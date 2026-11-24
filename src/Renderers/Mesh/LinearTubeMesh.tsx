import { useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface LinearTubeMeshProps {
    paths: Float32Array[];
    radius: number;
    radialSegments?: number;
    tubularSegments?: number;
    color?: string;
    opacity?: number;
    transparent?: boolean;
    depthWrite?: boolean;
    specular?: string;
    shininess?: number;
    // Per-point colors, one array per path: 3 floats (linear RGB) per point. The material color multiplies them,
    // so leave `color` white to show them as given.
    colors?: Float32Array[];
    // Draw each path only up to this point (its first visiblePointCount points); all points when omitted. Passing it
    // orders the index buffer for growth, which renders somewhat slower than the default order: omit it if unused.
    visiblePointCount?: number;
}

function calculateGeometrySize(paths: Float32Array[], radialSegments: number, tubularSegments: number) {
    let totalVertices = 0;
    let totalIndices = 0;

    for (const pathData of paths) {
        if (pathData.length < 6) continue;

        const pointCount = pathData.length / 3;
        if (pointCount < 2) continue;

        const segments = Math.max(1, (pointCount - 1) * tubularSegments);
        // Fixed: vertices = (segments + 1) rings, each with radialSegments vertices
        const verticesPerPath = (segments + 1) * radialSegments;
        const indicesPerPath = segments * radialSegments * 6;

        totalVertices += verticesPerPath;
        totalIndices += indicesPerPath;
    }

    return { totalVertices, totalIndices };
}

function createLinearTubeGeometry(
    paths: Float32Array[],
    radius: number,
    radialSegments: number = 8,
    tubularSegments: number = 1,
    growable: boolean = false
) {
    const { totalVertices, totalIndices } = calculateGeometrySize(paths, radialSegments, tubularSegments);

    if (totalVertices === 0) {
        return new THREE.BufferGeometry();
    }

    // Pre-allocate typed arrays
    const positions = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    const indices = new Uint32Array(totalIndices);

    let vertexOffset = 0;
    let indexOffset = 0;
    const pathVertexStarts: number[] = [];
    const pathSegmentCounts: number[] = [];
    let maxSegments = 0;
    let growthRanges: Uint32Array | undefined;

    // Process each path
    for (const pathData of paths) {
        if (pathData.length < 6) continue;

        const pointCount = pathData.length / 3;
        if (pointCount < 2) continue;

        const segments = Math.max(1, (pointCount - 1) * tubularSegments);

        // ✅ Pre-calculate consistent frame for entire path
        const frames = calculateConsistentFrames(pathData, pointCount, segments);

        // Generate vertices for each ring along the path
        for (let segIdx = 0; segIdx <= segments; segIdx++) {
            // Interpolate position along the path
            const t = segIdx / segments;
            const pathIndex = Math.min(Math.floor(t * (pointCount - 1)), pointCount - 2);
            const localT = (t * (pointCount - 1)) - pathIndex;

            // Get current and next points
            const p1X = pathData[pathIndex * 3];
            const p1Y = pathData[pathIndex * 3 + 1];
            const p1Z = pathData[pathIndex * 3 + 2];

            const p2X = pathData[(pathIndex + 1) * 3];
            const p2Y = pathData[(pathIndex + 1) * 3 + 1];
            const p2Z = pathData[(pathIndex + 1) * 3 + 2];

            // Interpolate position
            const centerX = p1X + (p2X - p1X) * localT;
            const centerY = p1Y + (p2Y - p1Y) * localT;
            const centerZ = p1Z + (p2Z - p1Z) * localT;

            // ✅ Use pre-calculated consistent frame
            const frame = frames[segIdx];
            const { ux, uy, uz, vx, vy, vz } = frame;

            // Generate ring vertices
            for (let i = 0; i < radialSegments; i++) {
                const angle = (i / radialSegments) * Math.PI * 2;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                // Position
                const x = centerX + radius * (cos * ux + sin * vx);
                const y = centerY + radius * (cos * uy + sin * vy);
                const z = centerZ + radius * (cos * uz + sin * vz);

                const posIdx = vertexOffset * 3;
                positions[posIdx] = x;
                positions[posIdx + 1] = y;
                positions[posIdx + 2] = z;

                // Normal (pointing outward from tube center)
                const normalX = cos * ux + sin * vx;
                const normalY = cos * uy + sin * vy;
                const normalZ = cos * uz + sin * vz;

                normals[posIdx] = normalX;
                normals[posIdx + 1] = normalY;
                normals[posIdx + 2] = normalZ;

                vertexOffset++;
            }
        }

        pathVertexStarts.push(vertexOffset - (segments + 1) * radialSegments);
        pathSegmentCounts.push(segments);
        maxSegments = Math.max(maxSegments, segments);
    }

    const emitSegment = (ringStart: number) => {
        const nextRingStart = ringStart + radialSegments;
        for (let i = 0; i < radialSegments; i++) {
            const next = (i + 1) % radialSegments;

            const a = ringStart + i;
            const b = ringStart + next;
            const c = nextRingStart + i;
            const d = nextRingStart + next;

            // Two triangles per quad
            indices[indexOffset++] = a;
            indices[indexOffset++] = b;
            indices[indexOffset++] = c;

            indices[indexOffset++] = b;
            indices[indexOffset++] = d;
            indices[indexOffset++] = c;
        }
    };

    if (!growable) {
        // Path-major: consecutive segments share a ring, so the GPU's vertex cache reuses it (measured ~20% faster at
        // 51k tubes than segment-major).
        for (let pathIdx = 0; pathIdx < pathVertexStarts.length; pathIdx++) {
            for (let segIdx = 0; segIdx < pathSegmentCounts[pathIdx]; segIdx++) {
                emitSegment(pathVertexStarts[pathIdx] + segIdx * radialSegments);
            }
        }
    } else {
        // Segment-major (segment 0 of every path, then segment 1, ...), so drawing a prefix of the index buffer
        // (setDrawRange) shows every path grown to the same length without rebuilding anything.
        // indexCountBeforeSegment[s] = number of indices of all segments < s.
        const indexCountBeforeSegment = new Uint32Array(maxSegments + 1);
        for (let segIdx = 0; segIdx < maxSegments; segIdx++) {
            indexCountBeforeSegment[segIdx] = indexOffset;
            for (let pathIdx = 0; pathIdx < pathVertexStarts.length; pathIdx++) {
                if (segIdx < pathSegmentCounts[pathIdx]) emitSegment(pathVertexStarts[pathIdx] + segIdx * radialSegments);
            }
        }
        indexCountBeforeSegment[maxSegments] = indexOffset;
        growthRanges = indexCountBeforeSegment;
    }

    // Create geometry with pre-allocated buffers
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    geometry.userData.indexCountBeforeSegment = growthRanges;

    geometry.computeBoundingSphere();
    return geometry;
}

// Per-vertex colors in the geometry's vertex order: each ring takes its path's per-point color, interpolated like the
// ring's position. pathColors[p] holds 3 floats (linear RGB) per point of paths[p]; paths without colors stay white.
function createRingColors(
    paths: Float32Array[],
    pathColors: Float32Array[],
    totalVertices: number,
    radialSegments: number,
    tubularSegments: number
) {
    const colors = new Float32Array(totalVertices * 3).fill(1);
    let vertexOffset = 0;
    paths.forEach((pathData, pathIdx) => {
        if (pathData.length < 6) return;
        const pointCount = pathData.length / 3;
        const segments = Math.max(1, (pointCount - 1) * tubularSegments);
        const colorData = pathColors[pathIdx];
        if (!colorData || colorData.length < pointCount * 3) {
            vertexOffset += (segments + 1) * radialSegments;
            return;
        }
        for (let segIdx = 0; segIdx <= segments; segIdx++) {
            const t = segIdx / segments;
            const pathIndex = Math.min(Math.floor(t * (pointCount - 1)), pointCount - 2);
            const localT = (t * (pointCount - 1)) - pathIndex;
            const red = colorData[pathIndex * 3] + (colorData[pathIndex * 3 + 3] - colorData[pathIndex * 3]) * localT;
            const green = colorData[pathIndex * 3 + 1] + (colorData[pathIndex * 3 + 4] - colorData[pathIndex * 3 + 1]) * localT;
            const blue = colorData[pathIndex * 3 + 2] + (colorData[pathIndex * 3 + 5] - colorData[pathIndex * 3 + 2]) * localT;
            for (let i = 0; i < radialSegments; i++) {
                const colorIdx = vertexOffset * 3;
                colors[colorIdx] = red;
                colors[colorIdx + 1] = green;
                colors[colorIdx + 2] = blue;
                vertexOffset++;
            }
        }
    });
    return colors;
}

// A key that changes exactly when some element array is a different object: a caller that rebuilds the outer array on
// each render (e.g. [contours[i]], or a filter) doesn't trigger a geometry rebuild, while any new path data always does.
const arrayIds = new WeakMap<Float32Array, number>();
let nextArrayId = 0;

function identityKey(arrays: Float32Array[] | undefined): string {
    if (!arrays) return "";
    return arrays.map(array => {
        if (!arrayIds.has(array)) arrayIds.set(array, nextArrayId++);
        return arrayIds.get(array);
    }).join(",");
}

function calculateConsistentFrames(pathData: Float32Array, pointCount: number, segments: number) {
    const frames = [];

    // Calculate initial frame for first segment
    let prevUx = 0, prevUy = 1, prevUz = 0; // Initial up vector
    let prevVx = 0, prevVy = 0, prevVz = 1; // Initial side vector

    for (let segIdx = 0; segIdx <= segments; segIdx++) {
        const t = segIdx / segments;
        const pathIndex = Math.min(Math.floor(t * (pointCount - 1)), pointCount - 2);
        // const localT = (t * (pointCount - 1)) - pathIndex;

        // Get current and next points
        const p1X = pathData[pathIndex * 3];
        const p1Y = pathData[pathIndex * 3 + 1];
        const p1Z = pathData[pathIndex * 3 + 2];

        const p2X = pathData[(pathIndex + 1) * 3];
        const p2Y = pathData[(pathIndex + 1) * 3 + 1];
        const p2Z = pathData[(pathIndex + 1) * 3 + 2];

        // Calculate direction vector (tangent)
        const dirX = p2X - p1X;
        const dirY = p2Y - p1Y;
        const dirZ = p2Z - p1Z;
        const dirLength = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

        if (dirLength === 0) {
            // Use previous frame if direction is zero
            frames.push({
                ux: prevUx, uy: prevUy, uz: prevUz,
                vx: prevVx, vy: prevVy, vz: prevVz
            });
            continue;
        }

        const tangentX = dirX / dirLength;
        const tangentY = dirY / dirLength;
        const tangentZ = dirZ / dirLength;

        let ux, uy, uz, vx, vy, vz;

        if (segIdx === 0) {
            // For first segment, calculate initial frame
            let perpX, perpY, perpZ;
            if (Math.abs(tangentY) < 0.9) {
                perpX = 0; perpY = 1; perpZ = 0;
            } else {
                perpX = 1; perpY = 0; perpZ = 0;
            }

            // Cross product to get first perpendicular
            const u1X = perpY * tangentZ - perpZ * tangentY;
            const u1Y = perpZ * tangentX - perpX * tangentZ;
            const u1Z = perpX * tangentY - perpY * tangentX;

            // Normalize
            const u1Length = Math.sqrt(u1X * u1X + u1Y * u1Y + u1Z * u1Z);
            ux = u1X / u1Length;
            uy = u1Y / u1Length;
            uz = u1Z / u1Length;

            // Second perpendicular
            vx = tangentY * uz - tangentZ * uy;
            vy = tangentZ * ux - tangentX * uz;
            vz = tangentX * uy - tangentY * ux;
        } else {
            // ✅ For subsequent segments, maintain continuity using parallel transport
            // Project previous frame vectors onto plane perpendicular to current tangent
            
            // Remove component parallel to tangent from previous U vector
            const uDotT = prevUx * tangentX + prevUy * tangentY + prevUz * tangentZ;
            const projUx = prevUx - uDotT * tangentX;
            const projUy = prevUy - uDotT * tangentY;
            const projUz = prevUz - uDotT * tangentZ;
            
            // Normalize projected U
            const projULength = Math.sqrt(projUx * projUx + projUy * projUy + projUz * projUz);
            if (projULength > 0.001) {
                ux = projUx / projULength;
                uy = projUy / projULength;
                uz = projUz / projULength;
            } else {
                // Fallback if U becomes parallel to tangent
                ux = prevUx;
                uy = prevUy;
                uz = prevUz;
            }

            // Calculate V as cross product of tangent and U
            vx = tangentY * uz - tangentZ * uy;
            vy = tangentZ * ux - tangentX * uz;
            vz = tangentX * uy - tangentY * ux;
            
            // Normalize V
            const vLength = Math.sqrt(vx * vx + vy * vy + vz * vz);
            if (vLength > 0.001) {
                vx /= vLength;
                vy /= vLength;
                vz /= vLength;
            }

            // Recalculate U to ensure orthogonality
            ux = vy * tangentZ - vz * tangentY;
            uy = vz * tangentX - vx * tangentZ;
            uz = vx * tangentY - vy * tangentX;
        }

        frames.push({ ux, uy, uz, vx, vy, vz });

        // Store for next iteration
        prevUx = ux; prevUy = uy; prevUz = uz;
        prevVx = vx; prevVy = vy; prevVz = vz;
    }

    return frames;
}

export function LinearTubeMesh(props: LinearTubeMeshProps) {
    const {
        paths,
        radius,
        radialSegments: radialSegments = 8,
        tubularSegments: tubularSegments = 1,
        color = 'white',
        opacity = 1,
        transparent = false,
        depthWrite = true,
        specular = 'white',
        shininess = 30,
        colors,
        visiblePointCount
    } = props;

    const meshRef = useRef<THREE.Mesh>(null);
    const invalidate = useThree(state => state.invalidate);

    const pathsKey = identityKey(paths);
    const growable = visiblePointCount !== undefined;
    const colorsKey = identityKey(colors);

    const geometry = useMemo(() => {
        return createLinearTubeGeometry(paths, radius, radialSegments, tubularSegments, growable);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- pathsKey stands for paths (see identityKey)
    }, [pathsKey, radius, radialSegments, tubularSegments, growable]);

    useEffect(() => {
        return () => geometry?.dispose();
    }, [geometry]);

    const hasColors = !!colors && colors.length > 0;
    useLayoutEffect(() => {
        const position = geometry.getAttribute('position');
        if (!hasColors || !position) {
            geometry.deleteAttribute('color');
        } else {
            geometry.setAttribute('color', new THREE.BufferAttribute(
                createRingColors(paths, colors, position.count, radialSegments, tubularSegments), 3));
        }
        invalidate();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the keys stand for paths and colors (see identityKey)
    }, [geometry, colorsKey, hasColors, invalidate]);

    useLayoutEffect(() => {
        const indexCountBeforeSegment: Uint32Array | undefined = geometry.userData.indexCountBeforeSegment;
        if (!indexCountBeforeSegment) {
            geometry.setDrawRange(0, Infinity);
            return;
        }
        const segmentCount = Math.max(0, Math.min((visiblePointCount! - 1) * tubularSegments,
            indexCountBeforeSegment.length - 1));
        geometry.setDrawRange(0, indexCountBeforeSegment[segmentCount]);
        invalidate();
    }, [geometry, visiblePointCount, tubularSegments, invalidate]);

    return (
        <mesh ref={meshRef} geometry={geometry}>
            {/* Keyed so toggling vertex colors builds a fresh material: the flag picks the shader program. */}
            <meshPhongMaterial
                key={hasColors ? 'vertex-colors' : 'uniform-color'}
                vertexColors={hasColors}
                color={color}
                opacity={opacity}
                transparent={transparent}
                depthWrite={depthWrite}
                specular={specular}
                shininess={shininess}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

export default LinearTubeMesh;