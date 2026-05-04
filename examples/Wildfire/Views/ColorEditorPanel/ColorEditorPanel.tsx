import Panel from "@/Panels/Panel";
import type PresetLinearColormap from "@/Renderers/Colormaps/PresetLinearColormap";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "../../WildfireGlobalContext";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, Divider } from "@mui/material";
import ColormapPlot from "./ColormapPlot";

export const ColorEditorPanel = observer(() => {
    const globalContext = useScenario().globalContext as WildfireGlobalContext;
    if (!globalContext) {
        return (
            <Panel panelName="Color Editor">
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
            <Panel panelName="Color Editor">
                <Box p={2}>
                    <Typography color="error">No scalar fields available</Typography>
                </Box>
            </Panel>
        );
    }

    // Both should be the same singleton instance
    const textureManager = globalContext.textureManager;
    const colormap = textureManager.getColormap(currentScalarName) as PresetLinearColormap;

    if (!colormap) {
        return (
            <Panel panelName="Color Editor">
                <Box p={2}>
                    <Typography color="warning">Loading colormap... ({currentScalarName})</Typography>
                    <Typography variant="caption" display="block">
                        Available: {Array.from(Object.keys(globalContext.scalars.tfs || {})).join(', ')}
                    </Typography>
                </Box>
            </Panel>
        );
    }

    return (
        <Panel panelName="Color Editor">
            <Box p={2}>
                <Typography variant="h6" gutterBottom>
                    Colormap Editor
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
                    Current colormap: <strong>{currentScalarName}</strong>
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Control points: {colormap.colorControlPoints.length}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <ColormapPlot scalarName={currentScalarName} />
            </Box>
        </Panel>
    );
});

export default ColorEditorPanel;
