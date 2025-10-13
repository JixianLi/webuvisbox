import { useRef } from "react";
import { observer } from "mobx-react-lite";
import { Canvas } from "@react-three/fiber";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

import Panel from "@/Panels/Panel";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalData from "@/Scenarios/UncertaintyTube/UncertaintyTubeGlobalData";
import { range } from "@/Helpers/MathHelper";
import PresetLinearColormap  from "@/Renderers/Colormaps/PresetLinearColormap";
import VSUP from "@/Renderers/Colormaps/VSUP";

const ColormapRenderer = observer(() => {
    const scenario = useScenario();
    const planeRef = useRef(null);
    const global_context = scenario.global_context as UncertaintyTubeGlobalData;
    const texture_height = global_context.colormap_config.texture_height;
    const texture_width = global_context.colormap_config.texture_width;
    const texture = global_context.texture_manager.getTexture("uncertainty_tube_colormap", undefined, texture_width, texture_height);


    if (!scenario.initialized) {
        return <div>Loading...</div>;
    }

    const ScreenPlane = () => (
        <mesh ref={planeRef}>
            <planeGeometry args={[9, 5]} />
            <meshBasicMaterial map={texture} />
        </mesh>
    );

    return (
        <Canvas linear flat>
            <ScreenPlane />
        </Canvas>
    );
});

const ColormapPanel = observer(() => {
    const scenario = useScenario();
    if (!scenario.initialized) {
        return <Panel panel_name="Colormap">
            <div>Loading...</div>
        </Panel>;
    }

    const global_data = scenario.global_context as UncertaintyTubeGlobalData;
    const type = global_data.colormap.type;
    let colormap;
    switch (type) {
        case "vsup":
            colormap = global_data.colormap as VSUP;
            break;
        case "linear":
            colormap = global_data.colormap as PresetLinearColormap;
            break;
        default:
            throw new Error(`Unknown colormap type: ${type}`);
            colormap = global_data.colormap as PresetLinearColormap;
    }

    return (
        <Panel panel_name="Colormap Config">
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ marginBottom: '10px' }}>
                <Typography variant="h6">Colormap:</Typography>
                <Select
                    value={colormap.preset_name}
                    onChange={(e) => {
                        colormap.setPreset(e.target.value);
                    }}
                    size="small"
                >
                    {PresetLinearColormap.getAvailablePresets().map((preset: string) => (
                        <MenuItem key={preset} value={preset}>
                            {preset}
                        </MenuItem>
                    ))}
                </Select>
            </Stack>
            <Grid container alignItems="center">
                {/* Vertical "- Uncertainty +" label */}
                <Grid size={1}>
                    <Box sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center'
                    }}>
                        <Typography 
                            sx={{ 
                                transform: 'rotate(-90deg)',
                                whiteSpace: 'nowrap',
                                fontWeight: 'medium',
                                fontFamily: 'monospace'
                            }}
                        >
                            - Uncertainty +
                        </Typography>
                    </Box>
                </Grid>
                
                {/* ColorMap Renderer */}
                <Grid size={11}>
                    <Box sx={{ width: '90%' }} style={{ aspectRatio: '6 / 4' }}>
                        <ColormapRenderer /> 
                    </Box>
                    
                    {/* Horizontal "- symmetry +" label */}
                    <Box sx={{ 
                        width: '90%', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        mt: 0,
                        pt: 0
                    }}>
                        <Typography sx={{ fontWeight: 'medium', fontFamily: 'monospace' }}>
                            - symmetry +
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ marginTop: '10px' }}>
                <Typography variant="h6">Colormap Depth:</Typography>

                <Select
                    value={colormap.depth}
                    onChange={(e) => {
                        colormap.setDepth(Number(e.target.value));
                    }}
                    size="small"
                >
                    {range(1, 10).map((depth: number) => (
                        <MenuItem key={depth} value={depth}>
                            {depth}
                        </MenuItem>
                    ))}
                </Select>
            </Stack>
        </Panel>
    );
});
export default ColormapPanel;