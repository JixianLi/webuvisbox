import Panel from "@/Panels/Panel";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalData from "@/Scenarios/UncertaintyTube/UncertaintyTubeGlobalData";
import { LazyTextField } from "@/Panels/Lazyfields";
import Stack from "@mui/material/Stack";
import { runInAction } from "mobx";
import Button from "@mui/material/Button";
import { clamp } from "@/Helpers/MathHelper";
import QueueIcon from '@mui/icons-material/Queue';
import DeleteIcon from '@mui/icons-material/Delete';

const SeedPlacementPanel = observer(() => {
    const scenario = useScenario();
    const global_context = scenario.global_context as UncertaintyTubeGlobalData;

    const seed_placement_config = global_context.seed_placement;
    const [min_x, max_x, min_y, max_y, min_z, max_z] = global_context.sb_bounds;

    return (
        <Panel panel_name="Seed Placement">
            <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={0} style={{ padding: '10px' }}>
                    <Grid size={12}>
                        <Stack direction='row'>
                            <FormControlLabel
                                control={<Switch
                                    checked={seed_placement_config.use_random_seeding}
                                    onChange={(e) => {
                                        runInAction(() => {
                                            global_context.seed_placement.use_random_seeding = e.target.checked;
                                        });
                                    }}
                                    name="seedPlacement"
                                    color="primary"
                                />}
                                label='Random'
                            />
                            <LazyTextField type='number' label='Number of Seeds'
                                defaultValue={seed_placement_config.random_seed_count}
                                key={'seed_placement_random_seed_count_field' + seed_placement_config.random_seed_count + ''}
                                onBlur={(e) => {
                                    runInAction(() => {
                                        let value = parseInt(e.target.value);
                                        if (typeof value === 'number' && !isNaN(value) && value >= 0) {
                                            seed_placement_config.random_seed_count = value;
                                        }
                                    });
                                }}
                            />
                        </Stack></Grid>
                    <Grid size={12} sx={{ mt: 2 }}>
                        <Stack direction='row' spacing={0} >
                            <FormControlLabel
                                control={<Switch
                                    checked={seed_placement_config.use_uniform_seeding}
                                    onChange={(e) => {
                                        runInAction(() => {
                                            seed_placement_config.use_uniform_seeding = e.target.checked;
                                        });
                                    }}
                                />}
                                label='Uniform'
                            />
                            <LazyTextField type='number' label='x'
                                defaultValue={seed_placement_config.num_uniform_seeds[0]}
                                key={'seed_placement_uniform_seed_count_field_x' + seed_placement_config.num_uniform_seeds[0] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value) && value >= 0) {
                                            seed_placement_config.num_uniform_seeds[0] = value;
                                        }
                                    });
                                }}
                            />
                            <LazyTextField type='number' label='y'
                                defaultValue={seed_placement_config.num_uniform_seeds[1]}
                                key={'seed_placement_uniform_seed_count_field_y' + seed_placement_config.num_uniform_seeds[1] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value) && value >= 0) {
                                            seed_placement_config.num_uniform_seeds[1] = value;
                                        }
                                    });
                                }}
                            />
                            <LazyTextField type='number' label='z'
                                defaultValue={seed_placement_config.num_uniform_seeds[2]}
                                key={'seed_placement_uniform_seed_count_field_z' + seed_placement_config.num_uniform_seeds[2] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value) && value >= 0) {
                                            seed_placement_config.num_uniform_seeds[2] = value;
                                        }
                                    });
                                }}
                            />
                        </Stack>
                    </Grid>
                    <Grid size={12} sx={{ mt: 2 }}>
                        <Stack direction='row'>
                            <FormControlLabel
                                control={<Switch
                                    checked={seed_placement_config.use_manual_seeding}
                                    onChange={(e) => {
                                        runInAction(() => {
                                            seed_placement_config.use_manual_seeding = e.target.checked;
                                        });
                                    }}
                                />}
                                label='manual'
                            />
                            <LazyTextField type='text' label='x'
                                defaultValue={seed_placement_config.manual_seed_location[0]}
                                key={'seed_placement_manual_seed_location_field_x' + seed_placement_config.manual_seed_location[0] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value)) {
                                            value = clamp(value, min_x, max_x);
                                            seed_placement_config.manual_seed_location[0] = value;
                                        }
                                    });
                                }}
                            />
                            <LazyTextField type='text' label='y'
                                defaultValue={seed_placement_config.manual_seed_location[1]}
                                key={'seed_placement_manual_seed_location_field_y' + seed_placement_config.manual_seed_location[1] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value)) {
                                            value = clamp(value, min_y, max_y);
                                            seed_placement_config.manual_seed_location[1] = value;
                                        }
                                    });
                                }}
                            />
                            <LazyTextField type='text' label='z'
                                defaultValue={seed_placement_config.manual_seed_location[2]}
                                key={'seed_placement_manual_seed_location_field_z' + seed_placement_config.manual_seed_location[2] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value)) {
                                            value = clamp(value, min_z, max_z);
                                            seed_placement_config.manual_seed_location[2] = value;
                                        }
                                    });
                                }}
                            />
                        </Stack>
                    </Grid>
                    <Grid size={12} sx={{ mt: 2 ,justifyContent: 'center', alignItems: 'center', display: 'flex'}}>
                        <Stack direction='row' spacing={2}>
                            <Button variant="contained" startIcon={<QueueIcon />} onClick={global_context.addSeeds}>Add Seeds</Button>
                            <Button variant="contained" startIcon={<DeleteIcon />} onClick={global_context.deleteSeeds}>Delete Seeds</Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Panel >
    );
});

export default SeedPlacementPanel;