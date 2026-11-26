// ABOUTME: The tornado example's 3D canvas, shared by its linked views: one camera pose for all of them (moving one moves
// ABOUTME: the others), a double press to go back to the start view, and the ensemble's bounding box for reference.

import type { ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useTheme } from "@mui/material/styles";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { SharedTrackballControl } from "../../../Renderers/SharedCameraControl/SharedTrackballControl";
import { DoublePressToReset } from "../../../Renderers/Camera/DoublePressToReset";
import { BoxOutlineMesh } from "../../../Renderers/Mesh/BoxOutlineMesh";
import type { TornadoEnsembleGlobalContext } from "../TornadoEnsembleGlobalContext";

// The paths span about x, y ∈ [−2.5, 2.5], z ∈ [1, 6]. The group shows the flow's z as up, scaled to about unit size and
// centered: rotating −90° about x maps (x, y, z) to (x, z, −y). Children are in the flow's coordinates.
const SCENE_SCALE = 1 / 2.2;
const CAMERA_POSITION = new THREE.Vector3(0.4, 0.5, 3.1);
const ORIGIN = new THREE.Vector3(0, 0, 0);
const BOX_LINE_WIDTH = 0.015;

const DomainBox = observer(function DomainBox() {
    const context = useScenario().globalContext as TornadoEnsembleGlobalContext;
    const color = useTheme().tokens.textMuted;
    return <BoxOutlineMesh boundingBox={context.ensemble.bounds} color={color} linewidth={BOX_LINE_WIDTH} />;
});

export function LinkedCanvas({ children }: { children: ReactNode }) {
    const context = useScenario().globalContext as TornadoEnsembleGlobalContext;
    return (
        <Canvas frameloop="demand" camera={{ position: CAMERA_POSITION.toArray(), fov: 40 }}>
            <DoublePressToReset />
            <hemisphereLight args={["#ffffff", "#808080", 1.4]} />
            <directionalLight position={[2, 3, 2]} intensity={1.2} />
            <group scale={SCENE_SCALE} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5 * SCENE_SCALE, 0]}>
                {children}
                <DomainBox />
            </group>
            <SharedTrackballControl makeDefault globalData={context} position0={CAMERA_POSITION} target={ORIGIN}
                                    target0={ORIGIN} minDistance={1.2} maxDistance={10} />
        </Canvas>
    );
}

export default LinkedCanvas;
