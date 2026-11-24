// ABOUTME: Controls of the Lorenz ensemble example: playback (play/pause, time, speed), ensemble size and starting
// ABOUTME: jitter, a new random start, and what the colors show.

import { useState } from "react";
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
import { COLORMAP_PRESETS, type ColorMode, type LorenzEnsembleGlobalContext } from "../LorenzEnsembleGlobalContext";
import { DURATION, SAMPLE_INTERVAL } from "../LorenzSystem";

// A slider that applies its value on release: each value regenerates the ensemble and rebuilds every tube (about a
// second at 200 paths), so applying while dragging would stall the drag. The label follows the drag.
function SliderOnRelease({ value, min, max, step, label, onRelease }: {
    value: number; min: number; max: number; step: number;
    label: (value: number) => string; onRelease: (value: number) => void;
}) {
    const [dragValue, setDragValue] = useState<number | null>(null);
    const shown = dragValue ?? value;
    return (
        <Box>
            <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>{label(shown)}</Typography>
            <Slider size="small" min={min} max={max} step={step} value={shown}
                    onChange={(_, next) => setDragValue(next as number)}
                    onChangeCommitted={(_, next) => { setDragValue(null); onRelease(next as number); }} />
        </Box>
    );
}

export default observer(function ControlsPanel() {
    const context = useScenario().globalContext as LorenzEnsembleGlobalContext;
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
                    <Button size="small" variant="outlined" sx={{ flex: 1 }} onClick={() => context.newRandomStart()}>
                        New random start
                    </Button>
                </Box>
                <Box>
                    <Typography variant="caption" sx={label}>{`Time: ${context.time.toFixed(2)} of ${DURATION}`}</Typography>
                    <Slider size="small" min={0} max={DURATION} step={SAMPLE_INTERVAL} value={context.time}
                            onChange={(_, value) => { context.pause(); context.setTime(value as number); }} />
                </Box>
                <Box>
                    <Typography variant="caption" sx={label}>{`Speed: ${context.speed.toFixed(2)} time units per second`}</Typography>
                    <Slider size="small" min={0.25} max={5} step={0.25} value={context.speed}
                            onChange={(_, value) => context.setSpeed(value as number)} />
                </Box>
                <SliderOnRelease min={10} max={200} step={10} value={context.memberCount}
                                 label={value => `Paths: ${value}`} onRelease={context.setMemberCount} />
                <SliderOnRelease min={-6} max={-1} step={0.5} value={context.jitterExponent}
                                 label={value => `Starting jitter: ${(10 ** value).toExponential(0)}`}
                                 onRelease={context.setJitterExponent} />
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
