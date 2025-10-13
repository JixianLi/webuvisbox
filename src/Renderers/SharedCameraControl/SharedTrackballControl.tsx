import { useRef, useId, useEffect, forwardRef, useImperativeHandle } from "react";
import { TrackballControls } from "@react-three/drei";
import { observer } from "mobx-react-lite";
import { useSharedTrackballPerspectiveCamera } from "./SharedPerspectiveCamera";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface SharedTrackballControlProps {
    global_data: any;
    position0: THREE.Vector3;
    target: THREE.Vector3;
    target0: THREE.Vector3;
    maxDistance: number;
    minDistance: number;
    makeDefault?: boolean;
}

export const SharedTrackballControl = observer(forwardRef<any, SharedTrackballControlProps>((props, ref) => {
    const {
        global_data,
        position0,
        target,
        target0,
        maxDistance,
        minDistance,
        makeDefault = false,
    } = props;

    const internal_ref = useRef(null);
    const unique_id = useId();
    const shared_camera = useSharedTrackballPerspectiveCamera(global_data);

    const control_ref: any = ref || internal_ref;
    useImperativeHandle(ref, () => control_ref.current, []);

    const handleControlChange = (e) => {
        shared_camera.setCamera(
            e.target.object.position,
            e.target.target,
            e.target.object.up,
            e.target.object.quaternion,
            unique_id
        );
    };

    useFrame(() => {
        if (control_ref.current && shared_camera.last_used_id !== unique_id) {
            control_ref.current.object.position.copy(shared_camera.position);
            control_ref.current.object.quaternion.copy(shared_camera.quaternion);
            control_ref.current.target.copy(shared_camera.target);
            control_ref.current.object.up.copy(shared_camera.up);
            control_ref.current.update();
        }
    });

    useEffect(() => {
        if (control_ref.current) {
            control_ref.current.object.position.copy(shared_camera.position);
            control_ref.current.object.quaternion.copy(shared_camera.quaternion);
            control_ref.current.target.copy(shared_camera.target);
            control_ref.current.object.up.copy(shared_camera.up);
            control_ref.current.update();
        }
    }, []);

    return <TrackballControls makeDefault={makeDefault}
        ref={control_ref}
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