import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import WildfireGlobalContext from "../../WildfireGlobalContext";
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
    useOpacity?: boolean;
    ctfName?: string;
    otfName?: string;
}

export const TerrainRenderer = observer(forwardRef<TerrainRendererHandle, TerrainRendererProps>((props, ref) => {
    const controlRef = useRef(null);
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const lastTapTime = useRef<number>(0);

    useImperativeHandle(ref, () => ({
        saveImage: () => {
            if (glRef.current) {
                const canvas = glRef.current.domElement;
                const dataURL = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.download = `terrain_${Date.now()}.png`;
                link.href = dataURL;
                link.click();
            }
        }
    }));

    const scenario = useScenario();
    const globalData = scenario.globalContext as WildfireGlobalContext;
    const terrainViewConfig = globalData.terrainViewConfig;

    if (!terrainViewConfig) {
        return <div>No terrain view configuration available</div>;
    }

    // Camera setup
    const center = globalData.terrain.center;
    const diag = globalData.terrain.diag;
    const near = 0.01;
    const far = diag * 3;
    const cameraPos = new THREE.Vector3(center[0], center[1], center[2] + diag);

    return (
        <Canvas
            gl={{ preserveDrawingBuffer: true }}
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
            linear flat >
            <TerrainScene {...props} />
            <ambientLight intensity={2.0} />
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
            <Perf position="top-left" />
        </Canvas>
    );
}));

TerrainRenderer.displayName = "TerrainRenderer";

export default TerrainRenderer;
