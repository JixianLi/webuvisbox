import { describe, expect, it } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { useThree } from '@react-three/fiber';
import type * as THREE from 'three';
import { FitCameraToAspect } from './FitCameraToAspect';

async function cameraPositionAt(width: number, height: number): Promise<THREE.Vector3Tuple> {
    let camera: THREE.Camera | null = null;
    function CaptureCamera() {
        camera = useThree(state => state.camera);
        return null;
    }
    const renderer = await ReactThreeTestRenderer.create(
        <><FitCameraToAspect position={[1, 2, 2]} minimumAspect={1.25} /><CaptureCamera /></>, { width, height });
    const position = camera!.position.toArray();
    await renderer.unmount();
    return position;
}

describe('FitCameraToAspect', () => {
    it('places the camera at the position on a canvas at least minimumAspect wide', async () => {
        expect(await cameraPositionAt(1600, 800)).toEqual([1, 2, 2]);
    });

    it('backs off by minimumAspect / aspect on a narrower canvas', async () => {
        const [x, y, z] = await cameraPositionAt(500, 1000);
        const factor = 1.25 / 0.5;
        expect([x, y, z]).toEqual([1 * factor, 2 * factor, 2 * factor]);
    });
});
