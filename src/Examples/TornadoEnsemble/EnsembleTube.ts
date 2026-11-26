// ABOUTME: Builds the tornado example's tube meshes around the ensemble mean path: the uncertainty tube (a superelliptical
// ABOUTME: cross-section along the members' principal directions, sized by their spread) and the plain mean-path tube.

// Frames along the path: tangent t_i by central differences of the centers; normal n_i by parallel transport
// (n_i = normalize(n_{i−1} − (n_{i−1}·t_i) t_i), so the frame does not twist the way a Frenet frame does where the
// curvature is small); binormal b_i = t_i × n_i.
//
// Cross-section i is the superellipse |x / a_i|^N + |y / b_i|^N = 1 (Li, Ouermi and Johnson, "Uncertainty Tube
// Visualization of Particle Trajectories", 2025), in the plane across the path, on axes u_i = cos φ_i n_i + sin φ_i b_i
// and v_i = t_i × u_i. Its points, θ = 2π j / radialSegments:
//     c_i + a_i sgn(cos θ) |cos θ|^{2/N} u_i + b_i sgn(sin θ) |sin θ|^{2/N} v_i,
// and its outward normal, the gradient of the left side: normalize(sgn(x) |x|^{N−1} / a_i^N u_i + sgn(y) |y|^{N−1} / b_i^N v_i).
// N = 2 is an ellipse; N = 4, a rounded square whose corners show which way the cross-section is turned, so the tube's
// twist (the members' spread rotating about the path) is visible.
//
// For the uncertainty tube, u_i and v_i are the principal directions of the members' offsets across the path, and a_i,
// b_i the square roots of the two eigenvalues (the RMS spread along each). With d_k = p_k,i − c_i and its components
// x_k = d_k · n_i, y_k = d_k · b_i, the covariance C = (1/M) Σ_k [x_k² x_k y_k; x_k y_k y_k²] has eigenvalues
// (C_xx + C_yy)/2 ± sqrt(((C_xx − C_yy)/2)² + C_xy²) and its first eigenvector at φ = ½ atan2(2 C_xy, C_xx − C_yy).
// An eigenvector's sign is arbitrary and the two swap order where the eigenvalues cross, so φ is taken modulo π/2 (a,
// b swapped for odd quarter turns), as the candidate nearest the previous sample's: aligned so, the ring's vertices
// do not jump around the tube between samples.
//
// One mean path and one cross-section summarize a unimodal ensemble only: members that split into groups (paths going
// different ways) put the mean where no member is, and spread along the path (members ahead of or behind each other)
// does not show in a cross-section.

type Vector = [number, number, number];

const subtract = (a: Vector, b: Vector): Vector => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vector, b: Vector): Vector => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const scale = (a: Vector, factor: number): Vector => [a[0] * factor, a[1] * factor, a[2] * factor];
function normalize(a: Vector): Vector | null {
    const length = Math.hypot(a[0], a[1], a[2]);
    return length > 1e-12 ? scale(a, 1 / length) : null;
}
const pointAt = (points: Float32Array, index: number): Vector => [points[index * 3], points[index * 3 + 1], points[index * 3 + 2]];

export interface TubeMesh {
    vertices: Float32Array;   // (radialSegments + 1) per sample (the seam is duplicated), x y z each
    normals: Float32Array;
    uv: Float32Array;         // u: the sample's value (for a 1D colormap texture), v: around the tube
    indices: Uint32Array;     // 6 · radialSegments per segment, segment by segment: a prefix draws the tube up to a sample
}

export interface Frame {
    normal: Vector;
    binormal: Vector;
}

