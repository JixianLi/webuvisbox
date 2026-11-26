// ABOUTME: Generates the tornado ensemble example's data: one particle traced through each member of an ensemble of
// ABOUTME: tornado-like flows whose axes wander more and more over time, and the ensemble's spread. Pure math.

import { seededRandom, standardNormal } from "../../Helpers/Random";

// Each member's flow is a Burgers vortex (Burgers 1948, an exact solution of the Navier–Stokes equations) about a
// vertical axis through c(t) = (c_x(t), c_y(t)). In cylindrical coordinates about that axis, with r the distance to it:
//     u_r = −α r,    u_z = 2 α z,    u_θ = Γ / (2π r) · (1 − e^{−r² / r_c²}),
// inflow toward the axis, an updraft, and swirl: rigid rotation at angular speed Γ / (2π r_c²) near the axis (r ≪ r_c),
// a potential vortex far from it. A particle spirals inward and up, keeping r² z constant (r ∝ e^{−αt}, z ∝ e^{2αt}).
//
// The members differ only in where the axis is. Its velocity is an Ornstein–Uhlenbeck process (smooth, mean zero,
// forgetting itself over TAU) whose noise grows linearly with time, so the members agree at first and disagree more
// and more:
//     dv = −v / TAU dt + growth · t dW,    dc = v dt,    c(0) = v(0) = 0.
// Γ, α and r_c are the same in every member on purpose: the particle stays inside the core, where every member turns at
// nearly the same angular speed, so the members do not turn apart (which would leave their mean near the axis, where no
// member is). That keeps the ensemble unimodal, which the uncertainty tube (one mean path, one cross-section) assumes.
// The axis moves horizontally and the path is a flat spiral, so about half of the spread is along the path (members
// ahead of or behind each other), which the tube's cross-section does not show; fewer turns (a steeper spiral) would
// show more of it.
//
// Integrated with fourth-order Runge–Kutta at a fixed step DT (the axis held fixed within a step, then advanced by
// Euler–Maruyama); every SAMPLE_STRIDE-th position is kept. Lengths are in arbitrary units (the core radius is 4).
const CIRCULATION = 190;        // Γ
const INFLOW_RATE = 0.09;       // α
const CORE_RADIUS = 4;          // r_c
const AXIS_MEMORY = 1;          // TAU
const DT = 0.01;
const SAMPLE_STRIDE = 4;
const START: State = [2.5, 0, 1];

export const DURATION = 10;
export const SAMPLE_INTERVAL = DT * SAMPLE_STRIDE;
export const SAMPLE_COUNT = Math.round(DURATION / SAMPLE_INTERVAL) + 1;
// The range of growth the controls offer: above it the members begin to turn at visibly different speeds, run ahead of
// or behind each other, and their mean leaves them, so the tube would no longer summarize them.
export const VARIABILITY_GROWTH_RANGE: [number, number] = [0.005, 0.025];

type State = [number, number, number];

function velocity([x, y, z]: State, axisX: number, axisY: number): State {
    const offsetX = x - axisX;
    const offsetY = y - axisY;
    const squaredRadius = offsetX * offsetX + offsetY * offsetY;
    // u_θ / r, finite on the axis (Γ / (2π r_c²) there).
    const angularSpeed = squaredRadius > 1e-12
        ? CIRCULATION / (2 * Math.PI * squaredRadius) * (1 - Math.exp(-squaredRadius / (CORE_RADIUS * CORE_RADIUS)))
        : CIRCULATION / (2 * Math.PI * CORE_RADIUS * CORE_RADIUS);
    return [-INFLOW_RATE * offsetX - angularSpeed * offsetY, -INFLOW_RATE * offsetY + angularSpeed * offsetX,
            2 * INFLOW_RATE * z];
}

function rungeKuttaStep(state: State, step: number, axisX: number, axisY: number): State {
    const along = (base: State, slope: State, fraction: number): State =>
        [base[0] + fraction * slope[0], base[1] + fraction * slope[1], base[2] + fraction * slope[2]];
    const k1 = velocity(state, axisX, axisY);
    const k2 = velocity(along(state, k1, step / 2), axisX, axisY);
    const k3 = velocity(along(state, k2, step / 2), axisX, axisY);
    const k4 = velocity(along(state, k3, step), axisX, axisY);
    return [0, 1, 2].map(axis => state[axis] + (step / 6) * (k1[axis] + 2 * k2[axis] + 2 * k3[axis] + k4[axis])) as State;
}

export interface TornadoEnsemble {
    paths: Float32Array[];   // one per member: SAMPLE_COUNT points, x y z each (z up)
    mean: Float32Array;      // the ensemble mean path: SAMPLE_COUNT points, x y z each
    spread: Float32Array;    // per sample: RMS distance of the members from the ensemble mean
}

// The spread axis shared by the colors, the colorbar, the chart and the uncertainty tube: fixed rather than fitted to the
// data, so a smaller growth visibly stays cooler and lower. The largest growth offered ends at a spread of about 0.55.
export const SPREAD_DOMAIN: [number, number] = [0, 0.6];

// A spread's place on SPREAD_DOMAIN in [0, 1] (as d3.scaleLinear().clamp(true) maps it).
export function normalizedSpread(spread: number): number {
    const [low, high] = SPREAD_DOMAIN;
    return Math.min(1, Math.max(0, (spread - low) / (high - low)));
}

function tracePath(gaussian: () => number, variabilityGrowth: number): Float32Array {
    const path = new Float32Array(SAMPLE_COUNT * 3);
    let state = START;
    let axisX = 0, axisY = 0, axisVelocityX = 0, axisVelocityY = 0;
    let time = 0;
    path.set(state, 0);
    for (let sample = 1; sample < SAMPLE_COUNT; sample++) {
        for (let step = 0; step < SAMPLE_STRIDE; step++) {
            state = rungeKuttaStep(state, DT, axisX, axisY);
            const noise = variabilityGrowth * time * Math.sqrt(DT);
            axisVelocityX += -axisVelocityX / AXIS_MEMORY * DT + noise * gaussian();
            axisVelocityY += -axisVelocityY / AXIS_MEMORY * DT + noise * gaussian();
            axisX += axisVelocityX * DT;
            axisY += axisVelocityY * DT;
            time += DT;
        }
        path.set(state, sample * 3);
    }
    return path;
}

export function generateEnsemble(memberCount: number, variabilityGrowth: number, seed: number): TornadoEnsemble {
    const gaussian = standardNormal(seededRandom(seed + 1));
    const paths = Array.from({ length: memberCount }, () => tracePath(gaussian, variabilityGrowth));

    const spread = new Float32Array(SAMPLE_COUNT);
    const mean = new Float32Array(SAMPLE_COUNT * 3);
    for (let sample = 0; sample < SAMPLE_COUNT; sample++) {
        let meanX = 0, meanY = 0, meanZ = 0;
        for (const path of paths) {
            meanX += path[sample * 3];
            meanY += path[sample * 3 + 1];
            meanZ += path[sample * 3 + 2];
        }
        meanX /= memberCount; meanY /= memberCount; meanZ /= memberCount;
        mean.set([meanX, meanY, meanZ], sample * 3);
        let squaredDistance = 0;
        for (const path of paths) {
            squaredDistance += (path[sample * 3] - meanX) ** 2 + (path[sample * 3 + 1] - meanY) ** 2
                + (path[sample * 3 + 2] - meanZ) ** 2;
        }
        spread[sample] = Math.sqrt(squaredDistance / memberCount);
    }
    return { paths, mean, spread };
}
