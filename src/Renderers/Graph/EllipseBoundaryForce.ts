// ABOUTME: d3-force force that keeps node centers inside an ellipse at the origin, setting a layout's outline.
// ABOUTME: Used by WordCloudLayout to give a word cloud the aspect ratio of its panel.

// A d3-force force that keeps node centers inside an ellipse centered at the origin with radii radiusX, radiusY.
// A node outside, at normalized radius r = √((x/radiusX)² + (y/radiusY)²) > 1, is moved toward the center by
// strength · (1 − 1/r) of its position, i.e. part of the way back to the boundary. This sets the cloud's outline
// directly, where centering forces only set how hard everything is pulled in.

import type { Force, SimulationNodeDatum } from "d3-force";

export function forceEllipseBoundary<Node extends SimulationNodeDatum>(radiusX: number, radiusY: number, strength = 0.5): Force<Node, undefined> {
    let nodes: Node[] = [];
    const force = () => {
        for (const node of nodes) {
            const x = node.x ?? 0;
            const y = node.y ?? 0;
            const radius = Math.hypot(x / radiusX, y / radiusY);
            if (radius > 1) {
                const pull = strength * (1 - 1 / radius);
                node.x = x - x * pull;
                node.y = y - y * pull;
            }
        }
    };
    force.initialize = (initialNodes: Node[]) => {
        nodes = initialNodes;
    };
    return force;
}
