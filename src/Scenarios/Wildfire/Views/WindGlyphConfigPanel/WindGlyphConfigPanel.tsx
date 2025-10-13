import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import { WildfireGlobalData } from "@/Scenarios/Wildfire/WildfireGlobalData";

import Panel from "@/Panels/Panel";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import GridLayoutContainer from "@/Panels/GridLayoutContainer";
import { LazyTextField } from "@/Panels/Lazyfields";

export const WindGlyphConfigPanel = observer(() => {
    const global_data = useScenario().global_context as WildfireGlobalData;
    const config = global_data.wind_glyphs_config;

    const content = (<>
        <GridLayoutContainer>
            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <Switch checked={config.display} onChange={(e) => {
                    global_data.windGlyphsSetDisplay(e.target.checked);
                }} />
                <Typography color={config.display ? "primary" : "textSecondary"}>Display</Typography>
            </Grid>
            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <LazyTextField
                    label="Sampling Stride"
                    type="number"
                    defaultValue={config.sampling_stride}
                    onBlur={(event) => {
                        const v = parseInt(event.target.value);
                        if (!isNaN(v) && v > 0) {
                            global_data.windGlyphsSetSamplingStride(v);
                        }
                    }}
                />
            </Grid>
            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <Switch checked={config.scale_by_magnitude} onChange={(e) => {
                    global_data.windGlyphsSetScaleByMagnitude(e.target.checked);
                }} />
                <Typography color={config.scale_by_magnitude ? "primary" : "textSecondary"}>Scale by Magnitude</Typography>
            </Grid>

            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <LazyTextField
                    label="Length Scale"
                    type="number"
                    defaultValue={config.length_scale}
                    onBlur={(event) => {
                        const v = parseFloat(event.target.value);
                        if (!isNaN(v) && v > 0) {
                            global_data.windGlyphsSetLengthScale(v);
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
                            global_data.windGlyphsSetRadius(v);
                        }
                    }}
                />
            </Grid>
            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <LazyTextField
                    label="Size Scale"
                    type="number"
                    defaultValue={config.size_scale}
                    onBlur={(event) => {
                        const v = parseFloat(event.target.value);
                        if (!isNaN(v) && v > 0) {
                            global_data.windGlyphsSetSizeScale(v);
                        }
                    }}
                />
            </Grid>

            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <Switch checked={config.color_by_magnitude} onChange={(e) => {
                    global_data.windGlyphsSetColorByMagnitude(e.target.checked);
                }} />
                <Typography color={config.color_by_magnitude ? "primary" : "textSecondary"}>Color by Magnitude</Typography>
            </Grid>
            <Grid size={{ xl: 6, lg: 12 }} sx={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <LazyTextField sx={{ width: '80%' }}
                    label="Glyph Color"
                    type="color"
                    defaultValue={config.color.formatHex()}
                    onBlur={(event) => {
                        const v = event.target.value;
                        global_data.windGlyphsSetColor(v);
                    }}
                />
            </Grid>

        </GridLayoutContainer>
    </>)
    return <Panel panel_name="Wind Glyph Configuration">{content}</Panel>;
});

export default WindGlyphConfigPanel;