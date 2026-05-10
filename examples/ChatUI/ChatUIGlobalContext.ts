// ABOUTME: Global context for the chatUI scenario — holds actors, trace, chat, selection.
// ABOUTME: Drives the fake agent on user prompt submit so the rendering components react.

import { makeAutoObservable, runInAction } from "mobx";
import type { GlobalContext } from "@/Types/GlobalContext";
import type { Actor, TraceMessage } from "@/Renderers/Trace";
import type { ChatMessage } from "@/Renderers/Chat";
import { runFakeAgent } from "./fakeAgent";

export class ChatUIGlobalContext implements GlobalContext {
    actors: Actor[];
    traceMessages: TraceMessage[];
    chatMessages: ChatMessage[];
    selectedTraceId: string | null;
    busy: boolean;

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

        makeAutoObservable(this);

        this.appendTrace = this.appendTrace.bind(this);
        this.appendChat = this.appendChat.bind(this);
    }

    appendTrace(msg: Omit<TraceMessage, "id">) {
        this.traceMessages.push({ id: crypto.randomUUID(), ...msg });
    }

    appendChat(msg: Omit<ChatMessage, "id">) {
        this.chatMessages.push({ id: crypto.randomUUID(), ...msg });
    }

    selectTrace(id: string | null) {
        this.selectedTraceId = id;
    }

    async submitUserPrompt(text: string) {
        if (this.busy) return;
        this.appendChat({ role: "user", content: text });
        this.appendTrace({ from: "user", to: "model", kind: "prompt", payload: text });
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

    initialize(_globalData: any): void {}

    async asyncInitialize(): Promise<void> {
        this.appendChat({ role: "user", content: "What's the weather in NYC?" });
        this.appendTrace({ from: "user", to: "model", kind: "prompt", payload: "What's the weather in NYC?" });
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
        this.appendChat({ role: "assistant", authorName: "Tool 1", content: "Sunny, 72°F in NYC" });
    }

    toObject(): any {
        return {
            actors: this.actors,
            trace_messages: this.traceMessages,
            chat_messages: this.chatMessages,
        };
    }
}

export default ChatUIGlobalContext;
