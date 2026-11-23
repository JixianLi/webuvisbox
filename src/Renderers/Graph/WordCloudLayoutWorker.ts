// ABOUTME: Web Worker entry that runs simulateLayout off the main thread.
// ABOUTME: Message in: { requestId, words, links, options }; message out: { requestId, placed }.

import { simulateLayout, type LayoutLink, type MeasuredWord, type SimulationOptions } from "./WordCloudLayout";

export interface WordCloudLayoutRequest {
    requestId: number;
    words: MeasuredWord[];
    links: LayoutLink[];
    options: SimulationOptions;
}

self.onmessage = (event: MessageEvent<WordCloudLayoutRequest>) => {
    const { requestId, words, links, options } = event.data;
    const placed = simulateLayout(words, links, options);
    self.postMessage({ requestId, placed });
};
