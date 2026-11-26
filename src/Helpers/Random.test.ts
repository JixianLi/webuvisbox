import { describe, expect, it } from 'vitest';
import { seededRandom, standardNormal } from './Random';

describe('seededRandom', () => {
    it('gives the same sequence for the same seed and another for another seed', () => {
        const first = seededRandom(7);
        const again = seededRandom(7);
        const other = seededRandom(8);
        const sequence = Array.from({ length: 5 }, first);
        expect(Array.from({ length: 5 }, again)).toEqual(sequence);
        expect(Array.from({ length: 5 }, other)).not.toEqual(sequence);
        expect(sequence.every(value => value >= 0 && value < 1)).toBe(true);
    });
});

describe('standardNormal', () => {
    it('has mean 0 and standard deviation 1', () => {
        const sample = standardNormal(seededRandom(1));
        const values = Array.from({ length: 20000 }, sample);
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
        expect(mean).toBeCloseTo(0, 1);
        expect(Math.sqrt(variance)).toBeCloseTo(1, 1);
    });
});
