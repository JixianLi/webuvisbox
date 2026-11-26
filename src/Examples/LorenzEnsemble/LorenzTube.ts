// ABOUTME: Builds the Lorenz example's tube meshes around the ensemble mean path: the uncertainty tube (an elliptical
// ABOUTME: cross-section sized by the members' spread in each direction) and the plain mean-path tube. Pure math.

// Frames along the path: tangent t_i by central differences of the centers; normal n_i by parallel transport
// (n_i = normalize(n_{i−1} − (n_{i−1}·t_i) t_i), so the frame does not twist the way a Frenet frame does where the
// curvature is small); binormal b_i = t_i × n_i.
//
// Cross-section i is the ellipse c_i + a_i cos θ n_i + b_i' sin θ b_i, θ = 2π j / radialSegments, with semi-axes
// (a_i, b_i') from radiiAt. For the uncertainty tube they are the members' RMS offsets from the mean along n_i and b_i,
//     a_i = sqrt( (1/M) Σ_k ((p_k,i − c_i) · n_i)² ),
// so an ensemble spread more one way than the other gives an elliptical, asymmetric tube (Li, Ouermi and Johnson,
// "Uncertainty Tube Visualization of Particle Trajectories", 2025, use superellipses for the same purpose).
// The ellipse's outward normal at θ is normalize(b_i' cos θ n_i + a_i sin θ b_i).

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

export function buildTube(centers: Float32Array, radiiAt: (sample: number, frame: Frame) => [number, number],
                          valueAt: (sample: number) => number, radialSegments: number): TubeMesh {
    const count = centers.length / 3;
    const ring = radialSegments + 1;
    const vertices = new Float32Array(count * ring * 3);
    const normals = new Float32Array(count * ring * 3);
    const uv = new Float32Array(count * ring * 2);
    const frames = tubeFrames(centers);

    for (let sample = 0; sample < count; sample++) {
        const center = pointAt(centers, sample);
        const frame = frames[sample];
        const [radiusNormal, radiusBinormal] = radiiAt(sample, frame);
        const value = valueAt(sample);
        for (let step = 0; step < ring; step++) {
            const angle = (2 * Math.PI * step) / radialSegments;
            const cosine = Math.cos(angle);
            const sine = Math.sin(angle);
            const vertex = sample * ring + step;
            for (let axis = 0; axis < 3; axis++) {
                vertices[vertex * 3 + axis] = center[axis] + radiusNormal * cosine * frame.normal[axis]
                                              + radiusBinormal * sine * frame.binormal[axis];
            }
            const outward = normalize([0, 1, 2].map(axis => radiusBinormal * cosine * frame.normal[axis]
                                                           + radiusNormal * sine * frame.binormal[axis]) as Vector)
                            ?? frame.normal;
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

// The members' RMS offset from the mean along each frame direction, at least minimumRadius so the tube stays visible
// where the members still coincide.
export function uncertaintyTube(paths: Float32Array[], mean: Float32Array, valueAt: (sample: number) => number,
                                radialSegments: number, minimumRadius: number): TubeMesh {
    return buildTube(mean, (sample, frame) => {
        const center = pointAt(mean, sample);
        let alongNormal = 0;
        let alongBinormal = 0;
        for (const path of paths) {
            const offset = subtract(pointAt(path, sample), center);
            alongNormal += dot(offset, frame.normal) ** 2;
            alongBinormal += dot(offset, frame.binormal) ** 2;
        }
        return [Math.max(minimumRadius, Math.sqrt(alongNormal / paths.length)),
                Math.max(minimumRadius, Math.sqrt(alongBinormal / paths.length))];
    }, valueAt, radialSegments);
}
