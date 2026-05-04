// ABOUTME: Renders the Wildfire terrain scene with depth visualization.
// ABOUTME: Uses DepthOverride to render all objects as inverted linear depth grayscale.

import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import WildfireGlobalContext from "../../WildfireGlobalContext";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useRef, forwardRef, useImperativeHandle } from "react";
import TerrainScene from "../TerrainVisualization/TerrainScene";
import SharedTrackballControl from "@/Renderers/SharedCameraControl/SharedTrackballControl";
import { DepthOverride } from "@/Renderers/DepthRenderer/DepthRenderer";
import { saveGrayscalePng } from "@/Helpers/saveGrayscalePng";

export interface DepthTerrainRendererHandle {
    saveImage: () => void;
}

export const DepthTerrainRenderer = observer(forwardRef<DepthTerrainRendererHandle>((_, ref) => {
    const controlRef = useRef(null);
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const lastTapTime = useRef<number>(0);

    useImperativeHandle(ref, () => ({
        saveImage: () => {
            if (glRef.current) {
                saveGrayscalePng(glRef.current, `depth_${Date.now()}.png`);
            }
        }
    }));

    const scenario = useScenario();
    const globalData = scenario.globalContext as WildfireGlobalContext;
    const terrainViewConfig = globalData.terrainViewConfig;

    if (!terrainViewConfig) {
        return <div>No terrain view configuration available</div>;
    }

    const center = globalData.terrain.center;
    const diag = globalData.terrain.diag;
    const near = 0.01;
    const far = diag * 3;
    const cameraPos = new THREE.Vector3(center[0], center[1], center[2] + diag);

    return (
        <Canvas
            gl={{ preserveDrawingBuffer: true, alpha: true }}
            onCreated={({ gl }) => { glRef.current = gl; }}
            onPointerDown={(_e) => {
                const now = Date.now();
                const timeDiff = now - lastTapTime.current;
                if (timeDiff < 300 && timeDiff > 0) {
                    controlRef.current?.reset();
                    lastTapTime.current = 0;
                }
                lastTapTime.current = now;
            }}
            linear
            flat
        >
            <DepthOverride />
            <TerrainScene />
            <PerspectiveCamera
                makeDefault
                position={cameraPos}
                near={near}
                far={far}
                fov={35}
            />
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
        </Canvas>
    );
}));

DepthTerrainRenderer.displayName = "DepthTerrainRenderer";

export default DepthTerrainRenderer;
