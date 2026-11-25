// ABOUTME: Maps the contour uncertainty example's panel IDs to their views. Views load lazily: the colormap presets
// ABOUTME: download only when the example is opened, not with every host app.

import { lazy, Suspense } from "react";
import type React from "react";
import Typography from "@mui/material/Typography";

const ContoursPanel = lazy(() => import("./Views/ContoursPanel"));
const ProbabilityPanel = lazy(() => import("./Views/ProbabilityPanel"));
const MembersPanel = lazy(() => import("./Views/MembersPanel"));
const ControlsPanel = lazy(() => import("./Views/ControlsPanel"));

const loading = <Typography variant="caption" sx={{ p: 1.5, color: "text.secondary" }}>Loading…</Typography>;

export function contourUncertaintyPanelMappingFunction(viewname: string): React.ReactNode {
    const view = (() => {
        switch (viewname) {
            case "Contours":
                return <ContoursPanel />;
            case "Probability":
                return <ProbabilityPanel />;
            case "Members":
                return <MembersPanel />;
            case "Controls":
                return <ControlsPanel />;
            default:
                throw new Error(`Unknown view name: ${viewname}`);
        }
    })();
    return <Suspense fallback={loading}>{view}</Suspense>;
}

export default contourUncertaintyPanelMappingFunction;
