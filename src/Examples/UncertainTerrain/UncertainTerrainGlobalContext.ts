// ABOUTME: State of the Uncertain terrain example: ensemble settings, color settings and the probed vertex. Imports no
// ABOUTME: rendering code, so registering the example does not pull three.js into a host's main bundle.

import { makeAutoObservable } from "mobx";
import type { GlobalContext } from "../../Types/GlobalContext";
import { generateEnsemble, GRID_SIZE } from "./TerrainEnsemble";

// The standard deviation (in height units) at which a vertex counts as fully uncertain: the color is fully faded.
// Fixed rather than the field's maximum, so raising Spread visibly washes the map out.
export const UNCERTAINTY_REFERENCE = 0.25;

export const COLORMAP_PRESETS = ["Viridis (matplotlib)", "Inferno (matplotlib)", "Cool to Warm"];

export class UncertainTerrainGlobalContext implements GlobalContext {
    memberCount = 20;
    spread = 0.3;
    seedOffset = 0;
    heightScale = 0.5;
    colormapPreset = COLORMAP_PRESETS[0];
    continuousColors = false;
    probeIndex = Math.floor((GRID_SIZE * GRID_SIZE) / 2);

    constructor() {
        makeAutoObservable(this);
    }

    initialize(globalData: any): void {
        this.memberCount = globalData?.member_count ?? this.memberCount;
        this.spread = globalData?.spread ?? this.spread;
        this.heightScale = globalData?.height_scale ?? this.heightScale;
        this.colormapPreset = globalData?.colormap_preset ?? this.colormapPreset;
        this.continuousColors = globalData?.continuous_colors ?? this.continuousColors;
    }

    async asyncInitialize(): Promise<void> {}

    toObject(): any {
        return {
            member_count: this.memberCount,
            spread: this.spread,
            height_scale: this.heightScale,
            colormap_preset: this.colormapPreset,
            continuous_colors: this.continuousColors,
        };
    }

    get ensemble() {
        return generateEnsemble(this.memberCount, this.spread, this.seedOffset);
    }

    // Per vertex, both in [0, 1]: the mean height within its range, and std / UNCERTAINTY_REFERENCE (clamped).
    get normalizedMean(): Float32Array {
        const { mean, meanRange: [minimum, maximum] } = this.ensemble;
        return mean.map(value => (value - minimum) / Math.max(1e-6, maximum - minimum));
    }

    get normalizedUncertainty(): Float32Array {
        return this.ensemble.standardDeviation.map(value => Math.min(1, value / UNCERTAINTY_REFERENCE));
    }

    setMemberCount(memberCount: number) {
        this.memberCount = memberCount;
    }

    setSpread(spread: number) {
        this.spread = spread;
    }

    regenerate() {
        this.seedOffset += 1;
    }

    setHeightScale(heightScale: number) {
        this.heightScale = heightScale;
    }

    setColormapPreset(preset: string) {
        this.colormapPreset = preset;
    }

    setContinuousColors(continuous: boolean) {
        this.continuousColors = continuous;
    }

    setProbeIndex(index: number) {
        this.probeIndex = index;
    }
}
