// ABOUTME: State of the Lorenz ensemble example: ensemble settings, playback (time, play/pause, speed) and color
// ABOUTME: settings. Imports no rendering code, so registering the example does not pull three.js into a host's bundle.

import { makeAutoObservable } from "mobx";
import type { GlobalContext } from "../../Types/GlobalContext";
import { DURATION, generateEnsemble, SAMPLE_COUNT, SAMPLE_INTERVAL } from "./LorenzSystem";

export const COLORMAP_PRESETS = ["Plasma (matplotlib)", "Viridis (matplotlib)", "Inferno (matplotlib)"];

export type ColorMode = "spread" | "time";

// The spread axis shared by the colors, the colorbar and the chart: fixed rather than fitted to the data, so a smaller
// starting jitter visibly starts cooler and lower.
export const SPREAD_DOMAIN: [number, number] = [1e-6, 30];

export class LorenzEnsembleGlobalContext implements GlobalContext {
    memberCount = 50;
    jitterExponent = -5;     // starting jitter = 10^jitterExponent
    seed = 0;
    time = DURATION;
    playing = false;
    speed = 1.5;             // model time units per second
    colorMode: ColorMode = "spread";
    colormapPreset = COLORMAP_PRESETS[0];
    private lastFrameTimestamp: number | null = null;

    constructor() {
        makeAutoObservable<this, "lastFrameTimestamp">(this, { lastFrameTimestamp: false }, { autoBind: true });
    }

    initialize(globalData: any): void {
        this.memberCount = globalData?.member_count ?? this.memberCount;
        this.jitterExponent = globalData?.jitter_exponent ?? this.jitterExponent;
        this.speed = globalData?.speed ?? this.speed;
        this.colorMode = globalData?.color_mode ?? this.colorMode;
        this.colormapPreset = globalData?.colormap_preset ?? this.colormapPreset;
    }

    async asyncInitialize(): Promise<void> {}

    toObject(): any {
        return {
            member_count: this.memberCount,
            jitter_exponent: this.jitterExponent,
            speed: this.speed,
            color_mode: this.colorMode,
            colormap_preset: this.colormapPreset,
        };
    }

    get jitter() {
        return 10 ** this.jitterExponent;
    }

    get ensemble() {
        return generateEnsemble(this.memberCount, this.jitter, this.seed);
    }

    // How many samples of each path are drawn at the current time (at least the starting point).
    get visibleSampleCount() {
        return Math.min(SAMPLE_COUNT, Math.floor(this.time / SAMPLE_INTERVAL + 1e-6) + 1);
    }

    setMemberCount(memberCount: number) {
        this.memberCount = memberCount;
    }

    setJitterExponent(jitterExponent: number) {
        this.jitterExponent = jitterExponent;
    }

    newRandomStart() {
        this.seed += 1;
    }

    setTime(time: number) {
        this.time = Math.max(0, Math.min(DURATION, time));
    }

    setSpeed(speed: number) {
        this.speed = speed;
    }

    setColorMode(colorMode: ColorMode) {
        this.colorMode = colorMode;
    }

    setColormapPreset(preset: string) {
        this.colormapPreset = preset;
    }

    // The clock lives here, not in a view, so playback continues whichever panels are shown. It stops by itself at the
    // end, so a scenario switched away from mid-play stops within DURATION / speed seconds.
    play() {
        if (this.playing) return;
        if (this.time >= DURATION) this.time = 0;
        this.playing = true;
        this.lastFrameTimestamp = null;
        requestAnimationFrame(this.advanceFrame);
    }

    pause() {
        this.playing = false;
    }

    advanceFrame(timestamp: number) {
        if (!this.playing) return;
        // Capped so a backgrounded tab (no frames) resumes where it was instead of jumping ahead.
        const elapsedSeconds = this.lastFrameTimestamp === null ? 0 : Math.min(0.1, (timestamp - this.lastFrameTimestamp) / 1000);
        this.lastFrameTimestamp = timestamp;
        this.setTime(this.time + elapsedSeconds * this.speed);
        if (this.time >= DURATION) {
            this.playing = false;
            return;
        }
        requestAnimationFrame(this.advanceFrame);
    }
}
