// ABOUTME: Generates the Uncertain terrain example's data: an ensemble of height fields on a square grid, and their
// ABOUTME: per-vertex mean and standard deviation. Pure math, no rendering (loaded with the scenario, not lazily).

// The grid covers x, z ∈ [−1, 1] with GRID_SIZE × GRID_SIZE vertices; vertex (column c, row r) is at index r·GRID_SIZE + c.
export const GRID_SIZE = 129;

// Heights (dimensionless, roughly within [−0.6, 0.9]):
//     base(p)     = Σ_k a_k · exp(−|p − c_k|² / (2 σ_k²)) + 0.18 · fbm(3p, seed 1)          hills and valleys plus detail
//     weight(p)   = 0.15 + 0.85 · smoothstep(−0.35, 0.45, fbm(1.3p + (5, 5), seed 2))     where members disagree (0.15 … 1)
//     member_m(p) = base(p) + spread · weight(p) · 0.6 · fbm(2p, seed 100 + m)          m = 0 … memberCount − 1
// fbm is fractal value noise: Σ_{o=0}^{3} 0.5^o · noise(2^o · p), with noise ∈ [−1, 1] interpolated from a hashed lattice.
// The spatially varying weight gives the ensemble structured uncertainty: calm regions and contested ones.
const HILLS: Array<{ x: number; z: number; amplitude: number; sigma: number }> = [
    { x: -0.35, z: -0.25, amplitude: 0.75, sigma: 0.28 },
    { x: 0.4, z: 0.3, amplitude: 0.55, sigma: 0.22 },
    { x: 0.15, z: -0.55, amplitude: 0.4, sigma: 0.18 },
    { x: -0.5, z: 0.55, amplitude: -0.45, sigma: 0.3 },
    { x: 0.6, z: -0.45, amplitude: -0.3, sigma: 0.2 },
];

export interface TerrainEnsemble {
    memberHeights: Float32Array[];  // one per member, GRID_SIZE² values each
    mean: Float32Array;
    standardDeviation: Float32Array;
    meanRange: [number, number];
}

function hash(latticeX: number, latticeZ: number, seed: number): number {
    let value = Math.imul(latticeX, 374761393) ^ Math.imul(latticeZ, 668265263) ^ Math.imul(seed, 2147483647);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    value ^= value >>> 16;
    return (value >>> 0) / 4294967295 * 2 - 1;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

function valueNoise(x: number, z: number, seed: number): number {
    const latticeX = Math.floor(x);
    const latticeZ = Math.floor(z);
    const fractionX = smoothstep(0, 1, x - latticeX);
    const fractionZ = smoothstep(0, 1, z - latticeZ);
    const top = hash(latticeX, latticeZ, seed) * (1 - fractionX) + hash(latticeX + 1, latticeZ, seed) * fractionX;
    const bottom = hash(latticeX, latticeZ + 1, seed) * (1 - fractionX) + hash(latticeX + 1, latticeZ + 1, seed) * fractionX;
    return top * (1 - fractionZ) + bottom * fractionZ;
}

function fbm(x: number, z: number, seed: number): number {
    let sum = 0;
    for (let octave = 0; octave < 4; octave++) {
        const frequency = 2 ** octave;
        sum += 0.5 ** octave * valueNoise(x * frequency, z * frequency, seed + octave * 31);
    }
    return sum;
}

export function gridPosition(index: number): { x: number; z: number } {
    const column = index % GRID_SIZE;
    const row = Math.floor(index / GRID_SIZE);
    return { x: (column / (GRID_SIZE - 1)) * 2 - 1, z: (row / (GRID_SIZE - 1)) * 2 - 1 };
}

export function nearestGridIndex(x: number, z: number): number {
    const column = Math.round(((x + 1) / 2) * (GRID_SIZE - 1));
    const row = Math.round(((z + 1) / 2) * (GRID_SIZE - 1));
    const clamp = (value: number) => Math.min(GRID_SIZE - 1, Math.max(0, value));
    return clamp(row) * GRID_SIZE + clamp(column);
}

export function generateEnsemble(memberCount: number, spread: number, seedOffset: number): TerrainEnsemble {
    const vertexCount = GRID_SIZE * GRID_SIZE;
    const base = new Float32Array(vertexCount);
    const weight = new Float32Array(vertexCount);
    for (let index = 0; index < vertexCount; index++) {
        const { x, z } = gridPosition(index);
        let height = 0.18 * fbm(3 * x, 3 * z, 1);
        for (const hill of HILLS) {
            const distanceSquared = (x - hill.x) ** 2 + (z - hill.z) ** 2;
            height += hill.amplitude * Math.exp(-distanceSquared / (2 * hill.sigma ** 2));
        }
        base[index] = height;
        weight[index] = 0.15 + 0.85 * smoothstep(-0.35, 0.45, fbm(1.3 * x + 5, 1.3 * z + 5, 2));
    }

    const memberHeights = Array.from({ length: memberCount }, (_, member) => {
        const heights = new Float32Array(vertexCount);
        const seed = 100 + seedOffset * 1000 + member;
        for (let index = 0; index < vertexCount; index++) {
            const { x, z } = gridPosition(index);
            heights[index] = base[index] + spread * weight[index] * 0.6 * fbm(2 * x, 2 * z, seed);
        }
        return heights;
    });

    const mean = new Float32Array(vertexCount);
    const standardDeviation = new Float32Array(vertexCount);
    let meanMinimum = Infinity;
    let meanMaximum = -Infinity;
    for (let index = 0; index < vertexCount; index++) {
        let sum = 0;
        for (const heights of memberHeights) {
            sum += heights[index];
        }
        const average = sum / memberCount;
        let squaredDeviations = 0;
        for (const heights of memberHeights) {
            squaredDeviations += (heights[index] - average) ** 2;
        }
        mean[index] = average;
        standardDeviation[index] = Math.sqrt(squaredDeviations / memberCount);
        meanMinimum = Math.min(meanMinimum, average);
        meanMaximum = Math.max(meanMaximum, average);
    }
    return { memberHeights, mean, standardDeviation, meanRange: [meanMinimum, meanMaximum] };
}
