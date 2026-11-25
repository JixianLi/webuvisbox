// ABOUTME: Analyses of a contour ensemble at one level: the fraction of members above it, the level-crossing
// ABOUTME: probability, band depth and the contour boxplot built on it, and each member's critical points.

import { GRID_SIZE } from "./ContourEnsemble";

const VERTEX_COUNT = GRID_SIZE * GRID_SIZE;

// Per vertex: the fraction of members whose value exceeds the level.
export function exceedanceFraction(members: Float32Array[], level: number): Float32Array {
    const fraction = new Float32Array(VERTEX_COUNT);
    for (const field of members) {
        for (let index = 0; index < VERTEX_COUNT; index++) if (field[index] > level) fraction[index] += 1;
    }
    for (let index = 0; index < VERTEX_COUNT; index++) fraction[index] /= members.length;
    return fraction;
}

// Per grid cell ((GRID_SIZE − 1)² of them): the fraction of members whose level set passes through the cell, i.e. whose
// four corner values are not all on one side of the level. The empirical level-crossing probability of Pöthkow &
// Hege, "Positional uncertainty of isocontours" (IEEE TVCG 2011).
export const CELL_COUNT_PER_SIDE = GRID_SIZE - 1;

export function crossingProbability(members: Float32Array[], level: number): Float32Array {
    const probability = new Float32Array(CELL_COUNT_PER_SIDE * CELL_COUNT_PER_SIDE);
    for (const field of members) {
        for (let row = 0; row < CELL_COUNT_PER_SIDE; row++) {
            for (let column = 0; column < CELL_COUNT_PER_SIDE; column++) {
                const corner = row * GRID_SIZE + column;
                const above = Number(field[corner] > level) + Number(field[corner + 1] > level)
                    + Number(field[corner + GRID_SIZE] > level) + Number(field[corner + GRID_SIZE + 1] > level);
                if (above > 0 && above < 4) probability[row * CELL_COUNT_PER_SIDE + column] += 1;
            }
        }
    }
    for (let cell = 0; cell < probability.length; cell++) probability[cell] /= members.length;
    return probability;
}

// Modified band depth of each member's superlevel set S_m = {f_m > level} (López-Pintado & Romo 2009, applied to
// contours as in Whitaker, Mirzargar & Kirby, "Contour boxplots", IEEE TVCG 2013): the fraction of (vertex, pair j < k)
// combinations where S_j ∩ S_k ⊆ S_m ⊆ S_j ∪ S_k holds locally, i.e. min(S_j, S_k) ≤ S_m ≤ max(S_j, S_k) at the vertex.
// It fails only when S_j and S_k both disagree with S_m there. With n₁ members inside at a vertex (n₀ = M − n₁
// outside), a member inside fails for C(n₀, 2) pairs and one outside for C(n₁, 2), so depth costs O(M · vertices)
// instead of looping over all O(M²) pairs.
export function bandDepths(members: Float32Array[], level: number): Float64Array {
    const memberCount = members.length;
    const pairCount = (memberCount * (memberCount - 1)) / 2;
    const insideCount = new Uint16Array(VERTEX_COUNT);
    for (const field of members) {
        for (let index = 0; index < VERTEX_COUNT; index++) if (field[index] > level) insideCount[index] += 1;
    }
    const choose2 = (count: number) => (count * (count - 1)) / 2;
    return Float64Array.from(members, field => {
        let failures = 0;
        for (let index = 0; index < VERTEX_COUNT; index++) {
            const inside = insideCount[index];
            failures += field[index] > level ? choose2(memberCount - inside) : choose2(inside);
        }
        return 1 - failures / (VERTEX_COUNT * pairCount);
    });
}

export interface ContourBoxplot {
    depths: Float64Array;
    medianMember: number;          // the deepest member
    outlierMembers: number[];
    innerBand: BandEnvelope;       // the deepest half of the members
    outerBand: BandEnvelope;       // every member but the outliers
}

