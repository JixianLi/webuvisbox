// ABOUTME: Global context for the chatUI scenario — holds actors, trace, chat, selection.
// ABOUTME: Drives the fake agent on user prompt submit so the rendering components react.

import { makeAutoObservable, runInAction } from "mobx";
import type { GlobalContext } from "../../Types/GlobalContext";
import type { Actor, TraceMessage } from "../../Renderers/Trace";
import type { ChatMessage } from "../../Renderers/Chat";
import { BUNDLED_CAT_DATA_URL, runFakeAgent } from "./FakeAgent";
import { conversationTopics } from "./ConversationTopics";

interface ChatUIGlobalData {
    chat_font_size: number;
    trace_font_size: number;
}

export class ChatUIGlobalContext implements GlobalContext {
    actors: Actor[];
    traceMessages: TraceMessage[];
    chatMessages: ChatMessage[];
    selectedTraceId: string | null;
    busy: boolean;
    chatFontSize: number;
    traceFontSize: number;

    constructor() {
        this.actors = [
            { id: "user", label: "User", kind: "user" },
            { id: "model", label: "Model", kind: "model" },
            { id: "tool1", label: "Tool 1", kind: "tool" },
            { id: "tool2", label: "Tool 2", kind: "tool" },
        ];
        this.traceMessages = [];
        this.chatMessages = [];
        this.selectedTraceId = null;
        this.busy = false;
        this.chatFontSize = 14;
        this.traceFontSize = 13;

        // autoBind: the fake agent calls these detached, after awaits; bound here they stay actions.
        makeAutoObservable(this, {}, { autoBind: true });
    }

    setChatFontSize(size: number) {
        this.chatFontSize = size;
    }

    setTraceFontSize(size: number) {
        this.traceFontSize = size;
    }

    appendTrace(message: Omit<TraceMessage, "id">) {
        this.traceMessages.push({ id: crypto.randomUUID(), ...message });
    }

    appendChat(message: Omit<ChatMessage, "id">) {
        this.chatMessages.push({ id: crypto.randomUUID(), ...message });
    }

    selectTrace(id: string | null) {
        if (id && id === this.selectedTraceId) {
            this.selectedTraceId = null;
        } else {
            this.selectedTraceId = id;
        }
    }

    async submitUserPrompt(text: string) {
        if (this.busy) return;
        this.appendChat({ role: "user", content: text });
        this.appendTrace({
            from: "user",
            to: "model",
            kind: "prompt",
            payload: text,
        });
        this.busy = true;
        try {
            await runFakeAgent(text, {
                appendTrace: this.appendTrace,
                appendChat: this.appendChat,
            });
        } finally {
            runInAction(() => {
                this.busy = false;
            });
        }
    }

    initialize(globalData?: Partial<ChatUIGlobalData>): void {
        if (typeof globalData?.chat_font_size === "number") {
            this.chatFontSize = globalData.chat_font_size;
        }
        if (typeof globalData?.trace_font_size === "number") {
            this.traceFontSize = globalData.trace_font_size;
        }
    }

    async asyncInitialize(): Promise<void> {
        this.seedTextRound();
        this.seedImageRound();
    }

    // A question answered with text by Tool 1.
    private seedTextRound() {
        this.appendChat({
            role: "user",
            content: "What's the weather in NYC?",
        });
        this.appendTrace({
            from: "user",
            to: "model",
            kind: "prompt",
            payload: "What's the weather in NYC?",
        });
        this.appendTrace({
            from: "model",
            to: "tool1",
            kind: "tool_call",
            payload: { tool: "tool1", args: { location: "NYC" } },
        });
        this.appendTrace({
            from: "tool1",
            to: "user",
            kind: "tool_result",
            payload: { temp: 72, condition: "sunny" },
        });
        this.appendChat({
            role: "assistant",
            authorName: "Tool 1",
            content: "Sunny, 72°F in NYC",
        });
    }

    // A question answered with the bundled cat by Tool 2, after a retry (asking again fetches a live cat).
    private seedImageRound() {
        const catUrl = BUNDLED_CAT_DATA_URL;
        this.appendChat({
            role: "user",
            content: "Can you show me a cat picture?",
        });
        this.appendTrace({
            from: "user",
            to: "model",
            kind: "prompt",
            payload: "Can you show me a cat picture?",
        });
        this.appendTrace({
            from: "model",
            to: "tool2",
            kind: "tool_call",
            payload: { tool: "tool2", args: { query: "cat" } },
        });
        this.appendTrace({
            from: "tool2",
            to: "tool2",
            kind: "retry",
            payload: { tool: "tool2", attempt: 1, error: "transient failure" },
        });
        this.appendTrace({
            from: "tool2",
            to: "user",
            kind: "tool_result",
            payload: { tool: "tool2", attempt: 2, result: `[image ${catUrl.length} chars]` },
        });
        this.appendChat({
            role: "assistant",
            authorName: "Tool 2",
            content: [
                { type: "text", text: "Here is a cat for you:" },
                { type: "image", url: catUrl, alt: "Cat image from Tool 2" },
            ],
        });
    }

    get topics() {
        return conversationTopics(this.chatMessages);
    }

    toObject(): ChatUIGlobalData {
        return {
            chat_font_size: this.chatFontSize,
            trace_font_size: this.traceFontSize,
        };
    }
}

export default ChatUIGlobalContext;
