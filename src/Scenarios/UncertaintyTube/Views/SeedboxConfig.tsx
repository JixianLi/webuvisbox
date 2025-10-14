import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import Grid from "@mui/material/Grid";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

import Panel from "@/Panels/Panel";
import { LazyTextField } from "@/Panels/Lazyfields";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "@/Scenarios/UncertaintyTube/UncertaintyTubeGlobalData";

const SeedboxConfigPanel = observer(() => {
    const scenario = useScenario();
    const global_context = scenario.global_context as UncertaintyTubeGlobalContext;
    const seedbox_config = global_context.seedbox;

    // Number of steps for sliders (higher value = finer control)
    const STEP_DIVISOR = 20;

    const [x_min,x_max,y_min,y_max,z_min,z_max] = global_context.sb_bounds;
    
    const px_min = x_min;
    const px_max = x_max - seedbox_config.size[0];
    const py_min = y_min;
    const py_max = y_max - seedbox_config.size[1];
    const pz_min = z_min;
    const pz_max = z_max - seedbox_config.size[2];

    const sx_min = 0;
    const sx_max = x_max - seedbox_config.position[0];
    const sy_min = 0;
    const sy_max = y_max - seedbox_config.position[1];
    const sz_min = 0;
    const sz_max = z_max - seedbox_config.position[2];

    const disable_px_slider = (px_max - px_min) < 1e-6;
    const disable_py_slider = (py_max - py_min) < 1e-6;
    const disable_pz_slider = (pz_max - pz_min) < 1e-6;

    const disable_sx_slider = (sx_max - sx_min) < 1e-6;
    const disable_sy_slider = (sy_max - sy_min) < 1e-6;
    const disable_sz_slider = (sz_max - sz_min) < 1e-6;

    // Helper to format numbers to 6 digits after decimal
    const format6 = (num: number) => num.toFixed(6);

    return (
        <Panel panel_name="Seedbox Config">
            <Grid container spacing={0} sx={{ p: "10px" }}>
                <Grid size={12} sx={{ display: 'flex', flexDirection: 'row', justifyContent: "center" }}>
                    <FormControlLabel control={<Switch checked={seedbox_config.visible} onChange={(e) => {
                        runInAction(() => {
                            seedbox_config.visible = e.target.checked;
                        });
                    }} />} label="Visible" />

                    <FormControlLabel control={<Switch checked={seedbox_config.active} onChange={(e) => {
                        runInAction(() => {
                            seedbox_config.active = e.target.checked;
                        });
                    }} />} label="Active" />
                </Grid>

                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Position X"
                            type="text"
                            defaultValue={format6(seedbox_config.position[0])}
                            key={'seedbox_position_x_field' + seedbox_config.position[0] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= px_min && val <= px_max) {
                                    runInAction(() => {
                                        seedbox_config.position[0] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedbox_config.position[0]}
                            min={px_min}
                            max={px_max}
                            step={(px_max - px_min)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedbox_config.position[0] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disable_px_slider}
                        />
                    </Grid>
                </Grid>

                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Position Y"
                            type="text"
                            defaultValue={format6(seedbox_config.position[1])}
                            key={'seedbox_position_y_field' + seedbox_config.position[1] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= py_min && val <= py_max) {
                                    runInAction(() => {
                                        seedbox_config.position[1] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedbox_config.position[1]}
                            min={py_min}
                            max={py_max}
                            step={(py_max - py_min)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedbox_config.position[1] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disable_py_slider}
                        />
                    </Grid>
                </Grid>
                
                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Position Z"
                            type="text"
                            defaultValue={format6(seedbox_config.position[2])}
                            key={'seedbox_position_z_field' + seedbox_config.position[2] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= pz_min && val <= pz_max) {
                                    runInAction(() => {
                                        seedbox_config.position[2] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedbox_config.position[2]}
                            min={pz_min}
                            max={pz_max}
                            step={(pz_max - pz_min)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedbox_config.position[2] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disable_pz_slider}
                        />
                    </Grid>
                </Grid>
                
                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Size X"
                            type="text"
                            defaultValue={format6(seedbox_config.size[0])}
                            key={'seedbox_size_x_field' + seedbox_config.size[0] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= sx_min && val <= sx_max) {
                                    runInAction(() => {
                                        seedbox_config.size[0] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedbox_config.size[0]}
                            min={sx_min}
                            max={sx_max}
                            step={(sx_max - sx_min)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedbox_config.size[0] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disable_sx_slider}
                        />
                    </Grid>
                </Grid>
                
                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Size Y"
                            type="text"
                            defaultValue={format6(seedbox_config.size[1])}
                            key={'seedbox_size_y_field' + seedbox_config.size[1] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= sy_min && val <= sy_max) {
                                    runInAction(() => {
                                        seedbox_config.size[1] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedbox_config.size[1]}
                            min={sy_min}
                            max={sy_max}
                            step={(sy_max - sy_min)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedbox_config.size[1] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disable_sy_slider}
                        />
                    </Grid>
                </Grid>
                
                <Grid size={12} sx={{ mt: 2, display: 'flex', flexDirection: 'row', justifyContent: "left" }}>
                    <Grid size={6}>
                        <LazyTextField
                            label="Size Z"
                            type="text"
                            defaultValue={format6(seedbox_config.size[2])}
                            key={'seedbox_size_z_field' + seedbox_config.size[2] + ''}
                            onBlur={e => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= sz_min && val <= sz_max) {
                                    runInAction(() => {
                                        seedbox_config.size[2] = val;
                                    });
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={6} sx={{px:'20px', mt:1}}>
                        <Slider
                            value={seedbox_config.size[2]}
                            min={sz_min}
                            max={sz_max}
                            step={(sz_max - sz_min)/STEP_DIVISOR}
                            onChange={(_, val) => {
                                runInAction(() => {
                                    seedbox_config.size[2] = val as number;
                                });
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={format6}
                            disabled={disable_sz_slider}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Panel>
    );
});
export default SeedboxConfigPanel;