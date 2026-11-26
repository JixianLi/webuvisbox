import { describe, expect, it } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import * as THREE from 'three';
import { BoxOutlineMesh } from './BoxOutlineMesh';

describe('BoxOutlineMesh', () => {
    it('draws lines as thick as linewidth: the outline reaches half of it past the box', async () => {
        const renderer = await ReactThreeTestRenderer.create(
            <BoxOutlineMesh boundingBox={[0, 2, 0, 2, 0, 2]} color="white" linewidth={0.2} radialSegments={32} />);
        const geometry = (renderer.getInstance() as THREE.Mesh).geometry;
        geometry.computeBoundingBox();
        expect(geometry.boundingBox!.max.x).toBeCloseTo(2.1, 2);
        expect(geometry.boundingBox!.min.y).toBeCloseTo(-0.1, 2);
        await renderer.unmount();
    });

    it('keeps its geometry for a new array with the same bounds', async () => {
        const renderer = await ReactThreeTestRenderer.create(<BoxOutlineMesh boundingBox={[0, 1, 0, 1, 0, 1]} color="white" />);
        const before = (renderer.getInstance() as THREE.Mesh).geometry;
        await renderer.update(<BoxOutlineMesh boundingBox={[0, 1, 0, 1, 0, 1]} color="white" />);
        expect((renderer.getInstance() as THREE.Mesh).geometry).toBe(before);
        await renderer.unmount();
    });
});
