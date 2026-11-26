// ABOUTME: Direct volume rendering of a scalar volume by GPU ray marching (WebGL2 3D texture), classified by a
// ABOUTME: transfer-function texture, with optional gradient lighting. The volume fills a box whose longest side is 1.

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { onTextureUpdate } from "../Colormaps/TextureUpdates";

export interface VolumeRendererProps {
    data: Float32Array | Uint8Array;            // Float32 in [0, 1], or Uint8 (0–255 read as 0–1); x fastest, then y, z
    dimensions: [number, number, number];
    transferFunction: THREE.Texture;            // 1D lookup (n × 1, RGBA): color and opacity per value in [0, 1]
    samplesPerVoxel?: number;
    lighting?: boolean;
}

// While the canvas regresses for interaction (r3f's performance.current < 1, e.g. OrbitControls' regress), rays take
// this fraction of the samples; the opacity correction keeps the image's overall opacity unchanged.
const INTERACTIVE_SAMPLE_FRACTION = 0.5;
const MAX_STEPS = 2048;

const VERTEX_SHADER = /* glsl */ `
out vec3 vPosition;
void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Rays run in the box's own coordinates, [−0.5, 0.5]³ (texture coordinates = position + 0.5), from the camera through
// each back face, front to back, stopping once nearly opaque. Two corrections: opacity α from the transfer function
// is defined per voxel-length step, so a step of length Δ (in voxels) uses α' = 1 − (1 − α)^Δ, which keeps the image
// independent of the sampling rate; and each ray starts at a random fraction of a step, which turns the ring
// ("wood-grain") artifacts of equally spaced samples into fine noise. Lighting: a headlight, Blinn–Phong on the
// normalized gradient (central differences), two-sided.
const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
precision highp sampler3D;
uniform sampler3D uVolume;
uniform sampler2D uTransferFunction;
uniform vec3 uCameraPosition;
uniform vec3 uVoxelSize;
uniform float uStepSize;
uniform float uOpacityExponent;
uniform bool uLighting;
in vec3 vPosition;
out vec4 fragmentColor;

// A per-pixel random number in [0, 1) without sin() ("hash without sine", D. Hoskins): the common
// fract(sin(dot(p, k)) · 43758.5) loses precision at large pixel coordinates on many GPUs, and its offsets then form
// patterns (moiré) instead of noise.
float pixelHash(vec2 pixel) {
    vec3 mixed = fract(vec3(pixel.xyx) * 0.1031);
    mixed += dot(mixed, mixed.yzx + 33.33);
    return fract((mixed.x + mixed.y) * mixed.z);
}

vec2 intersectBox(vec3 origin, vec3 direction) {
    vec3 inverse = 1.0 / direction;
    vec3 near = (vec3(-0.5) - origin) * inverse;
    vec3 far = (vec3(0.5) - origin) * inverse;
    vec3 entry = min(near, far);
    vec3 exit = max(near, far);
    return vec2(max(max(entry.x, entry.y), entry.z), min(min(exit.x, exit.y), exit.z));
}

// Linear interpolation between the lookup table's two nearest entries, done here rather than by texture filtering: it
// places entry i exactly at value i / (n − 1) (a filtered lookup at value v is off by up to half an entry), and it
// works for any table texture, including ones that cannot be filtered linearly (32-bit float without an extension) or
// use nearest filtering, which steps the classification into contour rings wherever opacity ramps steeply.
vec4 classify(float value) {
    float last = float(textureSize(uTransferFunction, 0).x - 1);
    float position = clamp(value, 0.0, 1.0) * last;
    int lower = int(floor(position));
    int upper = min(lower + 1, int(last));
    return mix(texelFetch(uTransferFunction, ivec2(lower, 0), 0), texelFetch(uTransferFunction, ivec2(upper, 0), 0),
               position - float(lower));
}

vec3 gradientAt(vec3 point) {
    vec3 step = uVoxelSize;
    return vec3(
        texture(uVolume, point + vec3(step.x, 0.0, 0.0)).r - texture(uVolume, point - vec3(step.x, 0.0, 0.0)).r,
        texture(uVolume, point + vec3(0.0, step.y, 0.0)).r - texture(uVolume, point - vec3(0.0, step.y, 0.0)).r,
        texture(uVolume, point + vec3(0.0, 0.0, step.z)).r - texture(uVolume, point - vec3(0.0, 0.0, step.z)).r
    ) / (2.0 * step);
}

void main() {
    vec3 direction = normalize(vPosition - uCameraPosition);
    vec2 span = intersectBox(uCameraPosition, direction);
    float t = max(span.x, 0.0);
    if (t >= span.y) discard;
    float jitter = pixelHash(gl_FragCoord.xy);
    t += jitter * uStepSize;

    vec4 accumulated = vec4(0.0);
    for (int step = 0; step < ${MAX_STEPS}; step++) {
        if (t > span.y) break;
        vec3 point = uCameraPosition + t * direction + 0.5;
        float value = texture(uVolume, point).r;
        vec4 classified = classify(value);
        float alpha = 1.0 - pow(1.0 - classified.a, uOpacityExponent);
        if (alpha > 0.002) {
            vec3 color = classified.rgb;
            if (uLighting) {
                vec3 gradient = gradientAt(point);
                float magnitude = length(gradient);
                if (magnitude > 1e-4) {
                    vec3 normal = gradient / magnitude;
                    float facing = abs(dot(normal, direction));
                    color = color * (0.3 + 0.7 * facing) + vec3(0.25 * pow(facing, 40.0));
                }
            }
            accumulated.rgb += (1.0 - accumulated.a) * alpha * color;
            accumulated.a += (1.0 - accumulated.a) * alpha;
            if (accumulated.a > 0.98) break;
        }
        t += uStepSize;
    }
    if (accumulated.a < 0.002) discard;
    // The transfer function texture holds linear light (TextureManager); encode for the screen as three's materials do.
    fragmentColor = linearToOutputTexel(vec4(accumulated.rgb / accumulated.a, accumulated.a));
}`;

