// ABOUTME: Maps the tornado ensemble example's panel IDs to their views. Views load lazily: three.js and the colormap
// ABOUTME: presets download only when the example is opened, not with every host app.

import { lazy, Suspense } from "react";
import type React from "react";
import Typography from "@mui/material/Typography";

const EnsemblePanel = lazy(() => import("./Views/EnsemblePanel"));
const ControlsPanel = lazy(() => import("./Views/ControlsPanel"));
const SpreadPanel = lazy(() => import("./Views/SpreadPanel"));
const ColorbarPanel = lazy(() => import("./Views/ColorbarPanel"));
const UncertaintyTubePanel = lazy(() => import("./Views/UncertaintyTubePanel"));
const MeanPathPanel = lazy(() => import("./Views/MeanPathPanel"));

const loading = <Typography variant="caption" sx={{ p: 1.5, color: "text.secondary" }}>Loading…</Typography>;

export function tornadoEnsemblePanelMappingFunction(viewName: string): React.ReactNode {
    const view = (() => {
        switch (viewName) {
            case "Ensemble":
                return <EnsemblePanel />;
            case "Controls":
                return <ControlsPanel />;
            case "Spread":
                return <SpreadPanel />;
            case "Colorbar":
                return <ColorbarPanel />;
            case "Uncertainty tube":
                return <UncertaintyTubePanel />;
            case "Mean path":
                return <MeanPathPanel />;
            default:
                throw new Error(`Unknown view name: ${viewName}`);
        }
    })();
    return <Suspense fallback={loading}>{view}</Suspense>;
}

export default tornadoEnsemblePanelMappingFunction;
