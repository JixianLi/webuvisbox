import { presets, presetnames } from './Presets'
import * as d3 from 'd3';
import { makeObservable, observable, runInAction } from 'mobx';
import { findSmallerIndex } from '@/Helpers/MathHelper';

export class PresetLinearColormap {
    preset_name: string;
    protected _colorCache: Map<string, d3.RGBColor> = new Map();
    protected _cache_size: number = 1000;
    type: "default" | "vsup" | "linear" = "linear";
    color_control_points: number[] = [];
    color_points: number[][] = [];

    constructor(
        preset_name: string = "Cool to Warm",
    ) {
        this.setPreset(preset_name);

        makeObservable(this, {
            preset_name: observable,
            color_control_points: observable,
            color_points: observable,
        });
    }

    removeColorControlPoint(index: number) {
        if (index <= 0 || index >= this.color_control_points.length - 1) {
            console.warn("Cannot remove first or last color control point.");
            return;
        }
        runInAction(() => {
            this.color_control_points.splice(index, 1);
            this.color_points.splice(index, 1);
        });
    }

    addColorConntrolPoint(value:number) {
        if (value <= this.color_control_points[0] || value >= this.color_control_points[this.color_control_points.length - 1]) {
            console.warn("New color control point must be within the existing range.");
            return;
        }
        const newColor = this.getColorByValue(value);
        let idx = findSmallerIndex(this.color_control_points, value) + 1;
        if (idx === this.color_control_points.length) idx = this.color_control_points.length - 1;
        runInAction(() => {
            this.color_control_points.splice(idx, 0, value);
            this.color_points.splice(idx, 0, [newColor.r / 255, newColor.g / 255, newColor.b / 255]);
        });
    }

    getRGBColors(values: number[]): d3.RGBColor[] {
        return values.map(v => this.getColorByValue(v));
    }

    getColor(value: number): d3.RGBColor {
        return this.getColorByValue(value);
    }

    invert() {
        runInAction(() => {
            this.color_points.reverse();
        });
    }

    _validatePreset(): void {
        if (!presetnames.includes(this.preset_name)) {
            console.warn(`Invalid preset_name: ${this.preset_name}. Defaulting to 'Cool to Warm'.`);
            this.preset_name = "Cool to Warm";
        }
    }

    getColorByValue(value: number): d3.RGBColor {
        value = Math.max(0, Math.min(value, 1));
        const color_control_points = this.color_control_points;
        const color_points = this.color_points;
        let leftIndex = 0;
        while (leftIndex < color_control_points.length - 1 && color_control_points[leftIndex + 1] <= value) {
            leftIndex++;
        }
        const rightIndex = Math.min(leftIndex + 1, color_control_points.length - 1);
        const ratio = leftIndex === rightIndex ? 0 : (value - color_control_points[leftIndex]) / (color_control_points[rightIndex] - color_control_points[leftIndex]);
        const [lr, lg, lb] = color_points[leftIndex].map(c => Math.round(c * 255));
        const [rr, rg, rb] = color_points[rightIndex].map(c => Math.round(c * 255));
        const colorLeft = d3.rgb(lr, lg, lb);
        const colorRight = d3.rgb(rr, rg, rb);
        return d3.rgb(d3.interpolateRgb(colorLeft, colorRight)(ratio));
    }

    setPreset(preset_name: string): void {
        runInAction(() => {
            this.preset_name = preset_name;
            this._validatePreset();
            this._colorCache.clear();
            this.color_control_points = [...presets[this.preset_name].control_points];
            this.color_points = presets[this.preset_name].color_points.map(arr => [...arr]);
        });
    }

    setControlPoints(control_points: number[], color_points: number[][]): void {
        if (control_points.length !== color_points.length) {
            console.warn("control_points and color_points must have the same length.");
            return;
        }
        runInAction(() => {
            this.color_control_points = control_points;
            this.color_points = color_points;
            this._colorCache.clear();
        });
    }

    setCacheSize(size: number): void {
        this._cache_size = Math.max(0, size);
        if (this._colorCache.size > this._cache_size) this._colorCache.clear();
    }

    getColorForTexture(x: number, _y: number): d3.RGBColor {
        return this.getColorByValue(x);
    }

    toObject() {
        return {
            type: "linear",
            preset_name: this.preset_name,
            color_control_points: this.color_control_points,
            color_points: this.color_points,
        };
    }

    static fromObject(obj: any): PresetLinearColormap {
        const colormap = new PresetLinearColormap();
        if (obj.type && obj.type !== "linear") {
            console.warn(`Invalid colormap type: ${obj.type}. Expected 'linear'.`);
        }
        if (obj.preset_name && typeof obj.preset_name === 'string') {
            colormap.preset_name = obj.preset_name;
        } else {
            console.warn("Missing or invalid 'preset_name' in colormap object. Defaulting to 'Cool to Warm'.");
            colormap.preset_name = "Cool to Warm";
        }
        if (Array.isArray(obj.color_control_points) && obj.color_control_points.every((v: any) => typeof v === 'number')) {
            colormap.color_control_points = obj.color_control_points;
        } else {
            console.warn("Missing or invalid 'color_control_points' in colormap object. Using default from preset.");
            colormap.color_control_points = [...presets[colormap.preset_name].control_points];
        }
        if (Array.isArray(obj.color_points) && obj.color_points.every((arr: any) => Array.isArray(arr) && arr.length === 3 && arr.every((v: any) => typeof v === 'number'))) {
            colormap.color_points = obj.color_points;
        } else {
            console.warn("Missing or invalid 'color_points' in colormap object. Using default from preset.");
            colormap.color_points = presets[colormap.preset_name].color_points.map(arr => [...arr]);
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
