// ABOUTME: React Three Fiber component that renders a scene with depth visualization.
// ABOUTME: Uses scene.overrideMaterial to render all objects with a logarithmic depth shader.

import { useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createDepthMaterial, updateDepthMaterialUniforms } from "./DepthMaterial";

// Scratch objects, reused every frame.
const sceneBox = new THREE.Box3();
const objectBox = new THREE.Box3();
const corner = new THREE.Vector3();

// The view-space depth range of what is drawn: visible meshes only, instanced meshes by their instances.
export function computeSceneDepthRange(scene: THREE.Scene, camera: THREE.Camera): { near: number; far: number } {
    sceneBox.makeEmpty();
    scene.traverseVisible((object) => {
        if (object instanceof THREE.InstancedMesh) {
            object.computeBoundingBox();
            objectBox.copy(object.boundingBox!).applyMatrix4(object.matrixWorld);
            sceneBox.union(objectBox);
        } else if (object instanceof THREE.Mesh && object.geometry) {
            if (!object.geometry.boundingBox) {
                object.geometry.computeBoundingBox();
            }
            objectBox.copy(object.geometry.boundingBox!).applyMatrix4(object.matrixWorld);
            sceneBox.union(objectBox);
        }
    });

    if (sceneBox.isEmpty()) {
        return { near: 0.1, far: 100 };
    }

    let minDepth = Infinity;
    let maxDepth = -Infinity;
    for (let index = 0; index < 8; index++) {
        corner.set(index & 1 ? sceneBox.max.x : sceneBox.min.x, index & 2 ? sceneBox.max.y : sceneBox.min.y,
                   index & 4 ? sceneBox.max.z : sceneBox.min.z).applyMatrix4(camera.matrixWorldInverse);
        // View space looks down −z.
        minDepth = Math.min(minDepth, -corner.z);
        maxDepth = Math.max(maxDepth, -corner.z);
    }

    minDepth = Math.max(0.001, minDepth);
    maxDepth = Math.max(minDepth + 0.001, maxDepth);
    return { near: minDepth, far: maxDepth * 1.2 };
}

export function DepthOverride() {
    const { scene, camera } = useThree();

    const depthMaterial = useMemo(() => createDepthMaterial({ near: 0.1, far: 100 }), []);
    useEffect(() => () => depthMaterial.dispose(), [depthMaterial]);

    useFrame(() => {
        const { near, far } = computeSceneDepthRange(scene, camera);
        updateDepthMaterialUniforms(depthMaterial, near, far);
    });

    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability -- the scene belongs to three.js; R3F expects it to be mutated
        scene.overrideMaterial = depthMaterial;
        return () => {
            scene.overrideMaterial = null;
        };
    }, [scene, depthMaterial]);

    return null;
}
