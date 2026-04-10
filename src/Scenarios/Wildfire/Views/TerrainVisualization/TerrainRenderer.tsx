import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useRef, forwardRef, useImperativeHandle } from "react";
import TerrainScene from "./TerrainScene";
import SharedTrackballControl from "@/Renderers/SharedCameraControl/SharedTrackballControl";
// @ts-ignore
import { Perf } from 'r3f-perf';
export interface TerrainRendererHandle {
    saveImage: () => void;
}

interface TerrainRendererProps {
    use_opacity?: boolean;
    ctf_name?: string;
    otf_name?: string;
}

export const TerrainRenderer = observer(forwardRef<TerrainRendererHandle, TerrainRendererProps>((props, ref) => {
    const control_ref = useRef(null);
    const gl_ref = useRef<THREE.WebGLRenderer | null>(null);
    const last_tap_time = useRef<number>(0);

    useImperativeHandle(ref, () => ({
        saveImage: () => {
            if (gl_ref.current) {
                const canvas = gl_ref.current.domElement;
                const dataURL = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.download = `terrain_${Date.now()}.png`;
                link.href = dataURL;
                link.click();
            }
        }
    }));

    const scenario = useScenario();
    const global_data = scenario.global_context as WildfireGlobalContext;
    const terrain_view_config = global_data.terrain_view_config;

    if (!terrain_view_config) {
        return <div>No terrain view configuration available</div>;
    }

    // Camera setup
    const center = global_data.terrain.center;
    const diag = global_data.terrain.diag;
    const near = 0.01;
    const far = diag * 3;
    const camera_pos = new THREE.Vector3(center[0], center[1], center[2] + diag);

    return (
        <Canvas
            gl={{ preserveDrawingBuffer: true }}
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
            linear flat >
            <TerrainScene {...props} />
            <ambientLight intensity={2.0} />
            <PerspectiveCamera makeDefault
                position={camera_pos} near={near} far={far} fov={35}>
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
            <Perf position="top-left" />
        </Canvas>
    );
}));

TerrainRenderer.displayName = "TerrainRenderer";

export default TerrainRenderer;