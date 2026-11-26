import { presets, presetnames } from './Presets'
import * as d3 from 'd3';
import { action, makeObservable, observable, runInAction } from 'mobx';
import { findSmallerIndex } from '../../Helpers/MathHelper';

export class PresetLinearColormap {
    presetName: string = "Cool to Warm";
    protected _colorCache: Map<string, d3.RGBColor> = new Map();
    protected _cacheSize: number = 1000;
    type: "default" | "vsup" | "linear" = "linear";
    colorControlPoints: number[] = [];
    colorPoints: number[][] = [];

    constructor(
        presetName: string = "Cool to Warm",
    ) {
        this.setPreset(presetName);

        makeObservable(this, {
            presetName: observable,
            colorControlPoints: observable,
            colorPoints: observable,
            setColorControlPoint: action,
        });
    }

    // Moves a color point and, if given, sets its color (RGB in [0, 1]). The endpoints keep their positions, and an
    // interior point stays strictly between its neighbors, so the points stay sorted.
    setColorControlPoint(index: number, position: number, color?: number[]) {
        const points = this.colorControlPoints;
        if (index > 0 && index < points.length - 1) {
            const gap = 1e-4;
            points[index] = Math.min(points[index + 1] - gap, Math.max(points[index - 1] + gap, position));
        }
        if (color) this.colorPoints[index] = [...color];
        this.onColorsChanged();
    }

    // Every edit of the points ends here, so anything derived from them (a cache, VSUP's tree) is rebuilt.
    protected onColorsChanged(): void {
        this._colorCache.clear();
    }

    removeColorControlPoint(index: number) {
        if (index <= 0 || index >= this.colorControlPoints.length - 1) {
            console.warn("Cannot remove first or last color control point.");
            return;
        }
        runInAction(() => {
            this.colorControlPoints.splice(index, 1);
            this.colorPoints.splice(index, 1);
            this.onColorsChanged();
        });
    }

    addColorControlPoint(value:number) {
        if (value <= this.colorControlPoints[0] || value >= this.colorControlPoints[this.colorControlPoints.length - 1]) {
            console.warn("New color control point must be within the existing range.");
            return;
        }
        const newColor = this.getColorByValue(value);
        let idx = findSmallerIndex(this.colorControlPoints, value) + 1;
        if (idx === this.colorControlPoints.length) idx = this.colorControlPoints.length - 1;
        runInAction(() => {
            this.colorControlPoints.splice(idx, 0, value);
            this.colorPoints.splice(idx, 0, [newColor.r / 255, newColor.g / 255, newColor.b / 255]);
            this.onColorsChanged();
        });
    }

    getRGBColors(values: number[]): d3.RGBColor[] {
        return values.map(v => this.getColorByValue(v));
    }

    getColor(value: number): d3.RGBColor {
        return this.getColorByValue(value);
    }

    // Mirrors the map: the color at position p moves to 1 - p.
    invert() {
        runInAction(() => {
            this.colorControlPoints = this.colorControlPoints.map(position => 1 - position).reverse();
            this.colorPoints = [...this.colorPoints].reverse();
            this.onColorsChanged();
        });
    }

    _validatePreset(): void {
        if (!presetnames.includes(this.presetName)) {
            console.warn(`Invalid presetName: ${this.presetName}. Defaulting to 'Cool to Warm'.`);
            this.presetName = "Cool to Warm";
        }
    }

    getColorByValue(value: number): d3.RGBColor {
        value = Math.max(0, Math.min(value, 1));
        const controlPoints = this.colorControlPoints;
        const colors = this.colorPoints;
        let leftIndex = 0;
        while (leftIndex < controlPoints.length - 1 && controlPoints[leftIndex + 1] <= value) {
            leftIndex++;
        }
        const rightIndex = Math.min(leftIndex + 1, controlPoints.length - 1);
        const ratio = leftIndex === rightIndex ? 0 : (value - controlPoints[leftIndex]) / (controlPoints[rightIndex] - controlPoints[leftIndex]);
        const [lr, lg, lb] = colors[leftIndex].map(c => Math.round(c * 255));
        const [rr, rg, rb] = colors[rightIndex].map(c => Math.round(c * 255));
        const colorLeft = d3.rgb(lr, lg, lb);
        const colorRight = d3.rgb(rr, rg, rb);
        return d3.rgb(d3.interpolateRgb(colorLeft, colorRight)(ratio));
    }

    setPreset(presetName: string): void {
        runInAction(() => {
            this.presetName = presetName;
            this._validatePreset();
            this.colorControlPoints = [...presets[this.presetName].control_points];
            this.colorPoints = presets[this.presetName].color_points.map(arr => [...arr]);
            this.onColorsChanged();
        });
    }

    setControlPoints(controlPoints: number[], colorPoints: number[][]): void {
        if (controlPoints.length !== colorPoints.length) {
            console.warn("controlPoints and colorPoints must have the same length.");
            return;
        }
        runInAction(() => {
            this.colorControlPoints = controlPoints;
            this.colorPoints = colorPoints;
            this.onColorsChanged();
        });
    }

    setCacheSize(size: number): void {
        this._cacheSize = Math.max(0, size);
        if (this._colorCache.size > this._cacheSize) this._colorCache.clear();
    }

    getColorForTexture(x: number, _y: number): d3.RGBColor {
        return this.getColorByValue(x);
    }

    toObject() {
        return {
            type: "linear",
            preset_name: this.presetName,
            color_control_points: this.colorControlPoints,
            color_points: this.colorPoints,
        };
    }

    static fromObject(obj: Record<string, unknown>): PresetLinearColormap {
        const colormap = new PresetLinearColormap();
        if (obj.type && obj.type !== "linear") {
            console.warn(`Invalid colormap type: ${obj.type}. Expected 'linear'.`);
        }
        if (obj.preset_name && typeof obj.preset_name === 'string') {
            colormap.presetName = obj.preset_name;
        } else {
            console.warn("Missing or invalid 'preset_name' in colormap object. Defaulting to 'Cool to Warm'.");
            colormap.presetName = "Cool to Warm";
        }
        if (Array.isArray(obj.color_control_points) && obj.color_control_points.every((value: unknown) => typeof value === 'number')) {
            colormap.colorControlPoints = obj.color_control_points;
        } else {
            console.warn("Missing or invalid 'color_control_points' in colormap object. Using default from preset.");
            colormap.colorControlPoints = [...presets[colormap.presetName].control_points];
        }
        if (Array.isArray(obj.color_points) && obj.color_points.every((color: unknown) => Array.isArray(color) && color.length === 3 && color.every((value: unknown) => typeof value === 'number'))) {
            colormap.colorPoints = obj.color_points;
        } else {
            console.warn("Missing or invalid 'color_points' in colormap object. Using default from preset.");
            colormap.colorPoints = presets[colormap.presetName].color_points.map(arr => [...arr]);
        }
        colormap._validatePreset();
        return colormap;
    }

    toJson() {
        return JSON.stringify(this.toObject(), null, 2);
    }

    static getAvailablePresets(): string[] {
        return presetnames;
    }
}

export default PresetLinearColormap;
