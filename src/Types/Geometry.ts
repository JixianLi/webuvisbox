import * as THREE from "three";

export type Point3D = [number, number, number] | THREE.Vector3;

export type Bounds = [number, number, number, number, number, number]; // xmin, xmax, ymin, ymax, zmin, zmax

export type Trajectory = Point3D[];

export type Trajectories = Trajectory[];

export interface UncertaintyTubes {
    loaded: boolean;
    vertices: Float32Array | number[] | null;
    faces: Uint32Array | number[] | null;
    uv: Float32Array | number[] | null;
}

export interface TransformationInstance {
    position: [number, number, number];
    h_rotation: number;
    v_rotation: number;
    scale_factor: number;
    color: d3.RGBColor;
}