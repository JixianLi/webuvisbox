// ABOUTME: Many spheres of one size and material in one draw call (GPU instancing): seeds, samples, markers. Positions
// ABOUTME: go straight into the instance matrices, so thousands of points cost no React work per point.

import { useLayoutEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type Point = [number, number, number] | THREE.Vector3;

interface SphereMeshProps {
    points: Point[];
    radius?: number;
    widthSegments?: number;
    heightSegments?: number;
    color?: THREE.ColorRepresentation;
    opacity?: number;
    transparent?: boolean;
    depthWrite?: boolean;
    specular?: THREE.ColorRepresentation;
    shininess?: number;
}

const INITIAL_CAPACITY = 1000;

export function InstancedSphereMesh({ points, radius = 0.1, widthSegments = 16, heightSegments = 16, color = "white",
                                      opacity = 1, transparent = false, depthWrite = true, specular = "white",
                                      shininess = 30 }: SphereMeshProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const invalidate = useThree(state => state.invalidate);
    // The instance buffer only grows: a larger one is a new mesh (key={capacity}), so shrinking would rebuild it for
    // nothing; the drawn count follows the points.
    const [capacity, setCapacity] = useState(Math.max(points.length, INITIAL_CAPACITY));
    if (points.length > capacity) {
        setCapacity(points.length);
    }

    useLayoutEffect(() => {
        const mesh = meshRef.current;
        if (!mesh) return;
        const matrix = new THREE.Matrix4();
        points.forEach((point, index) => {
            const [x, y, z] = Array.isArray(point) ? point : [point.x, point.y, point.z];
            mesh.setMatrixAt(index, matrix.makeTranslation(x, y, z));
        });
        mesh.count = points.length;
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        invalidate();
    }, [points, capacity, invalidate]);

    return (
        <instancedMesh key={capacity} ref={meshRef} args={[undefined, undefined, capacity]} frustumCulled={false}>
            <sphereGeometry args={[radius, widthSegments, heightSegments]} />
            <meshPhongMaterial color={color} opacity={opacity} transparent={transparent} depthWrite={depthWrite}
                               specular={specular} shininess={shininess} />
        </instancedMesh>
    );
}

export default InstancedSphereMesh;
