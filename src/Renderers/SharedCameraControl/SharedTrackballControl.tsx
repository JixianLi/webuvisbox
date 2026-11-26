// ABOUTME: Trackball controls whose camera pose is shared by every view on the same GlobalContext: moving one view moves
// ABOUTME: the others (linked views). The pose lives in a SharedTrackballPerspectiveCamera, observed through MobX.

import { useRef, useId, useEffect, forwardRef, useImperativeHandle, type ComponentRef } from "react";
import { TrackballControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { reaction } from "mobx";
import * as THREE from "three";
import { useSharedTrackballPerspectiveCamera } from "./SharedPerspectiveCamera";
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

export const SharedTrackballControl = forwardRef<TrackballControlsImpl, SharedTrackballControlProps>((props, ref) => {
    const { globalData, position0, target, target0, maxDistance, minDistance, makeDefault = false } = props;

    const controlRef = useRef<TrackballControlsImpl>(null);
    const uniqueId = useId();
    const sharedCamera = useSharedTrackballPerspectiveCamera(globalData);
    const invalidate = useThree(state => state.invalidate);
    // The version of the shared pose this control shows, and whether it is applying one (its own change events then
    // echo the shared pose; published, they would take the pose over from the view being moved).
    const appliedVersion = useRef(-1);
    const applying = useRef(false);
    // TrackballControls moves the camera only in update(), once per frame; a canvas that draws on demand has no frames
    // unless asked. So frames are asked for from the start of a drag to its end, and after it while each frame still
    // moves the camera (the controls' damping).
    const dragging = useRef(false);

    useImperativeHandle(ref, () => controlRef.current as TrackballControlsImpl, []);

    const handleChange = () => {
        if (applying.current) return;
        publish();
        invalidate();
    };

    const publish = () => {
        const control = controlRef.current;
        if (!control) return;
        sharedCamera.setCamera(control.object.position, control.target, control.object.up,
                               control.object.quaternion as THREE.Quaternion, uniqueId);
        appliedVersion.current = sharedCamera.version;
    };

    const applySharedPose = () => {
        const control = controlRef.current;
        if (!control || appliedVersion.current === sharedCamera.version) return;
        applying.current = true;
        control.object.position.copy(sharedCamera.position);
        control.object.quaternion.copy(sharedCamera.quaternion);
        control.target.copy(sharedCamera.target);
        control.object.up.copy(sharedCamera.up);
        control.update();
        applying.current = false;
        appliedVersion.current = sharedCamera.version;
    };

    // The first view to mount publishes its own camera as the shared pose; later ones take the shared pose.
    useEffect(() => {
        if (sharedCamera.version === 0) {
            publish();
        } else {
            applySharedPose();
            invalidate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- on mount only; later poses arrive through the reaction
    }, [sharedCamera]);

    // A canvas that draws on demand redraws when another view publishes a pose.
    useEffect(() => reaction(() => sharedCamera.version, () => {
        if (sharedCamera.lastUsedId !== uniqueId) invalidate();
    }), [sharedCamera, uniqueId, invalidate]);

    useFrame(() => {
        if (sharedCamera.lastUsedId !== uniqueId) applySharedPose();
        if (dragging.current) invalidate();
    });

    return <TrackballControls makeDefault={makeDefault}
        ref={controlRef}
        onChange={handleChange}
        onStart={() => { dragging.current = true; invalidate(); }}
        onEnd={() => { dragging.current = false; invalidate(); }}
        target={target}
        maxDistance={maxDistance}
        minDistance={minDistance}
        // @ts-expect-error -- drei's props omit position0/target0, the pose three's TrackballControls.reset() returns to
        position0={position0} target0={target0}
    />;
});

SharedTrackballControl.displayName = 'SharedTrackballControl';

export default SharedTrackballControl;
