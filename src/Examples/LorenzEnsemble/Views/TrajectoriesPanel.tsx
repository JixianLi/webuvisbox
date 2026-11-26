// ABOUTME: The Lorenz ensemble example's main view: every member's trajectory as a tube, grown up to the current time
// ABOUTME: and colored by the ensemble's spread (or by time), with a marker at each member's current position.

import { useMemo } from "react";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { LinearTubeMesh } from "../../../Renderers/Mesh/LinearTubeMesh";
import type { LorenzEnsembleGlobalContext } from "../LorenzEnsembleGlobalContext";
import { sampleColors } from "../LorenzColors";
import { LinkedCanvas } from "./LinkedCanvas";
import { MemberPositions } from "./MemberPositions";

// In Lorenz units.
const TUBE_RADIUS = 0.12;
const MARKER_RADIUS = 0.45;

const EnsembleTubes = observer(function EnsembleTubes() {
    const context = useScenario().globalContext as LorenzEnsembleGlobalContext;
    const { paths, spread } = context.ensemble;
    const preset = context.colormapPreset;
    const colorMode = context.colorMode;
    // Every member shares the per-sample colors (they depend on time only), so one array serves all paths.
    const colors = useMemo(() => {
        const shared = sampleColors(preset, colorMode, spread);
        return paths.map(() => shared);
    }, [preset, colorMode, spread, paths]);
    return (
        <LinearTubeMesh paths={paths} colors={colors} radius={TUBE_RADIUS} radialSegments={8}
                        visiblePointCount={context.visibleSampleCount} shininess={40} specular="#444444" />
    );
});

export default function TrajectoriesPanel() {
    const markerColor = useTheme().tokens.text;
    return (
        <Panel panelName="Trajectories">
            <Box sx={{ width: 1, height: 1, minHeight: 0 }}>
                <LinkedCanvas>
                    <EnsembleTubes />
                    <MemberPositions color={markerColor} radius={MARKER_RADIUS} />
                </LinkedCanvas>
            </Box>
        </Panel>
    );
}
