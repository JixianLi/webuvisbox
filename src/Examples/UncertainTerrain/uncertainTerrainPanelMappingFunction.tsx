// ABOUTME: Maps the Uncertain terrain example's panel IDs to their views. Views load lazily: three.js and the colormap
// ABOUTME: presets download only when the example is opened, not with every host app.

import { lazy, Suspense } from "react";
import type React from "react";
import Typography from "@mui/material/Typography";

const TerrainPanel = lazy(() => import("./Views/TerrainPanel"));
const ControlsPanel = lazy(() => import("./Views/ControlsPanel"));
const LegendPanel = lazy(() => import("./Views/LegendPanel"));
const ProbePanel = lazy(() => import("./Views/ProbePanel"));
const DepthPanel = lazy(() => import("./Views/DepthPanel"));

const loading = <Typography variant="caption" sx={{ p: 1.5, color: "text.secondary" }}>Loading…</Typography>;

export function uncertainTerrainPanelMappingFunction(viewName: string): React.ReactNode {
    const view = (() => {
        switch (viewName) {
            case "Terrain":
                return <TerrainPanel />;
            case "Controls":
                return <ControlsPanel />;
            case "Legend":
                return <LegendPanel />;
            case "Probe":
                return <ProbePanel />;
            case "Depth":
                return <DepthPanel />;
            default:
                throw new Error(`Unknown view name: ${viewName}`);
        }
    })();
    return <Suspense fallback={loading}>{view}</Suspense>;
}

export default uncertainTerrainPanelMappingFunction;
