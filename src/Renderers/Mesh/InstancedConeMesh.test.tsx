import { describe, expect, it } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import * as d3 from 'd3';
import { InstancedConeMesh } from './InstancedConeMesh';

// Where the cone's tip points (its +Y axis as built), for one instance with these rotations.
async function directionOf(hRotation: number, vRotation: number): Promise<number[]> {
    const renderer = await ReactThreeTestRenderer.create(<InstancedConeMesh instances={[
        { position: [0, 0, 0], hRotation, vRotation, scaleFactor: 1, color: d3.rgb(255, 255, 255) }]} />);
    const matrix = new THREE.Matrix4();
    (renderer.getInstance() as THREE.InstancedMesh).getMatrixAt(0, matrix);
    await renderer.unmount();
    return new THREE.Vector3(0, 1, 0).transformDirection(matrix).toArray().map(value => Math.round(value * 1000) / 1000 + 0);
}

describe('InstancedConeMesh', () => {
    it('turns the cone by hRotation about +Z (counterclockwise from above)', async () => {
        expect(await directionOf(0, 0)).toEqual([0, 1, 0]);
        expect(await directionOf(Math.PI / 2, 0)).toEqual([-1, 0, 0]);
    });

    it('tilts it by vRotation toward +Z before turning it', async () => {
        expect(await directionOf(0, Math.PI / 2)).toEqual([0, 0, 1]);
        const half = Math.round(Math.SQRT1_2 * 1000) / 1000;
        expect(await directionOf(Math.PI / 2, Math.PI / 4)).toEqual([-half, 0, half]);
    });

    it('points a horizontal wind glyph along the wind: hRotation = atan2(v, u) − π/2', async () => {
        expect(await directionOf(Math.atan2(1, 0) - Math.PI / 2, 0)).toEqual([0, 1, 0]);
        expect(await directionOf(Math.atan2(0, 1) - Math.PI / 2, 0)).toEqual([1, 0, 0]);
    });

    it('colors each instance, converting its sRGB color to linear', async () => {
        const renderer = await ReactThreeTestRenderer.create(<InstancedConeMesh instances={[
            { position: [0, 0, 0], hRotation: 0, vRotation: 0, scaleFactor: 1, color: d3.rgb(255, 0, 0) }]} />);
        const color = new THREE.Color();
        (renderer.getInstance() as THREE.InstancedMesh).getColorAt(0, color);
        expect([color.r, color.g, color.b]).toEqual([1, 0, 0]);
        await renderer.unmount();
    });
});
