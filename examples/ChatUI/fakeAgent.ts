// ABOUTME: Fake agent simulator for the chatUI scenario.
// ABOUTME: Picks a random tool path with retries and animates trace + chat updates.

import type { TraceMessage } from "@/Renderers/Trace";
import type { ChatMessage } from "@/Renderers/Chat";

type FakeAgentCtx = {
    appendTrace: (msg: Omit<TraceMessage, "id">) => void;
    appendChat: (msg: Omit<ChatMessage, "id">) => void;
};

const STEP_DELAY_MS = 350;
const FAILURE_PROB = 0.3;
const MAX_ATTEMPTS = 3;

const TOOL_LABELS: Record<string, string> = {
    tool1: "Tool 1",
    tool2: "Tool 2",
};

const TOOL_RESULTS: Record<string, string[]> = {
    tool1: ["sunny 72°F", "cloudy 65°F", "rainy 58°F"],
    tool2: ["price: $42.10", "price: $89.50", "price: $17.25"],
};

type Invocation = { tool: string; resultTo: string };

const PATHS: Invocation[][] = [
    [{ tool: "tool1", resultTo: "user" }],
    [{ tool: "tool2", resultTo: "user" }],
    [
        { tool: "tool1", resultTo: "model" },
        { tool: "tool2", resultTo: "user" },
    ],
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

async function invokeTool(
    tool: string,
    resultTo: string,
    ctx: FakeAgentCtx,
): Promise<{ outcome: "success"; result: string } | { outcome: "failure" }> {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        await sleep(STEP_DELAY_MS);
        const failed = Math.random() < FAILURE_PROB;
        if (!failed) {
            const result = pickRandom(TOOL_RESULTS[tool] ?? ["ok"]);
            ctx.appendTrace({
                from: tool,
                to: resultTo,
                kind: "tool_result",
                payload: { tool, attempt, result },
            });
            return { outcome: "success", result };
        }
        if (attempt < MAX_ATTEMPTS) {
            ctx.appendTrace({
                from: tool,
                to: tool,
                kind: "retry",
                payload: { tool, attempt, error: "transient failure" },
            });
        }
    }
    ctx.appendTrace({
        from: tool,
        to: "model",
        kind: "error",
        payload: { tool, attempts: MAX_ATTEMPTS, error: "all retries exhausted" },
    });
    return { outcome: "failure" };
}

export async function runFakeAgent(_prompt: string, ctx: FakeAgentCtx): Promise<void> {
    const invocations = pickRandom(PATHS);
    let lastResult: string | undefined;

    for (const inv of invocations) {
        await sleep(STEP_DELAY_MS);
        ctx.appendTrace({
            from: "model",
            to: inv.tool,
            kind: "tool_call",
            payload: { tool: inv.tool, args: { /* opaque */ } },
        });
        const r = await invokeTool(inv.tool, inv.resultTo, ctx);
        if (r.outcome === "failure") {
            await sleep(STEP_DELAY_MS);
            const apology = `Sorry, ${TOOL_LABELS[inv.tool]} failed after ${MAX_ATTEMPTS} attempts.`;
            ctx.appendTrace({
                from: "model",
                to: "user",
                kind: "error",
                payload: apology,
            });
            ctx.appendChat({
                role: "assistant",
                authorName: "Model",
                content: apology,
            });
            return;
        }
        lastResult = r.result;
    }

    const last = invocations[invocations.length - 1];
    ctx.appendChat({
        role: "assistant",
        authorName: TOOL_LABELS[last.tool],
        content: lastResult ?? "ok",
    });
}
