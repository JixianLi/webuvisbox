// ABOUTME: The contour uncertainty example's small multiples: one thumbnail per member, its field colored around the
// ABOUTME: level and its contour drawn. In boxplot mode the median and the outliers are labeled.

import { useLayoutEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type { ContourUncertaintyGlobalContext } from "../ContourUncertaintyGlobalContext";
import { GRID_SIZE } from "../ContourEnsemble";
import { contourPath, DIVERGING_PRESET, paintGrid } from "../ContourColors";
import { highlightHandlers } from "./Highlight";

// Every thumbnail shares one scale centered on the level: blue below it, red above, gray at it, so the colors compare
// across members and the contour is where blue meets red.
function centeredOnLevel(level: number, valueRange: [number, number]) {
    const halfWidth = Math.max(level - valueRange[0], valueRange[1] - level, 1e-6);
    return (value: number) => 0.5 + (value - level) / (2 * halfWidth);
}

const Thumbnail = observer(function Thumbnail({ member }: { member: number }) {
    const context = useScenario().globalContext as ContourUncertaintyGlobalContext;
    const tokens = useTheme().tokens;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const field = context.ensemble.members[member];
    const { level } = context;
    const { valueRange } = context.ensemble;
    useLayoutEffect(() => {
        if (canvasRef.current) paintGrid(canvasRef.current, field, GRID_SIZE, DIVERGING_PRESET, centeredOnLevel(level, valueRange));
    }, [field, level, valueRange]);

    const highlighted = context.highlightedMember === member;
    const boxplot = context.contourMode === "boxplot" ? context.boxplot : null;
    const role = boxplot?.medianMember === member ? "median" : boxplot?.outlierMembers.includes(member) ? "outlier" : null;
    return (
        <Box {...highlightHandlers(context, member)} sx={{ cursor: "pointer", minWidth: 0 }}>
            <Box sx={{ position: "relative", aspectRatio: "1", borderRadius: "4px", overflow: "hidden",
                       outline: highlighted ? `2.5px solid ${tokens.accentOnSurface}` : `1px solid ${tokens.border}`,
                       outlineOffset: highlighted ? "1px" : "0",
                       "& > *": { position: "absolute", inset: 0, width: "100%", height: "100%" } }}>
                <canvas ref={canvasRef} style={{ imageRendering: "auto" }} />
                {/* Dark ink in every display mode: the contour runs along the colormap's light gray middle. */}
                <svg viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}>
                    <path d={contourPath(field, level)} fill="none" stroke="#16181A" strokeWidth={1.25}
                          vectorEffect="non-scaling-stroke" />
                </svg>
            </Box>
            <Typography variant="caption" noWrap sx={{ display: "block", lineHeight: 1.6,
                        color: highlighted ? "text.primary" : "text.secondary", fontWeight: role ? 600 : 400 }}>
                {`#${member + 1}${role ? ` ${role}` : ""}`}
            </Typography>
        </Box>
    );
});

export default observer(function MembersPanel() {
    const context = useScenario().globalContext as ContourUncertaintyGlobalContext;
    return (
        <Panel panelName="Members" scene>
            {/* Thumbnails at least 80px wide, except that a narrow panel (a phone) still gets four per row. */}
            <Box sx={{ width: 1, display: "grid", gap: 1,
                       gridTemplateColumns: "repeat(auto-fill, minmax(min(80px, calc((100% - 24px) / 4)), 1fr))" }}>
                {context.ensemble.members.map((_, member) => <Thumbnail key={member} member={member} />)}
            </Box>
        </Panel>
    );
});
