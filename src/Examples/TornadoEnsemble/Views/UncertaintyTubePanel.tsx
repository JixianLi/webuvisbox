// ABOUTME: The tornado example's uncertainty tube: around the mean path, as wide in each direction as the members are
// ABOUTME: spread that way (so elliptical where the spread is lopsided), colored by the spread. Linked to the other views.

import { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { TexturedBufferedMesh } from "../../../Renderers/Mesh/TexturedBufferedMesh";
import type { TornadoEnsembleGlobalContext } from "../TornadoEnsembleGlobalContext";
import { TUBE_RADIAL_SEGMENTS } from "../TornadoDataServer";
import { setTubeColormapPreset, tubeColormapTexture } from "../TornadoColors";
import { LinkedCanvas } from "./LinkedCanvas";

const UncertaintyTube = observer(function UncertaintyTube() {
    const context = useScenario().globalContext as TornadoEnsembleGlobalContext;
    const tube = context.ensemble.uncertaintyTube;
    const preset = context.colormapPreset;
    const texture = useMemo(() => tubeColormapTexture(), []);
    useEffect(() => setTubeColormapPreset(preset), [preset]);
    const segments = Math.max(0, context.visibleSampleCount - 1);
    return (
        <TexturedBufferedMesh vertices={tube.vertices} normals={tube.normals} uv={tube.uv} indices={tube.indices}
                              colormap={texture} visibleIndexCount={segments * TUBE_RADIAL_SEGMENTS * 6}
                              shininess={30} specular="#333333" />
    );
});

const help = (
    <Typography variant="body2">
        The tube follows the ensemble's mean path. Its cross-section is an ellipse whose half-widths are the members'
        root-mean-square distances from the mean in the two directions across the path, so where the members spread
        more one way than the other, the tube flattens. Colored by the spread, on the colorbar's scale. Moving the view
        moves the other 3D views; a double click or double tap goes back to the start view.
    </Typography>
);

export default function UncertaintyTubePanel() {
    return (
        <Panel panelName="Uncertainty tube" helpContent={help}>
            <Box sx={{ width: 1, height: 1, minHeight: 0 }}>
                <LinkedCanvas>
                    <UncertaintyTube />
                </LinkedCanvas>
            </Box>
        </Panel>
    );
}
