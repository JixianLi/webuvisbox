import { describe, expect, it } from 'vitest';
import { generateEnsemble, SAMPLE_COUNT, VARIABILITY_GROWTH_RANGE } from './TornadoFlow';
import { tubeFrames, uncertaintyCrossSections } from './EnsembleTube';

const MEMBER_COUNT = 50;
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

    it('has a tube holding about as many members as a one-standard-deviation superellipse would', () => {
        // For offsets normally distributed across the path, the superellipse |x/a|⁴ + |y/b|⁴ ≤ 1 with the RMS spreads
        // along the principal directions as a and b holds about 44% of them (by Monte Carlo).
        const sections = uncertaintyCrossSections(paths, mean, 0);
        const frames = tubeFrames(mean);
        for (const sample of LATE_SAMPLES) {
            const { normal, binormal } = frames[sample];
            const { angle, halfWidths: [halfWidthU, halfWidthV] } = sections[sample];
            const center = point(mean, sample);
            const inside = paths.filter(path => {
                const offset = point(path, sample).map((value, axis) => value - center[axis]);
                const dot = (direction: number[]) => offset[0] * direction[0] + offset[1] * direction[1] + offset[2] * direction[2];
                const [x, y] = [dot(normal), dot(binormal)];
                const alongU = Math.cos(angle) * x + Math.sin(angle) * y;
                const alongV = -Math.sin(angle) * x + Math.cos(angle) * y;
                return (alongU / halfWidthU) ** 4 + (alongV / halfWidthV) ** 4 <= 1;
            }).length;
            expect(inside / MEMBER_COUNT).toBeGreaterThan(0.25);
            expect(inside / MEMBER_COUNT).toBeLessThan(0.65);
        }
    });
});
