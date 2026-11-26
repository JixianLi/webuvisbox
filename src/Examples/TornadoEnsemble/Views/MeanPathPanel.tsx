// ABOUTME: The tornado example's mean path, the ensemble's single "prediction", with every member's position around it at
// ABOUTME: the current time. Linked to the other 3D views.

import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { SingleColorBufferedMesh } from "../../../Renderers/Mesh/SingleColorBufferedMesh";
import type { TornadoEnsembleGlobalContext } from "../TornadoEnsembleGlobalContext";
import { TUBE_RADIAL_SEGMENTS } from "../TornadoDataServer";
import { LinkedCanvas } from "./LinkedCanvas";
import { MemberPositions } from "./MemberPositions";

const MEMBER_RADIUS = 0.06;

const MeanPath = observer(function MeanPath() {
    const context = useScenario().globalContext as TornadoEnsembleGlobalContext;
    const tube = context.ensemble.meanPathTube;
    const color = useTheme().tokens.text;
    const segments = Math.max(0, context.visibleSampleCount - 1);
    return (
        <SingleColorBufferedMesh vertices={tube.vertices} normals={tube.normals} indices={tube.indices} color={color}
                                 visibleIndexCount={segments * TUBE_RADIAL_SEGMENTS * 6} shininess={30} />
    );
});

const help = (
    <Typography variant="body2">
        The mean of the members' positions at each time: what a single forecast would show. The spheres are the members
        at the current time, gathered around it. Moving the view moves the other 3D views; a double click or double tap
        goes back to the start view.
    </Typography>
);

export default function MeanPathPanel() {
    const memberColor = useTheme().tokens.textSecondary;
    return (
        <Panel panelName="Mean path" helpContent={help}>
            <Box sx={{ width: 1, height: 1, minHeight: 0 }}>
                <LinkedCanvas>
                    <MeanPath />
                    <MemberPositions color={memberColor} radius={MEMBER_RADIUS} />
                </LinkedCanvas>
            </Box>
        </Panel>
    );
}
