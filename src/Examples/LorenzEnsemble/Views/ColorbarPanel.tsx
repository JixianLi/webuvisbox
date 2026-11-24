// ABOUTME: The Lorenz ensemble example's colorbar: the colormap with log-spread ticks (or time ticks), matching what
// ABOUTME: the tubes are colored by.

import { observer } from "mobx-react-lite";
import * as d3 from "d3";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type { LorenzEnsembleGlobalContext } from "../LorenzEnsembleGlobalContext";
import { colorAt, spreadScale, timeScale } from "../LorenzColors";

const GRADIENT_STOPS = 24;
const SPREAD_TICKS: Array<[number, string]> = [[1e-6, "10⁻⁶"], [1e-4, "10⁻⁴"], [1e-2, "10⁻²"], [1, "1"], [30, "30"]];
const TIME_TICKS: Array<[number, string]> = [0, 5, 10, 15, 20, 25].map(tick => [tick, String(tick)]);

export default observer(function ColorbarPanel() {
    const context = useScenario().globalContext as LorenzEnsembleGlobalContext;
    const bySpread = context.colorMode === "spread";
    const gradient = d3.range(GRADIENT_STOPS + 1)
        .map(stop => `${colorAt(context.colormapPreset, stop / GRADIENT_STOPS).formatHex()} ${(stop / GRADIENT_STOPS) * 100}%`)
        .join(", ");
    const ticks = bySpread ? SPREAD_TICKS : TIME_TICKS;
    const position = (value: number) => (bySpread ? spreadScale(value) : timeScale(value)) * 100;
    return (
        <Panel panelName="Colorbar">
            <Box sx={{ width: 1, px: 1, boxSizing: "border-box" }}>
                <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 0.25 }}>
                    {bySpread ? "Ensemble spread at that time (log scale)" : "Time"}
                </Typography>
                <Box sx={{ height: 12, borderRadius: "4px", background: `linear-gradient(to right, ${gradient})` }} />
                <Box sx={{ position: "relative", height: 18 }}>
                    {ticks.map(([value, label], index) => (
                        <Typography key={value} variant="caption" sx={{
                            position: "absolute", top: 0, lineHeight: 1.4, color: "text.secondary", left: `${position(value)}%`,
                            transform: index === 0 ? "none" : index === ticks.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
                        }}>
                            {label}
                        </Typography>
                    ))}
                </Box>
            </Box>
        </Panel>
    );
});
