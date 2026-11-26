import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { computeSceneDepthRange } from './DepthRenderer';

function cameraLookingDownZ(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 10);
    camera.updateMatrixWorld();
    return camera;
}

function cubeAt(z: number): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
    mesh.position.z = z;
    return mesh;
}

describe('computeSceneDepthRange', () => {
    it('spans what is visible, from the nearest face to past the farthest', () => {
        const scene = new THREE.Scene();
        scene.add(cubeAt(0));
        scene.updateMatrixWorld();
        const { near, far } = computeSceneDepthRange(scene, cameraLookingDownZ());
        expect(near).toBeCloseTo(9);
        expect(far).toBeCloseTo(11 * 1.2);
    });

    it('leaves hidden objects out', () => {
        const scene = new THREE.Scene();
        scene.add(cubeAt(0));
        const hidden = cubeAt(-40);
        hidden.visible = false;
        scene.add(hidden);
        scene.updateMatrixWorld();
        expect(computeSceneDepthRange(scene, cameraLookingDownZ()).far).toBeCloseTo(11 * 1.2);
    });

    it('measures an instanced mesh by its instances', () => {
        const scene = new THREE.Scene();
        const instanced = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 2, 2), undefined, 1);
        instanced.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 0, -20));
        scene.add(instanced);
        scene.updateMatrixWorld();
        expect(computeSceneDepthRange(scene, cameraLookingDownZ()).near).toBeCloseTo(29);
    });
});
