import Panel from "@/Panels/Panel";
import type OpacityMap from "@/Renderers/Colormaps/OpacityMap";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, Divider } from "@mui/material";
import OpacityPlot from "./OpacityPlot";

export const OpacityEditorPanel = observer(() => {
    const globalContext = useScenario().globalContext as WildfireGlobalContext;
    if (!globalContext) {
        return (
            <Panel panelName="Opacity Editor">
                <Box p={2}>
                    <Typography color="warning">Loading</Typography>
                </Box>
            </Panel>
        );
    }
    const scalarNames = globalContext.scalars.scalarNames;
    const [currentScalarName, setCurrentScalarName] = useState(scalarNames[0] || "NFUEL_CAT");

    if (!scalarNames || scalarNames.length === 0) {
        return (
            <Panel panelName="Opacity Editor">
                <Box p={2}>
                    <Typography color="error">No scalar fields available</Typography>
                </Box>
            </Panel>
        );
    }

    const textureManager = globalContext.textureManager;
    const opacityMap = textureManager.getOpacityMap(currentScalarName) as OpacityMap;

    if (!opacityMap) {
        return (
            <Panel panelName="Opacity Editor">
                <Box p={2}>
                    <Typography color="warning">Loading opacity map... ({currentScalarName})</Typography>
                </Box>
            </Panel>
        );
    }

    return (
        <Panel panelName="Opacity Editor">
            <Box p={2}>
                <Typography variant="h6" gutterBottom>
                    Opacity Editor
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="scalar-select-label">Scalar Field</InputLabel>
                    <Select
                        labelId="scalar-select-label"
                        id="scalar-select"
                        value={currentScalarName}
                        label="Scalar Field"
                        onChange={(e) => setCurrentScalarName(e.target.value)}
                    >
                        {scalarNames.map(name => (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current opacity map: <strong>{currentScalarName}</strong>
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Control points: {opacityMap.opacityControlPoints.length}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <OpacityPlot scalarName={currentScalarName} />
            </Box>
        </Panel>
    );
});

export default OpacityEditorPanel;
