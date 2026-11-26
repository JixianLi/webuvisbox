// ABOUTME: Controls of the tornado ensemble example: playback (play/pause, time, speed), ensemble size, how fast the
// ABOUTME: members' variability grows, a new random ensemble, and what the colors show.

import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import { COLORMAP_PRESETS, type ColorMode, type TornadoEnsembleGlobalContext } from "../TornadoEnsembleGlobalContext";
import { DURATION, SAMPLE_INTERVAL, VARIABILITY_GROWTH_RANGE } from "../TornadoFlow";
import { SliderOnRelease } from "../../../Panels/SliderOnRelease";


export default observer(function ControlsPanel() {
    const context = useScenario().globalContext as TornadoEnsembleGlobalContext;
    const label = { display: "block", color: "text.secondary" };
    return (
        <Panel panelName="Controls">
            {/* Clipped sideways: a slider thumb at its maximum carries a 42px touch target past the panel edge. */}
            <Box sx={{ width: 1, overflowX: "clip", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button size="small" variant="contained" sx={{ flex: 1 }}
                            onClick={() => (context.playing ? context.pause() : context.play())}>
                        {context.playing ? "Pause" : "Play"}
                    </Button>
                    <Button size="small" variant="outlined" sx={{ flex: 1 }} onClick={() => context.newRandomEnsemble()}>
                        New random ensemble
                    </Button>
                </Box>
                <Box>
                    <Typography variant="caption" sx={label}>{`Time: ${context.time.toFixed(2)} of ${DURATION}`}</Typography>
                    <Slider size="small" min={0} max={DURATION} step={SAMPLE_INTERVAL} value={context.time}
                            onChange={(_, value) => { context.pause(); context.setTime(value as number); }} />
                </Box>
                <Box>
                    <Typography variant="caption" sx={label}>{`Speed: ${context.speed.toFixed(2)} time units per second`}</Typography>
                    <Slider size="small" min={0.25} max={3} step={0.25} value={context.speed}
                            onChange={(_, value) => context.setSpeed(value as number)} />
                </Box>
                <SliderOnRelease min={10} max={200} step={10} value={context.memberCount}
                                 label={value => `Paths: ${value}`} onRelease={context.setMemberCount} />
                <SliderOnRelease min={VARIABILITY_GROWTH_RANGE[0]} max={VARIABILITY_GROWTH_RANGE[1]} step={0.0025}
                                 value={context.variabilityGrowth}
                                 label={value => `Variability growth: ${value.toFixed(4)}`}
                                 onRelease={context.setVariabilityGrowth} />
                <Box>
                    <Typography variant="caption" sx={label}>Color by</Typography>
                    <ToggleButtonGroup size="small" exclusive fullWidth value={context.colorMode}
                                       onChange={(_, value: ColorMode | null) => value && context.setColorMode(value)}>
                        <ToggleButton value="spread">Ensemble spread</ToggleButton>
                        <ToggleButton value="time">Time</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                <Box>
                    <Typography variant="caption" sx={label}>Colormap</Typography>
                    <Select size="small" fullWidth value={context.colormapPreset}
                            onChange={event => context.setColormapPreset(event.target.value)}>
                        {COLORMAP_PRESETS.map(preset => <MenuItem key={preset} value={preset}>{preset}</MenuItem>)}
                    </Select>
                </Box>
            </Box>
        </Panel>
    );
});
