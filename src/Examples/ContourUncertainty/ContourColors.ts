// ABOUTME: Colors and geometry the contour uncertainty views share: colormap lookup tables, painting a grid of values
// ABOUTME: into a canvas, and SVG contour paths. Imported only by lazily loaded views (the colormap presets are large).

import * as d3 from "d3";
import { PresetLinearColormap } from "../../Renderers/Colormaps/PresetLinearColormap";
import { GRID_SIZE } from "./ContourEnsemble";

// Colors by job: the fraction above the level and the member fields diverge around a meaningful middle (50%, the
// level itself), so they get a diverging map with a gray midpoint; the crossing probability is a magnitude from 0, so
// it gets a sequential one.
export const DIVERGING_PRESET = "Cool to Warm";
export const SEQUENTIAL_PRESET = "Viridis (matplotlib)";

const LOOKUP_SIZE = 256;
const lookups = new Map<string, Uint8ClampedArray>();

function colorLookup(preset: string): Uint8ClampedArray {
    if (!lookups.has(preset)) {
        const colormap = new PresetLinearColormap(preset);
        const lookup = new Uint8ClampedArray(LOOKUP_SIZE * 3);
        for (let entry = 0; entry < LOOKUP_SIZE; entry++) {
            const color = colormap.getColorByValue(entry / (LOOKUP_SIZE - 1));
            lookup.set([color.r, color.g, color.b], entry * 3);
        }
        lookups.set(preset, lookup);
    }
    return lookups.get(preset)!;
}

export function cssGradient(preset: string): string {
    const colormap = new PresetLinearColormap(preset);
    const stops = d3.range(17).map(stop => {
        const color = colormap.getColorByValue(stop / 16);
        return `${color.formatHex()} ${(stop / 16) * 100}%`;
    });
    return `linear-gradient(to right, ${stops.join(", ")})`;
}

// Paints a size × size grid of values (row 0 at the top) into the canvas, one pixel per value, colored by the preset at
// normalize(value) ∈ [0, 1].
export function paintGrid(canvas: HTMLCanvasElement, values: ArrayLike<number>, size: number, preset: string,
                          normalize: (value: number) => number) {
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;
    const lookup = colorLookup(preset);
    const image = context.createImageData(size, size);
    for (let index = 0; index < size * size; index++) {
        const entry = Math.round(Math.max(0, Math.min(1, normalize(values[index]))) * (LOOKUP_SIZE - 1)) * 3;
        image.data[index * 4] = lookup[entry];
        image.data[index * 4 + 1] = lookup[entry + 1];
        image.data[index * 4 + 2] = lookup[entry + 2];
        image.data[index * 4 + 3] = 255;
    }
    context.putImageData(image, 0, 0);
}

// SVG path of a field's contour at a level, in the [0, GRID_SIZE] frame where the value at (column, row) sits at
// (column + 0.5, row + 0.5) (d3.contours' convention). Cached per field, so the views that draw the same contour
// compute it once.
const contourGenerator = d3.contours().size([GRID_SIZE, GRID_SIZE]);
const planarPath = d3.geoPath();
const contourCache = new WeakMap<ArrayLike<number>, Map<number, string>>();

export function contourPath(field: ArrayLike<number>, level: number): string {
    let byLevel = contourCache.get(field);
    if (!byLevel) {
        byLevel = new Map();
        contourCache.set(field, byLevel);
    }
    let path = byLevel.get(level);
    if (path === undefined) {
        path = planarPath(contourGenerator.contour(field as number[], level)) ?? "";
        if (byLevel.size > 64) byLevel.clear();
        byLevel.set(level, path);
    }
    return path;
}
