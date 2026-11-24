// ABOUTME: The Uncertain terrain example's main view: the ensemble-mean surface in 3D, colored by VSUP (value = mean
// ABOUTME: height, faded by the members' spread), with a whisker at the probed vertex spanning all member heights.

import { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Box from "@mui/material/Box";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type { UncertainTerrainGlobalContext } from "../UncertainTerrainGlobalContext";
import { GRID_SIZE, gridPosition, nearestGridIndex } from "../TerrainEnsemble";
import { terrainColor, terrainPalette } from "../TerrainColors";

function surfaceGeometry(mean: Float32Array, heightScale: number): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(2, 2, GRID_SIZE - 1, GRID_SIZE - 1);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index++) {
        const { x, z } = gridPosition(index);
        positions.setXYZ(index, x, mean[index] * heightScale, z);
    }
    geometry.computeVertexNormals();
    return geometry;
}

// The camera is framed for a landscape view; on a portrait one (phones) it moves back so the terrain's width still fits,
// by the inverse of the aspect ratio (the horizontal field of view shrinks roughly with it).
const CAMERA_POSITION = new THREE.Vector3(1.7, 1.3, 1.9);

function FitCameraToAspect() {
    const camera = useThree(state => state.camera);
    const invalidate = useThree(state => state.invalidate);
    const aspect = useThree(state => state.size.width / Math.max(1, state.size.height));
    useEffect(() => {
        camera.position.copy(CAMERA_POSITION).multiplyScalar(Math.max(1, 1.25 / aspect));
        invalidate();
    }, [camera, aspect, invalidate]);
    return null;
}

const ProbeWhisker = observer(function ProbeWhisker() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    const { memberHeights, mean } = context.ensemble;
    const index = context.probeIndex;
    const { x, z } = gridPosition(index);
    const heights = memberHeights.map(member => member[index]);
    const low = Math.min(...heights) * context.heightScale;
    const high = Math.max(...heights) * context.heightScale;
    const length = Math.max(0.002, high - low);
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, (low + high) / 2, 0]}>
                <cylinderGeometry args={[0.006, 0.006, length, 8]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, mean[index] * context.heightScale, 0]}>
                <sphereGeometry args={[0.018, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
        </group>
    );
});

const TerrainSurface = observer(function TerrainSurface() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    const { mean } = context.ensemble;
    const palette = terrainPalette(context.colormapPreset, context.continuousColors);
    const values = context.normalizedMean;
    const uncertainties = context.normalizedUncertainty;
    const colors = useMemo(() => {
        // Palette colors are sRGB; three.js shades in linear space, so convert or every color comes out too light.
        const linear = new Float32Array(values.length * 3);
        const color = new THREE.Color();
        for (let index = 0; index < values.length; index++) {
            const rgb = terrainColor(palette, values[index], uncertainties[index]);
            color.setRGB(rgb.r / 255, rgb.g / 255, rgb.b / 255, THREE.SRGBColorSpace);
            linear.set([color.r, color.g, color.b], index * 3);
        }
        return linear;
    }, [palette, values, uncertainties]);
    const geometry = useMemo(() => {
        const surface = surfaceGeometry(mean, context.heightScale);
        surface.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        return surface;
    }, [mean, context.heightScale, colors]);
    useEffect(() => () => geometry.dispose(), [geometry]);

    const probe = (event: ThreeEvent<PointerEvent>) => context.setProbeIndex(nearestGridIndex(event.point.x, event.point.z));

    return (
        <mesh geometry={geometry} onPointerMove={probe} onPointerDown={probe}>
            <meshStandardMaterial vertexColors roughness={0.9} metalness={0} side={THREE.DoubleSide} />
        </mesh>
    );
});

export default function TerrainPanel() {
    return (
        <Panel panelName="Terrain">
            <Box sx={{ width: 1, height: 1, minHeight: 0 }}>
                <Canvas frameloop="demand" camera={{ position: CAMERA_POSITION.toArray(), fov: 38 }}>
                    <FitCameraToAspect />
                    <hemisphereLight args={["#ffffff", "#808080", 1.6]} />
                    <directionalLight position={[2, 3, 1]} intensity={1.1} />
                    <TerrainSurface />
                    <ProbeWhisker />
                    <OrbitControls makeDefault maxPolarAngle={Math.PI * 0.47} minDistance={1.2} maxDistance={9} />
                </Canvas>
            </Box>
        </Panel>
    );
}
