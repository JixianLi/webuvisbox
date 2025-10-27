import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalData";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";
import SharedTrackballControl from "@/Renderers/SharedCameraControl/SharedTrackballControl";
import SeedsMesh from "./SeedsMesh";
import UncertaintyTubeMesh from "./UncertaintyTubeMesh";
import UncertaintyPathMesh from "./UncertaintyPathMesh";

interface SharedCameraRendererProps {
    show_uncertainty_tube: boolean;
    show_uncertainty_path: boolean;
    show_primary_path: boolean;
}

export const SharedCameraRenderer = observer((props: SharedCameraRendererProps) => {
    const control_ref = useRef(null);
    const canvas_ref = useRef(null);
    const last_tap_time = useRef<number>(0);

    const scenario = useScenario();
    const global_data = scenario.global_context as UncertaintyTubeGlobalContext;

    const center = global_data.center;
    const diag = global_data.diag;
    const near = global_data.render_config.camera.near;
    const far = global_data.render_config.camera.farMultiplier * diag;

    const camera_pos = new THREE.Vector3(center[0], center[1], center[2] + diag);

    const seeds = <SeedsMesh show_seeds={true} />;

    const uncertainty_tube = <UncertaintyTubeMesh show_uncertainty_tube={props.show_uncertainty_tube} />;

    const paths = <UncertaintyPathMesh show_primary_path={props.show_primary_path} show_uncertainty_path={props.show_uncertainty_path} />;


    return (
        <Canvas ref={canvas_ref}
            onPointerDown={(_e) => {
                const now = Date.now();
                const time_diff = now - last_tap_time.current;
                if (time_diff < 300 && time_diff > 0) {
                    control_ref.current?.reset();
                    last_tap_time.current = 0;
                }
                last_tap_time.current = now;
            }} linear flat >
            {seeds}
            {uncertainty_tube}
            {paths}
            <ambientLight intensity={0.5} />
            <PerspectiveCamera
                makeDefault
                position={camera_pos}
                near={near}
                far={far}>
                <directionalLight position={[0, 0, 0]} intensity={2.0} />
            </PerspectiveCamera>
            <GizmoHelper>
                <GizmoViewport />
            </GizmoHelper>
            <SharedTrackballControl ref={control_ref}
                makeDefault
                global_data={global_data}
                position0={camera_pos}
                target={new THREE.Vector3(center[0], center[1], center[2])}
                target0={new THREE.Vector3(center[0], center[1], center[2])}
                maxDistance={far}
                minDistance={diag * 0.1}
            />
        </Canvas>
    );
});
