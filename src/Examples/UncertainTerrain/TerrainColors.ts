// ABOUTME: Value-suppressing uncertainty palette (VSUP) colors for the Uncertain terrain example, shared by the terrain
// ABOUTME: view and the legend. Imported only by lazily loaded views (the colormap presets are large).

import type * as THREE from "three";
import { VSUP } from "../../Renderers/Colormaps/VSUP";
import { PresetLinearColormap } from "../../Renderers/Colormaps/PresetLinearColormap";
import { OpacityMap } from "../../Renderers/Colormaps/OpacityMap";
import { getTextureManager } from "../../Renderers/Colormaps/TextureManager";

// Four levels: one fully faded color at the highest uncertainty, up to eight value bins when certain.
export const VSUP_DEPTH = 4;

const palettes = new Map<string, VSUP>();

export function terrainPalette(preset: string, continuous: boolean): VSUP {
    const key = `${preset}|${continuous}`;
    if (!palettes.has(key)) {
        palettes.set(key, new VSUP(VSUP_DEPTH, continuous, false, preset));
    }
    return palettes.get(key)!;
}

// VSUP.getColorForTexture takes certainty (1 = full color, 0 = fully faded).
export function terrainColor(palette: VSUP, value: number, uncertainty: number) {
    return palette.getColorForTexture(value, 1 - uncertainty);
}

// The scalar-field surface's lookup table, in TextureManager: a colormap following the example's preset and a flat
// opacity map, under one name.
const SCALAR_COLORMAP = "uncertain-terrain-scalar";

// Registers the maps on first use; idempotent, so safe while rendering.
export function scalarColormapTexture(): THREE.DataTexture {
    const textureManager = getTextureManager();
    if (!textureManager.getColormap(SCALAR_COLORMAP)) {
        textureManager.registerColormap(SCALAR_COLORMAP, new PresetLinearColormap());
        textureManager.registerOpacityMap(SCALAR_COLORMAP, new OpacityMap([0, 1], [1, 1]));
    }
    return textureManager.getTexture(SCALAR_COLORMAP, SCALAR_COLORMAP)!;
}

// Rewrites the texture in place (from an effect: it changes state other views draw from).
export function setScalarColormapPreset(preset: string) {
    const colormap = getTextureManager().getColormap(SCALAR_COLORMAP);
    if (colormap && colormap.presetName !== preset) {
        colormap.setPreset(preset);
    }
}
