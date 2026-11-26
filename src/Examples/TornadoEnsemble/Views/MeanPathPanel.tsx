// ABOUTME: The tornado example's mean path, the ensemble's single "prediction", with every member's position around it at
// ABOUTME: the current time. Linked to the other 3D views.

import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { SingleColorBufferedMesh } from "../../../Renderers/Mesh/SingleColorBufferedMesh";
import type { TornadoEnsembleGlobalContext } from "../TornadoEnsembleGlobalContext";
import { TUBE_RADIAL_SEGMENTS } from "../TornadoDataServer";
import { MEAN_PATH_COLOR, MEMBER_COLOR } from "../TornadoColors";
import { LinkedCanvas } from "./LinkedCanvas";
import { MemberPositions } from "./MemberPositions";

const MEMBER_RADIUS = 0.06;

const MeanPath = observer(function MeanPath() {
    const context = useScenario().globalContext as TornadoEnsembleGlobalContext;
    const tube = context.ensemble.meanPathTube;
    const segments = Math.max(0, context.visibleSampleCount - 1);
    return (
        <SingleColorBufferedMesh vertices={tube.vertices} normals={tube.normals} indices={tube.indices} color={MEAN_PATH_COLOR}
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
    return (
        <Panel panelName="Mean path" scene helpContent={help}>
            <Box sx={{ width: 1, height: 1, minHeight: 0 }}>
                <LinkedCanvas>
                    <MeanPath />
                    <MemberPositions color={MEMBER_COLOR} radius={MEMBER_RADIUS} />
                </LinkedCanvas>
            </Box>
        </Panel>
    );
}
