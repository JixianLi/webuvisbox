import { describe, expect, it } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { InstancedSphereMesh } from './InstancedSphereMesh';

describe('InstancedSphereMesh', () => {
    it('draws one instance per point in a single instanced mesh', async () => {
        const points: [number, number, number][] = [[0, 0, 0], [1, 2, 3], [-1, 0, 4]];
        const renderer = await ReactThreeTestRenderer.create(<InstancedSphereMesh points={points} />);
        // drei's Instances writes the instance count and matrices on the next frame.
        await renderer.advanceFrames(1, 1 / 60);

        const mesh = renderer.getInstance();
        expect(mesh).toBeInstanceOf(THREE.InstancedMesh);
        expect((mesh as THREE.InstancedMesh).count).toBe(points.length);

        await renderer.unmount();
    });
});
