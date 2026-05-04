import { observer } from "mobx-react-lite";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, TrackballControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { useRef } from "react";
import UncertaintyPathMesh from "./UncertaintyPathMesh";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalContext";
import { Vector3 } from "three";
import SeedsMesh from "./SeedsMesh";
import UncertaintyTubeMesh from "./UncertaintyTubeMesh";
import SeedBoxMesh from "./SeedBoxMesh";
import { Perf } from 'r3f-perf';


const TrajectoriesRenderer = observer(() => {
    const canvasRef = useRef(null);
    const controlRef = useRef(null);
    const scenario = useScenario();
    const globalData = scenario.globalContext as UncertaintyTubeGlobalContext;

    const center = globalData.center;
    const diag = globalData.diag;
    const near = globalData.renderConfig.camera.near;
    const far = globalData.renderConfig.camera.farMultiplier * diag;

    const cameraPos = new Vector3(center[0], center[1], center[2] + diag);

    const stats = globalData.trajectoryVisualization.showStats?<Perf />:null;

    return (
        <Canvas ref={canvasRef} onDoubleClick={() => { controlRef.current?.reset() }} linear flat>
            <group>
                <SeedsMesh />
                <UncertaintyPathMesh />
                <UncertaintyTubeMesh />
                <SeedBoxMesh />
            </group>
            <ambientLight intensity={0.5} />
            <PerspectiveCamera makeDefault position={cameraPos} near={near} far={far} fov={50}>
                <directionalLight position={[0, 0, 0]} intensity={2.0} />
            </PerspectiveCamera>
            <TrackballControls ref={controlRef} makeDefault
                target={center} maxDistance={far / 2} minDistance={near < 1 ? near / 100 : near * 100}
                // @ts-ignore
                target0={center} position0={cameraPos}
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
