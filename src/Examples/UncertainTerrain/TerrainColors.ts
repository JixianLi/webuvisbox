// ABOUTME: Value-suppressing uncertainty palette (VSUP) colors for the Uncertain terrain example, shared by the terrain
// ABOUTME: view and the legend. Imported only by lazily loaded views (the colormap presets are large).

import { VSUP } from "../../Renderers/Colormaps/VSUP";

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
