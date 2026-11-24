// ABOUTME: The Lorenz ensemble example's spread chart: the ensemble's spread over time on a log axis, with the e^{λt}
// ABOUTME: growth the largest Lyapunov exponent predicts. Pointing reads values; pressing or dragging sets the time.

import { useState } from "react";
import { observer } from "mobx-react-lite";
import * as d3 from "d3";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type { LorenzEnsembleGlobalContext } from "../LorenzEnsembleGlobalContext";
import { DURATION, LYAPUNOV_EXPONENT, SAMPLE_COUNT, SAMPLE_INTERVAL } from "../LorenzSystem";

// The plot is drawn in a WIDTH × HEIGHT box stretched to the panel (preserveAspectRatio none): lines only, with
// non-scaling strokes, so nothing distorts; text and the current-time dot are HTML placed by percentage.
const WIDTH = 300;
const HEIGHT = 110;
const SPREAD_AXIS: [number, number] = [1e-7, 100];
const SPREAD_TICKS = [1e-6, 1e-4, 1e-2, 1, 100];
const TIME_TICKS = [0, 5, 10, 15, 20, 25];

const x = d3.scaleLinear().domain([0, DURATION]).range([0, WIDTH]);
const y = d3.scaleLog().domain(SPREAD_AXIS).range([HEIGHT, 0]).clamp(true);

function powerOfTen(value: number) {
    const superscripts: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    const exponent = Math.round(Math.log10(value));
    return exponent === 0 ? "1" : `10${String(exponent).split("").map(character => superscripts[character]).join("")}`;
}

function formatSpread(value: number) {
    return value >= 0.01 ? value.toPrecision(2) : value.toExponential(1);
}

export default observer(function SpreadPanel() {
    const context = useScenario().globalContext as LorenzEnsembleGlobalContext;
    const tokens = useTheme().tokens;
    const { spread } = context.ensemble;
    const [hoveredSample, setHoveredSample] = useState<number | null>(null);

    const line = d3.line<number>().x((_, sample) => x(sample * SAMPLE_INTERVAL)).y(value => y(Math.max(value, 1e-12)));
    const values = Array.from(spread);
    const currentSample = context.visibleSampleCount - 1;
    // Exponential growth from the starting spread, up to where it would pass the attractor's size.
    const growthEnd = Math.min(DURATION, (Math.log(10 / spread[0])) / LYAPUNOV_EXPONENT);
    const growthLine = `M${x(0)},${y(spread[0])}L${x(growthEnd)},${y(spread[0] * Math.exp(LYAPUNOV_EXPONENT * growthEnd))}`;

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
        <Panel panelName="Spread">
            <Box sx={{ width: 1, pr: 1, boxSizing: "border-box" }}>
                <Typography variant="body2" sx={{ color: "text.primary", mb: 1 }}>
                    {`t = ${(readoutSample * SAMPLE_INTERVAL).toFixed(2)}: spread ${formatSpread(spread[readoutSample])}`}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Box sx={{ position: "relative", width: 28, height: HEIGHT, flex: "none" }}>
                        {SPREAD_TICKS.map(tick => (
                            <Typography key={tick} variant="caption"
                                        sx={{ ...caption, position: "absolute", right: 0, top: percentY(tick), transform: "translateY(-50%)" }}>
                                {powerOfTen(tick)}
                            </Typography>
                        ))}
                    </Box>
                    <Box sx={{ position: "relative", flex: 1, minWidth: 0, height: HEIGHT }}>
                        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} preserveAspectRatio="none"
                             role="img" aria-label="Ensemble spread over time, log scale"
                             style={{ display: "block", overflow: "visible", touchAction: "none", cursor: "crosshair" }}
                             onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); scrub(event); }}
                             onPointerMove={event => { setHoveredSample(sampleAt(event)); if (event.buttons) scrub(event); }}
                             onPointerLeave={() => setHoveredSample(null)}>
                            {SPREAD_TICKS.map(tick => (
                                <line key={tick} x1={0} x2={WIDTH} y1={y(tick)} y2={y(tick)} stroke={tokens.border}
                                      vectorEffect="non-scaling-stroke" />
                            ))}
                            <path d={growthLine} fill="none" stroke={tokens.textSecondary} strokeWidth={1.5}
                                  strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
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
                            left: percentX(currentSample * SAMPLE_INTERVAL), top: percentY(Math.max(spread[currentSample], 1e-12)),
                        }} />
                        <Typography variant="caption" sx={{
                            ...caption, position: "absolute", pointerEvents: "none", whiteSpace: "nowrap",
                            left: percentX(growthEnd), top: percentY(10), transform: "translate(6px, 60%)",
                        }}>
                            e<sup>{`${LYAPUNOV_EXPONENT.toFixed(2)} t`}</sup>
                        </Typography>
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
                    Spread: RMS distance of the paths from their mean. Dashed: growth at the Lyapunov exponent. Press or drag to set the time.
                </Typography>
            </Box>
        </Panel>
    );
});
