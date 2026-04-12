// ABOUTME: Shared geometry type definitions for 3D rendering.
// ABOUTME: Defines instanced transform data used by glyph renderers.

export interface InstanceTransform {
    position: [number, number, number];
    h_rotation: number;
    v_rotation: number;
    scale_factor: number;
    color: d3.RGBColor;
}
