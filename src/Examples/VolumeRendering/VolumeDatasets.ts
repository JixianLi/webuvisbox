// ABOUTME: The volume rendering example's two generated datasets, a Shepp–Logan-style head phantom and the
// ABOUTME: Marschner–Lobb test signal, and their histograms. Pure math, no rendering.

export interface Volume {
    data: Float32Array;                       // values in [0, 1]; index = x + nx · (y + ny · z)
    dimensions: [number, number, number];
}

// The 3D modified Shepp–Logan phantom (Shepp & Logan 1974; 3D form after Toft 1996): a sum of ellipsoids, each adding
// its density A inside (x − x0)²/a² + (y − y0)²/b² + (z − z0)²/c² ≤ 1 after rotating by φ about z, over [−1, 1]³.
// Densities are the "modified" ones (skull 1, brain 0.2, ventricles 0, lesions 0.3), which separate the tissues in
// the histogram, the reason a phantom suits transfer-function editing. Published 3D variants also tilt two
// ellipsoids out of plane; this one keeps only the rotation about z.
const PHANTOM_ELLIPSOIDS: Array<[number, number, number, number, number, number, number, number]> = [
    // A,     a,      b,     c,     x0,     y0,     z0,    φ (degrees)
    [ 1.0,  0.690, 0.920, 0.810,  0.00,   0.000,  0.00,   0],
    [-0.8,  0.6624, 0.874, 0.780, 0.00,  -0.0184, 0.00,   0],
    [-0.2,  0.110, 0.310, 0.220,  0.22,   0.000,  0.00, -18],
    [-0.2,  0.160, 0.410, 0.280, -0.22,   0.000,  0.00,  18],
    [ 0.1,  0.210, 0.250, 0.410,  0.00,   0.350, -0.15,   0],
    [ 0.1,  0.046, 0.046, 0.050,  0.00,   0.100,  0.25,   0],
    [ 0.1,  0.046, 0.046, 0.050,  0.00,  -0.100,  0.25,   0],
    [ 0.1,  0.046, 0.023, 0.050, -0.08,  -0.605,  0.00,   0],
    [ 0.1,  0.023, 0.023, 0.020,  0.00,  -0.606,  0.00,   0],
    [ 0.1,  0.023, 0.046, 0.020,  0.06,  -0.605,  0.00,   0],
];

// Edges are anti-aliased analytically: instead of the inside test q ≤ 1 (q = u² + v² + w², with u, v, w the voxel
// center's coordinates scaled by the semi-axes), an ellipsoid covers a voxel by clamp(0.5 − d / h, 0, 1), where
// d ≈ (q − 1) / |∇q| is the first-order distance to the surface q = 1 and h the voxel size. Values then change
// continuously across one voxel at every surface, as a scanner's partial volume does; an inside/outside test makes
// every curved surface a staircase of voxel terraces, which a volume renderer shows as rings.
export function sheppLoganPhantom(size: number): Volume {
    const data = new Float32Array(size * size * size);
    const voxelSize = 2 / size;
    const coordinate = (index: number) => -1 + (index + 0.5) * voxelSize;
    for (const [density, a, b, c, x0, y0, z0, degrees] of PHANTOM_ELLIPSOIDS) {
        const cosine = Math.cos((degrees * Math.PI) / 180);
        const sine = Math.sin((degrees * Math.PI) / 180);
        // Voxels within the ellipsoid's bounding box (its larger in-plane semi-axis bounds the rotated ellipse).
        const radius = Math.max(a, b);
        const indexRange = (center: number, halfWidth: number) => [
            Math.max(0, Math.floor(((center - halfWidth + 1) * size) / 2) - 1),
            Math.min(size - 1, Math.ceil(((center + halfWidth + 1) * size) / 2) + 1),
        ];
        const [xFirst, xLast] = indexRange(x0, radius);
        const [yFirst, yLast] = indexRange(y0, radius);
        const [zFirst, zLast] = indexRange(z0, c);
        for (let zIndex = zFirst; zIndex <= zLast; zIndex++) {
            const w = (coordinate(zIndex) - z0) / c;
            for (let yIndex = yFirst; yIndex <= yLast; yIndex++) {
                const dy = coordinate(yIndex) - y0;
                for (let xIndex = xFirst; xIndex <= xLast; xIndex++) {
                    const dx = coordinate(xIndex) - x0;
                    const u = (dx * cosine + dy * sine) / a;
                    const v = (-dx * sine + dy * cosine) / b;
                    const q = u * u + v * v + w * w;
                    const gradientX = (2 * u * cosine) / a - (2 * v * sine) / b;
                    const gradientY = (2 * u * sine) / a + (2 * v * cosine) / b;
                    const gradientZ = (2 * w) / c;
                    const gradientLength = Math.hypot(gradientX, gradientY, gradientZ);
                    const distance = gradientLength > 0 ? (q - 1) / gradientLength : q - 1;
                    const coverage = Math.max(0, Math.min(1, 0.5 - distance / voxelSize));
                    if (coverage > 0) data[xIndex + size * (yIndex + size * zIndex)] += density * coverage;
                }
            }
        }
    }
    for (let index = 0; index < data.length; index++) data[index] = Math.max(0, Math.min(1, data[index]));
    return { data, dimensions: [size, size, size] };
}

// The Marschner–Lobb test signal (Marschner & Lobb, "An evaluation of reconstruction filters for volume rendering",
// IEEE Visualization 1994), over [−1, 1]³:
//     ρ(x, y, z) = (1 − sin(π z / 2) + α (1 + ρ_r(√(x² + y²)))) / (2 (1 + α)),   ρ_r(r) = cos(2π f_M cos(π r / 2)),
// with α = 0.25 and f_M = 6, sampled on the paper's 41³ grid. Its fine rings sit near the sampling limit, so it shows
// how well the renderer reconstructs between samples; values already lie in [0, 1].
const MARSCHNER_LOBB_ALPHA = 0.25;
const MARSCHNER_LOBB_FREQUENCY = 6;
export const MARSCHNER_LOBB_SIZE = 41;

export function marschnerLobb(size: number): Volume {
    const data = new Float32Array(size * size * size);
    const coordinate = (index: number) => -1 + (2 * index) / (size - 1);
    for (let zIndex = 0; zIndex < size; zIndex++) {
        const z = coordinate(zIndex);
        for (let yIndex = 0; yIndex < size; yIndex++) {
            const y = coordinate(yIndex);
            for (let xIndex = 0; xIndex < size; xIndex++) {
                const x = coordinate(xIndex);
                const radial = Math.cos(2 * Math.PI * MARSCHNER_LOBB_FREQUENCY * Math.cos((Math.PI * Math.hypot(x, y)) / 2));
                data[xIndex + size * (yIndex + size * zIndex)] =
                    (1 - Math.sin((Math.PI * z) / 2) + MARSCHNER_LOBB_ALPHA * (1 + radial)) / (2 * (1 + MARSCHNER_LOBB_ALPHA));
            }
        }
    }
    return { data, dimensions: [size, size, size] };
}

export function histogram(values: Float32Array, binCount: number): Float64Array {
    const counts = new Float64Array(binCount);
    for (let index = 0; index < values.length; index++) {
        counts[Math.min(binCount - 1, Math.floor(values[index] * binCount))] += 1;
    }
    return counts;
}
