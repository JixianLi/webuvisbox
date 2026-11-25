// ABOUTME: Controls of the volume rendering example: the dataset, the colormap preset, lighting, sampling quality, and
// ABOUTME: resetting the transfer function.

import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { DATASETS, type DatasetName, type VolumeRenderingGlobalContext } from "../VolumeRenderingGlobalContext";
import { COLORMAP_PRESETS, resetTransferFunction, transferFunctionFor } from "../VolumeTransferFunctions";

export default observer(function ControlsPanel() {
    const context = useScenario().globalContext as VolumeRenderingGlobalContext;
    const transferFunction = transferFunctionFor(context, context.dataset);
    const label = { display: "block", color: "text.secondary" };
    const [width, height, depth] = context.volume.dimensions;
    return (
        <Panel panelName="Controls">
            {/* Clipped sideways: a slider thumb at its maximum carries a 42px touch target past the panel edge. */}
            <Box sx={{ width: 1, overflowX: "clip", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box>
                    <Typography variant="caption" sx={label}>Dataset</Typography>
                    <ToggleButtonGroup size="small" exclusive fullWidth value={context.dataset}
                                       onChange={(_, value: DatasetName | null) => value && context.setDataset(value)}>
                        {(Object.keys(DATASETS) as DatasetName[]).map(name => (
                            <ToggleButton key={name} value={name}>{DATASETS[name].label}</ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    <Typography variant="caption" sx={{ ...label, mt: 0.5 }}>
                        {`${DATASETS[context.dataset].description} ${width} × ${height} × ${depth} voxels.`}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" sx={label}>Colormap</Typography>
                    <Select size="small" fullWidth value={transferFunction.colormap.presetName}
                            onChange={event => transferFunction.colormap.setPreset(event.target.value)}>
                        {COLORMAP_PRESETS.map(preset => <MenuItem key={preset} value={preset}>{preset}</MenuItem>)}
                    </Select>
                </Box>
                <Box>
                    <Typography variant="caption" sx={label}>{`Samples per voxel: ${context.samplesPerVoxel}`}</Typography>
                    <Slider size="small" min={0.5} max={4} step={0.5} value={context.samplesPerVoxel}
                            onChange={(_, value) => context.setSamplesPerVoxel(value as number)} />
                </Box>
                <FormControlLabel label="Lighting (gradient shading)" sx={{ ml: 0, gap: 1 }}
                                  control={<Switch size="small" checked={context.lighting}
                                                   onChange={event => context.setLighting(event.target.checked)} />} />
                <Button size="small" variant="outlined" onClick={() => resetTransferFunction(transferFunction, context.dataset)}>
                    Reset transfer function
                </Button>
            </Box>
        </Panel>
    );
});
