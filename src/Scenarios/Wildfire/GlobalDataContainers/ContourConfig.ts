// ABOUTME: Observable configuration for contour display settings (visibility, scale, geometry).
// ABOUTME: Manages primary/secondary contour display and their scale parameters.

import { clip } from "@/Helpers/MathHelper";
import { makeAutoObservable, runInAction } from "mobx";

export class ContourConfig {

    private _displayPrimary: boolean;
    private _displaySecondary: boolean;
    private _radius: number;
    private _primaryScale: number;
    private _secondaryScale: number;
    private _radialSegments: number;

    constructor() {
        this._displayPrimary = true;
        this._displaySecondary = true;
        this._radius = 0.001;
        this._primaryScale = 2;
        this._secondaryScale = 1;
        this._radialSegments = 6;
        makeAutoObservable(this);
    }

    get displayPrimary(): boolean { return this._displayPrimary; }
    get displaySecondary(): boolean { return this._displaySecondary; }
    get radius(): number { return this._radius; }
    get primaryScale(): number { return this._primaryScale; }
    get secondaryScale(): number { return this._secondaryScale; }
    get radialSegments(): number { return this._radialSegments; }

    setDisplayPrimary(display: boolean): void {
        runInAction(() => {
            this._displayPrimary = display;
        });
    }

    setDisplaySecondary(display: boolean): void {
        runInAction(() => {
            this._displaySecondary = display;
        });
    }

    setPrimaryScale(scale: number): void {
        const clippedScale = clip(scale, 1, 100);
        runInAction(() => {
            this._primaryScale = clippedScale;
        });
    }

    setSecondaryScale(scale: number): void {
        const clippedScale = clip(scale, 1, 100);
        runInAction(() => {
            this._secondaryScale = clippedScale;
        });
    }

    loadFromObject(obj: any): void {
        this._displayPrimary = obj.display_primary ?? this._displayPrimary;
        this._displaySecondary = obj.display_secondary ?? this._displaySecondary;
        this._radius = obj.radius ?? this._radius;
        this._primaryScale = obj.primary_scale ?? this._primaryScale;
        this._secondaryScale = obj.secondary_scale ?? this._secondaryScale;
        this._radialSegments = obj.radial_segments ?? this._radialSegments;
    }

    toObject() {
        return {
            display_primary: this._displayPrimary,
            display_secondary: this._displaySecondary,
            radius: this._radius,
            primary_scale: this._primaryScale,
            secondary_scale: this._secondaryScale,
            radial_segments: this._radialSegments,
        };
    }
}

export default ContourConfig;
