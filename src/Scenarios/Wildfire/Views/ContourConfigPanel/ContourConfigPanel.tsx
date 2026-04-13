import Panel from "@/Panels/Panel";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
import { LazyTextField } from "@/Panels/Lazyfields";
import { FormGrid } from "@/Panels/FormGrid";

const ContourConfigPanel = observer(() => {
    const scenario = useScenario();
    const globalData = scenario.globalContext as WildfireGlobalContext;
    const contourConfig = globalData.contourConfig;
    if (!scenario.initialized) {
        return <Panel panelName={"Contour Configuration"}>
            <div>Loading...</div>
        </Panel>;
    }


    const content = (
        <FormGrid>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <Switch checked={contourConfig.displayPrimary} onChange={(e) => {
                    contourConfig.setDisplayPrimary(e.target.checked);
                }} />
                <Typography color={contourConfig.displayPrimary ? "primary" : "textSecondary"}>Display Primary</Typography>
            </Grid>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <Switch checked={contourConfig.displaySecondary} onChange={(e) => {
                        contourConfig.setDisplaySecondary(e.target.checked);
                    }} />
                    <Typography color={contourConfig.displaySecondary ? "primary" : "textSecondary"}>Display Secondary</Typography>
                </Stack>
            </Grid>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <LazyTextField type='number' label="Radius"
                    defaultValue={contourConfig.primaryScale}
                    key={"contour-config-scale-" + contourConfig.primaryScale}
                    onBlur={(value) => {
                        const val = parseFloat(value.target.value);
                        contourConfig.setPrimaryScale(val);
                    }}
                />
            </Grid>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <LazyTextField type='number' label="Secondary Scale"
                    defaultValue={contourConfig.secondaryScale}
                    key={"contour-config-secondary-scale-" + contourConfig.secondaryScale}
                    onBlur={(value) => {
                        const val = parseFloat(value.target.value);
                        contourConfig.setSecondaryScale(val);
                    }}
                />
            </Grid>
        </FormGrid>
    )
    return <Panel panelName="Contour Configuration">{content}</Panel>
})
export default ContourConfigPanel;
