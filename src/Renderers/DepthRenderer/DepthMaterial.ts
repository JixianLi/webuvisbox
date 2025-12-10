// ABOUTME: Custom shader material for linear depth visualization.
// ABOUTME: Outputs inverted grayscale where near is bright (white) and far is dark (black).

import * as THREE from "three";

const vertexShader = `
varying float vDepth;

void main() {
    #ifdef USE_INSTANCING
        vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
        vec4 viewPosition = modelViewMatrix * worldPosition;
    #else
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    #endif

    vDepth = -viewPosition.z;
    gl_Position = projectionMatrix * viewPosition;
}
`;

const fragmentShader = `
uniform float cameraNear;
uniform float cameraFar;

varying float vDepth;

void main() {
    // Logarithmic depth for better near-object differentiation
    float logNear = log(cameraNear);
    float logFar = log(cameraFar);
    float logDepth = log(max(vDepth, cameraNear));

    float normalizedDepth = (logDepth - logNear) / (logFar - logNear);
    normalizedDepth = clamp(normalizedDepth, 0.0, 1.0);

    // Invert: near (0) -> white (1), far (1) -> black (0)
    float inverted = 1.0 - normalizedDepth;

    gl_FragColor = vec4(inverted, inverted, inverted, 1.0);
}
`;

export interface DepthMaterialOptions {
    near: number;
    far: number;
}

export function createDepthMaterial(options: DepthMaterialOptions): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            cameraNear: { value: options.near },
            cameraFar: { value: options.far },
        },
    });
}

export function updateDepthMaterialUniforms(
    material: THREE.ShaderMaterial,
    near: number,
    far: number
): void {
    material.uniforms.cameraNear.value = near;
    material.uniforms.cameraFar.value = far;
}
