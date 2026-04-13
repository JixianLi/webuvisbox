import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import { WildfireGlobalContext } from "@/Scenarios/Wildfire/WildfireGlobalContext";

import Panel from "@/Panels/Panel";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import FormGrid from "@/Panels/FormGrid";
import { LazyTextField } from "@/Panels/Lazyfields";

export const WindGlyphConfigPanel = observer(() => {
    const globalData = useScenario().globalContext as WildfireGlobalContext;
    const config = globalData.windGlyphsConfig;

    const content = (<>
        <FormGrid>
            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <Switch checked={config.display} onChange={(e) => {
                    config.setDisplay(e.target.checked);
                }} />
                <Typography color={config.display ? "primary" : "textSecondary"}>Display</Typography>
            </Grid>
            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <LazyTextField
                    label="Sampling Stride"
                    type="number"
                    defaultValue={config.samplingStride}
                    onBlur={(event) => {
                        const v = parseInt(event.target.value);
                        if (!isNaN(v) && v > 0) {
                            config.setSamplingStride(v);
                        }
                    }}
                />
            </Grid>
            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <Switch checked={config.scaleByMagnitude} onChange={(e) => {
                    config.setScaleByMagnitude(e.target.checked);
                }} />
                <Typography color={config.scaleByMagnitude ? "primary" : "textSecondary"}>Scale by Magnitude</Typography>
            </Grid>

            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <LazyTextField
                    label="Length Scale"
                    type="number"
                    defaultValue={config.lengthScale}
                    onBlur={(event) => {
                        const v = parseFloat(event.target.value);
                        if (!isNaN(v) && v > 0) {
                            config.setLengthScale(v);
                        }
                    }}
                />
            </Grid>
            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <LazyTextField
                    label="Radius"
                    type="number"
                    defaultValue={config.radius}
                    onBlur={(event) => {
                        const v = parseFloat(event.target.value);
                        if (!isNaN(v) && v > 0) {
                            config.setRadius(v);
                        }
                    }}
                />
            </Grid>
            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <LazyTextField
                    label="Size Scale"
                    type="number"
                    defaultValue={config.sizeScale}
                    onBlur={(event) => {
                        const v = parseFloat(event.target.value);
                        if (!isNaN(v) && v > 0) {
                            config.setSizeScale(v);
                        }
                    }}
                />
            </Grid>

            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <Switch checked={config.colorByMagnitude} onChange={(e) => {
                    config.setColorByMagnitude(e.target.checked);
                }} />
                <Typography color={config.colorByMagnitude ? "primary" : "textSecondary"}>Color by Magnitude</Typography>
            </Grid>
            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <LazyTextField sx={{ width: '80%' }}
                    label="Glyph Color"
                    type="color"
                    defaultValue={config.color.formatHex()}
                    onBlur={(event) => {
                        const v = event.target.value;
                        config.setColor(v);
                    }}
                />
            </Grid>

        </FormGrid>
    </>)
    return <Panel panelName="Wind Glyph Configuration">{content}</Panel>;
});

export default WindGlyphConfigPanel;
