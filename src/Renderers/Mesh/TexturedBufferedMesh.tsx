import { useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { onTextureUpdate } from '../Colormaps/TextureUpdates';

interface TexturedBufferedGeometryProps {
    vertices: Float32Array;        // Vertex positions [x,y,z,x,y,z,...]
    indices: Uint32Array;          // Triangle indices referencing vertices
    uv: Float32Array;              // UV coordinates [u,v,u,v,...]
    normals?: Float32Array;        // Optional normals [nx,ny,nz,nx,ny,nz,...]
}

export const TexturedBufferedGeometry = (props: TexturedBufferedGeometryProps) => {
    const {
        vertices,
        indices,
        uv,
        normals,
    } = props;

    // Create geometry with memoization for performance
    const geometry = new THREE.BufferGeometry();

    // Set vertex positions (required)
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Set UV coordinates (required for texturing)
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

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

export interface TexturedBufferedMeshProps {
    vertices: Float32Array;        // Vertex positions [x,y,z,x,y,z,...]
    indices: Uint32Array;          // Triangle indices referencing vertices
    uv: Float32Array;              // UV coordinates [u,v,u,v,...]
    normals?: Float32Array;        // Optional normals [nx,ny,nz,nx,ny,nz,...]
    colormap: THREE.Texture;       // Texture to apply to the mesh
    color?: string;                // Base material color
    specular?: string;             // Specular highlight color
    shininess?: number;            // Material shininess factor
    opacity?: number;              // Material opacity (0-1)
    transparent?: boolean;         // Enable transparency
    depthTest?: boolean;           // Enable depth testing
    depthWrite?: boolean;          // Enable depth writing
    side?: THREE.Side;             // Which sides to render
    // Draws only the first this-many indices (a prefix of the triangles), e.g. a tube up to the current time, without
    // rebuilding the geometry. Default: all.
    visibleIndexCount?: number;
}

/**
 * TexturedBufferedMesh renders a custom geometry with texture mapping using buffer attributes.
 * Automatically computes normals if not provided for proper lighting calculations.
 */
export function TexturedBufferedMesh(props: TexturedBufferedMeshProps) {
    const {
        vertices,
        indices,
        uv,
        normals,
        colormap,
        color = '#ffffff',
        specular = '#ffffff',
        shininess = 30,
        opacity = 1,
        transparent = false,
        depthTest = true,
        depthWrite = true,
        side = THREE.DoubleSide,
        visibleIndexCount,
    } = props;

    const meshRef = useRef<THREE.Mesh>(null);

    // Create geometry with memoization for performance
    const geometry = useMemo(() => {
        return TexturedBufferedGeometry({ vertices, indices, uv, normals });
    }, [vertices, indices, uv, normals]);

    // Clean up geometry on unmount
    useEffect(() => {
        return () => {
            geometry?.dispose();
        };
    }, [geometry]);

    const invalidate = useThree(state => state.invalidate);
    useLayoutEffect(() => {
        geometry.setDrawRange(0, visibleIndexCount ?? Infinity);
        invalidate();
    }, [geometry, visibleIndexCount, invalidate]);
    // A colormap edited in TextureManager is rewritten in place; redraw a canvas that draws on demand.
    useEffect(() => onTextureUpdate(colormap, invalidate), [colormap, invalidate]);

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
                map={colormap}
            />
        </mesh>
    );
}

export default TexturedBufferedMesh;