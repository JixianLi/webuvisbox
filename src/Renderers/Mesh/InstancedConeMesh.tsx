// ABOUTME: Many cone glyphs (wind, flow, gradients) in one draw call (GPU instancing), each with its own position,
// ABOUTME: direction, size and color. Transforms go straight into the instance buffers, with no React work per glyph.

import { useLayoutEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { InstanceTransform } from "../../Types/Geometry";

// Direction of an instance, in a Z-up frame (a map with height along +Z; wrap the mesh in a group rotated −90° about X
// for a Y-up scene): the cone, pointing along +Y as built, is first tilted by vRotation about +X (positive raises its
// tip toward +Z), then turned by hRotation about +Z (counterclockwise seen from above). A glyph for a horizontal wind
// (u, v) therefore has hRotation = atan2(v, u) − π/2 and vRotation = 0.
interface ConeMeshProps {
    instances: InstanceTransform[];
    radius?: number;
    lengthScale?: number;
    radialSegments?: number;
    // Multiplies each instance's color (white keeps the instance colors as they are).
    color?: THREE.ColorRepresentation;
    opacity?: number;
    transparent?: boolean;
    depthWrite?: boolean;
    specular?: THREE.ColorRepresentation;
    shininess?: number;
}

const INITIAL_CAPACITY = 1000;

export function InstancedConeMesh({ instances, radius = 0.1, lengthScale = 1, radialSegments = 3, color = "white",
                                    opacity = 1, transparent = false, depthWrite = true, specular = "black",
                                    shininess = 0 }: ConeMeshProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const invalidate = useThree(state => state.invalidate);
    // Grows only, like InstancedSphereMesh: a larger buffer is a new mesh (key={capacity}).
    const [capacity, setCapacity] = useState(Math.max(instances.length, INITIAL_CAPACITY));
    if (instances.length > capacity) {
        setCapacity(instances.length);
    }

    useLayoutEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;
        const object = new THREE.Object3D();
        object.rotation.order = "ZXY";
        const instanceColor = new THREE.Color();
        instances.forEach((instance, index) => {
            object.position.set(...instance.position);
            object.rotation.set(instance.vRotation, 0, instance.hRotation);
            object.scale.setScalar(instance.scaleFactor);
            object.updateMatrix();
            mesh.setMatrixAt(index, object.matrix);
            const { r, g, b } = instance.color;
            mesh.setColorAt(index, instanceColor.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace));
        });
        mesh.count = instances.length;
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere();
        invalidate();
    }, [instances, capacity, invalidate]);

    return (
        <instancedMesh key={capacity} ref={meshRef} args={[undefined, undefined, capacity]} frustumCulled={false}>
            <coneGeometry args={[radius, lengthScale, radialSegments]} />
            <meshPhongMaterial color={color} opacity={opacity} transparent={transparent} depthWrite={depthWrite}
                               specular={specular} shininess={shininess} />
        </instancedMesh>
    );
}

export default InstancedConeMesh;
