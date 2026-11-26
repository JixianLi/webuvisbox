import { useRef, useId, useEffect, forwardRef, useImperativeHandle, type ComponentRef } from "react";
import { TrackballControls } from "@react-three/drei";
import { observer } from "mobx-react-lite";
import { useSharedTrackballPerspectiveCamera } from "./SharedPerspectiveCamera";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { GlobalContext } from "../../Types/GlobalContext";

type TrackballControlsImpl = ComponentRef<typeof TrackballControls>;

interface SharedTrackballControlProps {
    globalData: GlobalContext;
    position0: THREE.Vector3;
    target: THREE.Vector3;
    target0: THREE.Vector3;
    maxDistance: number;
    minDistance: number;
    makeDefault?: boolean;
}

export const SharedTrackballControl = observer(forwardRef<TrackballControlsImpl, SharedTrackballControlProps>((props, ref) => {
    const {
        globalData,
        position0,
        target,
        target0,
        maxDistance,
        minDistance,
        makeDefault = false,
    } = props;

    const controlRef = useRef<TrackballControlsImpl>(null);
    const uniqueId = useId();
    const sharedCamera = useSharedTrackballPerspectiveCamera(globalData);

    useImperativeHandle(ref, () => controlRef.current as TrackballControlsImpl, []);

    const handleControlChange = () => {
        const control = controlRef.current;
        if (!control) return;
        sharedCamera.setCamera(control.object.position, control.target, control.object.up,
                               control.object.quaternion as THREE.Quaternion, uniqueId);
    };

    useFrame(() => {
        if (controlRef.current && sharedCamera.lastUsedId !== uniqueId) {
            controlRef.current.object.position.copy(sharedCamera.position);
            controlRef.current.object.quaternion.copy(sharedCamera.quaternion);
            controlRef.current.target.copy(sharedCamera.target);
            controlRef.current.object.up.copy(sharedCamera.up);
            controlRef.current.update();
        }
    });

    useEffect(() => {
        if (controlRef.current) {
            controlRef.current.object.position.copy(sharedCamera.position);
            controlRef.current.object.quaternion.copy(sharedCamera.quaternion);
            controlRef.current.target.copy(sharedCamera.target);
            controlRef.current.object.up.copy(sharedCamera.up);
            controlRef.current.update();
        }
    }, [sharedCamera]);

    return <TrackballControls makeDefault={makeDefault}
        ref={controlRef}
        onChange={handleControlChange}
        target={target}
        maxDistance={maxDistance}
        minDistance={minDistance}
        // @ts-expect-error -- drei's props omit position0/target0, the pose three's TrackballControls.reset() returns to
        position0={position0} target0={target0}
    />;
}));

SharedTrackballControl.displayName = 'SharedTrackballControl';

export default SharedTrackballControl;