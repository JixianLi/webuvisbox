// ABOUTME: The Uncertain terrain example's main view: the ensemble-mean surface in 3D, colored by VSUP (value = mean
// ABOUTME: height, faded by the spread) or by one scalar field; wind glyphs; a whisker at the probe across all members.

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Tooltip from "@mui/material/Tooltip";
import { Layers } from "lucide-react";
import * as d3 from "d3";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type { UncertainTerrainGlobalContext } from "../UncertainTerrainGlobalContext";
import { gridPosition, nearestGridIndex } from "../TerrainEnsemble";
import { scalarColormapTexture, setScalarColormapPreset, terrainColor, terrainPalette } from "../TerrainColors";
import { surfaceGeometry } from "./TerrainSurfaceGeometry";
import { ScalarFieldMesh } from "../../../Renderers/Mesh/ScalarFieldMesh";
import { InstancedConeMesh } from "../../../Renderers/Mesh/InstancedConeMesh";
import { CheckMenuItem } from "../../../Panels/CheckMenuItem";
import { parseColor } from "../../../Helpers/ColorParser";
import type { InstanceTransform } from "../../../Types/Geometry";
import { FitCameraToAspect } from "../../../Renderers/Camera/FitCameraToAspect";
import { DoublePressToReset } from "../../../Renderers/Camera/DoublePressToReset";


// Framed for a landscape view; the terrain is wider than tall, so the camera backs off below an aspect of 1.25.
const CAMERA_POSITION = new THREE.Vector3(1.7, 1.3, 1.9);


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

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial vertexColors roughness={0.9} metalness={0} side={THREE.DoubleSide} />
        </mesh>
    );
});

// Both fields go on the mesh as scalars (normalized to [0, 1]); cIndex picks the one colored, from a TextureManager
// colormap. The opacity map is flat, so the surface stays opaque whichever field oIndex names.
const SCALAR_FIELDS = { mean: 0, spread: 1 } as const;

const ScalarFieldSurface = observer(function ScalarFieldSurface({ field }: { field: keyof typeof SCALAR_FIELDS }) {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    const { mean } = context.ensemble;
    const preset = context.colormapPreset;
    const texture = useMemo(() => scalarColormapTexture(), []);
    useEffect(() => setScalarColormapPreset(preset), [preset]);
    const mesh = useMemo(() => {
        const surface = surfaceGeometry(mean, context.heightScale);
        surface.computeVertexNormals();
        const arrays = {
            vertices: surface.getAttribute("position").array as Float32Array,
            normals: surface.getAttribute("normal").array as Float32Array,
            indices: Uint32Array.from(surface.index!.array),
        };
        surface.dispose();
        return arrays;
    }, [mean, context.heightScale]);
    const scalars = useMemo(() => [context.normalizedMean, context.normalizedUncertainty],
                            [context.normalizedMean, context.normalizedUncertainty]);
    return (
        <ScalarFieldMesh vertices={mesh.vertices} normals={mesh.normals} indices={mesh.indices} scalars={scalars}
                         cIndex={SCALAR_FIELDS[field]} oIndex={SCALAR_FIELDS[field]} texture={texture}
                         transparent={false} shininess={5} specular="#222222" />
    );
});

// In the cone mesh's Z-up frame (see InstancedConeMesh), inside a group that turns it Y-up: a world point (x, y, z)
// is (x, −z, y) there, so a horizontal wind (u, w) along world x and z heads along (u, −w): hRotation = atan2(−w, u) − π/2.
// The tilt follows the mean terrain along the wind, so a glyph blowing uphill points up.
const WIND_LIFT = 0.05;
const WIND_GLYPH_LENGTH = 0.06;

const WindGlyphs = observer(function WindGlyphs() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    const canvas = useTheme().tokens.canvas;
    const glyphs = context.windGlyphs;
    const { mean } = context.ensemble;
    const heightScale = context.heightScale;
    const windColor = context.windColor;
    const glyphScale = context.windGlyphScale;
    const instances = useMemo(() => {
        const agreed = parseColor(windColor);
        const fade = d3.interpolateRgb(agreed, canvas);
        return glyphs.map((glyph): InstanceTransform => {
            const height = mean[nearestGridIndex(glyph.x, glyph.z)] * heightScale + WIND_LIFT;
            return {
                position: [glyph.x, -glyph.z, height],
                hRotation: Math.atan2(-glyph.windZ, glyph.windX) - Math.PI / 2,
                vRotation: Math.atan(glyph.slopeAlongWind * heightScale),
                scaleFactor: glyphScale * Math.min(1.5, 0.6 + Math.hypot(glyph.windX, glyph.windZ)),
                color: d3.rgb(fade(1 - glyph.agreement)),
            };
        });
    }, [glyphs, mean, heightScale, windColor, glyphScale, canvas]);
    return (
        <group rotation={[-Math.PI / 2, 0, 0]}>
            <InstancedConeMesh instances={instances} radius={0.01} lengthScale={WIND_GLYPH_LENGTH} radialSegments={8}
                               shininess={20} specular="#333333" />
        </group>
    );
});

const Surface = observer(function Surface() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    const probe = (event: ThreeEvent<PointerEvent>) => context.setProbeIndex(nearestGridIndex(event.point.x, event.point.z));
    return (
        <group onPointerMove={probe} onPointerDown={probe}>
            {context.encoding === "vsup" ? <TerrainSurface /> : <ScalarFieldSurface field={context.encoding} />}
        </group>
    );
});

const WindLayer = observer(function WindLayer() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    return context.showWind ? <WindGlyphs /> : null;
});

const LayersMenu = observer(function LayersMenu() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    return <>
        <Tooltip title="Layers">
            <IconButton size="small" aria-label="layers" className="panel-header-action"
                        onClick={event => setAnchor(event.currentTarget)}>
                <Layers size={16} strokeWidth={1.75} />
            </IconButton>
        </Tooltip>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <CheckMenuItem text="Wind glyphs" checked={context.showWind}
                           onClick={() => context.setShowWind(!context.showWind)} />
        </Menu>
    </>;
});

export default function TerrainPanel() {
    return (
        <Panel panelName="Terrain" appbarContent={<LayersMenu />}>
            <Box sx={{ width: 1, height: 1, minHeight: 0 }}>
                <Canvas frameloop="demand" camera={{ position: CAMERA_POSITION.toArray(), fov: 38 }}>
                    <FitCameraToAspect position={CAMERA_POSITION.toArray()} minimumAspect={1.25} />
                    <DoublePressToReset />
                    <hemisphereLight args={["#ffffff", "#808080", 1.6]} />
                    <directionalLight position={[2, 3, 1]} intensity={1.1} />
                    <Surface />
                    <WindLayer />
                    <ProbeWhisker />
                    <OrbitControls makeDefault maxPolarAngle={Math.PI * 0.47} minDistance={1.2} maxDistance={9} />
                </Canvas>
            </Box>
        </Panel>
    );
}
