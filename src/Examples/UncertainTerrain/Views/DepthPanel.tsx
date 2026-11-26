// ABOUTME: The Uncertain terrain example's depth view: the mean surface as a depth image (near is white, far is dark,
// ABOUTME: on a log scale), savable as a grayscale PNG, e.g. as input to an image-based pipeline.

import { useEffect, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { DepthOverride } from "../../../Renderers/DepthRenderer/DepthRenderer";
import { FitCameraToAspect } from "../../../Renderers/Camera/FitCameraToAspect";
import { DoublePressToReset } from "../../../Renderers/Camera/DoublePressToReset";
import { saveGrayscalePng } from "../../../Helpers/SaveGrayscalePng";
import type { UncertainTerrainGlobalContext } from "../UncertainTerrainGlobalContext";
import { surfaceGeometry } from "./TerrainSurfaceGeometry";

const CAMERA_POSITION: [number, number, number] = [1.7, 1.3, 1.9];

const MeanSurface = observer(function MeanSurface() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    const { mean } = context.ensemble;
    const geometry = useMemo(() => surfaceGeometry(mean, context.heightScale), [mean, context.heightScale]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    // The depth override replaces the material when drawing; this one is a placeholder.
    return <mesh geometry={geometry}><meshBasicMaterial /></mesh>;
});

// The canvas keeps no copy of what it drew, so a read must follow a render in the same task.
function SaveHandle({ saveRef }: { saveRef: React.RefObject<(() => void) | null> }) {
    const { gl, scene, camera } = useThree();
    useEffect(() => {
        saveRef.current = () => {
            gl.render(scene, camera);
            saveGrayscalePng(gl, "terrain-depth.png");
        };
        return () => { saveRef.current = null; };
    }, [gl, scene, camera, saveRef]);
    return null;
}

export default function DepthPanel() {
    const saveRef = useRef<(() => void) | null>(null);
    const saveButton = (
        <Button size="small" onClick={() => saveRef.current?.()} sx={{ mr: 0.5 }}>Save PNG</Button>
    );
    return (
        <Panel panelName="Depth" appbarContent={saveButton}>
            <Box sx={{ width: 1, height: 1, minHeight: 0, aspectRatio: "4 / 3" }}>
                <Canvas frameloop="demand" camera={{ position: CAMERA_POSITION, fov: 38 }}>
                    <FitCameraToAspect position={CAMERA_POSITION} minimumAspect={1.25} />
                    <DoublePressToReset />
                    <DepthOverride />
                    <MeanSurface />
                    <SaveHandle saveRef={saveRef} />
                    <OrbitControls makeDefault maxPolarAngle={Math.PI * 0.47} minDistance={1.2} maxDistance={9} />
                </Canvas>
            </Box>
        </Panel>
    );
}
