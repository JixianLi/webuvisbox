import { clip, degree2radian } from "@/Helpers/MathHelper";
import { runInAction } from "mobx";
import * as d3 from "d3";
import { makeAutoObservable } from "mobx";
import type { TransformationInstance } from "@/Types/Geometry";

interface WindField {
    u: Float32Array;
    v: Float32Array;
    mag: Float32Array;
    mag_max: number;
}

interface TerrainData {
    positions: Float32Array;
    base_scale: number;
}

interface ColorGetter {
    (magnitude: number, max_magnitude: number): d3.RGBColor;
}

export class SingleInstanceWindGlyphsConfig {

    private _display: boolean;
    private _scale_by_magnitude: boolean;
    private _color_by_magnitude: boolean;
    private _sampling_stride: number;
    private _length_scale: number;
    private _radius: number;
    private _size_scale: number;
    private _color: d3.RGBColor;
    private _instances: TransformationInstance[];

    constructor() {
        this._display = false;
        this._scale_by_magnitude = false;
        this._color_by_magnitude = false;

        this._sampling_stride = 300;
        this._length_scale = 15;
        this._radius = 3;
        this._size_scale = 5;
        this._color = d3.rgb(0, 0, 255);

        this._instances = [];
        makeAutoObservable(this);
    }

    // Public getters - everyone can read
    get display(): boolean { return this._display; }
    get scale_by_magnitude(): boolean { return this._scale_by_magnitude; }
    get color_by_magnitude(): boolean { return this._color_by_magnitude; }
    get sampling_stride(): number { return this._sampling_stride; }
    get length_scale(): number { return this._length_scale; }
    get radius(): number { return this._radius; }
    get size_scale(): number { return this._size_scale; }
    get color(): d3.RGBColor { return this._color; }
    get instances(): TransformationInstance[] { return this._instances; }

    loadFromJson(json: string): void {
        const obj = JSON.parse(json);
        this.loadFromObject(obj);
    }

    private computeGlyphs(wind_field: WindField, terrain: TerrainData, color_getter: ColorGetter): TransformationInstance[] {
        const { u, v, mag, mag_max } = wind_field;
        const instances: TransformationInstance[] = [];
        const indices_length = Math.floor(u.length / this._sampling_stride);
        const z_scale_factor = this._scale_by_magnitude ? (this._size_scale * mag_max) : (this._size_scale);
        for (let i = 0; i < indices_length; i++) {
            const idx = i * this._sampling_stride;
            const position: [number, number, number] = [
                terrain.positions[idx * 3],
                terrain.positions[idx * 3 + 1],
                terrain.positions[idx * 3 + 2] + z_scale_factor * this._radius * terrain.base_scale
            ];
            const h_rotation = degree2radian(-90) + Math.atan2(v[idx], u[idx]);
            const v_rotation = 0;
            const color = this._color_by_magnitude ? color_getter(mag[idx], mag_max) : this._color;
            const scale_factor = this._scale_by_magnitude ? this._size_scale * mag[idx] : this._size_scale;
            instances.push({
                position: position,
                h_rotation: h_rotation,
                v_rotation: v_rotation,
                scale_factor: scale_factor,
                color: color
            });
        }
        return instances;
    }

    public updateInstances(wind_field: WindField, terrain: TerrainData, color_getter: ColorGetter): void {
        const instances = this.computeGlyphs(wind_field, terrain, color_getter);
        runInAction(() => {
            this._instances = instances;
        })
    }

    public resetInstances(): void {
        runInAction(() => {
            this._instances = [];
        })
    }

    public setColor(color: string | d3.RGBColor | [number, number, number, number] | [number, number, number]): void {
        let rgbColor: d3.RGBColor;

        if (typeof color === 'string') {
            rgbColor = d3.rgb(color);
        } else if (color && typeof color === 'object' && 'r' in color && 'g' in color && 'b' in color) {
            rgbColor = color as d3.RGBColor;
        } else if (Array.isArray(color)) {
            if (color.length === 3) {
                rgbColor = d3.rgb(color[0], color[1], color[2]);
            } else if (color.length === 4) {
                // For RGBA, ignore alpha channel as d3.RGBColor doesn't support it directly
                rgbColor = d3.rgb(color[0], color[1], color[2]);
            } else {
                throw new Error('Color array must have 3 or 4 elements');
            }
        } else {
            throw new Error('Invalid color format');
        }

        runInAction(() => {
            this._color = rgbColor;
        });
    }

    public setRadius(radius: number): void {
        const clipped_radius = clip(radius, 1e-10, undefined);
        runInAction(() => {
            this._radius = clipped_radius;
        })
    }

    public setSizeScale(size_scale: number): void {
        const clipped_size_scale = clip(size_scale, 1e-10, undefined);
        runInAction(() => {
            this._size_scale = clipped_size_scale;
        })
    }

    public setLengthScale(length_scale: number): void {
        const clipped_length_scale = clip(length_scale, 1e-10, undefined);
        runInAction(() => {
            this._length_scale = clipped_length_scale;
        })
    }

    public setStride(stride: number): void {
        runInAction(() => {
            this._sampling_stride = stride;
        })
    }

    public setDisplay(display: boolean): void {
        runInAction(() => {
            this._display = display;
        })
    }

    public setScaleByMagnitude(scale_by_magnitude: boolean): void {
        runInAction(() => {
            this._scale_by_magnitude = scale_by_magnitude;
        })
    }

    public setColorByMagnitude(color_by_magnitude: boolean): void {
        runInAction(() => {
            this._color_by_magnitude = color_by_magnitude;
        })
    }

    public setSamplingStride(stride: number): void {
        const clipped_stride = Math.max(1, Math.round(stride));
        runInAction(() => {
            this._sampling_stride = clipped_stride;
        })
    }

    loadFromObject(obj: any): void {
        this._display = obj.display ?? this._display;
        this._scale_by_magnitude = obj.scale_by_magnitude ?? this._scale_by_magnitude;
        this._color_by_magnitude = obj.color_by_magnitude ?? this._color_by_magnitude;

        this._sampling_stride = obj.sampling_stride ?? this._sampling_stride;
        this._length_scale = obj.length_scale ?? this._length_scale;
        this._radius = obj.radius ?? this._radius;
        this._size_scale = obj.size_scale ?? this._size_scale;
        this._color = d3.rgb(obj.color) ?? this._color;

        try {
            this._instances = Array.isArray(obj.instances)
                ? obj.instances.map((instance: any) => ({
                    position: instance.position,
                    h_rotation: instance.h_rotation,
                    v_rotation: instance.v_rotation,
                    scale_factor: instance.scale_factor,
                    color: d3.rgb(instance.color)
                })) as TransformationInstance[]
                : [];
        } catch {
            this._instances = [];
        }
    }

    toObject() {
        return {
            display: this._display,
            scale_by_magnitude: this._scale_by_magnitude,
            color_by_magnitude: this._color_by_magnitude,
            sampling_stride: this._sampling_stride,
            length_scale: this._length_scale,
            radius: this._radius,
            size_scale: this._size_scale,
            color: this._color.formatHex(),
        };
    }

    toJson(): string {
        return JSON.stringify(this.toObject());
    }
}