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
    const global_data = scenario.global_context as WildfireGlobalContext;
    const contour_config = global_data.contour_config;
    if (!scenario.initialized) {
        return <Panel panel_name={"Contour Configuration"}>
            <div>Loading...</div>
        </Panel>;
    }


    const content = (
        <FormGrid>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <Switch checked={contour_config.display_primary} onChange={(e) => {
                    contour_config.setDisplayPrimary(e.target.checked);
                }} />
                <Typography color={contour_config.display_primary ? "primary" : "textSecondary"}>Display Primary</Typography>
            </Grid>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <Switch checked={contour_config.display_secondary} onChange={(e) => {
                        contour_config.setDisplaySecondary(e.target.checked);
                    }} />
                    <Typography color={contour_config.display_secondary ? "primary" : "textSecondary"}>Display Secondary</Typography>
                </Stack>
            </Grid>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <LazyTextField type='number' label="Radius"
                    defaultValue={contour_config.primary_scale}
                    key={"contour-config-scale-" + contour_config.primary_scale}
                    onBlur={(value) => {
                        const val = parseFloat(value.target.value);
                        contour_config.setPrimaryScale(val);
                    }}
                />
            </Grid>
            <Grid size={12} sx={{ justifyContent: 'center', display: 'flex' }}>
                <LazyTextField type='number' label="Secondary Scale"
                    defaultValue={contour_config.secondary_scale}
                    key={"contour-config-secondary-scale-" + contour_config.secondary_scale}
                    onBlur={(value) => {
                        const val = parseFloat(value.target.value);
                        contour_config.setSecondaryScale(val);
                    }}
                />
            </Grid>
        </FormGrid>
    )
    return <Panel panel_name="Contour Configuration">{content}</Panel>
})
export default ContourConfigPanel;