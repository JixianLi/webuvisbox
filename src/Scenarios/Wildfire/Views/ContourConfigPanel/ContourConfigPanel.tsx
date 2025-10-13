import Panel from "@/Panels/Panel";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalData from "@/Scenarios/Wildfire/WildfireGlobalData";
import { LazyTextField } from "@/Panels/Lazyfields";
import { GridLayoutContainer } from "@/Panels/GridLayoutContainer";

const ContourConfigPanel = observer(() => {
    const scenario = useScenario();
    const global_data = scenario.global_context as WildfireGlobalData;
    const contour_configs = global_data.contour_configs;
    if (!scenario.initialized) {
        return <Panel panel_name={"Contour Configuration"}>
            <div>Loading...</div>
        </Panel>;
    }


    const content = (
        <GridLayoutContainer>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <Switch checked={contour_configs.display_primary} onChange={(e) => {
                    global_data.contourConfigSetDisplayPrimary(e.target.checked);
                }} />
                <Typography color={contour_configs.display_primary ? "primary" : "textSecondary"}>Display Primary</Typography>
            </Grid>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <Switch checked={contour_configs.display_secondary} onChange={(e) => {
                        global_data.contourConfigSetDisplaySecondary(e.target.checked);
                    }} />
                    <Typography color={contour_configs.display_secondary ? "primary" : "textSecondary"}>Display Secondary</Typography>
                </Stack>
            </Grid>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <LazyTextField type='number' label="Radius"
                    defaultValue={contour_configs.primary_scale}
                    key={"contour-config-scale-" + contour_configs.primary_scale}
                    onBlur={(value) => {
                        const val = parseFloat(value.target.value);
                        global_data.contourConfigSetPrimaryScale(val);
                    }}
                />
            </Grid>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <LazyTextField type='number' label="Secondary Scale"
                    defaultValue={contour_configs.secondary_scale}
                    key={"contour-config-secondary-scale-" + contour_configs.secondary_scale}
                    onBlur={(value) => {
                        const val = parseFloat(value.target.value);
                        global_data.contourConfigSetSecondaryScale(val);
                    }}
                />
            </Grid>
        </GridLayoutContainer>
    )
    return <Panel panel_name="Contour Configuration">{content}</Panel>
})
export default ContourConfigPanel;