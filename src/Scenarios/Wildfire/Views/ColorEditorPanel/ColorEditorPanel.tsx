import Panel from "@/Panels/Panel";
import type PresetLinearColormap from "@/Renderers/Colormaps/PresetLinearColormap";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, Divider } from "@mui/material";
import ColormapPlot from "./ColormapPlot";

export const ColorEditorPanel = observer(() => {
    const global_context = useScenario().global_context as WildfireGlobalContext;
    if (!global_context) {
        return (
            <Panel panel_name="Color Editor">
                <Box p={2}>
                    <Typography color="warning">Loading</Typography>
                </Box>
            </Panel>
        );
    }
    const scalar_names = global_context.scalars.scalar_names;
    const [current_scalar_name, setCurrentScalarName] = useState(scalar_names[0] || "NFUEL_CAT");

    if (!scalar_names || scalar_names.length === 0) {
        return (
            <Panel panel_name="Color Editor">
                <Box p={2}>
                    <Typography color="error">No scalar fields available</Typography>
                </Box>
            </Panel>
        );
    }

    // Both should be the same singleton instance
    const texture_manager = global_context.texture_manager;
    const colormap = texture_manager.getColormap(current_scalar_name) as PresetLinearColormap;

    if (!colormap) {
        return (
            <Panel panel_name="Color Editor">
                <Box p={2}>
                    <Typography color="warning">Loading colormap... ({current_scalar_name})</Typography>
                    <Typography variant="caption" display="block">
                        Available: {Array.from(Object.keys(global_context.scalars.tfs || {})).join(', ')}
                    </Typography>
                </Box>
            </Panel>
        );
    }

    return (
        <Panel panel_name="Color Editor">
            <Box p={2}>
                <Typography variant="h6" gutterBottom>
                    Colormap Editor
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="scalar-select-label">Scalar Field</InputLabel>
                    <Select
                        labelId="scalar-select-label"
                        id="scalar-select"
                        value={current_scalar_name}
                        label="Scalar Field"
                        onChange={(e) => setCurrentScalarName(e.target.value)}
                    >
                        {scalar_names.map(name => (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current colormap: <strong>{current_scalar_name}</strong>
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Control points: {colormap.color_control_points.length}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <ColormapPlot scalar_name={current_scalar_name} />
            </Box>
        </Panel>
    );
});

export default ColorEditorPanel;