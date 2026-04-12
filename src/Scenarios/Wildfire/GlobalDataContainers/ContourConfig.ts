// ABOUTME: Observable configuration for contour display settings (visibility, scale, geometry).
// ABOUTME: Manages primary/secondary contour display and their scale parameters.

import { clip } from "@/Helpers/MathHelper";
import { makeAutoObservable, runInAction } from "mobx";

export class ContourConfig {

    private _display_primary: boolean;
    private _display_secondary: boolean;
    private _radius: number;
    private _primary_scale: number;
    private _secondary_scale: number;
    private _radial_segments: number;

    constructor() {
        this._display_primary = true;
        this._display_secondary = true;
        this._radius = 0.001;
        this._primary_scale = 2;
        this._secondary_scale = 1;
        this._radial_segments = 6;
        makeAutoObservable(this);
    }

    get display_primary(): boolean { return this._display_primary; }
    get display_secondary(): boolean { return this._display_secondary; }
    get radius(): number { return this._radius; }
    get primary_scale(): number { return this._primary_scale; }
    get secondary_scale(): number { return this._secondary_scale; }
    get radial_segments(): number { return this._radial_segments; }

    setDisplayPrimary(display: boolean): void {
        runInAction(() => {
            this._display_primary = display;
        });
    }

    setDisplaySecondary(display: boolean): void {
        runInAction(() => {
            this._display_secondary = display;
        });
    }

    setPrimaryScale(scale: number): void {
        const clipped_scale = clip(scale, 1, 100);
        runInAction(() => {
            this._primary_scale = clipped_scale;
        });
    }

    setSecondaryScale(scale: number): void {
        const clipped_scale = clip(scale, 1, 100);
        runInAction(() => {
            this._secondary_scale = clipped_scale;
        });
    }

    loadFromObject(obj: any): void {
        this._display_primary = obj.display_primary ?? this._display_primary;
        this._display_secondary = obj.display_secondary ?? this._display_secondary;
        this._radius = obj.radius ?? this._radius;
        this._primary_scale = obj.primary_scale ?? this._primary_scale;
        this._secondary_scale = obj.secondary_scale ?? this._secondary_scale;
        this._radial_segments = obj.radial_segments ?? this._radial_segments;
    }

    toObject() {
        return {
            display_primary: this._display_primary,
            display_secondary: this._display_secondary,
            radius: this._radius,
            primary_scale: this._primary_scale,
            secondary_scale: this._secondary_scale,
            radial_segments: this._radial_segments,
        };
    }
}

export default ContourConfig;
