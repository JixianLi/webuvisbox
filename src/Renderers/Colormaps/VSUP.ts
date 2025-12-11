import { makeObservable, runInAction, observable } from 'mobx';
import { PresetLinearColormap } from './PresetLinearColormap';
import { presets } from './Presets';
import * as d3 from 'd3';

export class VSUP extends PresetLinearColormap {
    depth: number;
    nodes: d3.RGBColor[];
    fading_color: d3.RGBColor = d3.rgb(233, 233, 233)
    continuous: boolean = false;
    flip_y: boolean = false;

    constructor(
        depth: number = 4,
        continuous: boolean = false,
        flip_y: boolean = false,
        preset_name: string = "Cool to Warm"
    ) {
        super(preset_name);
        this.type = "vsup"
        this.depth = depth;
        this.continuous = continuous;
        this.flip_y = flip_y;
        this._validatePreset();
        this._validateDepth();
        this._createTree();
        makeObservable(this, { depth: true, continuous: true, flip_y: true, fading_color: true, nodes: observable.deep });
    }

    setFadingColor(color: d3.RGBColor | string | [number, number, number]) {
        runInAction(() => {
            if (typeof color === 'string') {
                this.fading_color = d3.rgb(color);
            } else if (Array.isArray(color) && color.length === 3) {
                this.fading_color = d3.rgb(color[0], color[1], color[2]);
            } else if ('r' in color && 'g' in color && 'b' in color) {
                this.fading_color = d3.rgb(color.r, color.g, color.b);
            } else {
                console.warn('Invalid color format for setFadingColor.');
                return;
            }
            this._createTree();
        });
    }

    _validateDepth() {
        if (this.depth < 1 || this.depth > 10) {
            console.warn("Depth must be at least 1 and at most 10. Adjusting depth value.");
            this.depth = Math.max(1, Math.min(this.depth, 10));
        }
    }

    _validateColorValue(value) {
        if (typeof value !== 'number' || isNaN(value) || value < 0 || value > 1) {
            console.warn(`Color value must be a number between 0 and 1. Received: ${value}. Defaulting to 0.`);
            value = 0;
        }
    }

    _createTree() {
        const nNodes = 2 ** this.depth - 1;
        this.nodes = new Array(nNodes).fill(this.fading_color);

        for (let d = 0; d < this.depth; d++) {
            for (let i = 0; i < 2 ** d; i++) {
                if (d > 0) {
                    const idx = 2 ** d - 1 + i;
                    const uncertainty = 1 - d / (this.depth - 1);
                    const ratio = i / (2 ** d - 1);

                    const color1 = this.getColorByValue(ratio);
                    const color = d3.rgb(d3.interpolateLab(color1, this.fading_color)(uncertainty));

                    this.nodes[idx] = color;
                }
            }
        }
    }

    setFlipY(flip: boolean) {
        if (flip !== this.flip_y) {
            runInAction(() => {
                this.flip_y = flip;
            });
        }
    }

    setContinuous(continuous: boolean) {
        if (continuous !== this.continuous) {
            runInAction(() => {
                this.continuous = continuous;
            });
        }
    }

    setDepth(depth: number) {
        if (depth !== this.depth) {
            runInAction(() => {
                this.depth = depth;
                this._validateDepth();
                this._createTree();
            });
        }
    }

    setPreset(preset_name: string): void {
        super.setPreset(preset_name);
        runInAction(() => {
            this._createTree();
        });
    }

    getColorForTexture(x: number, y: number): d3.RGBColor {
        const ratio = x;
        let uncertainty = y;
        const continuous = this.continuous;
        uncertainty = Math.max(0, Math.min(uncertainty, 1));
        if (this.flip_y) {
            uncertainty = 1 - uncertainty;
        }
        const value = Math.max(0, Math.min(ratio, 1));

        const cacheKey = `${uncertainty.toFixed(3)}-${value.toFixed(3)}-${continuous}`;
        if (this._colorCache.has(cacheKey)) {
            return this._colorCache.get(cacheKey)!;
        }

        let result: d3.RGBColor;

        if (continuous || this.depth === 1) {
            const color1 = this.getColorByValue(value);
            result = d3.rgb(d3.interpolateLab(color1, this.fading_color)(1 - uncertainty));
        } else {
            let depth = Math.floor(this.depth * uncertainty);
            if (depth === this.depth) depth = this.depth - 1;
            if (depth === 0) return this.nodes[0];

            let vIdx = Math.floor(value * (2 ** depth));
            if (vIdx === 2 ** depth) vIdx -= 1;

            const idx = 2 ** depth + vIdx - 1;
            return this.nodes[idx];
        }

        if (this._colorCache.size < this._cache_size) {
            this._colorCache.set(cacheKey, result);
        }

        return result;
    }

    toJson() {
        return JSON.stringify(this.toObject(), null, 2);
    }

    toObject() {
        return {
            type: "vsup",
            preset_name: this.preset_name,
            color_control_points: this.color_control_points,
            color_points: this.color_points.map(arr => [...arr]),
            depth: this.depth,
            flip_y: this.flip_y,
            fading_color: d3.rgb(this.fading_color).formatRgb(),
            continuous: this.continuous
        }
    }

    static fromObject(obj: any): VSUP {
        const colormap = new VSUP();
        if (obj.type && obj.type !== "vsup") {
            console.warn(`Invalid colormap type: ${obj.type}. Expected 'vsup'.`);
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
            colormap.color_points = obj.color_points.map(arr => [...arr]);
        } else {
            console.warn("Missing or invalid 'color_points' in colormap object. Using default from preset.");
            colormap.color_points = presets[colormap.preset_name].color_points.map(arr => [...arr]);
        }
        if (typeof obj.depth === 'number') {
            colormap.depth = obj.depth;
        } else {
            console.warn("Missing or invalid 'depth' in colormap object. Defaulting to 4.");
            colormap.depth = 4;
        }
        if (typeof obj.flip_y === 'boolean') {
            colormap.flip_y = obj.flip_y;
        } else {
            console.warn("Missing or invalid 'flip_y' in colormap object. Defaulting to false.");
            colormap.flip_y = false;
        }
        if (typeof obj.continuous === 'boolean') {
            colormap.continuous = obj.continuous;
        } else {
            console.warn("Missing or invalid 'continuous' in colormap object. Defaulting to false.");
            colormap.continuous = false;
        }
        if (obj.fading_color) {
            if (typeof obj.fading_color === 'string') {
                colormap.fading_color = d3.rgb(obj.fading_color);
            } else if (Array.isArray(obj.fading_color) && obj.fading_color.length === 3) {
                colormap.fading_color = d3.rgb(obj.fading_color[0], obj.fading_color[1], obj.fading_color[2]);
            } else if (typeof obj.fading_color === 'object' && 'r' in obj.fading_color && 'g' in obj.fading_color && 'b' in obj.fading_color) {
                colormap.fading_color = d3.rgb(obj.fading_color.r, obj.fading_color.g, obj.fading_color.b);
            } else {
                console.warn("Invalid format for 'fading_color' in colormap object. Defaulting to (233, 233, 233).");
                colormap.fading_color = d3.rgb(233, 233, 233);
            }
        } else {
            console.warn("Missing 'fading_color' in colormap object. Defaulting to (233, 233, 233).");
            colormap.fading_color = d3.rgb(233, 233, 233);
        }
        colormap._validatePreset();
        colormap._validateDepth();
        colormap._createTree();
        return colormap;
    }
}

export default VSUP;
