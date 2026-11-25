// ABOUTME: Generates the contour uncertainty example's data: an ensemble of smooth 2D scalar fields, each a sum of
// ABOUTME: Gaussian bumps whose positions, heights and widths vary from member to member. Pure math, no rendering.

// Fields are sampled at GRID_SIZE × GRID_SIZE vertices covering the unit square; value index = row · GRID_SIZE + column,
// with row 0 at the top. Each member is
//     f(x, y) = Σ_k a_k · exp(−((x − x_k)² + (y − y_k)²) / (2 σ_k²))
// over the shared base bumps (perturbed) plus a few small random bumps of the member's own, which make peaks, pits and
// saddles appear in some members and not in others. No noise is added, so each field has only a handful of critical
// points rather than hundreds.
export const GRID_SIZE = 96;

interface Bump { x: number; y: number; amplitude: number; sigma: number }

const BASE_BUMPS: Bump[] = [
    { x: 0.28, y: 0.30, amplitude: 1.00, sigma: 0.13 },
    { x: 0.70, y: 0.28, amplitude: 0.85, sigma: 0.12 },
    { x: 0.50, y: 0.70, amplitude: 0.90, sigma: 0.15 },
    { x: 0.80, y: 0.74, amplitude: -0.60, sigma: 0.10 },
    { x: 0.18, y: 0.76, amplitude: -0.50, sigma: 0.11 },
    { x: 0.50, y: 0.44, amplitude: -0.30, sigma: 0.08 },
];
// At spread 1: bump centers move by about POSITION_JITTER, heights and widths change by about the given fractions.
const POSITION_JITTER = 0.06;
const AMPLITUDE_JITTER = 0.25;
const SIGMA_JITTER = 0.15;
const EXTRA_BUMPS_PER_MEMBER = 2;
const EXTRA_BUMP_AMPLITUDE = 0.25;

// Seeded uniform random numbers in [0, 1) (mulberry32), so one seed always gives the same ensemble.
function seededRandom(seed: number): () => number {
    let value = seed >>> 0;
    return () => {
        value = (value + 0x6d2b79f5) >>> 0;
        let mixed = Math.imul(value ^ (value >>> 15), value | 1);
        mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
}

export interface ContourEnsemble {
    members: Float32Array[];   // GRID_SIZE² values each
    mean: Float32Array;
    valueRange: [number, number];   // over every member
}

function addBump(field: Float32Array, bump: Bump) {
    const scale = -1 / (2 * bump.sigma * bump.sigma);
    for (let row = 0; row < GRID_SIZE; row++) {
        const dy = row / (GRID_SIZE - 1) - bump.y;
        for (let column = 0; column < GRID_SIZE; column++) {
            const dx = column / (GRID_SIZE - 1) - bump.x;
            field[row * GRID_SIZE + column] += bump.amplitude * Math.exp((dx * dx + dy * dy) * scale);
        }
    }
}

export function generateEnsemble(memberCount: number, spread: number, seed: number): ContourEnsemble {
    const random = seededRandom(seed + 1);
    const gaussian = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
    const members = Array.from({ length: memberCount }, () => {
        const field = new Float32Array(GRID_SIZE * GRID_SIZE);
        for (const bump of BASE_BUMPS) {
            addBump(field, {
                x: bump.x + spread * POSITION_JITTER * gaussian(),
                y: bump.y + spread * POSITION_JITTER * gaussian(),
                amplitude: bump.amplitude * (1 + spread * AMPLITUDE_JITTER * gaussian()),
                sigma: bump.sigma * Math.max(0.3, 1 + spread * SIGMA_JITTER * gaussian()),
            });
        }
        for (let extra = 0; extra < EXTRA_BUMPS_PER_MEMBER; extra++) {
            addBump(field, {
                x: 0.1 + 0.8 * random(),
                y: 0.1 + 0.8 * random(),
                amplitude: spread * EXTRA_BUMP_AMPLITUDE * (random() < 0.5 ? -1 : 1) * (0.5 + random()),
                sigma: 0.05 + 0.04 * random(),
            });
        }
        return field;
    });

    const mean = new Float32Array(GRID_SIZE * GRID_SIZE);
    let minimum = Infinity, maximum = -Infinity;
    for (const field of members) {
        for (let index = 0; index < field.length; index++) {
            mean[index] += field[index] / memberCount;
            if (field[index] < minimum) minimum = field[index];
            if (field[index] > maximum) maximum = field[index];
        }
    }
    return { members, mean, valueRange: [minimum, maximum] };
}
