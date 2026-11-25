// ABOUTME: Controls of the contour uncertainty example: the contour level, the ensemble (members, spread, a new random
// ABOUTME: seed), and what the views show (members or boxplot, which probability, critical points).

import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Panel } from "../../../Panels/Panel";
import { useScenario } from "../../../ScenarioManager/ScenarioManager";
import type { ContourMode, ContourUncertaintyGlobalContext, ProbabilityMode } from "../ContourUncertaintyGlobalContext";

export default observer(function ControlsPanel() {
    const context = useScenario().globalContext as ContourUncertaintyGlobalContext;
    const label = { display: "block", color: "text.secondary" };
    const [minimum, maximum] = context.ensemble.valueRange;
    return (
        <Panel panelName="Controls">
            {/* Clipped sideways: a slider thumb at its maximum carries a 42px touch target past the panel edge. */}
            <Box sx={{ width: 1, overflowX: "clip", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box>
                    <Typography variant="caption" sx={label}>{`Contour level: ${context.level.toFixed(2)}`}</Typography>
                    <Slider size="small" min={Math.ceil(minimum * 100) / 100} max={Math.floor(maximum * 100) / 100}
                            step={0.01} value={context.level} onChange={(_, value) => context.setLevel(value as number)} />
                </Box>
                <Box>
                    <Typography variant="caption" sx={label}>{`Members: ${context.memberCount}`}</Typography>
                    <Slider size="small" min={5} max={50} step={1} value={context.memberCount}
                            onChange={(_, value) => context.setMemberCount(value as number)} />
                </Box>
                <Box>
                    <Typography variant="caption" sx={label}>{`Spread between members: ${context.spread.toFixed(2)}`}</Typography>
                    <Slider size="small" min={0} max={1} step={0.05} value={context.spread}
                            onChange={(_, value) => context.setSpread(value as number)} />
                </Box>
                <Button size="small" variant="outlined" onClick={() => context.newRandomSeed()}>New random ensemble</Button>
                <Box>
                    <Typography variant="caption" sx={label}>Contours</Typography>
                    <ToggleButtonGroup size="small" exclusive fullWidth value={context.contourMode}
                                       onChange={(_, value: ContourMode | null) => value && context.setContourMode(value)}>
                        <ToggleButton value="members">All members</ToggleButton>
                        <ToggleButton value="boxplot">Contour boxplot</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                <Box>
                    <Typography variant="caption" sx={label}>Probability map</Typography>
                    <ToggleButtonGroup size="small" exclusive fullWidth value={context.probabilityMode}
                                       onChange={(_, value: ProbabilityMode | null) => value && context.setProbabilityMode(value)}>
                        <ToggleButton value="exceedance">Above the level</ToggleButton>
                        <ToggleButton value="crossing">Contour crossing</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                <FormControlLabel label="Peaks, pits and saddles" sx={{ ml: 0, gap: 1 }}
                                  control={<Switch size="small" checked={context.showCriticalPoints}
                                                   onChange={event => context.setShowCriticalPoints(event.target.checked)} />} />
            </Box>
        </Panel>
    );
});
