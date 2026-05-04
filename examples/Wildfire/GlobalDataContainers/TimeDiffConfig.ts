// ABOUTME: Observable configuration for time-difference chart interaction state.
// ABOUTME: Manages hover time, zoom box, display range, ensemble visibility, and playback settings.

import { clip } from "@/Helpers/MathHelper";
import { makeAutoObservable, runInAction } from "mobx";

export class TimeDiffConfig {

    private _hoverTime: number | null;
    private _showHoverTime: boolean;
    private _showEnsemble: boolean;
    private _showZoomBox: boolean;
    private _shareYScale: boolean;
    private _xRange: [number, number] | null;
    private _xDisplayRange: [number, number] | null;
    private _zoomBoxRange: [number, number] | null;
    private _playSteps: number;

    constructor() {
        this._hoverTime = null;
        this._showHoverTime = true;
        this._showEnsemble = true;
        this._showZoomBox = false;
        this._shareYScale = false;
        this._xRange = null;
        this._xDisplayRange = null;
        this._zoomBoxRange = null;
        this._playSteps = 5;
        makeAutoObservable(this);
    }

    get hoverTime(): number | null { return this._hoverTime; }
    get showHoverTime(): boolean { return this._showHoverTime; }
    get showEnsemble(): boolean { return this._showEnsemble; }
    get showZoomBox(): boolean { return this._showZoomBox; }
    get shareYScale(): boolean { return this._shareYScale; }
    get xRange(): [number, number] | null { return this._xRange; }
    get xDisplayRange(): [number, number] | null { return this._xDisplayRange; }
    get zoomBoxRange(): [number, number] | null { return this._zoomBoxRange; }
    get playSteps(): number { return this._playSteps; }

    setHoverTime(timeIndex: number, xRange: [number, number]): void {
        const clippedInput = clip(timeIndex, xRange[0], xRange[1]);
        runInAction(() => {
            this._hoverTime = Math.round(clippedInput);
        });
    }

    setShowHoverTime(show: boolean): void {
        runInAction(() => {
            this._showHoverTime = show;
        });
    }

    toggleShowEnsemble(): void {
        runInAction(() => {
            this._showEnsemble = !this._showEnsemble;
        });
    }

    toggleShareYScale(): void {
        runInAction(() => {
            this._shareYScale = !this._shareYScale;
        });
    }

    setShowZoomBox(show: boolean): void {
        runInAction(() => {
            this._showZoomBox = show;
        });
    }

    setXDisplayRange(range: [number, number]): void {
        runInAction(() => {
            this._xDisplayRange = range;
        });
    }

    resetXDisplayRange(): void {
        if (this._xRange) {
            runInAction(() => {
                this._xDisplayRange = [this._xRange![0], this._xRange![1]];
            });
        }
    }

    setZoomBoxRange(range: [number, number] | null): void {
        runInAction(() => {
            this._zoomBoxRange = range;
        });
    }

    setPlaySteps(steps: number): void {
        const clippedSteps = clip(steps, 1, 100);
        runInAction(() => {
            this._playSteps = clippedSteps;
        });
    }

    loadFromObject(obj: any): void {
        this._hoverTime = obj.hover_time ?? this._hoverTime;
        this._showHoverTime = obj.show_hover_time ?? this._showHoverTime;
        this._showEnsemble = obj.show_ensemble ?? this._showEnsemble;
        this._showZoomBox = obj.show_zoom_box ?? this._showZoomBox;
        this._shareYScale = obj.share_y_scale ?? this._shareYScale;
        this._xRange = obj.x_range ?? this._xRange;
        this._xDisplayRange = obj.x_display_range ?? this._xDisplayRange;
        this._zoomBoxRange = obj.zoom_box_range ?? this._zoomBoxRange;
        this._playSteps = obj.play_steps ?? this._playSteps;
    }

    setXRange(range: [number, number]): void {
        runInAction(() => {
            this._xRange = range;
        });
    }

    toObject() {
        return {
            hover_time: this._hoverTime,
            show_hover_time: this._showHoverTime,
            show_ensemble: this._showEnsemble,
            show_zoom_box: this._showZoomBox,
            share_y_scale: this._shareYScale,
            x_range: this._xRange,
            x_display_range: this._xDisplayRange,
            zoom_box_range: this._zoomBoxRange,
            play_steps: this._playSteps,
        };
    }
}

export default TimeDiffConfig;
