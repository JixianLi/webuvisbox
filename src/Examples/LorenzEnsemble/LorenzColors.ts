// ABOUTME: Colors of the Lorenz ensemble example, shared by the 3D view, the colorbar and the chart: a sequential
// ABOUTME: colormap over log spread or over time. Imported only by lazily loaded views (the colormap presets are large).

import * as d3 from "d3";
import { PresetLinearColormap } from "../../Renderers/Colormaps/PresetLinearColormap";
import { SPREAD_DOMAIN, type ColorMode } from "./LorenzEnsembleGlobalContext";
import { DURATION, SAMPLE_COUNT, SAMPLE_INTERVAL } from "./LorenzSystem";

const colormaps = new Map<string, PresetLinearColormap>();

function colormap(preset: string): PresetLinearColormap {
    if (!colormaps.has(preset)) colormaps.set(preset, new PresetLinearColormap(preset));
    return colormaps.get(preset)!;
}

export const spreadScale = d3.scaleLog().domain(SPREAD_DOMAIN).clamp(true);
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
        const value = colorMode === "spread" ? spreadScale(Math.max(spread[sample], 1e-12)) : timeScale(sample * SAMPLE_INTERVAL);
        convert(colorAt(preset, value));
        colors.set([linear.r, linear.g, linear.b], sample * 3);
    }
    return colors;
}