// Float volumes go to the GPU as 16-bit floats: filterable in WebGL2 without extensions (32-bit floats need
// OES_texture_float_linear, which many phones lack), and precise enough for values in [0, 1].
function createVolumeTexture(data: Float32Array | Uint8Array, [width, height, depth]: [number, number, number]) {
    const texture = data instanceof Uint8Array
        ? new THREE.Data3DTexture(data, width, height, depth)
        : new THREE.Data3DTexture(Uint16Array.from(data, THREE.DataUtils.toHalfFloat), width, height, depth);
    texture.format = THREE.RedFormat;
    texture.type = data instanceof Uint8Array ? THREE.UnsignedByteType : THREE.HalfFloatType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = texture.wrapT = texture.wrapR = THREE.ClampToEdgeWrapping;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;
    return texture;
}

export function VolumeRenderer({ data, dimensions, transferFunction, samplesPerVoxel = 1, lighting = true }: VolumeRendererProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const invalidate = useThree(state => state.invalidate);
    const volumeTexture = useMemo(() => createVolumeTexture(data, dimensions), [data, dimensions]);
    useEffect(() => () => volumeTexture.dispose(), [volumeTexture]);

    const material = useMemo(() => new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: {
            uVolume: { value: null },
            uTransferFunction: { value: null },
            uCameraPosition: { value: new THREE.Vector3() },
            uVoxelSize: { value: new THREE.Vector3() },
            uStepSize: { value: 0.01 },
            uOpacityExponent: { value: 1 },
            uLighting: { value: true },
        },
    }), []);
    useEffect(() => () => material.dispose(), [material]);

    const largest = Math.max(...dimensions);
    useLayoutEffect(() => {
        const uniforms = material.uniforms;
        // eslint-disable-next-line react-hooks/immutability -- three.js materials are mutated in place by design; React never reads them back
        uniforms.uVolume.value = volumeTexture;
        uniforms.uTransferFunction.value = transferFunction;
        uniforms.uVoxelSize.value.set(1 / dimensions[0], 1 / dimensions[1], 1 / dimensions[2]);
        uniforms.uLighting.value = lighting;
        invalidate();
    }, [material, volumeTexture, transferFunction, dimensions, lighting, invalidate]);

    // The step follows samplesPerVoxel in useFrame, which runs only when a frame is drawn: request one.
    useEffect(() => invalidate(), [samplesPerVoxel, invalidate]);
    // An edited transfer function is rewritten into the same texture in place: redraw when its manager announces it.
    useEffect(() => onTextureUpdate(transferFunction, invalidate), [transferFunction, invalidate]);

    // Per frame: the camera in box coordinates, and the step for the current sampling rate (in box units, where a
    // voxel along the longest side is 1 / largest).
    // eslint-disable-next-line react-hooks/immutability -- three.js materials are mutated in place by design; React never reads them back
    useFrame(state => {
        const mesh = meshRef.current;
        if (!mesh) return;
        const uniforms = material.uniforms;
        mesh.worldToLocal(uniforms.uCameraPosition.value.copy(state.camera.position));
        const rate = samplesPerVoxel * (state.performance.current < 1 ? INTERACTIVE_SAMPLE_FRACTION : 1);
        // eslint-disable-next-line react-hooks/immutability -- three.js materials are mutated in place by design; React never reads them back
        uniforms.uStepSize.value = 1 / (largest * rate);
        uniforms.uOpacityExponent.value = 1 / rate;
    });

    return (
        <mesh ref={meshRef} material={material} scale={dimensions.map(size => size / largest) as [number, number, number]}>
            <boxGeometry args={[1, 1, 1]} />
        </mesh>
    );
}

export default VolumeRenderer;
