import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { SharedTrackballPerspectiveCamera } from './SharedPerspectiveCamera';

describe('SharedTrackballPerspectiveCamera', () => {
    it('counts the poses published and remembers who published the last', () => {
        const camera = new SharedTrackballPerspectiveCamera();
        expect(camera.version).toBe(0);
        camera.setCamera(new THREE.Vector3(1, 2, 3), new THREE.Vector3(), new THREE.Vector3(0, 1, 0),
                         new THREE.Quaternion(), 'view-a');
        expect(camera.version).toBe(1);
        expect(camera.lastUsedId).toBe('view-a');
        expect(camera.position.toArray()).toEqual([1, 2, 3]);
    });
});
