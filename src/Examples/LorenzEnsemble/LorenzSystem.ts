// ABOUTME: Generates the Lorenz ensemble example's data: trajectories of the Lorenz system from nearly identical
// ABOUTME: starting points, and the ensemble's spread over time. Pure math, no rendering (loaded with the scenario).

// The Lorenz system (Lorenz 1963, "Deterministic nonperiodic flow"), with the classic chaotic parameters:
//     dx/dt = σ (y − x),    dy/dt = x (ρ − z) − y,    dz/dt = x y − β z,    σ = 10, ρ = 28, β = 8/3.
// Integrated with classic fourth-order Runge–Kutta at a fixed step DT; every SAMPLE_STRIDE-th state is kept.
// Nearby trajectories separate like e^{λ t}, λ ≈ 0.906 (the largest Lyapunov exponent), until the separation
// saturates at the attractor's size (spread of order 10).
const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;
const DT = 0.005;
const SAMPLE_STRIDE = 4;

export const DURATION = 25;
export const SAMPLE_INTERVAL = DT * SAMPLE_STRIDE;
export const SAMPLE_COUNT = Math.round(DURATION / SAMPLE_INTERVAL) + 1;
export const LYAPUNOV_EXPONENT = 0.906;

type State = [number, number, number];

function derivative([x, y, z]: State): State {
    return [SIGMA * (y - x), x * (RHO - z) - y, x * y - BETA * z];
}

function rungeKuttaStep(state: State, step: number): State {
    const k1 = derivative(state);
    const k2 = derivative([state[0] + 0.5 * step * k1[0], state[1] + 0.5 * step * k1[1], state[2] + 0.5 * step * k1[2]]);
    const k3 = derivative([state[0] + 0.5 * step * k2[0], state[1] + 0.5 * step * k2[1], state[2] + 0.5 * step * k2[2]]);
    const k4 = derivative([state[0] + step * k3[0], state[1] + step * k3[1], state[2] + step * k3[2]]);
    return [
        state[0] + (step / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
        state[1] + (step / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
        state[2] + (step / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    ];
}

// The shared starting point: (1, 1, 1) run for 20 time units, so it lies on the attractor and the ensemble starts
// there rather than on the transient that leads to it.
const START: State = (() => {
    let state: State = [1, 1, 1];
    for (let step = 0; step < 20 / DT; step++) state = rungeKuttaStep(state, DT);
    return state;
})();

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

// Standard normal samples by the Box–Muller transform.
function seededGaussian(seed: number): () => number {
    const random = seededRandom(seed);
    return () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}

export interface LorenzEnsemble {
    paths: Float32Array[];   // one per member: SAMPLE_COUNT points, x y z each
    spread: Float32Array;    // per sample: RMS distance of the members from the ensemble mean
}

// Member m starts at START + jitter · (g_x, g_y, g_z) with g standard normal, so the starting spread is about
// jitter · √3.
export function generateEnsemble(memberCount: number, jitter: number, seed: number): LorenzEnsemble {
    const gaussian = seededGaussian(seed + 1);
    const paths = Array.from({ length: memberCount }, () => {
        let state: State = [START[0] + jitter * gaussian(), START[1] + jitter * gaussian(), START[2] + jitter * gaussian()];
        const path = new Float32Array(SAMPLE_COUNT * 3);
        path.set(state, 0);
        for (let sample = 1; sample < SAMPLE_COUNT; sample++) {
            for (let step = 0; step < SAMPLE_STRIDE; step++) state = rungeKuttaStep(state, DT);
            path.set(state, sample * 3);
        }
        return path;
    });

    const spread = new Float32Array(SAMPLE_COUNT);
    for (let sample = 0; sample < SAMPLE_COUNT; sample++) {
        let meanX = 0, meanY = 0, meanZ = 0;
        for (const path of paths) {
            meanX += path[sample * 3];
            meanY += path[sample * 3 + 1];
            meanZ += path[sample * 3 + 2];
        }
        meanX /= memberCount; meanY /= memberCount; meanZ /= memberCount;
        let squaredDistance = 0;
        for (const path of paths) {
            squaredDistance += (path[sample * 3] - meanX) ** 2 + (path[sample * 3 + 1] - meanY) ** 2
                + (path[sample * 3 + 2] - meanZ) ** 2;
        }
        spread[sample] = Math.sqrt(squaredDistance / memberCount);
    }
    return { paths, spread };
}
