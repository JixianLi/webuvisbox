// ABOUTME: Controls of the Uncertain terrain example: ensemble size and spread, a new random ensemble, height scale,
// ABOUTME: colormap and discrete versus continuous VSUP.

import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { COLORMAP_PRESETS, type UncertainTerrainGlobalContext } from "../UncertainTerrainGlobalContext";
import { SliderOnRelease } from "../../../Panels/SliderOnRelease";

export default observer(function ControlsPanel() {
    const context = useScenario().globalContext as UncertainTerrainGlobalContext;
    const label = { display: "block", color: "text.secondary" };
    return (
        <Panel panelName="Controls">
            <Box sx={{ width: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <SliderOnRelease min={5} max={50} step={1} value={context.memberCount}
                                 label={value => `Ensemble members: ${value}`} onRelease={value => context.setMemberCount(value)} />
                <SliderOnRelease min={0} max={1} step={0.05} value={context.spread}
                                 label={value => `Spread between members: ${value.toFixed(2)}`} onRelease={value => context.setSpread(value)} />
                <Box>
                    <Typography variant="caption" sx={label}>{`Height scale: ${context.heightScale.toFixed(2)}`}</Typography>
                    <Slider size="small" min={0.1} max={1} step={0.05} value={context.heightScale}
                            onChange={(_, value) => context.setHeightScale(value as number)} />
                </Box>
                <Box>
                    <Typography variant="caption" sx={label}>Colormap</Typography>
                    <Select size="small" fullWidth value={context.colormapPreset}
                            onChange={event => context.setColormapPreset(event.target.value)}>
                        {COLORMAP_PRESETS.map(preset => <MenuItem key={preset} value={preset}>{preset}</MenuItem>)}
                    </Select>
                </Box>
                <FormControlLabel
                    control={<Switch size="small" checked={context.continuousColors}
                                     onChange={event => context.setContinuousColors(event.target.checked)} />}
                    label={<Typography variant="body2">Continuous palette</Typography>} />
                <Button size="small" variant="outlined" onClick={() => context.regenerate()}>New random ensemble</Button>
            </Box>
        </Panel>
    );
});
