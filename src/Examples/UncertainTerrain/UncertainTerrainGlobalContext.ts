// ABOUTME: State of the Uncertain terrain example: ensemble settings, color settings and the probed vertex. Imports no
// ABOUTME: rendering code, so registering the example does not pull three.js into a host's main bundle.

import { makeAutoObservable } from "mobx";
import type { GlobalContext } from "../../Types/GlobalContext";
import { generateEnsemble, GRID_SIZE } from "./TerrainEnsemble";
import { windGlyphs } from "./TerrainWind";
import { numberBetween } from "../../Helpers/InputChecks";

// The standard deviation (in height units) at which a vertex counts as fully uncertain: the color is fully faded.
// Fixed rather than the field's maximum, so raising Spread visibly washes the map out.
export const UNCERTAINTY_REFERENCE = 0.25;

export const COLORMAP_PRESETS = ["Viridis (matplotlib)", "Inferno (matplotlib)", "Cool to Warm"];

// How the surface is colored: by VSUP (mean height, faded by the spread), or by one scalar field.
export type Encoding = "vsup" | "mean" | "spread";
export const ENCODINGS: Record<Encoding, string> = {
    vsup: "Mean height, faded by spread (VSUP)",
    mean: "Mean height",
    spread: "Spread between members (σ)",
};

const WIND_GLYPH_STRIDE = 8;

interface UncertainTerrainGlobalData {
    member_count: number;
    spread: number;
    height_scale: number;
    colormap_preset: string;
    continuous_colors: boolean;
    seed_offset: number;
    encoding: Encoding;
    show_wind: boolean;
    // A CSS color, or [r, g, b] in 0–255: the color of a glyph whose members all agree.
    wind_color: string | [number, number, number];
    wind_glyph_scale: number;
}

export class UncertainTerrainGlobalContext implements GlobalContext {
    memberCount = 20;
    spread = 0.3;
    seedOffset = 0;
    heightScale = 0.5;
    colormapPreset = COLORMAP_PRESETS[0];
    continuousColors = false;
    encoding: Encoding = "vsup";
    showWind = true;
    windColor: string | [number, number, number] = "#ffffff";
    windGlyphScale = 1;
    probeIndex = Math.floor((GRID_SIZE * GRID_SIZE) / 2);

    constructor() {
        makeAutoObservable(this);
    }

    initialize(globalData?: Partial<UncertainTerrainGlobalData>): void {
        this.memberCount = globalData?.member_count ?? this.memberCount;
        this.spread = globalData?.spread ?? this.spread;
        this.heightScale = globalData?.height_scale ?? this.heightScale;
        this.colormapPreset = globalData?.colormap_preset ?? this.colormapPreset;
        this.continuousColors = globalData?.continuous_colors ?? this.continuousColors;
        this.seedOffset = globalData?.seed_offset ?? this.seedOffset;
        this.encoding = globalData?.encoding && globalData.encoding in ENCODINGS ? globalData.encoding : this.encoding;
        this.showWind = globalData?.show_wind ?? this.showWind;
        this.windColor = globalData?.wind_color ?? this.windColor;
        if (globalData?.wind_glyph_scale !== undefined) {
            numberBetween(globalData.wind_glyph_scale, 0.1, 5, 1, scale => { this.windGlyphScale = scale; });
        }
    }

    async asyncInitialize(): Promise<void> {}

    toObject(): UncertainTerrainGlobalData {
        return {
            member_count: this.memberCount,
            spread: this.spread,
            height_scale: this.heightScale,
            colormap_preset: this.colormapPreset,
            continuous_colors: this.continuousColors,
            seed_offset: this.seedOffset,
            encoding: this.encoding,
            show_wind: this.showWind,
            wind_color: this.windColor,
            wind_glyph_scale: this.windGlyphScale,
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

    get windGlyphs() {
        return windGlyphs(this.ensemble, WIND_GLYPH_STRIDE);
    }

    setEncoding(encoding: Encoding) {
        this.encoding = encoding;
    }

    setShowWind(showWind: boolean) {
        this.showWind = showWind;
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