export function tubeFrames(centers: Float32Array): Frame[] {
    const count = centers.length / 3;
    const frames: Frame[] = [];
    let tangent: Vector = [1, 0, 0];
    let normal: Vector | null = null;
    for (let index = 0; index < count; index++) {
        const ahead = pointAt(centers, Math.min(count - 1, index + 1));
        const behind = pointAt(centers, Math.max(0, index - 1));
        tangent = normalize(subtract(ahead, behind)) ?? tangent;
        if (normal === null) {
            // Any direction perpendicular to the first tangent: the coordinate axis least aligned with it.
            const axis: Vector = Math.abs(tangent[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
            normal = normalize(cross(cross(tangent, axis), tangent))!;
        } else {
            normal = normalize(subtract(normal, scale(tangent, dot(normal, tangent)))) ?? normal;
        }
        frames.push({ normal, binormal: cross(tangent, normal) });
    }
    return frames;
}

// φ: the angle of the first axis u from the frame's normal toward its binormal; halfWidths: (a, b) along u and v.
export interface CrossSection {
    angle: number;
    halfWidths: [number, number];
}

export function buildTube(centers: Float32Array, crossSectionAt: (sample: number, frame: Frame) => CrossSection,
                          valueAt: (sample: number) => number, radialSegments: number, exponent = 2): TubeMesh {
    const count = centers.length / 3;
    const ring = radialSegments + 1;
    const vertices = new Float32Array(count * ring * 3);
    const normals = new Float32Array(count * ring * 3);
    const uv = new Float32Array(count * ring * 2);
    const frames = tubeFrames(centers);
    const signedPower = (value: number, power: number) => Math.sign(value) * Math.abs(value) ** power;

    for (let sample = 0; sample < count; sample++) {
        const center = pointAt(centers, sample);
        const frame = frames[sample];
        const { angle, halfWidths: [halfWidthU, halfWidthV] } = crossSectionAt(sample, frame);
        const axisU: Vector = [0, 1, 2].map(axis => Math.cos(angle) * frame.normal[axis]
                                                    + Math.sin(angle) * frame.binormal[axis]) as Vector;
        const axisV: Vector = [0, 1, 2].map(axis => -Math.sin(angle) * frame.normal[axis]
                                                    + Math.cos(angle) * frame.binormal[axis]) as Vector;
        const value = valueAt(sample);
        for (let step = 0; step < ring; step++) {
            const theta = (2 * Math.PI * step) / radialSegments;
            const x = halfWidthU * signedPower(Math.cos(theta), 2 / exponent);
            const y = halfWidthV * signedPower(Math.sin(theta), 2 / exponent);
            const vertex = sample * ring + step;
            for (let axis = 0; axis < 3; axis++) {
                vertices[vertex * 3 + axis] = center[axis] + x * axisU[axis] + y * axisV[axis];
            }
            const gradientU = signedPower(x, exponent - 1) / halfWidthU ** exponent;
            const gradientV = signedPower(y, exponent - 1) / halfWidthV ** exponent;
            const outward = normalize([0, 1, 2].map(axis => gradientU * axisU[axis] + gradientV * axisV[axis]) as Vector)
                            ?? axisU;
            normals.set(outward, vertex * 3);
            uv[vertex * 2] = value;
            uv[vertex * 2 + 1] = step / radialSegments;
        }
    }

    const indices = new Uint32Array(Math.max(0, count - 1) * radialSegments * 6);
    let next = 0;
    for (let sample = 0; sample < count - 1; sample++) {
        for (let step = 0; step < radialSegments; step++) {
            const a = sample * ring + step;
            const b = a + 1;
            const c = a + ring;
            const d = c + 1;
            indices.set([a, c, b, b, c, d], next);
            next += 6;
        }
    }
    return { vertices, normals, uv, indices };
}

// The members' principal directions and RMS spreads across the path, sample by sample, aligned (see above). Half-widths
// are at least minimumRadius, so the tube stays visible where the members still coincide. Where the spread has no
// direction (the same every way, as where the two eigenvalues cross, or both half-widths at the minimum), the
// previous angle is kept: the eigenvector there is rounding noise.
export function uncertaintyCrossSections(paths: Float32Array[], mean: Float32Array, minimumRadius: number): CrossSection[] {
    const sections: CrossSection[] = [];
    let previousAngle = 0;
    tubeFrames(mean).forEach((frame, sample) => {
        const center = pointAt(mean, sample);
        let covarianceXX = 0, covarianceXY = 0, covarianceYY = 0;
        for (const path of paths) {
            const offset = subtract(pointAt(path, sample), center);
            const x = dot(offset, frame.normal);
            const y = dot(offset, frame.binormal);
            covarianceXX += x * x; covarianceXY += x * y; covarianceYY += y * y;
        }
        covarianceXX /= paths.length; covarianceXY /= paths.length; covarianceYY /= paths.length;
        const halfTrace = (covarianceXX + covarianceYY) / 2;
        const deviation = Math.hypot((covarianceXX - covarianceYY) / 2, covarianceXY);
        const halfWidthFirst = Math.max(minimumRadius, Math.sqrt(halfTrace + deviation));
        const halfWidthSecond = Math.max(minimumRadius, Math.sqrt(Math.max(0, halfTrace - deviation)));
        const isotropic = deviation <= 1e-9 * halfTrace;
        if (isotropic || (halfWidthFirst === minimumRadius && halfWidthSecond === minimumRadius)) {
            sections.push({ angle: previousAngle, halfWidths: [halfWidthFirst, halfWidthSecond] });
            return;
        }
        const principalAngle = 0.5 * Math.atan2(2 * covarianceXY, covarianceXX - covarianceYY);
        const quarterTurns = Math.round((previousAngle - principalAngle) / (Math.PI / 2));
        const angle = principalAngle + quarterTurns * (Math.PI / 2);
        const swapped = Math.abs(quarterTurns) % 2 === 1;
        sections.push({ angle, halfWidths: swapped ? [halfWidthSecond, halfWidthFirst] : [halfWidthFirst, halfWidthSecond] });
        previousAngle = angle;
    });
    return sections;
}

export function uncertaintyTube(paths: Float32Array[], mean: Float32Array, valueAt: (sample: number) => number,
                                radialSegments: number, minimumRadius: number, exponent: number): TubeMesh {
    const sections = uncertaintyCrossSections(paths, mean, minimumRadius);
    return buildTube(mean, sample => sections[sample], valueAt, radialSegments, exponent);
}
