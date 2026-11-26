// ABOUTME: The tornado example's uncertainty tube: around the mean path, a rounded-square cross-section turned and sized
// ABOUTME: to the members' spread (so its twist shows), colored by the spread. Linked to the other views.

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
        The tube follows the ensemble's mean path. Its cross-section is a superellipse (a rounded square) turned to the
        two directions in which the members spread most and least across the path, with half-widths their
        root-mean-square spread in each: where the members spread more one way than the other, the tube flattens, and
        where that direction turns about the path, the corners show the tube twisting. Colored by the spread, on the
        colorbar's scale. Moving the view
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
