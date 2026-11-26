import { describe, expect, it } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { InstancedSphereMesh } from './InstancedSphereMesh';

function translationOf(mesh: THREE.InstancedMesh, index: number): number[] {
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(index, matrix);
    return new THREE.Vector3().setFromMatrixPosition(matrix).toArray();
}

describe('InstancedSphereMesh', () => {
    it('draws one instance per point, at the point, in a single instanced mesh', async () => {
        const points: [number, number, number][] = [[0, 0, 0], [1, 2, 3], [-1, 0, 4]];
        const renderer = await ReactThreeTestRenderer.create(<InstancedSphereMesh points={points} />);
        const mesh = renderer.getInstance() as THREE.InstancedMesh;
        expect(mesh).toBeInstanceOf(THREE.InstancedMesh);
        expect(mesh.count).toBe(3);
        expect(translationOf(mesh, 1)).toEqual([1, 2, 3]);
        await renderer.unmount();
    });

    it('grows its buffer for more points than it holds, and keeps it for fewer', async () => {
        const many = Array.from({ length: 1500 }, (_, index) => [index, 0, 0] as [number, number, number]);
        const renderer = await ReactThreeTestRenderer.create(<InstancedSphereMesh points={many} />);
        expect((renderer.getInstance() as THREE.InstancedMesh).count).toBe(1500);
        expect(translationOf(renderer.getInstance() as THREE.InstancedMesh, 1499)).toEqual([1499, 0, 0]);

        await renderer.update(<InstancedSphereMesh points={many.slice(0, 2)} />);
        const mesh = renderer.getInstance() as THREE.InstancedMesh;
        expect(mesh.count).toBe(2);
        expect(mesh.instanceMatrix.count).toBe(1500);
        await renderer.unmount();
    });
});
