import Panel from "@/Panels/Panel";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "@/Scenarios/UncertaintyTube/UncertaintyTubeGlobalContext";
import { LazyTextField } from "@/Panels/Lazyfields";
import Stack from "@mui/material/Stack";
import { runInAction } from "mobx";
import Button from "@mui/material/Button";
import { clamp } from "@/Helpers/MathHelper";
import QueueIcon from '@mui/icons-material/Queue';
import DeleteIcon from '@mui/icons-material/Delete';

const SeedPlacementPanel = observer(() => {
    const scenario = useScenario();
    const globalContext = scenario.globalContext as UncertaintyTubeGlobalContext;

    const seedPlacementConfig = globalContext.seedPlacement;
    const [minX, maxX, minY, maxY, minZ, maxZ] = globalContext.sbBounds;

    return (
        <Panel panelName="Seed Placement">
            <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={0} style={{ padding: '10px' }}>
                    <Grid size={12}>
                        <Stack direction='row'>
                            <FormControlLabel
                                control={<Switch
                                    checked={seedPlacementConfig.useRandomSeeding}
                                    onChange={(e) => {
                                        runInAction(() => {
                                            globalContext.seedPlacement.useRandomSeeding = e.target.checked;
                                        });
                                    }}
                                    name="seedPlacement"
                                    color="primary"
                                />}
                                label='Random'
                            />
                            <LazyTextField type='number' label='Number of Seeds'
                                defaultValue={seedPlacementConfig.randomSeedCount}
                                key={'seed_placement_random_seed_count_field' + seedPlacementConfig.randomSeedCount + ''}
                                onBlur={(e) => {
                                    runInAction(() => {
                                        let value = parseInt(e.target.value);
                                        if (typeof value === 'number' && !isNaN(value) && value >= 0) {
                                            seedPlacementConfig.randomSeedCount = value;
                                        }
                                    });
                                }}
                            />
                        </Stack></Grid>
                    <Grid size={12} sx={{ mt: 2 }}>
                        <Stack direction='row' spacing={0} >
                            <FormControlLabel
                                control={<Switch
                                    checked={seedPlacementConfig.useUniformSeeding}
                                    onChange={(e) => {
                                        runInAction(() => {
                                            seedPlacementConfig.useUniformSeeding = e.target.checked;
                                        });
                                    }}
                                />}
                                label='Uniform'
                            />
                            <LazyTextField type='number' label='x'
                                defaultValue={seedPlacementConfig.numUniformSeeds[0]}
                                key={'seed_placement_uniform_seed_count_field_x' + seedPlacementConfig.numUniformSeeds[0] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value) && value >= 0) {
                                            seedPlacementConfig.numUniformSeeds[0] = value;
                                        }
                                    });
                                }}
                            />
                            <LazyTextField type='number' label='y'
                                defaultValue={seedPlacementConfig.numUniformSeeds[1]}
                                key={'seed_placement_uniform_seed_count_field_y' + seedPlacementConfig.numUniformSeeds[1] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value) && value >= 0) {
                                            seedPlacementConfig.numUniformSeeds[1] = value;
                                        }
                                    });
                                }}
                            />
                            <LazyTextField type='number' label='z'
                                defaultValue={seedPlacementConfig.numUniformSeeds[2]}
                                key={'seed_placement_uniform_seed_count_field_z' + seedPlacementConfig.numUniformSeeds[2] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value) && value >= 0) {
                                            seedPlacementConfig.numUniformSeeds[2] = value;
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
                                    checked={seedPlacementConfig.useManualSeeding}
                                    onChange={(e) => {
                                        runInAction(() => {
                                            seedPlacementConfig.useManualSeeding = e.target.checked;
                                        });
                                    }}
                                />}
                                label='manual'
                            />
                            <LazyTextField type='text' label='x'
                                defaultValue={seedPlacementConfig.manualSeedLocation[0]}
                                key={'seed_placement_manual_seed_location_field_x' + seedPlacementConfig.manualSeedLocation[0] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value)) {
                                            value = clamp(value, minX, maxX);
                                            seedPlacementConfig.manualSeedLocation[0] = value;
                                        }
                                    });
                                }}
                            />
                            <LazyTextField type='text' label='y'
                                defaultValue={seedPlacementConfig.manualSeedLocation[1]}
                                key={'seed_placement_manual_seed_location_field_y' + seedPlacementConfig.manualSeedLocation[1] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value)) {
                                            value = clamp(value, minY, maxY);
                                            seedPlacementConfig.manualSeedLocation[1] = value;
                                        }
                                    });
                                }}
                            />
                            <LazyTextField type='text' label='z'
                                defaultValue={seedPlacementConfig.manualSeedLocation[2]}
                                key={'seed_placement_manual_seed_location_field_z' + seedPlacementConfig.manualSeedLocation[2] + ''}
                                onBlur={(v) => {
                                    runInAction(() => {
                                        let value = parseFloat(v.target.value);
                                        if (typeof value === 'number' && !isNaN(value)) {
                                            value = clamp(value, minZ, maxZ);
                                            seedPlacementConfig.manualSeedLocation[2] = value;
                                        }
                                    });
                                }}
                            />
                        </Stack>
                    </Grid>
                    <Grid size={12} sx={{ mt: 2 ,justifyContent: 'center', alignItems: 'center', display: 'flex'}}>
                        <Stack direction='row' spacing={2}>
                            <Button variant="contained" startIcon={<QueueIcon />} onClick={globalContext.addSeeds}>Add Seeds</Button>
                            <Button variant="contained" startIcon={<DeleteIcon />} onClick={globalContext.deleteSeeds}>Delete Seeds</Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Panel >
    );
});

export default SeedPlacementPanel;
