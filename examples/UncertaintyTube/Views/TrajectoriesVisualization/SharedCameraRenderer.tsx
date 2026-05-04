import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import UncertaintyTubeGlobalContext from "../../UncertaintyTubeGlobalContext";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";
import SharedTrackballControl from "@/Renderers/SharedCameraControl/SharedTrackballControl";
import SeedsMesh from "./SeedsMesh";
import UncertaintyTubeMesh from "./UncertaintyTubeMesh";
import UncertaintyPathMesh from "./UncertaintyPathMesh";

interface SharedCameraRendererProps {
    showUncertaintyTube: boolean;
    showUncertaintyPath: boolean;
    showPrimaryPath: boolean;
}

export const SharedCameraRenderer = observer((props: SharedCameraRendererProps) => {
    const controlRef = useRef(null);
    const canvasRef = useRef(null);
    const lastTapTime = useRef<number>(0);

    const scenario = useScenario();
    const globalData = scenario.globalContext as UncertaintyTubeGlobalContext;

    const center = globalData.center;
    const diag = globalData.diag;
    const near = globalData.renderConfig.camera.near;
    const far = globalData.renderConfig.camera.farMultiplier * diag;

    const cameraPos = new THREE.Vector3(center[0], center[1], center[2] + diag);

    const seeds = <SeedsMesh showSeeds={true} />;

    const uncertaintyTube = <UncertaintyTubeMesh showUncertaintyTube={props.showUncertaintyTube} />;

    const paths = <UncertaintyPathMesh showPrimaryPath={props.showPrimaryPath} showUncertaintyPath={props.showUncertaintyPath} />;


    return (
        <Canvas ref={canvasRef}
            onPointerDown={(_e) => {
                const now = Date.now();
                const timeDiff = now - lastTapTime.current;
                if (timeDiff < 300 && timeDiff > 0) {
                    controlRef.current?.reset();
                    lastTapTime.current = 0;
                }
                lastTapTime.current = now;
            }} linear flat >
            {seeds}
            {uncertaintyTube}
            {paths}
            <ambientLight intensity={0.5} />
            <PerspectiveCamera
                makeDefault
                position={cameraPos}
                near={near}
                far={far}>
                <directionalLight position={[0, 0, 0]} intensity={2.0} />
            </PerspectiveCamera>
            <GizmoHelper>
                <GizmoViewport />
            </GizmoHelper>
            <SharedTrackballControl ref={controlRef}
                makeDefault
                globalData={globalData}
                position0={cameraPos}
                target={new THREE.Vector3(center[0], center[1], center[2])}
                target0={new THREE.Vector3(center[0], center[1], center[2])}
                maxDistance={far}
                minDistance={diag * 0.1}
            />
        </Canvas>
    );
});
