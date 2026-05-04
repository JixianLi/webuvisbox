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
import type UncertaintyTubeGlobalContext from "../UncertaintyTubeGlobalContext";
import { trackPromise } from "react-promise-tracker";


const QueryConfigPanel = observer(() => {

    const scenario = useScenario();
    const globalContext = scenario.globalContext as UncertaintyTubeGlobalContext;

    if (!scenario.initialized) {
        return <Panel panelName={"Query Config"}>
            <div>Loading...</div>
        </Panel>;
    }

    const createContent = () => {
        return (
            <Box sx={{ flexGrow: 1 }}>
                <Grid container spacing={2} style={{ padding: '10px' }}>
                    <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                        <Switch checked={globalContext.queryConfig.sym} onChange={(e) => {
                            runInAction(() => {
                                globalContext.queryConfig.sym = e.target.checked;
                            });
                        }} />
                        <Typography color={globalContext.queryConfig.sym ? "primary" : "textSecondary"}>Symmetric Tubes</Typography>
                    </Grid>
                    <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                            <Typography color={globalContext.queryConfig.method === "swag" ? "primary" : "textSecondary"}>SWAG</Typography>
                            <Switch checked={globalContext.queryConfig.method === "mcdropout"}
                                color={'default'}
                                onChange={(e) => {
                                    runInAction(() => {
                                        globalContext.queryConfig.method = e.target.checked ? "mcdropout" : "swag";
                                    });
                                }} />
                            <Typography color={globalContext.queryConfig.method === "mcdropout" ? "primary" : "textSecondary"}>MCDropout</Typography>
                        </Stack>
                    </Grid>
                    <Grid size={12} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                        <Grid size={6}>
                            <LazyTextField type='text' label="Tube roundness"
                                key={"eproj-" + globalContext.queryConfig.eproj}
                                defaultValue={globalContext.queryConfig.eproj}
                                onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val > 0 && val <= 2.0) {
                                        runInAction(() => {
                                            globalContext.queryConfig.eproj = val;
                                        });
                                    }
                                }} autoComplete="off" />
                        </Grid>
                        <Grid size={6} sx={{ paddingLeft: '20px', paddingRight: '20px' }}>
                            <Slider value={globalContext.queryConfig.eproj} min={0.0} max={2.0} step={0.1} onChange={(_, val) => {
                                runInAction(() => {
                                    globalContext.queryConfig.eproj = val;
                                });

                            }} valueLabelDisplay="auto" />
                        </Grid>
                    </Grid>
                    <Grid size={12} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                        <Button variant="contained" endIcon={<SendIcon />}
                            onClick={async () => {
                                if (globalContext.seeds.length === 0) {
                                    alert("Please add seeds first!");
                                    return;
                                }
                                trackPromise(globalContext.fetchTrajectories());
                            }
                            }>Send Query</Button>
                    </Grid>
                </Grid>
            </Box>
        );
    };

    return (
        <Panel panelName={"Query Config"}>
            {createContent()}
        </Panel>
    );
});

export default QueryConfigPanel;
