// ABOUTME: d3-force force that pushes overlapping axis-aligned rectangles (word boxes) apart, plus a final
// ABOUTME: overlap-removal pass. Used by WordCloudLayout; usable in any d3-force simulation of rectangles.

// A d3-force force that pushes overlapping axis-aligned rectangles apart. d3's forceCollide treats nodes as circles,
// which leaves large gaps around long words; words are wide, short boxes.
//
// For each overlapping pair, the overlap is resolved along one axis, half by each node, scaled by strength. The axis
// is the one with the smaller overlap relative to the pair's combined extent, with x overlaps weighted by
// HORIZONTAL_BIAS. Raw overlaps would almost always pick the vertical axis for wide, short words (a tall column);
// unweighted relative overlaps (bias 1) pick the horizontal axis too often (a 15:1 band). Measured on this corpus:
// bias 1.43 gives about 2.2:1, 1.71 about 1.2:1; 1.55 gives 1.4–2.6:1 across scopes and 60–300 terms. The result
// is sensitive to the bias and barely responds to the centering forces, so this is not real shape control
// (Phase 3: a boundary force).
// All pairs are tested (O(n²)): fine for the few hundred words of a cloud.

import type { Force, SimulationNodeDatum } from "d3-force";

export interface RectangleNode extends SimulationNodeDatum {
    width: number;
    height: number;
}

const HORIZONTAL_BIAS = 1.55;

export function forceRectangleCollision<Node extends RectangleNode>(padding = 2, strength = 0.7): Force<Node, undefined> {
    let nodes: Node[] = [];

    const force = () => {
        for (let indexFirst = 0; indexFirst < nodes.length; indexFirst++) {
            const first = nodes[indexFirst];
            for (let indexSecond = indexFirst + 1; indexSecond < nodes.length; indexSecond++) {
                const second = nodes[indexSecond];
                const dx = (second.x ?? 0) - (first.x ?? 0);
                const dy = (second.y ?? 0) - (first.y ?? 0);
                const overlapX = (first.width + second.width) / 2 + padding - Math.abs(dx);
                const overlapY = (first.height + second.height) / 2 + padding - Math.abs(dy);
                if (overlapX <= 0 || overlapY <= 0) {
                    continue;
                }
                if ((overlapX / (first.width + second.width)) * HORIZONTAL_BIAS < overlapY / (first.height + second.height)) {
                    const shift = (overlapX / 2) * strength * (dx < 0 ? -1 : 1);
                    first.x = (first.x ?? 0) - shift;
                    second.x = (second.x ?? 0) + shift;
                } else {
                    const shift = (overlapY / 2) * strength * (dy < 0 ? -1 : 1);
                    first.y = (first.y ?? 0) - shift;
                    second.y = (second.y ?? 0) + shift;
                }
            }
        }
    };
    force.initialize = (initialNodes: Node[]) => {
        nodes = initialNodes;
    };
    return force;
}

// Final pass after the simulation: repeat the pairwise separation at full strength until nothing overlaps (or
// maxIterations), so the forces' last near-misses do not leave words on top of each other.
export function removeOverlaps<Node extends RectangleNode>(nodes: Node[], padding = 2, maxIterations = 200): void {
    const separate = forceRectangleCollision<Node>(padding, 1);
    separate.initialize?.(nodes, Math.random);
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        if (!anyOverlap(nodes, padding)) {
            return;
        }
        separate(1);
    }
}

function anyOverlap(nodes: RectangleNode[], padding: number): boolean {
    for (let indexFirst = 0; indexFirst < nodes.length; indexFirst++) {
        const first = nodes[indexFirst];
        for (let indexSecond = indexFirst + 1; indexSecond < nodes.length; indexSecond++) {
            const second = nodes[indexSecond];
            const overlapX = (first.width + second.width) / 2 + padding - Math.abs((second.x ?? 0) - (first.x ?? 0));
            const overlapY = (first.height + second.height) / 2 + padding - Math.abs((second.y ?? 0) - (first.y ?? 0));
            if (overlapX > 0.01 && overlapY > 0.01) {
                return true;
            }
        }
    }
    return false;
}
