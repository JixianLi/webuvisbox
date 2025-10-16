import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalData";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";
import TerrainScene from "./TerrainScene";
import SharedTrackballControl from "@/Renderers/SharedCameraControl/SharedTrackballControl";


interface TerrainRendererProps {
    use_opacity?: boolean;
    ctf_name?: string;
    otf_name?: string;
}

export const TerrainRenderer = observer((props: TerrainRendererProps) => {
    const control_ref = useRef(null);
    const canvas_ref = useRef(null);
    const last_tap_time = useRef<number>(0);

    const scenario = useScenario();
    const global_data = scenario.global_context as WildfireGlobalContext;
    const terrain_view_config = global_data.terrain_view_config;

    if (!terrain_view_config) {
        return <div>No terrain view configuration available</div>;
    }
    let gizmo_scale = 1.0;

    switch (scenario.panel_layouts.current_breakpoint) {
        case "xl": case "lg":
            gizmo_scale = 1.0;
            break;
        case "md":
            gizmo_scale = 0.75;
            break;
        case "sm": case "xs":
            gizmo_scale = 0.5;
            break;
    }

    // Camera setup
    const center = global_data.terrain.center;
    const diag = global_data.terrain.diag;
    const near = 0.01;
    const far = diag * 3;
    const camera_pos = new THREE.Vector3(center[0], center[1], center[2] + diag);

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
            }}
            linear flat >
            <TerrainScene {...props} />
            <ambientLight intensity={2} />
            <PerspectiveCamera makeDefault
                position={camera_pos} near={near} far={far} fov={50}>
                <directionalLight position={[0, 0, 0]} intensity={1} />
            </PerspectiveCamera>
            <SharedTrackballControl
                ref={control_ref}
                makeDefault
                global_data={global_data}
                position0={camera_pos}
                target={new THREE.Vector3(center[0], center[1], center[2])}
                target0={new THREE.Vector3(center[0], center[1], center[2])}
                maxDistance={far / 2}
                minDistance={near < 1 ? near / 100 : near * 100}
            />
            <GizmoHelper alignment="bottom-right" margin={[80 * gizmo_scale, 80 * gizmo_scale]}>
                <mesh scale={new THREE.Vector3(gizmo_scale, gizmo_scale, gizmo_scale)}>
                    <GizmoViewport />
                </mesh>
            </GizmoHelper>
        </Canvas >
    );
});

export default TerrainRenderer;