import { describe, expect, it } from 'vitest';
import { GRID_SIZE, gridPosition, type TerrainEnsemble } from './TerrainEnsemble';
import { windGlyphs } from './TerrainWind';

function ensembleOf(height: (x: number, z: number) => number, memberCount = 3): TerrainEnsemble {
    const heights = Float32Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
        const { x, z } = gridPosition(index);
        return height(x, z);
    });
    return { memberHeights: Array.from({ length: memberCount }, () => heights), mean: heights,
             standardDeviation: new Float32Array(heights.length), meanRange: [0, 1] };
}

describe('windGlyphs', () => {
    it('blows with the prevailing wind over flat ground, every member agreeing', () => {
        const [glyph] = windGlyphs(ensembleOf(() => 0), 16);
        expect(glyph.windX).toBeCloseTo(0.6);
        expect(glyph.windZ).toBeCloseTo(0.25);
        expect(glyph.agreement).toBeCloseTo(1);
        expect(glyph.slopeAlongWind).toBeCloseTo(0);
    });

    it('bends downslope, and reports the rise along the wind', () => {
        // Ground rising toward +x with slope 1: the downslope pull is −0.35 along x.
        const [glyph] = windGlyphs(ensembleOf(x => x), 16);
        expect(glyph.windX).toBeCloseTo(0.6 - 0.35, 2);
        expect(glyph.slopeAlongWind).toBeGreaterThan(0);
    });

    it('agrees less where members disagree on the direction', () => {
        const flat = new Float32Array(GRID_SIZE * GRID_SIZE);
        const steep = Float32Array.from(flat, (_, index) => 6 * gridPosition(index).x);
        const ensemble: TerrainEnsemble = { memberHeights: [flat, steep], mean: flat, standardDeviation: flat, meanRange: [0, 1] };
        const [glyph] = windGlyphs(ensemble, 16);
        expect(glyph.agreement).toBeLessThan(0.9);
    });
});
