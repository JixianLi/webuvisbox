import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import WildfireGlobalData from "@/Scenarios/Wildfire/WildfireGlobalData";
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

    const scenario = useScenario();
    const global_data = scenario.global_context as WildfireGlobalData;
    const terrain_view_config = global_data.terrain_view_config;
    if (!terrain_view_config) {
        return <div>No terrain view configuration available</div>;
    }

    // Camera setup
    const center = global_data.terrain.center;
    const diag = global_data.terrain.diag;
    const near = 0.01;
    const far = diag * 2;
    const camera_pos = new THREE.Vector3(center[0], center[1], center[2] + diag);

    return (
        <Canvas ref={canvas_ref}
            onDoubleClick={() => {
                control_ref.current.reset();
            }}
            linear flat >
            <TerrainScene {...props} />
            <ambientLight intensity={0.5} />
            <PerspectiveCamera makeDefault
                position={camera_pos} near={near} far={far} fov={50}>
                <directionalLight position={[0, 0, 0]} intensity={2} />
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
            <GizmoHelper>
                <GizmoViewport />
            </GizmoHelper>
        </Canvas >
    );
});

export default TerrainRenderer;