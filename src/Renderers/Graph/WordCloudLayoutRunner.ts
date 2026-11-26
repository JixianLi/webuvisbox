// ABOUTME: Owns a WordCloudLayoutWorker and hands back only the answer to the latest request, so rapid changes
// ABOUTME: (slider drags, filter clicks) never put a stale layout on screen.

import type { LayoutLink, MeasuredWord, PlacedWord, SimulationOptions } from "./WordCloudLayout";
import type { WordCloudLayoutRequest } from "./WordCloudLayoutWorker";

export class WordCloudLayoutRunner {
    private worker: Worker;
    private latestRequestId = 0;

    // onError hears of a layout that failed in the worker (else the cloud would silently keep its last layout).
    constructor(onLayout: (placed: PlacedWord[]) => void, onError: (message: string) => void = message =>
        console.error("Word cloud layout failed:", message)) {
        this.worker = new Worker(new URL("./WordCloudLayoutWorker.ts", import.meta.url), { type: "module" });
        this.worker.onmessage = (event: MessageEvent<{ requestId: number; placed: PlacedWord[] }>) => {
            if (event.data.requestId === this.latestRequestId) {
                onLayout(event.data.placed);
            }
        };
        this.worker.onerror = (event: ErrorEvent) => {
            event.preventDefault();
            onError(event.message);
        };
    }

    request(words: MeasuredWord[], links: LayoutLink[], options: SimulationOptions): void {
        const request: WordCloudLayoutRequest = { requestId: ++this.latestRequestId, words, links, options };
        this.worker.postMessage(request);
    }

    dispose(): void {
        this.worker.terminate();
    }
}
