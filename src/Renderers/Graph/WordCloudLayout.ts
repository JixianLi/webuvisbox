// ABOUTME: Word-cloud layout: font sizes and boxes from weights, then a two-phase force simulation that pulls
// ABOUTME: linked (similar) words together and packs the boxes without overlap into an ellipse of a given aspect.

// Force-directed placement of words as rectangles, with similarity links pulling related words together.
//
// Two steps, so the expensive one can run in a Web Worker:
//   measureWords   (main thread: needs the page's fonts) word -> font size and box
//   simulateLayout (pure; WordCloudLayoutWorker runs it) boxes + links -> positions
//
// Font size encodes score by area: a word's ink area grows with fontSize², so fontSize ∝ √score keeps area ∝ score.
// Sizes below minFontSize are clamped up, which overstates the smallest words; that is the price of legibility.
//
// Two phases, as in force-directed semantic word clouds (Barth, Kobourov & Pupyrev 2014: lay out the similarity
// graph, then remove overlaps):
//   1. structure (UNTANGLE_TICKS): words as points. Links pull related words together (strength = similarity ·
//      linkStrength); many-body repulsion spreads everything else; weak centering. Collision would freeze words
//      wherever they first touch, so it is off.
//   2. packing: rectangle collision (RectangleCollisionForce) and an ellipse boundary of the panel's aspect ratio
//      (area = words' box area / TARGET_FILL) switch on and squeeze the layout into a cloud; links stay on with
//      short rest lengths so neighbors stay adjacent; then a final overlap-removal pass.

import { forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationLinkDatum } from "d3-force";
import { forceEllipseBoundary } from "./EllipseBoundaryForce";
import { forceRectangleCollision, removeOverlaps, type RectangleNode } from "./RectangleCollisionForce";

export interface WordInput {
    key: string;
    text: string;
    weight: number;
}

export interface MeasuredWord extends WordInput {
    fontSize: number;
    width: number;
    height: number;
}

export interface PlacedWord extends MeasuredWord, RectangleNode {
    x: number;
    y: number;
}

export interface LayoutLink {
    source: number;   // index into the words
    target: number;
    similarity: number;
}

export interface MeasureOptions {
    maxFontSize: number;
    minFontSize: number;
    fontFamily: string;
    fontWeight: number;
}

export interface SimulationOptions {
    aspectRatio: number;
    linkStrength: number;
    // Previous positions by key: words that stay keep their place, so a filter change does not scatter the cloud.
    previousPositions?: Record<string, { x: number; y: number }>;
    ticks?: number;
}

type SimulationLink = SimulationLinkDatum<PlacedWord> & { similarity: number };

const TEXT_HEIGHT_FACTOR = 1.05;
export const COLLISION_PADDING = 4;
// Share of the boundary ellipse the word boxes should cover; lower leaves more room to move apart.
const TARGET_FILL = 0.5;
const UNTANGLE_TICKS = 300;

export function measureWords(words: WordInput[], options: MeasureOptions): MeasuredWord[] {
    const maxWeight = Math.max(...words.map(word => word.weight), Number.EPSILON);
    const measure = textMeasurer(options.fontFamily, options.fontWeight);
    return words.map(word => {
        const fontSize = Math.max(options.minFontSize, options.maxFontSize * Math.sqrt(word.weight / maxWeight));
        return { ...word, fontSize, width: measure(word.text, fontSize), height: fontSize * TEXT_HEIGHT_FACTOR };
    });
}

export function simulateLayout(words: MeasuredWord[], links: LayoutLink[], options: SimulationOptions): PlacedWord[] {
    const minHeight = Math.min(...words.map(word => word.height), 10);
    const nodes: PlacedWord[] = words.map((word, index) => {
        const previous = options.previousPositions?.[word.key];
        const angle = index * 2.399963; // golden angle: an even spiral of starting points
        const radius = 4 * Math.sqrt(index) * minHeight;
        return {
            ...word,
            x: previous?.x ?? radius * Math.cos(angle) * options.aspectRatio,
            y: previous?.y ?? radius * Math.sin(angle),
        };
    });

    const boxArea = nodes.reduce((sum, node) => sum + (node.width + COLLISION_PADDING) * (node.height + COLLISION_PADDING), 0);
    const radiusY = Math.sqrt(boxArea / TARGET_FILL / (Math.PI * options.aspectRatio));
    const radiusX = radiusY * options.aspectRatio;

    const simulationLinks: SimulationLink[] = links.map(link => ({ ...link }));
    const restLength = (link: SimulationLink) => {
        const source = link.source as PlacedWord;
        const target = link.target as PlacedWord;
        return (source.height + target.height) / 2;
    };
    const simulation = forceSimulation(nodes)
        .force("link", forceLink<PlacedWord, SimulationLink>(simulationLinks)
            .distance(restLength)
            .strength(link => link.similarity * options.linkStrength))
        .force("charge", forceManyBody<PlacedWord>().strength(node => -2 * node.height).distanceMax(radiusX))
        .force("x", forceX<PlacedWord>(0).strength(0.02))
        .force("y", forceY<PlacedWord>(0).strength(0.02 * options.aspectRatio))
        .stop();
    const hasPreviousPositions = Object.keys(options.previousPositions ?? {}).length > 0;
    for (let tick = 0; tick < (hasPreviousPositions ? 0 : UNTANGLE_TICKS); tick++) {
        simulation.tick();
    }

    simulation
        .force("charge", null)
        .force("boundary", forceEllipseBoundary<PlacedWord>(radiusX, radiusY))
        .force("collide", forceRectangleCollision<PlacedWord>(COLLISION_PADDING))
        .alpha(1);
    const ticks = options.ticks ?? 300;
    for (let tick = 0; tick < ticks; tick++) {
        simulation.tick();
    }
    removeOverlaps(nodes, COLLISION_PADDING);
    return nodes.map(({ key, text, weight, fontSize, width, height, x, y }) => ({ key, text, weight, fontSize, width, height, x, y }));
}

function textMeasurer(fontFamily: string, fontWeight: number): (text: string, fontSize: number) => number {
    const context = document.createElement("canvas").getContext("2d");
    return (text, fontSize) => {
        if (!context) {
            return text.length * fontSize * 0.55;
        }
        context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        return context.measureText(text).width;
    };
}

export function layoutBounds(words: PlacedWord[]): { x: number; y: number; width: number; height: number } {
    if (words.length === 0) {
        return { x: -1, y: -1, width: 2, height: 2 };
    }
    const left = Math.min(...words.map(word => word.x - word.width / 2));
    const right = Math.max(...words.map(word => word.x + word.width / 2));
    const top = Math.min(...words.map(word => word.y - word.height / 2));
    const bottom = Math.max(...words.map(word => word.y + word.height / 2));
    return { x: left, y: top, width: right - left, height: bottom - top };
}
