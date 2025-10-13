import { Instances, Instance } from "@react-three/drei"
import * as THREE from 'three';
// @ts-ignore
import { useFrame } from '@react-three/fiber';

// Type definitions for point coordinates
type Point = [number, number, number] | THREE.Vector3;
type Points = Point[];

interface SphereMeshProps {
    points: Points;                // Array of 3D points where spheres will be positioned
    key_prefix?: string;           // Prefix for React keys to ensure uniqueness
    radius?: number;               // Radius of each sphere instance
    widthSegments?: number;        // Number of horizontal segments for sphere geometry
    heightSegments?: number;       // Number of vertical segments for sphere geometry
    color?: string;                // Base color of the spheres
    opacity?: number;              // Transparency level (0-1)
    transparent?: boolean;         // Enable transparency rendering
    depthWrite?: boolean;          // Whether to write to depth buffer
    specular?: string;             // Specular highlight color for Phong material
    shininess?: number;            // Shininess factor for specular highlights
}

/**
 * InstancedSphereMesh component renders multiple spheres efficiently using instancing.
 * This approach is much more performant than creating individual sphere meshes
 * when rendering many spheres with the same geometry and material.
 *
 * @remarks
 * Uses the `@react-three/drei` `Instances` and `Instance` components to render up to 10,000 spheres
 * with shared geometry and material, significantly improving performance for large point clouds or
 * molecular visualizations.
 *
 * @param props - Configuration object for the instanced sphere mesh.
 * @prop points - Array of 3D points (`[number, number, number]` or `THREE.Vector3`) specifying the positions of each sphere instance.
 * @prop key_prefix - Optional string prefix for React keys to ensure uniqueness among instances. Defaults to `'sphere_mesh'`.
 * @prop radius - Optional radius for each sphere instance. Defaults to `0.1`.
 * @prop widthSegments - Optional number of horizontal segments for the sphere geometry. Higher values increase detail. Defaults to `16`.
 * @prop heightSegments - Optional number of vertical segments for the sphere geometry. Higher values increase detail. Defaults to `16`.
 * @prop color - Optional base color for the spheres. Accepts any CSS color string. Defaults to `"#ffffff"`.
 * @prop opacity - Optional transparency level for the spheres, from `0` (fully transparent) to `1` (fully opaque). Defaults to `1`.
 * @prop transparent - Optional boolean to enable transparency rendering. Defaults to `false`.
 * @prop depthWrite - Optional boolean to control whether the material writes to the depth buffer. Defaults to `true`.
 * @prop specular - Optional color for specular highlights in the Phong material. Accepts any CSS color string. Defaults to `"#ffffffff"`.
 * @prop shininess - Optional shininess factor for specular highlights. Higher values create sharper highlights. Defaults to `30`.
 *
 * @returns JSX element containing instanced spheres at the specified positions.
 */
export function InstancedSphereMesh(props: SphereMeshProps) {
    const {
        points,
        key_prefix = 'sphere_mesh',          // Default prefix for React keys
        radius = 0.1,                        // Default small sphere radius
        widthSegments = 16,                  // Default geometry detail level
        heightSegments = 16,                 // Default geometry detail level
        color = "white",                   // Default white color
        opacity = 1,                         // Default fully opaque
        transparent = false,                 // Default opaque rendering
        depthWrite = true,                   // Default depth buffer writing enabled
        specular = "white",              // Default white specular highlights
        shininess = 30                       // Default moderate shininess
    } = props;

    return (
        <Instances limit={points.length} frustumCulled={false}>
            {/* Shared geometry - created once and reused for all instances */}
            <sphereGeometry args={[radius, widthSegments, heightSegments]} />
            
            {/* Shared material - applied to all sphere instances */}
            <meshPhongMaterial 
                color={color} 
                opacity={opacity} 
                transparent={transparent} 
                depthWrite={depthWrite} 
                specular={specular} 
                shininess={shininess} 
                side={THREE.DoubleSide}
            />
            
            {/* Generate individual sphere instances at each point */}
            {points.map((point, index) => {
                // Extract x, y, z coordinates from either array or Vector3 format
                const [x, y, z] = Array.isArray(point) ? point : [point.x, point.y, point.z];
                
                return (
                    <Instance 
                        key={`${key_prefix}_${index}`}  // Unique key for React reconciliation
                        position={[x, y, z]}            // Position this sphere instance
                    />
                );
            })}
        </Instances>
    );
}

export default InstancedSphereMesh;