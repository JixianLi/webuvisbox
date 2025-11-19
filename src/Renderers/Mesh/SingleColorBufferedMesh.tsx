import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

interface SingleColorBufferedGeometryProps {
    vertices: Float32Array;        // Vertex positions [x,y,z,x,y,z,...]
    indices: Uint32Array;          // Triangle indices referencing vertices
    normals?: Float32Array;        // Optional normals [nx,ny,nz,nx,ny,nz,...]
}

export const SingleColorBufferedGeometry = (props: SingleColorBufferedGeometryProps) => {
    const {
        vertices,
        indices,
        normals,
    } = props;

    // Create geometry with memoization for performance
    const geometry = new THREE.BufferGeometry();

    // Set vertex positions (required)
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Set indices for triangle faces
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // Set normals or compute them automatically
    if (normals && normals.length === vertices.length) {
        // Use provided normals
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    } else {
        // Compute normals automatically for proper lighting
        geometry.computeVertexNormals();
    }

    // Compute bounding sphere for frustum culling
    geometry.computeBoundingSphere();
    return geometry;
}

export interface SingleColorBufferedMeshProps {
    vertices: Float32Array;        // Vertex positions [x,y,z,x,y,z,...]
    indices: Uint32Array;          // Triangle indices referencing vertices
    normals?: Float32Array;        // Optional normals [nx,ny,nz,nx,ny,nz,...]
    color: string;                 // Base material color
    specular?: string;             // Specular highlight color
    shininess?: number;            // Material shininess factor
    opacity?: number;              // Material opacity (0-1)
    transparent?: boolean;         // Enable transparency
    depthTest?: boolean;           // Enable depth testing
    depthWrite?: boolean;          // Enable depth writing
    side?: THREE.Side;             // Which sides to render
}

/**
 * TexturedBufferedMesh renders a custom geometry with texture mapping using buffer attributes.
 * Automatically computes normals if not provided for proper lighting calculations.
 */
export function SingleColorBufferedMesh(props: SingleColorBufferedMeshProps) {
    const {
        vertices,
        indices,
        normals,
        color = '#ffffff',
        specular = '#ffffff',
        shininess = 30,
        opacity = 1,
        transparent = false,
        depthTest = true,
        depthWrite = true,
        side = THREE.DoubleSide
    } = props;

    const meshRef = useRef<THREE.Mesh>(null);

    // Create geometry with memoization for performance
    const geometry = useMemo(() => {
        return SingleColorBufferedGeometry({ vertices, indices, normals });
    }, [vertices, indices, normals]);

    // Clean up geometry on unmount
    useEffect(() => {
        return () => {
            geometry?.dispose();
        };
    }, [geometry]);

    return (
        <mesh ref={meshRef} geometry={geometry}>
            <meshPhongMaterial
                color={color}
                specular={specular}
                shininess={shininess}
                opacity={opacity}
                transparent={transparent}
                depthTest={depthTest}
                depthWrite={depthWrite}
                side={side}
            />
        </mesh>
    );
}

export default SingleColorBufferedMesh;