// ABOUTME: The Uncertain terrain example's synthetic wind: per member, a prevailing wind bent downslope by that member's
// ABOUTME: terrain; summarized per glyph as the members' mean direction and how much they agree on it. Pure math.

import { GRID_SIZE, gridPosition, type TerrainEnsemble } from "./TerrainEnsemble";

// Member m's wind at vertex p (horizontal, x and z):
//     w_m(p) = PREVAILING − DOWNSLOPE · ∇h_m(p)
// with ∇h_m by central differences on the grid (spacing 2 / (GRID_SIZE − 1)). A glyph summarizes the members at its
// vertex: mean wind w̄ = (1/M) Σ_m w_m, and agreement R = |(1/M) Σ_m w_m / |w_m||, the mean resultant length of the
// directions (1: all members blow the same way; near 0: they point every which way).
const PREVAILING: [number, number] = [0.6, 0.25];
const DOWNSLOPE = 0.35;
const GRID_SPACING = 2 / (GRID_SIZE - 1);

export interface WindGlyph {
    x: number;
    z: number;
    // Mean wind, horizontal.
    windX: number;
    windZ: number;
    agreement: number;
    // Rise of the mean terrain per unit distance along the mean wind (heights unscaled).
    slopeAlongWind: number;
}

function gradientAt(heights: Float32Array, index: number): [number, number] {
    const column = index % GRID_SIZE;
    const row = Math.floor(index / GRID_SIZE);
    const at = (c: number, r: number) => heights[Math.min(GRID_SIZE - 1, Math.max(0, r)) * GRID_SIZE
                                                 + Math.min(GRID_SIZE - 1, Math.max(0, c))];
    return [(at(column + 1, row) - at(column - 1, row)) / (2 * GRID_SPACING),
            (at(column, row + 1) - at(column, row - 1)) / (2 * GRID_SPACING)];
}

// One glyph every `stride` grid vertices in each direction, away from the edges.
export function windGlyphs(ensemble: TerrainEnsemble, stride: number): WindGlyph[] {
    const glyphs: WindGlyph[] = [];
    const memberCount = ensemble.memberHeights.length;
    for (let row = stride / 2; row < GRID_SIZE; row += stride) {
        for (let column = stride / 2; column < GRID_SIZE; column += stride) {
            const index = Math.floor(row) * GRID_SIZE + Math.floor(column);
            let sumX = 0, sumZ = 0, directionX = 0, directionZ = 0;
            for (const heights of ensemble.memberHeights) {
                const [gradientX, gradientZ] = gradientAt(heights, index);
                const windX = PREVAILING[0] - DOWNSLOPE * gradientX;
                const windZ = PREVAILING[1] - DOWNSLOPE * gradientZ;
                const speed = Math.hypot(windX, windZ) || 1;
                sumX += windX;
                sumZ += windZ;
                directionX += windX / speed;
                directionZ += windZ / speed;
            }
            const windX = sumX / memberCount;
            const windZ = sumZ / memberCount;
            const [meanGradientX, meanGradientZ] = gradientAt(ensemble.mean, index);
            const speed = Math.hypot(windX, windZ) || 1;
            const { x, z } = gridPosition(index);
            glyphs.push({
                x, z, windX, windZ,
                agreement: Math.hypot(directionX, directionZ) / memberCount,
                slopeAlongWind: (meanGradientX * windX + meanGradientZ * windZ) / speed,
            });
        }
    }
    return glyphs;
}
