import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";
import EnsembleTerrainScene from "./EnsembleTerrainScene";
import SharedTrackballControl from "@/Renderers/SharedCameraControl/SharedTrackballControl";

export const EnsembleTerrainRenderer = observer(() => {
    const controlRef = useRef(null);
    const canvasRef = useRef(null);
    const lastTapTime = useRef<number>(0);

    const scenario = useScenario();
    const globalData = scenario.globalContext as WildfireGlobalContext;
    const terrainViewConfig = globalData.terrainViewConfig;

    if (!terrainViewConfig) {
        return <div>No terrain view configuration available</div>;
    }
    let gizmoScale = 1.0;

    switch (scenario.panelLayouts.currentBreakpoint) {
        case "xl": case "lg":
            gizmoScale = 1.0;
            break;
        case "md":
            gizmoScale = 0.75;
            break;
        case "sm": case "xs":
            gizmoScale = 0.5;
            break;
    }

    // Camera setup
    const center = globalData.terrain.center;
    const diag = globalData.terrain.diag;
    const near = 0.01;
    const far = diag * 3;
    const cameraPos = new THREE.Vector3(center[0], center[1], center[2] + diag);

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
            }}
            linear flat>
            <EnsembleTerrainScene />
            <PerspectiveCamera makeDefault
                position={cameraPos} near={near} far={far} fov={35}>
                <directionalLight position={[0, 0, 0]} intensity={1} />
            </PerspectiveCamera>
            <SharedTrackballControl
                ref={controlRef}
                makeDefault
                globalData={globalData}
                position0={cameraPos}
                target={new THREE.Vector3(center[0], center[1], center[2])}
                target0={new THREE.Vector3(center[0], center[1], center[2])}
                maxDistance={far / 2}
                minDistance={near < 1 ? near / 100 : near * 100}
            />
            <ambientLight intensity={2.0} />

            <GizmoHelper alignment="bottom-right" margin={[80 * gizmoScale, 80 * gizmoScale]}>
                <mesh scale={new THREE.Vector3(gizmoScale, gizmoScale, gizmoScale)}>
                    <GizmoViewport labels={['E', 'N', 'U']} />
                </mesh>
            </GizmoHelper>
        </Canvas>
    );
})

export default EnsembleTerrainRenderer;
