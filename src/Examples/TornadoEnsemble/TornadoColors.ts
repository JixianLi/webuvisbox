// ABOUTME: Colors of the tornado ensemble example, shared by the 3D views, the colorbar and the chart: a sequential
// ABOUTME: colormap over spread or over time. Imported only by lazily loaded views (the colormap presets are large).

import * as d3 from "d3";
import type * as THREE from "three";
import { getTextureManager } from "../../Renderers/Colormaps/TextureManager";
import { PresetLinearColormap } from "../../Renderers/Colormaps/PresetLinearColormap";
import { SPREAD_DOMAIN, type ColorMode } from "./TornadoEnsembleGlobalContext";
import { DURATION, SAMPLE_COUNT, SAMPLE_INTERVAL } from "./TornadoFlow";

const colormaps = new Map<string, PresetLinearColormap>();

function colormap(preset: string): PresetLinearColormap {
    if (!colormaps.has(preset)) colormaps.set(preset, new PresetLinearColormap(preset));
    return colormaps.get(preset)!;
}

// Fixed in every display mode, so the mean path and the members look the same whatever the chrome: a blue-gray for
// the mean path, a warm gray for the members' current positions, apart from each other by hue and from the colormap
// by their low saturation.
export const MEAN_PATH_COLOR = "#8FA6BF";
export const MEMBER_COLOR = "#C2B6A6";

export const spreadScale = d3.scaleLinear().domain(SPREAD_DOMAIN).clamp(true);
export const timeScale = d3.scaleLinear().domain([0, DURATION]).clamp(true);

export function colorAt(preset: string, normalizedValue: number): d3.RGBColor {
    return colormap(preset).getColorByValue(normalizedValue);
}

// Per-sample colors as linear RGB (three.js shades in linear space; palette colors are sRGB, so convert or every color
// comes out too light). Spread mode colors sample s by the ensemble's spread at s; time mode by s's time.
export function sampleColors(preset: string, colorMode: ColorMode, spread: Float32Array): Float32Array {
    const colors = new Float32Array(SAMPLE_COUNT * 3);
    const linear = { r: 0, g: 0, b: 0 };
    const convert = (rgb: d3.RGBColor) => {
        const toLinear = (channel: number) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        };
        linear.r = toLinear(rgb.r); linear.g = toLinear(rgb.g); linear.b = toLinear(rgb.b);
    };
    for (let sample = 0; sample < SAMPLE_COUNT; sample++) {
        const value = colorMode === "spread" ? spreadScale(spread[sample]) : timeScale(sample * SAMPLE_INTERVAL);
        convert(colorAt(preset, value));
        colors.set([linear.r, linear.g, linear.b], sample * 3);
    }
    return colors;
}

// The uncertainty tube's colormap, a texture in TextureManager (sampled by the tube's u coordinate): one registered
// colormap whose preset follows the example's.
const TUBE_COLORMAP = "tornado-ensemble-spread";

// Registers the colormap on first use; idempotent, so safe while rendering.
export function tubeColormapTexture(): THREE.DataTexture {
    const textureManager = getTextureManager();
    if (!textureManager.getColormap(TUBE_COLORMAP)) {
        textureManager.registerColormap(TUBE_COLORMAP, new PresetLinearColormap());
    }
    return textureManager.getTexture(TUBE_COLORMAP)!;
}

// Rewrites the texture in place (from an effect: it changes state other views draw from).
export function setTubeColormapPreset(preset: string) {
    const colormap = getTextureManager().getColormap(TUBE_COLORMAP);
    if (colormap && colormap.presetName !== preset) {
        colormap.setPreset(preset);
    }
}
