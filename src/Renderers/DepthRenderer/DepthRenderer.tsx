// ABOUTME: React Three Fiber component that renders a scene with depth visualization.
// ABOUTME: Uses scene.overrideMaterial to render all objects with a linear depth shader.

import { useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createDepthMaterial, updateDepthMaterialUniforms } from "./DepthMaterial";

function computeSceneDepthRange(scene: THREE.Scene, camera: THREE.Camera): { near: number; far: number } {
    const box = new THREE.Box3();
    const tempBox = new THREE.Box3();

    scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.geometry) {
            if (!object.geometry.boundingBox) {
                object.geometry.computeBoundingBox();
            }
            if (object.geometry.boundingBox) {
                tempBox.copy(object.geometry.boundingBox);
                tempBox.applyMatrix4(object.matrixWorld);
                box.union(tempBox);
            }
        }
    });

    if (box.isEmpty()) {
        return { near: 0.1, far: 100 };
    }

    // Get box corners and transform to view space to find depth range
    const corners = [
        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
        new THREE.Vector3(box.min.x, box.max.y, box.min.z),
        new THREE.Vector3(box.min.x, box.max.y, box.max.z),
        new THREE.Vector3(box.max.x, box.min.y, box.min.z),
        new THREE.Vector3(box.max.x, box.min.y, box.max.z),
        new THREE.Vector3(box.max.x, box.max.y, box.min.z),
        new THREE.Vector3(box.max.x, box.max.y, box.max.z),
    ];

    const viewMatrix = camera.matrixWorldInverse;
    let minDepth = Infinity;
    let maxDepth = -Infinity;

    for (const corner of corners) {
        corner.applyMatrix4(viewMatrix);
        const depth = -corner.z; // View space Z is negative
        minDepth = Math.min(minDepth, depth);
        maxDepth = Math.max(maxDepth, depth);
    }

    // Clamp to positive values
    minDepth = Math.max(0.001, minDepth);
    maxDepth = Math.max(minDepth + 0.001, maxDepth);

    return { near: minDepth, far: maxDepth * 1.2};
}

export function DepthOverride() {
    const { scene, camera } = useThree();

    const depthMaterial = useMemo(() => createDepthMaterial({ near: 0.1, far: 100 }), []);

    useFrame(() => {
        const { near, far } = computeSceneDepthRange(scene, camera);
        updateDepthMaterialUniforms(depthMaterial, near, far);
    });

    useEffect(() => {
        scene.overrideMaterial = depthMaterial;
        return () => {
            scene.overrideMaterial = null;
        };
    }, [scene, depthMaterial]);

    return null;
}
