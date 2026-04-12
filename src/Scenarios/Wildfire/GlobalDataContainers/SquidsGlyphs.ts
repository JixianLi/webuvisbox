// ABOUTME: Observable container for squid glyph geometry and display settings.
// ABOUTME: Manages vertices, faces, scale, color, and display state for squid glyphs.

import { clip } from "@/Helpers/MathHelper";
import { runInAction } from "mobx";
import * as d3 from "d3";
import { makeAutoObservable } from "mobx";
import { colorEquals, parseColor } from "@/Helpers/ColorParser";

export class SquidsGlyphs {

    private _vertices: Float32Array;
    private _faces: Uint32Array;
    private _display: boolean;
    private _scale: number;
    private _color: d3.RGBColor;
    private _onChanged: (() => void) | null;

    constructor() {
        this._display = false;
        this._scale = 1.0;
        this._color = d3.rgb(0, 0, 255);
        this._onChanged = null;

        makeAutoObservable(this);
    }

    // Public getters - everyone can read
    get vertices(): Float32Array { return this._vertices; }
    get faces(): Uint32Array { return this._faces; }
    get display(): boolean { return this._display; }
    get scale(): number { return this._scale; }
    get color(): d3.RGBColor { return this._color; }

    setOnChanged(callback: () => void): void {
        this._onChanged = callback;
    }

    public setVertices(vertices: Float32Array): void {
        runInAction(() => {
            this._vertices = vertices;
        });
    }

    public setFaces(faces: Uint32Array): void {
        runInAction(() => {
            this._faces = faces;
        });
    }

    public setDisplay(display: boolean): void {
        runInAction(() => {
            this._display = display;
        });
        if (this._display && this._onChanged) {
            this._onChanged();
        }
    }

    public setScale(scale: number): void {
        const clipped_scale = clip(scale, 1e-10, undefined);
        if (clipped_scale === this._scale) return;
        runInAction(() => {
            this._scale = clipped_scale;
        });
        if (this._display && this._onChanged) {
            this._onChanged();
        }
    }

    public setColor(color: string | d3.RGBColor | [number, number, number, number] | [number, number, number]): void {
        const rgbColor = parseColor(color);
        if (colorEquals(rgbColor, this._color)) return;
        runInAction(() => {
            this._color = rgbColor;
        });
    }

    loadFromJson(json: string): void {
        const obj = JSON.parse(json);
        this.loadFromObject(obj);
    }

    loadFromObject(obj: any): void {
        this._display = obj.display ?? this._display;
        this._scale = obj.scale ?? this._scale;
        this._color = d3.rgb(obj.color) ?? this._color;
    }

    toObject() {
        return {
            display: this._display,
            scale: this._scale,
            color: this._color.formatHex(),
        };
    }

    toJson(): string {
        return JSON.stringify(this.toObject());
    }
}

export default SquidsGlyphs;
