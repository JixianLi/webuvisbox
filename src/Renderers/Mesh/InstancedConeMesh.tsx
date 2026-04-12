import { Instance, Instances } from "@react-three/drei";
import type { InstanceTransform } from "@/Types/Geometry";

interface ConeMeshProps {
    instances: InstanceTransform[]; // Array of instances to be rendered
    keyPrefix?: string;                    // Prefix for React keys to ensure uniqueness
    radius?: number;                      // Radius of each cone instance
    lengthScale?: number;                 // Length scale of each cone instance
    radialSegments?: number;              // Number of radial segments for the cone geometry
    color?: string;                       // Base color of the cones
    opacity?: number;              // Transparency level (0-1)
    transparent?: boolean;         // Enable transparency rendering
    depthWrite?: boolean;          // Whether to write to depth buffer
    specular?: string;             // Specular highlight color for Phong material
    shininess?: number;            // Shininess factor for specular highlights
}
export const InstancedConeMesh = (props: ConeMeshProps) => {
    const {
        instances,
        keyPrefix = 'cone_mesh',            // Default prefix for React keys
        radius = 0.1,                      // Default cone radius
        lengthScale = 1,                   // Default cone length scale
        radialSegments = 3,                // Default number of radial segments
        color = "white",                   // Default white color
        opacity = 1,                       // Default fully opaque
        transparent = false,               // Default opaque rendering
        depthWrite = true,                 // Default depth buffer writing enabled
        specular = "black",                // Default black specular highlights
        shininess = 0                     // Default no shininess
    } = props;

    return (
        <Instances limit={instances.length} frustumCulled={false}>
            {/* Shared geometry - created once and reused for all instances */}
            <coneGeometry args={[radius, lengthScale, radialSegments]} />
            <meshPhongMaterial
                color={color}
                opacity={opacity}
                transparent={transparent}
                depthWrite={depthWrite}
                specular={specular}
                shininess={shininess}
            />
            {instances.map((instance, idx) => (
                <Instance
                    key={`${keyPrefix}_instance_${idx}`}
                    position={instance.position}
                    rotation={[instance.vRotation, instance.vRotation, instance.hRotation, 'ZYX']}
                    scale={[instance.scaleFactor, instance.scaleFactor, instance.scaleFactor]}
                    color={instance.color.toString()}
                />
            ))}
        </Instances>
    );
};

export default InstancedConeMesh;