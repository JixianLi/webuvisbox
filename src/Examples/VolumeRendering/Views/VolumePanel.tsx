// ABOUTME: The volume rendering example's main view: the generated volume ray-marched through its transfer function,
// ABOUTME: orbitable, at reduced resolution and sampling while the camera moves.

import { useRef } from "react";
import { observer } from "mobx-react-lite";
import { Canvas, useThree } from "@react-three/fiber";
import { AdaptiveDpr, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Box from "@mui/material/Box";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { getTextureManager } from "../../../Renderers/Colormaps/TextureManager";
import { VolumeRenderer } from "../../../Renderers/Volume/VolumeRenderer";
import type { VolumeRenderingGlobalContext } from "../VolumeRenderingGlobalContext";
import { transferFunctionFor } from "../VolumeTransferFunctions";
import { FitCameraToAspect } from "../../../Renderers/Camera/FitCameraToAspect";
import { DoublePressToReset } from "../../../Renderers/Camera/DoublePressToReset";

const CAMERA_POSITION = new THREE.Vector3(1.1, 1.0, 1.3);


// Lower resolution and sampling (r3f's performance regression, read by AdaptiveDpr and VolumeRenderer) only while a
// pointer drags the view. OrbitControls' own regress prop regresses on every change, including the damped glide after
// release, which kept the view coarse for about three seconds after letting go.
function OrbitControlsRegressingWhileDragging() {
    const regress = useThree(state => state.performance.regress);
    const dragging = useRef(false);
    return (
        <OrbitControls makeDefault minDistance={0.6} maxDistance={6} dampingFactor={0.12}
                       onStart={() => { dragging.current = true; regress(); }}
                       onEnd={() => { dragging.current = false; }}
                       onChange={() => { if (dragging.current) regress(); }} />
    );
}

const Volume = observer(function Volume() {
    const context = useScenario().globalContext as VolumeRenderingGlobalContext;
    const transferFunction = transferFunctionFor(context, context.dataset);
    const texture = getTextureManager().getTexture(transferFunction.textureName, transferFunction.textureName);
    const { data, dimensions } = context.volume;
    if (!texture) return null;
    return (
        // The datasets' z axis is up; three.js' up is y.
        <group rotation={[-Math.PI / 2, 0, 0]}>
            <VolumeRenderer data={data} dimensions={dimensions} transferFunction={texture}
                            samplesPerVoxel={context.samplesPerVoxel} lighting={context.lighting} />
        </group>
    );
});

export default function VolumePanel() {
    return (
        <Panel panelName="Volume">
            <Box sx={{ width: 1, height: 1, minHeight: 0 }}>
                <Canvas frameloop="demand" performance={{ min: 0.5 }} camera={{ position: CAMERA_POSITION.toArray(), fov: 40 }}>
                    <FitCameraToAspect position={CAMERA_POSITION.toArray()} />
                    <DoublePressToReset />
                    <AdaptiveDpr pixelated />
                    <Volume />
                    <OrbitControlsRegressingWhileDragging />
                </Canvas>
            </Box>
        </Panel>
    );
}
