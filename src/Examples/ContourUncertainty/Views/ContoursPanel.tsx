// ABOUTME: The contour uncertainty example's main view: every member's contour at the level (spaghetti plot) or the
// ABOUTME: contour boxplot, with each member's peaks, pits and saddles. Pointing at a member highlights it everywhere.

import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type { ContourUncertaintyGlobalContext } from "../ContourUncertaintyGlobalContext";
import type { BandEnvelope, CriticalPointType } from "../ContourAnalysis";
import { GRID_SIZE } from "../ContourEnsemble";
import { contourPath } from "../ContourColors";
import { SquareStage } from "./SquareStage";
import { highlightHandlers } from "./Highlight";

const GLYPH_RADIUS = 1.3;
const GLYPHS: Record<CriticalPointType, { path: string; symbol: string; label: string }> = {
    maximum: { path: `M0,${-GLYPH_RADIUS}L${GLYPH_RADIUS},${0.7 * GLYPH_RADIUS}L${-GLYPH_RADIUS},${0.7 * GLYPH_RADIUS}Z`, symbol: "▲", label: "peaks" },
    minimum: { path: `M0,${GLYPH_RADIUS}L${GLYPH_RADIUS},${-0.7 * GLYPH_RADIUS}L${-GLYPH_RADIUS},${-0.7 * GLYPH_RADIUS}Z`, symbol: "▼", label: "pits" },
    saddle: { path: `M0,${-GLYPH_RADIUS}L${GLYPH_RADIUS},0L0,${GLYPH_RADIUS}L${-GLYPH_RADIUS},0Z`, symbol: "◆", label: "saddles" },
};
const POINT_TYPES: CriticalPointType[] = ["maximum", "saddle", "minimum"];

const CriticalPoints = observer(function CriticalPoints() {
    const context = useScenario().globalContext as ContourUncertaintyGlobalContext;
    const tokens = useTheme().tokens;
    const highlighted = context.highlightedMember;
    const glyphs = (member: number, emphasized: boolean) => context.memberCriticalPoints[member].map(point => (
        <path key={`${member}-${point.column}-${point.row}`} d={GLYPHS[point.type].path}
              transform={`translate(${point.column + 0.5},${point.row + 0.5})`}
              fill={emphasized ? tokens.accentOnSurface : tokens.text} fillOpacity={emphasized ? 1 : 0.4}
              stroke={tokens.surface} strokeWidth={emphasized ? 1.5 : 0.75} vectorEffect="non-scaling-stroke" />
    ));
    return (
        <g pointerEvents="none">
            {context.memberCriticalPoints.map((_, member) => member === highlighted ? null : glyphs(member, false))}
            {highlighted !== null && glyphs(highlighted, true)}
        </g>
    );
});

const Legend = observer(function Legend() {
    const context = useScenario().globalContext as ContourUncertaintyGlobalContext;
    const caption = { color: "text.secondary", lineHeight: 1.5 };
    if (context.contourMode === "boxplot") {
        const outliers = context.boxplot.outlierMembers.length;
        return (
            <Typography variant="caption" sx={caption}>
                Bold: median member (deepest). Dark band: the deepest half of the members. Light band: all but
                outliers. Dashed: {outliers === 0 ? "no outliers" : `${outliers} outlier${outliers > 1 ? "s" : ""}`}.
            </Typography>
        );
    }
    const counts = { maximum: 0, minimum: 0, saddle: 0 };
    context.memberCriticalPoints.forEach(points => points.forEach(point => { counts[point.type] += 1; }));
    const memberCount = context.memberCriticalPoints.length;
    return (
        <Typography variant="caption" sx={caption}>
            One line per member; bold: the mean field's contour.
            {context.showCriticalPoints && ` Per member on average: ${POINT_TYPES.map(type =>
                `${GLYPHS[type].symbol} ${(counts[type] / memberCount).toFixed(1)} ${GLYPHS[type].label}`).join(", ")}.`}
        </Typography>
    );
});

export default observer(function ContoursPanel() {
    const context = useScenario().globalContext as ContourUncertaintyGlobalContext;
    const tokens = useTheme().tokens;
    const { members, mean } = context.ensemble;
    const level = context.level;
    const highlighted = context.highlightedMember;
    const boxplot = context.contourMode === "boxplot" ? context.boxplot : null;
    const line = { fill: "none", vectorEffect: "non-scaling-stroke" as const };
    const band = (envelope: BandEnvelope) => `${contourPath(envelope.maximum, level)}${contourPath(envelope.minimum, level)}`;

    const memberLine = (member: number) => {
        const isOutlier = boxplot?.outlierMembers.includes(member) ?? false;
        if (boxplot && !isOutlier && member !== highlighted) return null;
        const path = contourPath(members[member], level);
        return (
            <g key={member} {...highlightHandlers(context, member)} style={{ cursor: "pointer" }}>
                <path d={path} {...line} stroke="transparent" strokeWidth={10} pointerEvents="stroke" />
                <path d={path} {...line} pointerEvents="none"
                      stroke={member === highlighted ? tokens.accentOnSurface : boxplot ? tokens.textSecondary : tokens.textMuted}
                      strokeWidth={member === highlighted ? 2.5 : boxplot ? 1.25 : 1}
                      strokeOpacity={member === highlighted || boxplot ? 1 : 0.75}
                      strokeDasharray={isOutlier && member !== highlighted ? "4 3" : undefined} />
            </g>
        );
    };
    const order = members.map((_, member) => member).filter(member => member !== highlighted);
    if (highlighted !== null) order.push(highlighted);

    return (
        <Panel panelName="Contours" scene>
            <Box sx={{ width: 1, height: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <SquareStage>
                    <svg viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`} role="img"
                         aria-label={boxplot ? "Contour boxplot of the ensemble" : "Contours of every ensemble member"}>
                        <rect x={0} y={0} width={GRID_SIZE} height={GRID_SIZE} fill="none" stroke={tokens.border}
                              vectorEffect="non-scaling-stroke" />
                        {boxplot && (
                            <g pointerEvents="none">
                                <path d={band(boxplot.outerBand)} fill={tokens.text} fillOpacity={0.12} fillRule="evenodd" />
                                <path d={band(boxplot.innerBand)} fill={tokens.text} fillOpacity={0.28} fillRule="evenodd" />
                            </g>
                        )}
                        {order.map(memberLine)}
                        <path d={contourPath(boxplot ? members[boxplot.medianMember] : mean, level)} {...line}
                              stroke={tokens.text} strokeWidth={2.5} pointerEvents="none" />
                        {context.showCriticalPoints && <CriticalPoints />}
                    </svg>
                </SquareStage>
                <Legend />
            </Box>
        </Panel>
    );
});
