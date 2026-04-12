import * as THREE from "three";
import { makeAutoObservable, runInAction } from "mobx";
import type { GlobalContext } from "@/Types/GlobalContext";

export class SharedTrackballPerspectiveCamera {
    private _position: THREE.Vector3;
    private _target: THREE.Vector3;
    private _up: THREE.Vector3;
    private _quaternion: THREE.Quaternion;
    private _lastUsedId: string | null;

    constructor() {
        this._position = new THREE.Vector3(0, 0, 5);
        this._target = new THREE.Vector3(0, 0, 0);
        this._quaternion = new THREE.Quaternion();
        this._lastUsedId = null;
        this._up = new THREE.Vector3(0, 1, 0);
        makeAutoObservable(this);
    }

    // Public getters - everyone can read
    get up(): THREE.Vector3 { return this._up; }
    get position(): THREE.Vector3 { return this._position; }
    get target(): THREE.Vector3 { return this._target; }
    get quaternion(): THREE.Quaternion { return this._quaternion; }
    get lastUsedId(): string | null { return this._lastUsedId; }


    // Utility methods for updating camera state
    public setCamera(position: THREE.Vector3, target: THREE.Vector3, up: THREE.Vector3, quaternion: THREE.Quaternion, id:string): void {
        runInAction(() => {
            this._position.copy(position);
            this._target.copy(target);
            this._up.copy(up);
            this._quaternion.copy(quaternion);
            this._lastUsedId = id;
        });
    }
}

export function createSharedTrackballPerspectiveCamera(
): SharedTrackballPerspectiveCamera {
    const camera = new SharedTrackballPerspectiveCamera();
    return camera;
}

export function useSharedTrackballPerspectiveCamera(globalData:GlobalContext): SharedTrackballPerspectiveCamera {
    if (!('shared_trackball_perspective_camera' in globalData)) {
        (globalData as any).shared_trackball_perspective_camera = createSharedTrackballPerspectiveCamera();
    }
    return (globalData as any).shared_trackball_perspective_camera;
}

export default SharedTrackballPerspectiveCamera;

