// ABOUTME: Maps the volume rendering example's panel IDs to their views. Views load lazily: three.js, the colormap
// ABOUTME: presets and the TextureManager download only when the example is opened, not with every host app.

import { lazy, Suspense } from "react";
import type React from "react";
import Typography from "@mui/material/Typography";

const VolumePanel = lazy(() => import("./Views/VolumePanel"));
const TransferFunctionPanel = lazy(() => import("./Views/TransferFunctionPanel"));
const ControlsPanel = lazy(() => import("./Views/ControlsPanel"));

const loading = <Typography variant="caption" sx={{ p: 1.5, color: "text.secondary" }}>Loading…</Typography>;

export function volumeRenderingPanelMappingFunction(viewname: string): React.ReactNode {
    const view = (() => {
        switch (viewname) {
            case "Volume":
                return <VolumePanel />;
            case "Transfer function":
                return <TransferFunctionPanel />;
            case "Controls":
                return <ControlsPanel />;
            default:
                throw new Error(`Unknown view name: ${viewname}`);
        }
    })();
    return <Suspense fallback={loading}>{view}</Suspense>;
}

export default volumeRenderingPanelMappingFunction;
