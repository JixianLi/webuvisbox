import Panel from "@/Panels/Panel";
import type OpacityMap from "@/Renderers/Colormaps/OpacityMap";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, Divider } from "@mui/material";
import OpacityPlot from "./OpacityPlot";

export const OpacityEditorPanel = observer(() => {
    const global_context = useScenario().global_context as WildfireGlobalContext;
    if (!global_context) {
        return (
            <Panel panel_name="Opacity Editor">
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
            <Panel panel_name="Opacity Editor">
                <Box p={2}>
                    <Typography color="error">No scalar fields available</Typography>
                </Box>
            </Panel>
        );
    }

    const texture_manager = global_context.texture_manager;
    const opacityMap = texture_manager.getOpacityMap(current_scalar_name) as OpacityMap;

    if (!opacityMap) {
        return (
            <Panel panel_name="Opacity Editor">
                <Box p={2}>
                    <Typography color="warning">Loading opacity map... ({current_scalar_name})</Typography>
                </Box>
            </Panel>
        );
    }

    return (
        <Panel panel_name="Opacity Editor">
            <Box p={2}>
                <Typography variant="h6" gutterBottom>
                    Opacity Editor
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
                    Current opacity map: <strong>{current_scalar_name}</strong>
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Control points: {opacityMap.opacity_control_points.length}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <OpacityPlot scalar_name={current_scalar_name} />
            </Box>
        </Panel>
    );
});

export default OpacityEditorPanel;
