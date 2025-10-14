import { observer } from "mobx-react-lite";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, TrackballControls, GizmoHelper, GizmoViewport, Stats } from "@react-three/drei";
import { useRef } from "react";
import UncertaintyPathMesh from "./UncertaintyPathMesh";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalData";
import { Vector3 } from "three";
import SeedsMesh from "./SeedsMesh";
import UncertaintyTubeMesh from "./UncertaintyTubeMesh";
import SeedBoxMesh from "./SeedBoxMesh";


const TrajectoriesRenderer = observer(() => {
    const canvas_ref = useRef(null);
    const control_ref = useRef(null);
    const scenario = useScenario();
    const global_data = scenario.global_context as UncertaintyTubeGlobalContext;

    const center = global_data.center;
    const diag = global_data.diag;
    const near = global_data.render_config.camera.near;
    const far = global_data.render_config.camera.farMultiplier * diag;

    const camera_pos = new Vector3(center[0], center[1], center[2] + diag);

    const stats = global_data.trajectory_visualization.show_stats?<Stats />:null;

    return (
        <Canvas ref={canvas_ref} onDoubleClick={() => { control_ref.current?.reset() }} linear flat>
            <group>
                <SeedsMesh />
                <UncertaintyPathMesh />
                <UncertaintyTubeMesh />
                <SeedBoxMesh />
            </group>
            <ambientLight intensity={0.5} />
            <PerspectiveCamera makeDefault position={camera_pos} near={near} far={far} fov={50}>
                <directionalLight position={[0, 0, 0]} intensity={2.0} />
            </PerspectiveCamera>
            <TrackballControls ref={control_ref} makeDefault
                target={center} maxDistance={far / 2} minDistance={near < 1 ? near / 100 : near * 100}
                // @ts-ignore
                target0={center} position0={camera_pos}
            />
            <GizmoHelper>
                <GizmoViewport />
            </GizmoHelper>
            {stats}

            {/* Render your trajectories here */}
        </Canvas>
    );
});

export default TrajectoriesRenderer;