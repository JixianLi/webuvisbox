// ABOUTME: The Uncertain terrain example's color legend: the VSUP arc (around it the mean height; from the outer edge,
// ABOUTME: certain, inward, uncertain, bins merge until one faded color remains), or a colorbar for a single field.

import { observer } from "mobx-react-lite";
import * as d3 from "d3";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { ENCODINGS, UNCERTAINTY_REFERENCE, type UncertainTerrainGlobalContext } from "../UncertainTerrainGlobalContext";
import { PresetLinearColormap } from "../../../Renderers/Colormaps/PresetLinearColormap";
import { terrainColor, terrainPalette, VSUP_DEPTH } from "../TerrainColors";

const HALF_ANGLE = Math.PI / 3;
const INNER_RADIUS = 28;
const OUTER_RADIUS = 112;
const CONTINUOUS_RINGS = 16;
const CONTINUOUS_SECTORS = 48;

interface Cell { innerRadius: number; outerRadius: number; startAngle: number; endAngle: number; color: string }

// Ring r of R (0 = innermost) spans uncertainty from 1 − r/R down to 1 − (r + 1)/R; each cell is colored at its center.
function arcCells(rings: number, sectorsInRing: (ring: number) => number,
                  colorAt: (value: number, uncertainty: number) => string): Cell[] {
    const ringWidth = (OUTER_RADIUS - INNER_RADIUS) / rings;
    return d3.range(rings).flatMap(ring => {
        const sectors = sectorsInRing(ring);
        const sectorAngle = (2 * HALF_ANGLE) / sectors;
        return d3.range(sectors).map(sector => ({
            innerRadius: INNER_RADIUS + ring * ringWidth,
            outerRadius: INNER_RADIUS + (ring + 1) * ringWidth,
            startAngle: -HALF_ANGLE + sector * sectorAngle,
            endAngle: -HALF_ANGLE + (sector + 1) * sectorAngle,
            color: colorAt((sector + 0.5) / sectors, 1 - (ring + 0.5) / rings),
        }));
    });
}

const COLORBAR_STOPS = 32;

// A single field: the colormap as a bar, from the field's low to its high end.
const Colorbar = observer(function Colorbar() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    const colormap = new PresetLinearColormap(context.colormapPreset);
    const stops = d3.range(COLORBAR_STOPS + 1).map(stop => colormap.getColorByValue(stop / COLORBAR_STOPS).formatHex());
    const [low, high] = context.encoding === "mean" ? context.ensemble.meanRange : [0, UNCERTAINTY_REFERENCE];
    const highLabel = context.encoding === "spread" ? `≥ ${high.toFixed(2)}` : high.toFixed(2);
    return (
        <Box sx={{ width: 1, maxWidth: 320, mx: "auto" }}>
            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", textAlign: "center" }}>
                {ENCODINGS[context.encoding].toLowerCase()}
            </Typography>
            <Box sx={{ height: 14, borderRadius: 0.5, background: `linear-gradient(to right, ${stops.join(", ")})` }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{low.toFixed(2)}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{highLabel}</Typography>
            </Box>
        </Box>
    );
});

// Inside the Panel, so the theme it reads is the panel's (dark in neutral mode).
const VsupArc = observer(function VsupArc() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    const tokens = useTheme().tokens;
    const palette = terrainPalette(context.colormapPreset, context.continuousColors);
    const colorAt = (value: number, uncertainty: number) => terrainColor(palette, value, uncertainty).formatHex();
    const cells = context.continuousColors
        ? arcCells(CONTINUOUS_RINGS, () => CONTINUOUS_SECTORS, colorAt)
        : arcCells(VSUP_DEPTH, ring => 2 ** ring, colorAt);
    const arc = d3.arc<Cell>();
    const [low, high] = context.ensemble.meanRange;
    const caption = { display: "block", color: "text.secondary", textAlign: "center" };
    // Labels are HTML rather than SVG text so they keep the UI's type size however wide the panel scales the arc.
    return (
        <Box sx={{ width: 1, maxWidth: 320, mx: "auto" }}>
            <Typography variant="caption" sx={caption}>mean height</Typography>
            <svg viewBox={`${-OUTER_RADIUS - 2} ${-OUTER_RADIUS - 2} ${2 * OUTER_RADIUS + 4} ${OUTER_RADIUS + 4}`}
                 width="100%" role="img"
                 aria-label="Color legend: mean height around the arc, uncertainty from the outer edge inward">
                {cells.map((cell, index) => (
                    <path key={index} d={arc(cell) ?? undefined} fill={cell.color}
                          stroke={tokens.surface} strokeWidth={context.continuousColors ? 0 : 1} />
                ))}
            </svg>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{low.toFixed(2)}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{high.toFixed(2)}</Typography>
            </Box>
            <Typography variant="caption" sx={caption}>
                {`Certain at the rim, uncertain toward the center; fully faded at σ ≥ ${UNCERTAINTY_REFERENCE}`}
            </Typography>
        </Box>
    );
});

export default observer(function LegendPanel() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    return <Panel panelName="Legend">{context.encoding === "vsup" ? <VsupArc /> : <Colorbar />}</Panel>;
});
