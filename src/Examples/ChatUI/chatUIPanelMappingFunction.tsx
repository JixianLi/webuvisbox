// ABOUTME: Maps panel IDs from the chatUI scenario config to their React components.
// ABOUTME: Throws on unknown view names so config typos are caught loudly.

import TracePanel from "./Views/TracePanel";
import ChatPanel from "./Views/ChatPanel";
import TopicsPanel from "./Views/TopicsPanel";
import type React from "react";

export function chatUIPanelMappingFunction(viewName: string): React.ReactNode {
    switch (viewName) {
        case "Trace":
            return <TracePanel />;
        case "Chat":
            return <ChatPanel />;
        case "Topics":
            return <TopicsPanel />;
        default:
            throw new Error(`Unknown view name: ${viewName}`);
    }
}

export default chatUIPanelMappingFunction;
