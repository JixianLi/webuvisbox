// ABOUTME: A square area as large as its panel allows, centered, for the contour uncertainty example's maps: layers
// ABOUTME: (a canvas, an SVG) stack inside it, sized to the whole square.

import type React from "react";
import Box from "@mui/material/Box";

// Container query units: the square's side is the smaller of the container's width and height (100cqw, 100cqh), which
// plain aspect-ratio cannot do when either dimension may be the limiting one.
export function SquareStage({ children }: { children: React.ReactNode }) {
    return (
        <Box sx={{ flex: 1, minHeight: 0, width: 1, containerType: "size", display: "flex", alignItems: "center",
                   justifyContent: "center" }}>
            <Box sx={{ position: "relative", width: "min(100cqw, 100cqh)", height: "min(100cqw, 100cqh)",
                       "& > *": { position: "absolute", inset: 0, width: "100%", height: "100%" } }}>
                {children}
            </Box>
        </Box>
    );
}
