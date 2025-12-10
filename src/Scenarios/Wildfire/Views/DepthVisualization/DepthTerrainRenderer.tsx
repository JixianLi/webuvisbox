// ABOUTME: Renders the Wildfire terrain scene with depth visualization.
// ABOUTME: Uses DepthOverride to render all objects as inverted linear depth grayscale.

import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
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
    const control_ref = useRef(null);
    const gl_ref = useRef<THREE.WebGLRenderer | null>(null);
    const last_tap_time = useRef<number>(0);

    useImperativeHandle(ref, () => ({
        saveImage: () => {
            if (gl_ref.current) {
                saveGrayscalePng(gl_ref.current, `depth_${Date.now()}.png`);
            }
        }
    }));

    const scenario = useScenario();
    const global_data = scenario.global_context as WildfireGlobalContext;
    const terrain_view_config = global_data.terrain_view_config;

    if (!terrain_view_config) {
        return <div>No terrain view configuration available</div>;
    }

    const center = global_data.terrain.center;
    const diag = global_data.terrain.diag;
    const near = 0.01;
    const far = diag * 3;
    const camera_pos = new THREE.Vector3(center[0], center[1], center[2] + diag);

    return (
        <Canvas
            gl={{ preserveDrawingBuffer: true, alpha: true }}
            onCreated={({ gl }) => { gl_ref.current = gl; }}
            onPointerDown={(_e) => {
                const now = Date.now();
                const time_diff = now - last_tap_time.current;
                if (time_diff < 300 && time_diff > 0) {
                    control_ref.current?.reset();
                    last_tap_time.current = 0;
                }
                last_tap_time.current = now;
            }}
            linear
            flat
        >
            <DepthOverride />
            <TerrainScene />
            <PerspectiveCamera
                makeDefault
                position={camera_pos}
                near={near}
                far={far}
                fov={35}
            />
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
        </Canvas>
    );
}));

DepthTerrainRenderer.displayName = "DepthTerrainRenderer";

export default DepthTerrainRenderer;
