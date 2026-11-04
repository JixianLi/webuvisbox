// ABOUTME: Maps panel IDs from the chatUI scenario config to their React components.
// ABOUTME: Throws on unknown view names so config typos are caught loudly.

import TracePanel from "./Views/TracePanel";
import ChatPanel from "./Views/ChatPanel";
import type React from "react";

export function chatUIPanelMappingFunction(viewname: string): React.ReactNode {
    switch (viewname) {
        case "Trace":
            return <TracePanel />;
        case "Chat":
            return <ChatPanel />;
        default:
            throw new Error(`Unknown view name: ${viewname}`);
    }
}

export default chatUIPanelMappingFunction;
