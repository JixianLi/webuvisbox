// ABOUTME: The contour uncertainty example's probability map: per place, the fraction of members above the level (with
// ABOUTME: its 50% line), or the level-crossing probability, with a colorbar. The highlighted member's contour is drawn.

import { useLayoutEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type { ContourUncertaintyGlobalContext } from "../ContourUncertaintyGlobalContext";
import { CELL_COUNT_PER_SIDE } from "../ContourAnalysis";
import { GRID_SIZE } from "../ContourEnsemble";
import { contourPath, cssGradient, DIVERGING_PRESET, paintGrid, SEQUENTIAL_PRESET } from "../ContourColors";
import { SquareStage } from "./SquareStage";

// The crossing map has one value per cell, and cells lie between vertex centers: inset by half a grid step.
const CELL_INSET = `${(0.5 / GRID_SIZE) * 100}%`;
const CELL_EXTENT = `${(CELL_COUNT_PER_SIDE / GRID_SIZE) * 100}%`;

export default observer(function ProbabilityPanel() {
    const context = useScenario().globalContext as ContourUncertaintyGlobalContext;
    const tokens = useTheme().tokens;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const byExceedance = context.probabilityMode === "exceedance";
    const values = byExceedance ? context.exceedance : context.crossing;
    const highlighted = context.highlightedMember;

    // One member's contour crosses only about one cell per row, so crossing probabilities stay low (rarely above a
    // third) and a fixed 0–100% scale would show a nearly uniform dark map: color runs from 0 to the highest value.
    const crossingTop = byExceedance ? 1 : Math.max(1 / context.memberCount, ...values);

    useLayoutEffect(() => {
        if (!canvasRef.current) return;
        if (byExceedance) paintGrid(canvasRef.current, values, GRID_SIZE, DIVERGING_PRESET, value => value);
        else paintGrid(canvasRef.current, values, CELL_COUNT_PER_SIDE, SEQUENTIAL_PRESET, value => value / crossingTop);
    }, [values, byExceedance, crossingTop]);

    const ticks: Array<[string, number]> = byExceedance
        ? [["Below in every member", 0], ["Half", 50], ["Above in every member", 100]]
        : [["0%", 0], [`${Math.round(crossingTop * 100)}% of members (highest here)`, 100]];
    const line = { fill: "none", vectorEffect: "non-scaling-stroke" as const };

    return (
        <Panel panelName="Probability">
            <Box sx={{ width: 1, height: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <SquareStage>
                    {/* Fractions above the level are samples at vertices, so smooth interpolation shows them as the
                        contours see them; crossing probabilities belong to whole cells, so they stay blocky. */}
                    <canvas ref={canvasRef} role="img"
                            aria-label={byExceedance ? "Fraction of members above the level" : "Level-crossing probability"}
                            style={byExceedance ? { imageRendering: "auto" }
                                : { imageRendering: "pixelated", top: CELL_INSET, left: CELL_INSET, width: CELL_EXTENT, height: CELL_EXTENT }} />
                    <svg viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`} style={{ pointerEvents: "none" }}>
                        <rect x={0} y={0} width={GRID_SIZE} height={GRID_SIZE} fill="none" stroke={tokens.border}
                              vectorEffect="non-scaling-stroke" />
                        {byExceedance && (
                            <path d={contourPath(context.exceedance, 0.5)} {...line} stroke={tokens.text} strokeWidth={2} />
                        )}
                        {highlighted !== null && (
                            <path d={contourPath(context.ensemble.members[highlighted], context.level)} {...line}
                                  stroke={tokens.surface} strokeWidth={2.5} strokeDasharray="5 3" />
                        )}
                    </svg>
                </SquareStage>
                <Box>
                    <Typography variant="caption" sx={{ display: "block", color: "text.secondary", lineHeight: 1.5 }}>
                        {byExceedance
                            ? "Fraction of members above the level. Line: where half are above (the median contour)."
                            : "Level-crossing probability: the fraction of members whose contour passes through each cell."}
                    </Typography>
                    <Box sx={{ height: 10, borderRadius: "3px", mt: 0.5,
                               background: cssGradient(byExceedance ? DIVERGING_PRESET : SEQUENTIAL_PRESET) }} />
                    <Box sx={{ position: "relative", height: 18 }}>
                        {ticks.map(([label, percent]) => (
                            <Typography key={percent} variant="caption" sx={{
                                position: "absolute", top: 0, lineHeight: 1.5, color: "text.secondary", whiteSpace: "nowrap",
                                left: `${percent}%`,
                                transform: percent === 0 ? "none" : percent === 100 ? "translateX(-100%)" : "translateX(-50%)",
                            }}>
                                {label}
                            </Typography>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Panel>
    );
});
