// ABOUTME: The Uncertain terrain example's surface: the grid lifted to the ensemble-mean heights, shared by the terrain
// ABOUTME: and depth views.

import * as THREE from "three";
import { GRID_SIZE, gridPosition } from "../TerrainEnsemble";

export function surfaceGeometry(mean: Float32Array, heightScale: number): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(2, 2, GRID_SIZE - 1, GRID_SIZE - 1);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index++) {
        const { x, z } = gridPosition(index);
        positions.setXYZ(index, x, mean[index] * heightScale, z);
    }
    geometry.computeVertexNormals();
    return geometry;
}
