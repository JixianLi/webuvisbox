import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import Grid from "@mui/material/Grid";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

import Panel from "@/Panels/Panel";
import { LazyTextField } from "@/Panels/Lazyfields";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../UncertaintyTubeGlobalContext";

const SeedboxConfigPanel = observer(() => {
    const scenario = useScenario();
    const globalContext = scenario.globalContext as UncertaintyTubeGlobalContext;
    const seedboxConfig = globalContext.seedbox;

    // Number of steps for sliders (higher value = finer control)
    const STEP_DIVISOR = 20;

    const [xMin,xMax,yMin,yMax,zMin,zMax] = globalContext.sbBounds;

    const pxMin = xMin;
    const pxMax = xMax - seedboxConfig.size[0];
    const pyMin = yMin;
    const pyMax = yMax - seedboxConfig.size[1];
    const pzMin = zMin;
    const pzMax = zMax - seedboxConfig.size[2];

    const sxMin = 0;
    const sxMax = xMax - seedboxConfig.position[0];
    const syMin = 0;
    const syMax = yMax - seedboxConfig.position[1];
    const szMin = 0;
    const szMax = zMax - seedboxConfig.position[2];

    const disablePxSlider = (pxMax - pxMin) < 1e-6;
    const disablePySlider = (pyMax - pyMin) < 1e-6;
    const disablePzSlider = (pzMax - pzMin) < 1e-6;

    const disableSxSlider = (sxMax - sxMin) < 1e-6;
    const disableSySlider = (syMax - syMin) < 1e-6;
    const disableSzSlider = (szMax - szMin) < 1e-6;

    // Helper to format numbers to 6 digits after decimal
    const format6 = (num: number) => num.toFixed(6);

    return (
        <Panel panelName="Seedbox Config">
            <Grid container spacing={0} sx={{ p: "10px" }}>
                <Grid size={12} sx={{ display: 'flex', flexDirection: 'row', justifyContent: "center" }}>
                    <FormControlLabel control={<Switch checked={seedboxConfig.visible} onChange={(e) => {
                        runInAction(() => {
                            seedboxConfig.visible = e.target.checked;
                        });
                    }} />} label="Visible" />

                    <FormControlLabel control={<Switch checked={seedboxConfig.active} onChange={(e) => {
                        runInAction(() => {
                            seedboxConfig.active = e.target.checked;
                        });
                    }} />} label="Active" />
                </Grid>

                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Position X"
                            type="text"
                            defaultValue={format6(seedboxConfig.position[0])}
                            key={'seedbox_position_x_field' + seedboxConfig.position[0] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= pxMin && val <= pxMax) {
                                    runInAction(() => {
                                        seedboxConfig.position[0] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedboxConfig.position[0]}
                            min={pxMin}
                            max={pxMax}
                            step={(pxMax - pxMin)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedboxConfig.position[0] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disablePxSlider}
                        />
                    </Grid>
                </Grid>

                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Position Y"
                            type="text"
                            defaultValue={format6(seedboxConfig.position[1])}
                            key={'seedbox_position_y_field' + seedboxConfig.position[1] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= pyMin && val <= pyMax) {
                                    runInAction(() => {
                                        seedboxConfig.position[1] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedboxConfig.position[1]}
                            min={pyMin}
                            max={pyMax}
                            step={(pyMax - pyMin)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedboxConfig.position[1] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disablePySlider}
                        />
                    </Grid>
                </Grid>

                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Position Z"
                            type="text"
                            defaultValue={format6(seedboxConfig.position[2])}
                            key={'seedbox_position_z_field' + seedboxConfig.position[2] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= pzMin && val <= pzMax) {
                                    runInAction(() => {
                                        seedboxConfig.position[2] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedboxConfig.position[2]}
                            min={pzMin}
                            max={pzMax}
                            step={(pzMax - pzMin)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedboxConfig.position[2] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disablePzSlider}
                        />
                    </Grid>
                </Grid>

                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Size X"
                            type="text"
                            defaultValue={format6(seedboxConfig.size[0])}
                            key={'seedbox_size_x_field' + seedboxConfig.size[0] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= sxMin && val <= sxMax) {
                                    runInAction(() => {
                                        seedboxConfig.size[0] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedboxConfig.size[0]}
                            min={sxMin}
                            max={sxMax}
                            step={(sxMax - sxMin)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedboxConfig.size[0] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disableSxSlider}
                        />
                    </Grid>
                </Grid>

                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Size Y"
                            type="text"
                            defaultValue={format6(seedboxConfig.size[1])}
                            key={'seedbox_size_y_field' + seedboxConfig.size[1] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= syMin && val <= syMax) {
                                    runInAction(() => {
                                        seedboxConfig.size[1] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedboxConfig.size[1]}
                            min={syMin}
                            max={syMax}
                            step={(syMax - syMin)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedboxConfig.size[1] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disableSySlider}
                        />
                    </Grid>
                </Grid>

                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Size Z"
                            type="text"
                            defaultValue={format6(seedboxConfig.size[2])}
                            key={'seedbox_size_z_field' + seedboxConfig.size[2] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= szMin && val <= szMax) {
                                    runInAction(() => {
                                        seedboxConfig.size[2] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedboxConfig.size[2]}
                            min={szMin}
                            max={szMax}
                            step={(szMax - szMin)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedboxConfig.size[2] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disableSzSlider}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Panel>
    );
});
export default SeedboxConfigPanel;
