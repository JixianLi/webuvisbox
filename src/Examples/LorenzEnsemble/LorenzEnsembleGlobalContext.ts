// ABOUTME: State of the Lorenz ensemble example: ensemble settings and the ensemble fetched from its data server,
// ABOUTME: playback (time, play/pause, speed) and colors. No rendering code, so registering it does not pull in three.js.

import { makeAutoObservable, observable, runInAction } from "mobx";
import type { GlobalContext } from "../../Types/GlobalContext";
import { decode64 } from "../../Helpers/DataHelper";
import { DURATION, SAMPLE_COUNT, SAMPLE_INTERVAL } from "./LorenzSystem";
import { fetchLorenz, type EnsembleQuery, type EnsembleResponse, type TubeResponse } from "./LorenzDataServer";

export const COLORMAP_PRESETS = ["Plasma (matplotlib)", "Viridis (matplotlib)", "Inferno (matplotlib)"];

export type ColorMode = "spread" | "time";

export { SPREAD_DOMAIN } from "./LorenzSystem";

export interface TubeData {
    vertices: Float32Array;
    normals: Float32Array;
    uv: Float32Array;
    indices: Uint32Array;
}

export interface LorenzEnsembleData {
    paths: Float32Array[];
    mean: Float32Array;
    spread: Float32Array;
    bounds: [number, number, number, number, number, number];
    uncertaintyTube: TubeData;
    meanPathTube: TubeData;
}

function decodeTube(tube: TubeResponse): TubeData {
    return { vertices: decode64(tube.vertices) as Float32Array, normals: decode64(tube.normals) as Float32Array,
             uv: decode64(tube.uv) as Float32Array, indices: decode64(tube.indices, "uint32") as Uint32Array };
}

function decodeEnsemble(response: EnsembleResponse): LorenzEnsembleData {
    const allPaths = decode64(response.paths) as Float32Array;
    const pointsPerPath = response.sample_count * 3;
    return {
        // Views into the one decoded buffer, no copies.
        paths: Array.from({ length: response.member_count },
                          (_, member) => allPaths.subarray(member * pointsPerPath, (member + 1) * pointsPerPath)),
        mean: decode64(response.mean) as Float32Array,
        spread: decode64(response.spread) as Float32Array,
        bounds: response.bounds,
        uncertaintyTube: decodeTube(response.uncertainty_tube),
        meanPathTube: decodeTube(response.mean_path_tube),
    };
}

interface LorenzEnsembleGlobalData {
    member_count: number;
    jitter_exponent: number;
    seed: number;
    speed: number;
    color_mode: ColorMode;
    colormap_preset: string;
}

export class LorenzEnsembleGlobalContext implements GlobalContext {
    memberCount = 50;
    jitterExponent = -5;     // starting jitter = 10^jitterExponent
    seed = 0;
    time = DURATION;
    playing = false;
    speed = 1.5;             // model time units per second
    colorMode: ColorMode = "spread";
    colormapPreset = COLORMAP_PRESETS[0];
    // Set by asyncInitialize before any view shows; replaced when an answer to a newer query arrives.
    ensemble!: LorenzEnsembleData;
    private lastFrameTimestamp: number | null = null;
    private latestRequest = 0;
    private disposed = false;

    constructor() {
        makeAutoObservable<this, "lastFrameTimestamp" | "latestRequest" | "disposed">(this, {
            lastFrameTimestamp: false, latestRequest: false, disposed: false, ensemble: observable.ref,
        }, { autoBind: true });
    }

    initialize(globalData?: Partial<LorenzEnsembleGlobalData>): void {
        this.memberCount = globalData?.member_count ?? this.memberCount;
        this.jitterExponent = globalData?.jitter_exponent ?? this.jitterExponent;
        this.seed = globalData?.seed ?? this.seed;
        this.speed = globalData?.speed ?? this.speed;
        this.colorMode = globalData?.color_mode ?? this.colorMode;
        this.colormapPreset = globalData?.colormap_preset ?? this.colormapPreset;
    }

    async asyncInitialize(): Promise<void> {
        await this.requestEnsemble();
    }

    dispose(): void {
        this.disposed = true;
        this.pause();
    }

    // Asks the data server for the ensemble of the current settings. Answers can arrive out of order: only the latest
    // query's is kept.
    async requestEnsemble(): Promise<void> {
        this.latestRequest += 1;
        const request = this.latestRequest;
        const query: EnsembleQuery = { member_count: this.memberCount, jitter: this.jitter, seed: this.seed };
        const response = await fetchLorenz("/ensemble", { method: "POST", body: JSON.stringify(query) });
        if (!response.ok) {
            throw new Error(`The Lorenz data server answered ${response.status}.`);
        }
        const ensemble = decodeEnsemble(await response.json());
        if (request !== this.latestRequest || this.disposed) {
            return;
        }
        runInAction(() => {
            this.ensemble = ensemble;
        });
    }

    private refreshEnsemble() {
        this.requestEnsemble().catch(error => console.error("The Lorenz ensemble could not be loaded:", error));
    }

    toObject(): LorenzEnsembleGlobalData {
        return {
            member_count: this.memberCount,
            jitter_exponent: this.jitterExponent,
            seed: this.seed,
            speed: this.speed,
            color_mode: this.colorMode,
            colormap_preset: this.colormapPreset,
        };
    }

    get jitter() {
        return 10 ** this.jitterExponent;
    }

    // How many samples of each path are drawn at the current time (at least the starting point).
    get visibleSampleCount() {
        return Math.min(SAMPLE_COUNT, Math.floor(this.time / SAMPLE_INTERVAL + 1e-6) + 1);
    }

    setMemberCount(memberCount: number) {
        this.memberCount = memberCount;
        this.refreshEnsemble();
    }

    setJitterExponent(jitterExponent: number) {
        this.jitterExponent = jitterExponent;
        this.refreshEnsemble();
    }

    newRandomStart() {
        this.seed += 1;
        this.refreshEnsemble();
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
