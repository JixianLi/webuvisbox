import { describe, expect, it } from 'vitest';
import { generateEnsemble, SAMPLE_COUNT, VARIABILITY_GROWTH_RANGE } from './TornadoFlow';
import { tubeFrames, uncertaintyTube } from './EnsembleTube';

const MEMBER_COUNT = 50;
const RADIAL_SEGMENTS = 8;
const LATE_SAMPLES = [Math.floor(SAMPLE_COUNT / 2), Math.floor(SAMPLE_COUNT * 0.75), SAMPLE_COUNT - 1];

const point = (points: Float32Array, sample: number) =>
    [points[sample * 3], points[sample * 3 + 1], points[sample * 3 + 2]];

// The uncertainty tube assumes a unimodal ensemble (EnsembleTube.ts). These check that the generator keeps to it at
// every growth the controls offer.
describe.each(VARIABILITY_GROWTH_RANGE)('the tornado ensemble at variability growth %f', growth => {
    const { paths, mean, spread } = generateEnsemble(MEMBER_COUNT, growth, 3);

    it('starts with every member together and spreads them more and more', () => {
        expect(spread[0]).toBe(0);
        const quarters = [1, 2, 3, 4].map(quarter => spread[Math.floor((SAMPLE_COUNT - 1) * quarter / 4)]);
        quarters.slice(1).forEach((value, index) => expect(value).toBeGreaterThan(quarters[index]));
    });

    it('keeps the mean path among the members: no turning apart that would pull it toward the axis', () => {
        for (const sample of LATE_SAMPLES) {
            const radii = paths.map(path => Math.hypot(path[sample * 3], path[sample * 3 + 1])).sort((a, b) => a - b);
            const medianRadius = radii[MEMBER_COUNT / 2];
            const [meanX, meanY] = point(mean, sample);
            expect(Math.hypot(meanX, meanY) / medianRadius).toBeGreaterThan(0.85);
        }
    });

    // Measured 41–60% across (TornadoFlow.ts explains the rest); this catches the ensemble turning apart.
    it('spreads the members across the path at least about as much as along it', () => {
        const frames = tubeFrames(mean);
        for (const sample of LATE_SAMPLES) {
            const { normal, binormal } = frames[sample];
            const center = point(mean, sample);
            let across = 0;
            let total = 0;
            for (const path of paths) {
                const offset = point(path, sample).map((value, axis) => value - center[axis]);
                const dot = (direction: number[]) => offset[0] * direction[0] + offset[1] * direction[1] + offset[2] * direction[2];
                across += dot(normal) ** 2 + dot(binormal) ** 2;
                total += offset[0] ** 2 + offset[1] ** 2 + offset[2] ** 2;
            }
            expect(across / total).toBeGreaterThan(0.4);
        }
    });

    it('has a tube holding about as many members as a one-standard-deviation ellipse would', () => {
        // For offsets normally distributed across the path, the ellipse with the RMS offsets as half-widths holds
        // 1 − e^{−1/2} ≈ 39% of them.
        const tube = uncertaintyTube(paths, mean, () => 0, RADIAL_SEGMENTS, 0);
        const frames = tubeFrames(mean);
        const ring = RADIAL_SEGMENTS + 1;
        for (const sample of LATE_SAMPLES) {
            const { normal, binormal } = frames[sample];
            const center = point(mean, sample);
            // Ring vertex 0 is at angle 0 (along the normal), vertex RADIAL_SEGMENTS / 4 at π/2 (along the binormal).
            const halfWidth = (step: number) => {
                const vertex = point(tube.vertices, sample * ring + step);
                return Math.hypot(vertex[0] - center[0], vertex[1] - center[1], vertex[2] - center[2]);
            };
            const [alongNormal, alongBinormal] = [halfWidth(0), halfWidth(RADIAL_SEGMENTS / 4)];
            const inside = paths.filter(path => {
                const offset = point(path, sample).map((value, axis) => value - center[axis]);
                const dot = (direction: number[]) => offset[0] * direction[0] + offset[1] * direction[1] + offset[2] * direction[2];
                return (dot(normal) / alongNormal) ** 2 + (dot(binormal) / alongBinormal) ** 2 <= 1;
            }).length;
            expect(inside / MEMBER_COUNT).toBeGreaterThan(0.2);
            expect(inside / MEMBER_COUNT).toBeLessThan(0.6);
        }
    });
});
