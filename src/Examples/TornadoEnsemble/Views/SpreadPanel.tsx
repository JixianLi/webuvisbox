// ABOUTME: The tornado ensemble example's spread chart: the ensemble's spread over time. Pointing reads values;
// ABOUTME: pressing or dragging sets the time.

import { useState } from "react";
import { observer } from "mobx-react-lite";
import * as d3 from "d3";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type { TornadoEnsembleGlobalContext } from "../TornadoEnsembleGlobalContext";
import { DURATION, SAMPLE_COUNT, SAMPLE_INTERVAL, SPREAD_DOMAIN } from "../TornadoFlow";

// The plot is drawn in a WIDTH × HEIGHT box stretched to the panel (preserveAspectRatio none): lines only, with
// non-scaling strokes, so nothing distorts; text and the current-time dot are HTML placed by percentage.
const WIDTH = 300;
const HEIGHT = 110;
const SPREAD_TICKS = [0, 0.2, 0.4, 0.6];
const TIME_TICKS = [0, 2, 4, 6, 8, 10];

const x = d3.scaleLinear().domain([0, DURATION]).range([0, WIDTH]);
const y = d3.scaleLinear().domain(SPREAD_DOMAIN).range([HEIGHT, 0]).clamp(true);

function formatSpread(value: number) {
    return value.toFixed(3);
}

// Inside the Panel, so the theme it reads is the panel's (dark in neutral mode).
const SpreadContent = observer(function SpreadContent() {
    const context = useScenario().globalContext as TornadoEnsembleGlobalContext;
    const tokens = useTheme().tokens;
    const { spread } = context.ensemble;
    const [hoveredSample, setHoveredSample] = useState<number | null>(null);

    const line = d3.line<number>().x((_, sample) => x(sample * SAMPLE_INTERVAL)).y(value => y(value));
    const values = Array.from(spread);
    const currentSample = context.visibleSampleCount - 1;

    const sampleAt = (event: React.PointerEvent<SVGSVGElement>) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const fraction = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        return Math.round(fraction * (SAMPLE_COUNT - 1));
    };
    const scrub = (event: React.PointerEvent<SVGSVGElement>) => {
        context.pause();
        context.setTime(sampleAt(event) * SAMPLE_INTERVAL);
    };
    const readoutSample = hoveredSample ?? currentSample;
    const caption = { color: "text.secondary", lineHeight: 1 };
    const percentX = (time: number) => `${(x(time) / WIDTH) * 100}%`;
    const percentY = (value: number) => `${(y(value) / HEIGHT) * 100}%`;

    return (
        <>
            <Box sx={{ width: 1, pr: 1, boxSizing: "border-box" }}>
                <Typography variant="body2" sx={{ color: "text.primary", mb: 1 }}>
                    {`t = ${(readoutSample * SAMPLE_INTERVAL).toFixed(2)}: spread ${formatSpread(spread[readoutSample])}`}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Box sx={{ position: "relative", width: 28, height: HEIGHT, flex: "none" }}>
                        {SPREAD_TICKS.map(tick => (
                            <Typography key={tick} variant="caption"
                                        sx={{ ...caption, position: "absolute", right: 0, top: percentY(tick), transform: "translateY(-50%)" }}>
                                {tick}
                            </Typography>
                        ))}
                    </Box>
                    <Box sx={{ position: "relative", flex: 1, minWidth: 0, height: HEIGHT }}>
                        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} preserveAspectRatio="none"
                             role="img" aria-label="Ensemble spread over time"
                             style={{ display: "block", overflow: "visible", touchAction: "none", cursor: "crosshair" }}
                             onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); scrub(event); }}
                             onPointerMove={event => { setHoveredSample(sampleAt(event)); if (event.buttons) scrub(event); }}
                             onPointerLeave={() => setHoveredSample(null)}>
                            {SPREAD_TICKS.map(tick => (
                                <line key={tick} x1={0} x2={WIDTH} y1={y(tick)} y2={y(tick)} stroke={tokens.border}
                                      vectorEffect="non-scaling-stroke" />
                            ))}
                            <path d={line(values) ?? undefined} fill="none" stroke={tokens.textMuted} strokeWidth={2}
                                  vectorEffect="non-scaling-stroke" />
                            <path d={line(values.slice(0, currentSample + 1)) ?? undefined} fill="none" stroke={tokens.text}
                                  strokeWidth={2} vectorEffect="non-scaling-stroke" />
                            {hoveredSample !== null && (
                                <line x1={x(hoveredSample * SAMPLE_INTERVAL)} x2={x(hoveredSample * SAMPLE_INTERVAL)} y1={0} y2={HEIGHT}
                                      stroke={tokens.textSecondary} vectorEffect="non-scaling-stroke" />
                            )}
                        </svg>
                        <Box sx={{
                            position: "absolute", width: 10, height: 10, borderRadius: "50%", bgcolor: "text.primary",
                            border: `2px solid ${tokens.surface}`, pointerEvents: "none", transform: "translate(-50%, -50%)",
                            left: percentX(currentSample * SAMPLE_INTERVAL), top: percentY(spread[currentSample]),
                        }} />
                    </Box>
                </Box>
                <Box sx={{ position: "relative", height: 16, ml: "32px" }}>
                    {TIME_TICKS.map(tick => (
                        <Typography key={tick} variant="caption"
                                    sx={{ ...caption, position: "absolute", top: 4, left: percentX(tick),
                                          transform: tick === 0 ? "none" : tick === DURATION ? "translateX(-100%)" : "translateX(-50%)" }}>
                            {tick}
                        </Typography>
                    ))}
                </Box>
                <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5 }}>
                    Spread: RMS distance of the paths from their mean. Press or drag to set the time.
                </Typography>
            </Box>
        </>
    );
});

export default function SpreadPanel() {
    return <Panel panelName="Spread"><SpreadContent /></Panel>;
}
