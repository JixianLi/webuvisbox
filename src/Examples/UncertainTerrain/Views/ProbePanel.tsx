// ABOUTME: The Uncertain terrain example's probe: at the vertex under the pointer (or last tapped), a histogram of all
// ABOUTME: member heights on the ensemble's full height range, with the mean marked, plus mean and σ.

import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import * as d3 from "d3";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type { UncertainTerrainGlobalContext } from "../UncertainTerrainGlobalContext";
import { gridPosition } from "../TerrainEnsemble";
import { terrainColor, terrainPalette } from "../TerrainColors";

const WIDTH = 260;
const HEIGHT = 80;
const BIN_COUNT = 24;

export default observer(function ProbePanel() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    const tokens = useTheme().tokens;
    const { memberHeights, mean, standardDeviation } = context.ensemble;
    // A fixed axis (every member, every vertex) so a narrow histogram reads as certain and a wide one as uncertain.
    const heightRange = useMemo(() => {
        let minimum = Infinity;
        let maximum = -Infinity;
        for (const heights of memberHeights) {
            for (const height of heights) {
                minimum = Math.min(minimum, height);
                maximum = Math.max(maximum, height);
            }
        }
        return [minimum, maximum] as [number, number];
    }, [memberHeights]);

    const index = context.probeIndex;
    const heights = memberHeights.map(member => member[index]);
    const x = d3.scaleLinear().domain(heightRange).range([4, WIDTH - 4]);
    const bins = d3.bin().domain(heightRange).thresholds(d3.range(1, BIN_COUNT).map(bin =>
        heightRange[0] + (bin / BIN_COUNT) * (heightRange[1] - heightRange[0])))(heights);
    const tallest = Math.max(1, ...bins.map(bin => bin.length));
    const y = d3.scaleLinear().domain([0, tallest]).range([HEIGHT - 2, 4]);
    const palette = terrainPalette(context.colormapPreset, context.continuousColors);
    const pointColor = terrainColor(palette, context.normalizedMean[index], context.normalizedUncertainty[index]).formatHex();
    const position = gridPosition(index);

    return (
        <Panel panelName="Probe">
            <Box sx={{ width: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: pointColor, flex: "none" }} />
                    <Typography variant="body2" sx={{ color: "text.primary" }}>
                        {`mean ${mean[index].toFixed(3)}, σ ${standardDeviation[index].toFixed(3)}`}
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {`${heights.length} member heights at (${position.x.toFixed(2)}, ${position.z.toFixed(2)}); point or tap the terrain to move`}
                </Typography>
                {/* Stretched to the panel (preserveAspectRatio none): bars and lines only, so nothing distorts visibly. */}
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} preserveAspectRatio="none"
                     role="img" aria-label="Histogram of member heights">
                    {bins.map((bin, binIndex) => bin.length > 0 && (
                        <rect key={binIndex} x={x(bin.x0!) + 1} width={Math.max(1, x(bin.x1!) - x(bin.x0!) - 2)}
                              y={y(bin.length)} height={HEIGHT - 2 - y(bin.length)} rx={2} fill={tokens.textSecondary} />
                    ))}
                    <line x1={x(mean[index])} x2={x(mean[index])} y1={2} y2={HEIGHT - 2} stroke={tokens.text} strokeWidth={2}
                          vectorEffect="non-scaling-stroke" />
                    <line x1={4} x2={WIDTH - 4} y1={HEIGHT - 1} y2={HEIGHT - 1} stroke={tokens.border} />
                </svg>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{heightRange[0].toFixed(2)}</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>height</Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>{heightRange[1].toFixed(2)}</Typography>
                </Box>
            </Box>
        </Panel>
    );
});
