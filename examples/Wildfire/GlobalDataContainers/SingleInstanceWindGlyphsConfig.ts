// ABOUTME: Observable configuration and instance data for wind glyph visualization.
// ABOUTME: Manages glyph display settings, computes instanced transforms from wind field data.

import { clip, degree2radian } from "@/Helpers/MathHelper";
import { runInAction } from "mobx";
import * as d3 from "d3";
import { makeAutoObservable } from "mobx";
import type { InstanceTransform } from "@/Types/Geometry";
import { parseColor } from "@/Helpers/ColorParser";

interface WindField {
    u: Float32Array;
    v: Float32Array;
    mag: Float32Array;
    magMax: number;
}

interface TerrainData {
    positions: Float32Array;
    baseScale: number;
}

interface ColorGetter {
    (magnitude: number, maxMagnitude: number): d3.RGBColor;
}

export class SingleInstanceWindGlyphsConfig {

    private _display: boolean;
    private _scaleByMagnitude: boolean;
    private _colorByMagnitude: boolean;
    private _samplingStride: number;
    private _lengthScale: number;
    private _radius: number;
    private _sizeScale: number;
    private _color: d3.RGBColor;
    private _instances: InstanceTransform[];
    private _onChanged: (() => void) | null;

    constructor() {
        this._display = false;
        this._scaleByMagnitude = false;
        this._colorByMagnitude = false;

        this._samplingStride = 300;
        this._lengthScale = 15;
        this._radius = 3;
        this._sizeScale = 5;
        this._color = d3.rgb(0, 0, 255);

        this._instances = [];
        this._onChanged = null;
        makeAutoObservable(this);
    }

    get display(): boolean { return this._display; }
    get scaleByMagnitude(): boolean { return this._scaleByMagnitude; }
    get colorByMagnitude(): boolean { return this._colorByMagnitude; }
    get samplingStride(): number { return this._samplingStride; }
    get lengthScale(): number { return this._lengthScale; }
    get radius(): number { return this._radius; }
    get sizeScale(): number { return this._sizeScale; }
    get color(): d3.RGBColor { return this._color; }
    get instances(): InstanceTransform[] { return this._instances; }

    setOnChanged(callback: () => void): void {
        this._onChanged = callback;
    }

    private notifyChanged(): void {
        if (this._display && this._onChanged) {
            this._onChanged();
        }
    }

    loadFromJson(json: string): void {
        const obj = JSON.parse(json);
        this.loadFromObject(obj);
    }

    private computeGlyphs(windField: WindField, terrain: TerrainData, colorGetter: ColorGetter): InstanceTransform[] {
        const { u, v, mag, magMax } = windField;
        const instances: InstanceTransform[] = [];
        const indicesLength = Math.floor(u.length / this._samplingStride);
        const zScaleFactor = this._scaleByMagnitude ? (this._sizeScale * magMax) : (this._sizeScale);
        for (let i = 0; i < indicesLength; i++) {
            const idx = i * this._samplingStride;
            const position: [number, number, number] = [
                terrain.positions[idx * 3],
                terrain.positions[idx * 3 + 1],
                terrain.positions[idx * 3 + 2] + zScaleFactor * this._radius * terrain.baseScale
            ];
            const hRotation = degree2radian(-90) + Math.atan2(v[idx], u[idx]);
            const vRotation = 0;
            const color = this._colorByMagnitude ? colorGetter(mag[idx], magMax) : this._color;
            const scaleFactor = this._scaleByMagnitude ? this._sizeScale * mag[idx] : this._sizeScale;
            instances.push({
                position: position,
                hRotation: hRotation,
                vRotation: vRotation,
                scaleFactor: scaleFactor,
                color: color
            });
        }
        return instances;
    }

    public updateInstances(windField: WindField, terrain: TerrainData, colorGetter: ColorGetter): void {
        const instances = this.computeGlyphs(windField, terrain, colorGetter);
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
        const rgbColor = parseColor(color);
        runInAction(() => {
            this._color = rgbColor;
        });
        this.notifyChanged();
    }

    public setRadius(radius: number): void {
        const clippedRadius = clip(radius, 1e-10, undefined);
        runInAction(() => {
            this._radius = clippedRadius;
        });
        this.notifyChanged();
    }

    public setSizeScale(sizeScale: number): void {
        const clippedSizeScale = clip(sizeScale, 1e-10, undefined);
        runInAction(() => {
            this._sizeScale = clippedSizeScale;
        });
        this.notifyChanged();
    }

    public setLengthScale(lengthScale: number): void {
        const clippedLengthScale = clip(lengthScale, 1e-10, undefined);
        runInAction(() => {
            this._lengthScale = clippedLengthScale;
        });
        this.notifyChanged();
    }

    public setStride(stride: number): void {
        runInAction(() => {
            this._samplingStride = stride;
        });
        this.notifyChanged();
    }

    public setDisplay(display: boolean): void {
        runInAction(() => {
            this._display = display;
        });
        // Notify even when display changes (caller handles compute vs reset)
        if (this._onChanged) {
            this._onChanged();
        }
    }

    public setScaleByMagnitude(scaleByMagnitude: boolean): void {
        runInAction(() => {
            this._scaleByMagnitude = scaleByMagnitude;
        });
        this.notifyChanged();
    }

    public setColorByMagnitude(colorByMagnitude: boolean): void {
        runInAction(() => {
            this._colorByMagnitude = colorByMagnitude;
        });
        this.notifyChanged();
    }

    public setSamplingStride(stride: number): void {
        const clippedStride = Math.max(1, Math.round(stride));
        runInAction(() => {
            this._samplingStride = clippedStride;
        });
        this.notifyChanged();
    }

    loadFromObject(obj: any): void {
        this._display = obj.display ?? this._display;
        this._scaleByMagnitude = obj.scale_by_magnitude ?? this._scaleByMagnitude;
        this._colorByMagnitude = obj.color_by_magnitude ?? this._colorByMagnitude;

        this._samplingStride = obj.sampling_stride ?? this._samplingStride;
        this._lengthScale = obj.length_scale ?? this._lengthScale;
        this._radius = obj.radius ?? this._radius;
        this._sizeScale = obj.size_scale ?? this._sizeScale;
        this._color = d3.rgb(obj.color) ?? this._color;

        try {
            this._instances = Array.isArray(obj.instances)
                ? obj.instances.map((instance: any) => ({
                    position: instance.position,
                    hRotation: instance.h_rotation,
                    vRotation: instance.v_rotation,
                    scaleFactor: instance.scale_factor,
                    color: d3.rgb(instance.color)
                })) as InstanceTransform[]
                : [];
        } catch {
            this._instances = [];
        }
    }

    toObject() {
        return {
            display: this._display,
            scale_by_magnitude: this._scaleByMagnitude,
            color_by_magnitude: this._colorByMagnitude,
            sampling_stride: this._samplingStride,
            length_scale: this._lengthScale,
            radius: this._radius,
            size_scale: this._sizeScale,
            color: this._color.formatHex(),
        };
    }

    toJson(): string {
        return JSON.stringify(this.toObject());
    }
}
