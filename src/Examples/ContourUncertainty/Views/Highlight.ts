// ABOUTME: Pointer handlers that highlight an ensemble member across the contour uncertainty example's views: a mouse
// ABOUTME: highlights while hovering; a touch or pen tap toggles, since touch has no hover.

import type React from "react";
import type { ContourUncertaintyGlobalContext } from "../ContourUncertaintyGlobalContext";

export function highlightHandlers(context: ContourUncertaintyGlobalContext, member: number) {
    return {
        onPointerEnter: (event: React.PointerEvent) => {
            if (event.pointerType === "mouse") context.setHighlightedMember(member);
        },
        onPointerLeave: (event: React.PointerEvent) => {
            if (event.pointerType === "mouse") context.setHighlightedMember(null);
        },
        onPointerUp: (event: React.PointerEvent) => {
            if (event.pointerType !== "mouse") {
                context.setHighlightedMember(context.highlightedMember === member ? null : member);
            }
        },
    };
}
