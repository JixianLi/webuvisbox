import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

export interface BoxOutlineMeshProps {
    boundingBox: [number, number, number, number, number, number]; // [x_min, x_max, y_min, y_max, z_min, z_max]
    color: string;                 // Line color (required)
    opacity?: number;              // Line opacity (0-1)
    transparent?: boolean;         // Enable transparency
    linewidth?: number;            // Line thickness (works on all platforms with tube mesh)
    radialSegments?: number;       // Number of segments around tube circumference
    shininess?: number;            // Material shininess factor
}

/**
 * BoxOutlineMesh renders a wireframe box outline using tube geometry.
 * This approach works on all platforms including Mac where linewidth is not supported.
 * 
 * @param props.boundingBox - Array defining box bounds [x_min, x_max, y_min, y_max, z_min, z_max]
 * @param props.color - Line color (required)
 * @param props.opacity - Line opacity, defaults to 1
 * @param props.transparent - Enable transparency, defaults to false
 * @param props.linewidth - Line thickness, defaults to 1
 * @param props.radialSegments - Tube detail level, defaults to 8
 * @param props.shininess - Material shininess factor, defaults to 0
 * 
 * @returns JSX element rendering the box outline
 */
export function BoxOutlineMesh(props: BoxOutlineMeshProps) {
    const {
        boundingBox,
        color,
        opacity = 1,
        transparent = false,
        linewidth = 1,
        radialSegments = 8,
        shininess = 0
    } = props;

    const meshRef = useRef<THREE.Group>(null);

    // Create tube-based box outline geometry
    const geometry = useMemo(() => {
        const [xMin, xMax, yMin, yMax, zMin, zMax] = boundingBox;

        // Define the 12 edges as line segments
        const edges = [
            // Bottom face edges (y = yMin)
            [[xMin, yMin, zMin], [xMax, yMin, zMin]], // front edge
            [[xMax, yMin, zMin], [xMax, yMin, zMax]], // right edge
            [[xMax, yMin, zMax], [xMin, yMin, zMax]], // back edge
            [[xMin, yMin, zMax], [xMin, yMin, zMin]], // left edge

            // Top face edges (y = yMax)
            [[xMin, yMax, zMin], [xMax, yMax, zMin]], // front edge
            [[xMax, yMax, zMin], [xMax, yMax, zMax]], // right edge
            [[xMax, yMax, zMax], [xMin, yMax, zMax]], // back edge
            [[xMin, yMax, zMax], [xMin, yMax, zMin]], // left edge

            // Vertical edges
            [[xMin, yMin, zMin], [xMin, yMax, zMin]], // front-left vertical
            [[xMax, yMin, zMin], [xMax, yMax, zMin]], // front-right vertical
            [[xMax, yMin, zMax], [xMax, yMax, zMax]], // back-right vertical
            [[xMin, yMin, zMax], [xMin, yMax, zMax]]  // back-left vertical
        ];

        // Create merged geometry for all tube segments
        const mergedGeometry = new THREE.BufferGeometry();
        const positions: number[] = [];
        const normals: number[] = [];
        const indices: number[] = [];
        let vertexOffset = 0;

        // Generate tube geometry for each edge
        edges.forEach(([start, end]) => {
            const startVec = new THREE.Vector3(start[0], start[1], start[2]);
            const endVec = new THREE.Vector3(end[0], end[1], end[2]);
            
            // Create curve for this edge
            const curve = new THREE.LineCurve3(startVec, endVec);
            
            // Create tube geometry for this edge
            const tubeGeometry = new THREE.TubeGeometry(
                curve,
                1,              // tubularSegments (1 for straight lines)
                linewidth,      // radius
                radialSegments, // radialSegments
                false          // closed
            );

            // Extract attributes
            const positionAttr = tubeGeometry.getAttribute('position');
            const normalAttr = tubeGeometry.getAttribute('normal');
            const indexAttr = tubeGeometry.getIndex();

            if (positionAttr && normalAttr && indexAttr) {
                // Add positions
                for (let i = 0; i < positionAttr.count; i++) {
                    positions.push(
                        positionAttr.getX(i),
                        positionAttr.getY(i),
                        positionAttr.getZ(i)
                    );
                }

                // Add normals
                for (let i = 0; i < normalAttr.count; i++) {
                    normals.push(
                        normalAttr.getX(i),
                        normalAttr.getY(i),
                        normalAttr.getZ(i)
                    );
                }

                // Add indices with vertex offset
                for (let i = 0; i < indexAttr.count; i++) {
                    indices.push(indexAttr.getX(i) + vertexOffset);
                }

                vertexOffset += positionAttr.count;
            }

            // Clean up temporary geometry
            tubeGeometry.dispose();
        });

        // Set merged attributes
        mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        mergedGeometry.setIndex(indices);
        mergedGeometry.computeBoundingSphere();

        return mergedGeometry;
    }, [boundingBox, linewidth, radialSegments]);

    // Clean up geometry on unmount or when geometry changes
    useEffect(() => {
        return () => {
            geometry?.dispose();
        };
    }, [geometry]);

    return (
        <mesh ref={meshRef} geometry={geometry}>
            <meshPhongMaterial 
                color={color}
                opacity={opacity}
                transparent={transparent}
                shininess={shininess}
                specular="white"
            />
        </mesh>
    );
}

export default BoxOutlineMesh;