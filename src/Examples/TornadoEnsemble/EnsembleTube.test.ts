import { describe, expect, it } from 'vitest';
import { buildTube, tubeFrames, uncertaintyTube } from './EnsembleTube';

// A straight path along x: 5 samples at x = 0..4.
const CENTERS = new Float32Array([0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0, 4, 0, 0]);

function vertexAt(vertices: Float32Array, index: number) {
    return [vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2]];
}

describe('tubeFrames', () => {
    it('gives unit normals and binormals perpendicular to the path and to each other', () => {
        for (const { normal, binormal } of tubeFrames(CENTERS)) {
            expect(normal[0]).toBeCloseTo(0);
            expect(binormal[0]).toBeCloseTo(0);
            expect(Math.hypot(...normal)).toBeCloseTo(1);
            expect(normal[0] * binormal[0] + normal[1] * binormal[1] + normal[2] * binormal[2]).toBeCloseTo(0);
        }
    });
});

describe('buildTube', () => {
    it('makes one ring per sample and 6 indices per segment and step, in order', () => {
        const tube = buildTube(CENTERS, () => [1, 1], sample => sample / 4, 8);
        expect(tube.vertices.length).toBe(5 * 9 * 3);
        expect(tube.indices.length).toBe(4 * 8 * 6);
        expect(Math.max(...tube.indices)).toBe(5 * 9 - 1);
        // The first segment's triangles use only its two rings, so a prefix of the indices draws the tube to a sample.
        expect(Math.max(...tube.indices.subarray(0, 8 * 6))).toBeLessThan(2 * 9);
        expect(tube.uv[0]).toBe(0);
        expect(tube.uv[(4 * 9) * 2]).toBe(1);
    });
});

describe('uncertaintyTube', () => {
    it('is as wide along each direction as the members spread that way', () => {
        const [{ normal }] = tubeFrames(CENTERS);
        // Two members offset by ±2 along the frame's normal at every sample: RMS offset 2 that way, 0 the other way.
        const offset = (sign: number) => CENTERS.map((value, index) => value + sign * 2 * normal[index % 3]);
        const tube = uncertaintyTube([offset(1), offset(-1)], CENTERS, () => 0, 8, 0.1);

        const [, y0, z0] = vertexAt(tube.vertices, 0);   // angle 0: along the normal
        const [, y2, z2] = vertexAt(tube.vertices, 2);   // angle π/2: along the binormal
        expect(Math.hypot(y0, z0)).toBeCloseTo(2, 5);
        expect(Math.hypot(y2, z2)).toBeCloseTo(0.1, 5);
    });
});