// The pointwise maximum and minimum of the band members' fields. The union of their superlevel sets is
// {maximum > level} and the intersection {minimum > level}, so the band lies between the two fields' contours at the
// level: smooth curves, where contouring a per-vertex inside count would give pixel steps.
export interface BandEnvelope { maximum: Float32Array; minimum: Float32Array }

function bandEnvelope(members: Float32Array[], memberIndices: number[]): BandEnvelope {
    const maximum = new Float32Array(VERTEX_COUNT).fill(-Infinity);
    const minimum = new Float32Array(VERTEX_COUNT).fill(Infinity);
    for (const member of memberIndices) {
        const field = members[member];
        for (let index = 0; index < VERTEX_COUNT; index++) {
            if (field[index] > maximum[index]) maximum[index] = field[index];
            if (field[index] < minimum[index]) minimum[index] = field[index];
        }
    }
    return { maximum, minimum };
}

function quantile(sortedValues: number[], probability: number): number {
    const position = (sortedValues.length - 1) * probability;
    const lower = Math.floor(position);
    const upper = Math.min(sortedValues.length - 1, lower + 1);
    return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (position - lower);
}

// Outliers: members whose depth falls below Q1 − 1.5 · IQR of all members' depths. This fence is our choice, by analogy
// with Tukey's boxplot; Whitaker et al. leave the outlier threshold to the user.
export function contourBoxplot(members: Float32Array[], level: number): ContourBoxplot {
    const depths = bandDepths(members, level);
    const byDepth = Array.from(depths.keys()).sort((first, second) => depths[second] - depths[first]);
    const sortedDepths = Array.from(depths).sort((first, second) => first - second);
    const firstQuartile = quantile(sortedDepths, 0.25);
    const fence = firstQuartile - 1.5 * (quantile(sortedDepths, 0.75) - firstQuartile);
    const outlierMembers = byDepth.filter(member => depths[member] < fence);
    const innerMembers = byDepth.slice(0, Math.max(1, Math.ceil(members.length / 2)));
    const outerMembers = byDepth.filter(member => depths[member] >= fence);
    return {
        depths,
        medianMember: byDepth[0],
        outlierMembers,
        innerBand: bandEnvelope(members, innerMembers),
        outerBand: bandEnvelope(members, outerMembers),
    };
}

export type CriticalPointType = "maximum" | "minimum" | "saddle";

export interface CriticalPoint { column: number; row: number; type: CriticalPointType }

// The six neighbors of a vertex, in angular order, in the Freudenthal triangulation of the grid (each square split by
// its top-left to bottom-right diagonal). On a triangulation the field is piecewise linear, and the ring test below is
// exact for it; the naive 8-neighbor test has no such underlying field, and misses or invents saddles.
const RING: Array<[number, number]> = [[0, 1], [1, 1], [1, 0], [0, -1], [-1, -1], [-1, 0]];

// Critical points of the piecewise-linear field, interior vertices only (Banchoff's criterion): walk the ring and count
// the changes between neighbors above and below the vertex. None: a maximum (all below) or minimum (all above); two:
// a regular point; four or more: a saddle. Equal values are ordered by index (simulation of simplicity), so plateaus
// do not create spurious points.
export function criticalPoints(field: Float32Array): CriticalPoint[] {
    const points: CriticalPoint[] = [];
    const above = new Array<boolean>(RING.length);
    for (let row = 1; row < GRID_SIZE - 1; row++) {
        for (let column = 1; column < GRID_SIZE - 1; column++) {
            const center = row * GRID_SIZE + column;
            const value = field[center];
            RING.forEach(([rowOffset, columnOffset], position) => {
                const neighbor = center + rowOffset * GRID_SIZE + columnOffset;
                above[position] = field[neighbor] > value || (field[neighbor] === value && neighbor > center);
            });
            let changes = 0;
            for (let position = 0; position < RING.length; position++) {
                if (above[position] !== above[(position + 1) % RING.length]) changes += 1;
            }
            if (changes === 0) points.push({ column, row, type: above[0] ? "minimum" : "maximum" });
            else if (changes >= 4) points.push({ column, row, type: "saddle" });
        }
    }
    return points;
}
