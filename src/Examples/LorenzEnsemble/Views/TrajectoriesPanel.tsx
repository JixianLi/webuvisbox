// ABOUTME: The Lorenz ensemble example's main view: every member's trajectory as a tube, grown up to the current time
// ABOUTME: and colored by the ensemble's spread (or by time), with a marker at each member's current position.

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { LinearTubeMesh } from "../../../Renderers/Mesh/LinearTubeMesh";
import type { LorenzEnsembleGlobalContext } from "../LorenzEnsembleGlobalContext";
import { sampleColors } from "../LorenzColors";

// Lorenz coordinates span about x, y ∈ [−20, 20], z ∈ [0, 50]. The group shows Lorenz z as up, scaled to about unit
// size and centered: rotating −90° about x maps (x, y, z) to (x, z, −y).
const SCENE_SCALE = 1 / 25;
const TUBE_RADIUS = 0.12;
const MARKER_RADIUS = 0.45;
const CAMERA_POSITION = new THREE.Vector3(0.4, 0.5, 3.1);

// Framed for a landscape view; a portrait one (phones) moves back by the inverse aspect so the attractor's width fits.
function FitCameraToAspect() {
    const camera = useThree(state => state.camera);
    const invalidate = useThree(state => state.invalidate);
    const aspect = useThree(state => state.size.width / Math.max(1, state.size.height));
    useEffect(() => {
        camera.position.copy(CAMERA_POSITION).multiplyScalar(Math.max(1, 1.0 / aspect));
        invalidate();
    }, [camera, aspect, invalidate]);
    return null;
}

const MemberMarkers = observer(function MemberMarkers() {
    const context = useScenario().globalContext as LorenzEnsembleGlobalContext;
    const markerColor = useTheme().tokens.text;
    const invalidate = useThree(state => state.invalidate);
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const { paths } = context.ensemble;
    const sample = context.visibleSampleCount - 1;
    useLayoutEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;
        const matrix = new THREE.Matrix4();
        paths.forEach((path, member) => {
            matrix.makeTranslation(path[sample * 3], path[sample * 3 + 1], path[sample * 3 + 2]);
            mesh.setMatrixAt(member, matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        invalidate();
    }, [paths, sample, invalidate]);
    return (
        <instancedMesh key={paths.length} ref={meshRef} args={[undefined, undefined, paths.length]}>
            <sphereGeometry args={[MARKER_RADIUS, 12, 12]} />
            <meshBasicMaterial color={markerColor} />
        </instancedMesh>
    );
});

const EnsembleTubes = observer(function EnsembleTubes() {
    const context = useScenario().globalContext as LorenzEnsembleGlobalContext;
    const { paths, spread } = context.ensemble;
    const preset = context.colormapPreset;
    const colorMode = context.colorMode;
    // Every member shares the per-sample colors (they depend on time only), so one array serves all paths.
    const colors = useMemo(() => {
        const shared = sampleColors(preset, colorMode, spread);
        return paths.map(() => shared);
    }, [preset, colorMode, spread, paths]);
    return (
        <LinearTubeMesh paths={paths} colors={colors} radius={TUBE_RADIUS} radialSegments={8}
                        visiblePointCount={context.visibleSampleCount} shininess={40} specular="#444444" />
    );
});

export default function TrajectoriesPanel() {
    return (
        <Panel panelName="Trajectories">
            <Box sx={{ width: 1, height: 1, minHeight: 0 }}>
                <Canvas frameloop="demand" camera={{ position: CAMERA_POSITION.toArray(), fov: 40 }}>
                    <FitCameraToAspect />
                    <hemisphereLight args={["#ffffff", "#808080", 1.4]} />
                    <directionalLight position={[2, 3, 2]} intensity={1.2} />
                    <group scale={SCENE_SCALE} rotation={[-Math.PI / 2, 0, 0]} position={[0, -25 * SCENE_SCALE, 0]}>
                        <EnsembleTubes />
                        <MemberMarkers />
                    </group>
                    <OrbitControls makeDefault minDistance={1.2} maxDistance={10} />
                </Canvas>
            </Box>
        </Panel>
    );
}
