import { useRef, useId, useEffect, forwardRef, useImperativeHandle } from "react";
import { TrackballControls } from "@react-three/drei";
import { observer } from "mobx-react-lite";
import { useSharedTrackballPerspectiveCamera } from "./SharedPerspectiveCamera";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface SharedTrackballControlProps {
    globalData: any;
    position0: THREE.Vector3;
    target: THREE.Vector3;
    target0: THREE.Vector3;
    maxDistance: number;
    minDistance: number;
    makeDefault?: boolean;
}

export const SharedTrackballControl = observer(forwardRef<any, SharedTrackballControlProps>((props, ref) => {
    const {
        globalData,
        position0,
        target,
        target0,
        maxDistance,
        minDistance,
        makeDefault = false,
    } = props;

    const internalRef = useRef(null);
    const uniqueId = useId();
    const sharedCamera = useSharedTrackballPerspectiveCamera(globalData);

    const controlRef: any = ref || internalRef;
    useImperativeHandle(ref, () => controlRef.current, []);

    const handleControlChange = (e) => {
        sharedCamera.setCamera(
            e.target.object.position,
            e.target.target,
            e.target.object.up,
            e.target.object.quaternion,
            uniqueId
        );
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
    }, []);

    return <TrackballControls makeDefault={makeDefault}
        ref={controlRef}
        onChange={handleControlChange}
        target={target}
        maxDistance={maxDistance}
        minDistance={minDistance}
        // @ts-expect-error
        position0={position0} target0={target0}
    />;
}));

SharedTrackballControl.displayName = 'SharedTrackballControl';

export default SharedTrackballControl;