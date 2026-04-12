// ABOUTME: Shared geometry type definitions for 3D rendering.
// ABOUTME: Defines instanced transform data used by glyph renderers.

export interface InstanceTransform {
    position: [number, number, number];
    hRotation: number;
    vRotation: number;
    scaleFactor: number;
    color: d3.RGBColor;
}
