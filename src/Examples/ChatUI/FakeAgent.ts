// ABOUTME: Fake agent simulator for the chatUI scenario.
// ABOUTME: Picks a random tool path with retries and animates trace + chat updates.

import type { TraceMessage } from "../../Renderers/Trace";
import type { ChatMessage, ContentPart } from "../../Renderers/Chat";

type FakeAgentContext = {
    appendTrace: (message: Omit<TraceMessage, "id">) => void;
    appendChat: (message: Omit<ChatMessage, "id">) => void;
};

const STEP_DELAY_MS = 350;
const FAILURE_PROB = 0.3;
const MAX_ATTEMPTS = 3;

const TOOL_LABELS: Record<string, string> = {
    tool1: "Tool 1",
    tool2: "Tool 2",
};

const TOOL1_RESULTS = ["sunny 72°F", "cloudy 65°F", "rainy 58°F"];

type ToolResult = { type: "text"; text: string } | { type: "image"; url: string };

type Invocation = { tool: string; resultTo: string };

const PATHS: Invocation[][] = [
    [{ tool: "tool1", resultTo: "user" }],
    [{ tool: "tool2", resultTo: "user" }],
    [
        { tool: "tool1", resultTo: "model" },
        { tool: "tool2", resultTo: "user" },
    ],
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const CAT_FETCH_TIMEOUT_MS = 4000;

// A cat drawn in SVG, bundled: the seeded conversation shows it, and a live cat falls back to it when cataas.com is
// unreachable or slow.
const BUNDLED_CAT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <rect width="300" height="200" rx="12" fill="#f4efe6"/>
  <polygon points="95,88 106,38 142,68" fill="#d98a4e"/>
  <polygon points="103,80 110,48 134,68" fill="#f2b8a2"/>
  <polygon points="205,88 194,38 158,68" fill="#d98a4e"/>
  <polygon points="197,80 190,48 166,68" fill="#f2b8a2"/>
  <ellipse cx="150" cy="116" rx="60" ry="52" fill="#e59b5c"/>
  <circle cx="128" cy="108" r="7" fill="#2b2623"/>
  <circle cx="172" cy="108" r="7" fill="#2b2623"/>
  <circle cx="126" cy="106" r="2.2" fill="#ffffff"/>
  <circle cx="170" cy="106" r="2.2" fill="#ffffff"/>
  <polygon points="144,122 156,122 150,129" fill="#d96b6b"/>
  <path d="M138,134 Q144,140 150,132 Q156,140 162,134" fill="none" stroke="#2b2623" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="82" y1="118" x2="114" y2="122" stroke="#6b5647" stroke-width="2"/>
  <line x1="80" y1="128" x2="114" y2="128" stroke="#6b5647" stroke-width="2"/>
  <line x1="186" y1="122" x2="218" y2="118" stroke="#6b5647" stroke-width="2"/>
  <line x1="186" y1="128" x2="220" y2="128" stroke="#6b5647" stroke-width="2"/>
</svg>`;

export const BUNDLED_CAT_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(BUNDLED_CAT_SVG)}`;

export async function fetchCatDataUrl(): Promise<string> {
    try {
        const response = await fetch(`https://cataas.com/cat?width=300&height=200&t=${Date.now()}`, {
            signal: AbortSignal.timeout(CAT_FETCH_TIMEOUT_MS),
        });
        if (!response.ok) {
            return BUNDLED_CAT_DATA_URL;
        }
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    } catch {
        return BUNDLED_CAT_DATA_URL;
    }
}

async function produceResult(tool: string): Promise<ToolResult> {
    if (tool === "tool2") {
        const url = await fetchCatDataUrl();
        return { type: "image", url };
    }
    return { type: "text", text: pickRandom(TOOL1_RESULTS) };
}

function tracePayloadForResult(tool: string, attempt: number, result: ToolResult): unknown {
    if (result.type === "text") return { tool, attempt, result: result.text };
    return { tool, attempt, result: `[image ${result.url.length} chars, base64]` };
}

async function invokeTool(
    tool: string,
    resultTo: string,
    context: FakeAgentContext,
): Promise<{ outcome: "success"; result: ToolResult } | { outcome: "failure" }> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        await sleep(STEP_DELAY_MS);
        const failed = Math.random() < FAILURE_PROB;
        if (!failed) {
            const result = await produceResult(tool);
            context.appendTrace({
                from: tool,
                to: resultTo,
                kind: "tool_result",
                payload: tracePayloadForResult(tool, attempt, result),
            });
            return { outcome: "success", result };
        }
        if (attempt < MAX_ATTEMPTS) {
            context.appendTrace({
                from: tool,
                to: tool,
                kind: "retry",
                payload: { tool, attempt, error: "transient failure" },
            });
        }
    }
    context.appendTrace({
        from: tool,
        to: "model",
        kind: "error",
        payload: { tool, attempts: MAX_ATTEMPTS, error: "all retries exhausted" },
    });
    return { outcome: "failure" };
}

function resultToContent(tool: string, result: ToolResult): string | ContentPart[] {
    if (result.type === "text") return result.text;
    return [
        { type: "text", text: `Here is the ${TOOL_LABELS[tool]} output:` },
        { type: "image", url: result.url, alt: `${TOOL_LABELS[tool]} output` },
    ];
}

export async function runFakeAgent(_prompt: string, context: FakeAgentContext): Promise<void> {
    const invocations = pickRandom(PATHS);
    let lastResult: ToolResult | undefined;

    for (const invocation of invocations) {
        await sleep(STEP_DELAY_MS);
        context.appendTrace({
            from: "model",
            to: invocation.tool,
            kind: "tool_call",
            payload: { tool: invocation.tool, args: {} },
        });
        const outcome = await invokeTool(invocation.tool, invocation.resultTo, context);
        if (outcome.outcome === "failure") {
            await sleep(STEP_DELAY_MS);
            const apology = `Sorry, ${TOOL_LABELS[invocation.tool]} failed after ${MAX_ATTEMPTS} attempts.`;
            context.appendTrace({
                from: "model",
                to: "user",
                kind: "error",
                payload: apology,
            });
            context.appendChat({
                role: "assistant",
                authorName: "Model",
                content: apology,
            });
            return;
        }
        lastResult = outcome.result;
    }

    const last = invocations[invocations.length - 1];
    context.appendChat({
        role: "assistant",
        authorName: TOOL_LABELS[last.tool],
        content: resultToContent(last.tool, lastResult ?? { type: "text", text: "ok" }),
    });
}
