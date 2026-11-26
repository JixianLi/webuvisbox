import { describe, expect, it } from 'vitest';
import { buildTube, tubeFrames, uncertaintyCrossSections, uncertaintyTube } from './EnsembleTube';

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
        const tube = buildTube(CENTERS, () => ({ angle: 0, halfWidths: [1, 1] }), sample => sample / 4, 8);
        expect(tube.vertices.length).toBe(5 * 9 * 3);
        expect(tube.indices.length).toBe(4 * 8 * 6);
        expect(Math.max(...tube.indices)).toBe(5 * 9 - 1);
        // The first segment's triangles use only its two rings, so a prefix of the indices draws the tube to a sample.
        expect(Math.max(...tube.indices.subarray(0, 8 * 6))).toBeLessThan(2 * 9);
        expect(tube.uv[0]).toBe(0);
        expect(tube.uv[(4 * 9) * 2]).toBe(1);
    });
});

// Members offset from CENTERS by ±length along the direction at angle φ from the frame's normal toward its binormal.
function membersAlong(angleAt: (sample: number) => number, lengthAt: (sample: number) => number) {
    const frames = tubeFrames(CENTERS);
    const member = (sign: number) => CENTERS.map((value, index) => {
        const sample = Math.floor(index / 3);
        const { normal, binormal } = frames[sample];
        const angle = angleAt(sample);
        const direction = Math.cos(angle) * normal[index % 3] + Math.sin(angle) * binormal[index % 3];
        return value + sign * lengthAt(sample) * direction;
    });
    return [member(1), member(-1)];
}

describe('uncertaintyTube', () => {
    it('is a superellipse as wide along each principal direction as the members spread that way', () => {
        // Members at ±2 along the normal: RMS spread 2 that way, none the other way (the minimum, 0.1).
        const tube = uncertaintyTube(membersAlong(() => 0, () => 2), CENTERS, () => 0, 8, 0.1, 4);
        const [, y0, z0] = vertexAt(tube.vertices, 0);   // θ = 0: along the first axis
        const [, y1, z1] = vertexAt(tube.vertices, 1);   // θ = π/4: the corner
        const [, y2, z2] = vertexAt(tube.vertices, 2);   // θ = π/2: along the second axis
        expect(Math.hypot(y0, z0)).toBeCloseTo(2, 5);
        expect(Math.hypot(y2, z2)).toBeCloseTo(0.1, 5);
        const [{ normal, binormal }] = tubeFrames(CENTERS);
        const x = y1 * normal[1] + z1 * normal[2];
        const y = y1 * binormal[1] + z1 * binormal[2];
        expect((x / 2) ** 4 + (y / 0.1) ** 4).toBeCloseTo(1, 5);
    });

    it('turns its cross-section to a diagonal spread instead of measuring it along the frame', () => {
        const sections = uncertaintyCrossSections(membersAlong(() => Math.PI / 4, () => 2), CENTERS, 0.1);
        for (const { angle, halfWidths } of sections) {
            expect(Math.abs(Math.cos(angle - Math.PI / 4))).toBeCloseTo(1, 5);
            expect(halfWidths[0]).toBeCloseTo(2, 5);
            expect(halfWidths[1]).toBeCloseTo(0.1, 5);
        }
    });

    it('follows a spread that keeps rotating, without jumping back a half or quarter turn', () => {
        // 0.5 rad per sample: 2 rad over the path, past both π/2 and the point where the raw eigenvector would wrap.
        const sections = uncertaintyCrossSections(membersAlong(sample => 0.5 * sample, () => 2), CENTERS, 0.1);
        sections.forEach(({ angle, halfWidths }, sample) => {
            expect(angle).toBeCloseTo(0.5 * sample, 5);
            expect(halfWidths[0]).toBeCloseTo(2, 5);
        });
    });

    it('keeps its axes where the two spreads trade places, swapping the half-widths instead', () => {
        // Four members: ±2a along the normal and ±2b along the binormal, a shrinking from 1 to 0.25 and b growing from
        // 0.25 to 1, so the larger eigenvalue changes axis halfway. RMS along each: 2a / √2 and 2b / √2.
        const along = (angle: number, lengthAt: (sample: number) => number) => membersAlong(() => angle, lengthAt);
        const a = (sample: number) => 1 - 0.1875 * sample;
        const b = (sample: number) => 0.25 + 0.1875 * sample;
        const members = [...along(0, sample => 2 * a(sample)), ...along(Math.PI / 2, sample => 2 * b(sample))];
        const sections = uncertaintyCrossSections(members, CENTERS, 0.01);
        sections.forEach(({ angle, halfWidths }, sample) => {
            expect(angle).toBeCloseTo(0, 5);
            expect(halfWidths[0]).toBeCloseTo(Math.SQRT2 * a(sample), 5);
            expect(halfWidths[1]).toBeCloseTo(Math.SQRT2 * b(sample), 5);
        });
    });
});
