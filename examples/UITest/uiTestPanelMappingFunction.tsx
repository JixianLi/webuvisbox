// ABOUTME: Maps panel IDs from the UI test scenario config to their React components.
// ABOUTME: Throws on unknown view names so config typos are caught loudly.

import GraphTracePanel from "./Views/GraphTracePanel";
import ChatPanel from "./Views/ChatPanel";
import type React from "react";

export function uiTestPanelMappingFunction(viewname: string): React.ReactNode {
    switch (viewname) {
        case "Graph Trace":
            return <GraphTracePanel />;
        case "Chat":
            return <ChatPanel />;
        default:
            throw new Error(`Unknown view name: ${viewname}`);
    }
}

export default uiTestPanelMappingFunction;
