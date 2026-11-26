// ABOUTME: Shared geometry type definitions for 3D rendering.
// ABOUTME: Defines instanced transform data used by glyph renderers.

import type * as d3 from "d3";

// One glyph of InstancedConeMesh; see there for how hRotation and vRotation orient it.
export interface InstanceTransform {
    position: [number, number, number];
    hRotation: number;
    vRotation: number;
    scaleFactor: number;
    color: d3.RGBColor;
}
