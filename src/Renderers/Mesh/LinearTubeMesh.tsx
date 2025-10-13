import { useRef, useMemo, useEffect } from 'react';
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
    tubularSegments: number = 1
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

        // Generate indices connecting the rings (unchanged)
        const pathVertexStart = vertexOffset - (segments + 1) * radialSegments;
        for (let segIdx = 0; segIdx < segments; segIdx++) {
            for (let i = 0; i < radialSegments; i++) {
                const next = (i + 1) % radialSegments;

                const ringStart = pathVertexStart + segIdx * radialSegments;
                const nextRingStart = pathVertexStart + (segIdx + 1) * radialSegments;

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
        }
    }

    // Create geometry with pre-allocated buffers
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    geometry.computeBoundingSphere();
    return geometry;
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
        shininess = 30
    } = props;

    const meshRef = useRef<THREE.Mesh>(null);

    const pathsKey = useMemo(() =>
        paths.map(p => p.length).join(','), [paths]
    );

    const geometry = useMemo(() => {
        return createLinearTubeGeometry(paths, radius, radialSegments, tubularSegments);
    }, [pathsKey, radius, radialSegments, tubularSegments]);

    useEffect(() => {
        return () => geometry?.dispose();
    }, [geometry]);

    return (
        <mesh ref={meshRef} geometry={geometry}>
            <meshPhongMaterial
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