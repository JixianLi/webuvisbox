import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import SendIcon from "@mui/icons-material/Send";

import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";

import { LazyTextField } from "@/Panels/Lazyfields";
import Panel from "@/Panels/Panel";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalData from "@/Scenarios/UncertaintyTube/UncertaintyTubeGlobalData";
import { trackPromise } from "react-promise-tracker";


const QueryConfigPanel = observer(() => {

    const scenario = useScenario();
    const global_context = scenario.global_context as UncertaintyTubeGlobalData;

    if (!scenario.initialized) {
        return <Panel panel_name={"Query Config"}>
            <div>Loading...</div>
        </Panel>;
    }

    // global_data is ready to use here

    const create_content = () => {
        return (
            <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={2} style={{ padding: '10px' }}>
                    <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                        <Switch checked={global_context.query_config.sym} onChange={(e) => {
                            runInAction(() => {
                                global_context.query_config.sym = e.target.checked;
                            });
                        }} />
                        <Typography color={global_context.query_config.sym ? "primary" : "textSecondary"}>Symmetric Tubes</Typography>
                    </Grid>
                    <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                            <Typography color={global_context.query_config.method === "swag" ? "primary" : "textSecondary"}>SWAG</Typography>
                            <Switch checked={global_context.query_config.method === "mcdropout"}
                                color={'default'}
                                onChange={(e) => {
                                    runInAction(() => {
                                        global_context.query_config.method = e.target.checked ? "mcdropout" : "swag";
                                    });
                                }} />
                            <Typography color={global_context.query_config.method === "mcdropout" ? "primary" : "textSecondary"}>MCDropout</Typography>
                        </Stack>
                    </Grid>
                    <Grid size={12} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                        <Grid size={6}>
                            <LazyTextField type='text' label="Tube roundness"
                                key={"eproj-" + global_context.query_config.eproj}
                                defaultValue={global_context.query_config.eproj}
                                onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val > 0 && val <= 2.0) {
                                        runInAction(() => {
                                            global_context.query_config.eproj = val;
                                        });
                                    }
                                }} autoComplete="off" />
                        </Grid>
                        <Grid size={6} sx={{ paddingLeft: '20px', paddingRight: '20px' }}>
                            <Slider value={global_context.query_config.eproj} min={0.0} max={2.0} step={0.1} onChange={(_, val) => {
                                runInAction(() => {
                                    global_context.query_config.eproj = val;
                                });

                            }} valueLabelDisplay="auto" />
                        </Grid>
                    </Grid>
                    <Grid size={12} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                        <Button variant="contained" endIcon={<SendIcon />}
                            onClick={async () => {
                                if (global_context.seeds.length === 0) {
                                    alert("Please add seeds first!");
                                    return;
                                }
                                trackPromise(global_context.fetch_trajectories());
                            }
                            }>Send Query</Button>
                    </Grid>
                </Grid>
            </Box>
        );
    };

    return (
        <Panel panel_name={"Query Config"}>
            {create_content()}
        </Panel>
    );
});

export default QueryConfigPanel;