// ABOUTME: Observable configuration for time-difference chart interaction state.
// ABOUTME: Manages hover time, zoom box, display range, ensemble visibility, and playback settings.

import { clip } from "@/Helpers/MathHelper";
import { makeAutoObservable, runInAction } from "mobx";

export class TimeDiffConfig {

    private _hover_time: number | null;
    private _show_hover_time: boolean;
    private _show_ensemble: boolean;
    private _show_zoom_box: boolean;
    private _share_y_scale: boolean;
    private _x_range: [number, number] | null;
    private _x_display_range: [number, number] | null;
    private _zoom_box_range: [number, number] | null;
    private _play_steps: number;

    constructor() {
        this._hover_time = null;
        this._show_hover_time = true;
        this._show_ensemble = true;
        this._show_zoom_box = false;
        this._share_y_scale = false;
        this._x_range = null;
        this._x_display_range = null;
        this._zoom_box_range = null;
        this._play_steps = 5;
        makeAutoObservable(this);
    }

    get hover_time(): number | null { return this._hover_time; }
    get show_hover_time(): boolean { return this._show_hover_time; }
    get show_ensemble(): boolean { return this._show_ensemble; }
    get show_zoom_box(): boolean { return this._show_zoom_box; }
    get share_y_scale(): boolean { return this._share_y_scale; }
    get x_range(): [number, number] | null { return this._x_range; }
    get x_display_range(): [number, number] | null { return this._x_display_range; }
    get zoom_box_range(): [number, number] | null { return this._zoom_box_range; }
    get play_steps(): number { return this._play_steps; }

    setHoverTime(timeIndex: number, x_range: [number, number]): void {
        const clipped_input = clip(timeIndex, x_range[0], x_range[1]);
        runInAction(() => {
            this._hover_time = Math.round(clipped_input);
        });
    }

    setShowHoverTime(show: boolean): void {
        runInAction(() => {
            this._show_hover_time = show;
        });
    }

    toggleShowEnsemble(): void {
        runInAction(() => {
            this._show_ensemble = !this._show_ensemble;
        });
    }

    toggleShareYScale(): void {
        runInAction(() => {
            this._share_y_scale = !this._share_y_scale;
        });
    }

    setShowZoomBox(show: boolean): void {
        runInAction(() => {
            this._show_zoom_box = show;
        });
    }

    setXDisplayRange(range: [number, number]): void {
        runInAction(() => {
            this._x_display_range = range;
        });
    }

    resetXDisplayRange(): void {
        if (this._x_range) {
            runInAction(() => {
                this._x_display_range = [this._x_range![0], this._x_range![1]];
            });
        }
    }

    setZoomBoxRange(range: [number, number] | null): void {
        runInAction(() => {
            this._zoom_box_range = range;
        });
    }

    setPlaySteps(steps: number): void {
        const clipped_steps = clip(steps, 1, 100);
        runInAction(() => {
            this._play_steps = clipped_steps;
        });
    }

    loadFromObject(obj: any): void {
        this._hover_time = obj.hover_time ?? this._hover_time;
        this._show_hover_time = obj.show_hover_time ?? this._show_hover_time;
        this._show_ensemble = obj.show_ensemble ?? this._show_ensemble;
        this._show_zoom_box = obj.show_zoom_box ?? this._show_zoom_box;
        this._share_y_scale = obj.share_y_scale ?? this._share_y_scale;
        this._x_range = obj.x_range ?? this._x_range;
        this._x_display_range = obj.x_display_range ?? this._x_display_range;
        this._zoom_box_range = obj.zoom_box_range ?? this._zoom_box_range;
        this._play_steps = obj.play_steps ?? this._play_steps;
    }

    setXRange(range: [number, number]): void {
        runInAction(() => {
            this._x_range = range;
        });
    }

    toObject() {
        return {
            hover_time: this._hover_time,
            show_hover_time: this._show_hover_time,
            show_ensemble: this._show_ensemble,
            show_zoom_box: this._show_zoom_box,
            share_y_scale: this._share_y_scale,
            x_range: this._x_range,
            x_display_range: this._x_display_range,
            zoom_box_range: this._zoom_box_range,
            play_steps: this._play_steps,
        };
    }
}

export default TimeDiffConfig;
