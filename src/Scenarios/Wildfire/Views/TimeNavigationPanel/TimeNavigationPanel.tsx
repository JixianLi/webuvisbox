import Panel from "@/Panels/Panel";
import TimeCharts from "./TimeCharts";
import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type { WildfireGlobalContext } from "@/Scenarios/Wildfire/WildfireGlobalContext";
import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import MenuIcon from '@mui/icons-material/Menu';
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Check from "@mui/icons-material/Check";
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { LazyTextField } from "@/Panels/Lazyfields";


const TimeNavigationPanel = observer(() => {

    const global_data = useScenario().global_context as WildfireGlobalContext;
    const config = global_data.time_diff_configs;

    const [anchor, setAnchor] = useState(null);

    const onMenuClick = (event) => {
        setAnchor(event.currentTarget);
    }

    const onMenuClose = () => {
        setAnchor(null);
    }

    const toggleShowEnsemble = () => {
        global_data.timeDiffToggleShowEnsemble();
        onMenuClose();
    }

    const toggleShareYScale = () => {
        global_data.timeDiffToggleShareYScale();
        onMenuClose();
    }

    const resetZoom = () => {
        global_data.timeDiffResetXDisplayRange();
        onMenuClose();
    }

    const play = () => {
        global_data.play();
        onMenuClose();
    }

    const stop = () => {
        global_data.stop();
        onMenuClose();
    }


    const appBarContent = (<>
        <IconButton
            size="small"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={onMenuClick}
        >
            <MenuIcon />
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={onMenuClose}>
            <MenuList dense>
                <MenuItem onClick={toggleShowEnsemble}>
                    <ListItemIcon>{config.show_ensemble ? <Check /> : null}</ListItemIcon>
                    <ListItemText>Show Ensemble</ListItemText>
                </MenuItem>
                <MenuItem onClick={toggleShareYScale}>
                    <ListItemIcon>{config.share_y_scale ? <Check /> : null}</ListItemIcon>
                    <ListItemText>Share Y Scale</ListItemText>
                </MenuItem>
                <MenuItem onClick={resetZoom}>
                    <ListItemIcon><ZoomOutMapIcon /></ListItemIcon>
                    <ListItemText>Reset Zoom</ListItemText>
                </MenuItem>
                <MenuItem onClick={play}>
                    <ListItemIcon><PlayCircleIcon /></ListItemIcon>
                    <ListItemText>Play</ListItemText>
                </MenuItem>
                <MenuItem onClick={stop}>
                    <ListItemIcon><StopCircleIcon /></ListItemIcon>
                    <ListItemText>Stop</ListItemText>
                </MenuItem>
                <MenuItem>
                    <LazyTextField
                        label="Play Steps"
                        defaultValue={config.play_steps}
                        key={"play_steps_field" + config.play_steps}
                        type="number"
                        onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val)) {
                                global_data.timeDiffSetPlaySteps(val)
                            }
                        }}
                    />
                </MenuItem>
            </MenuList>
        </Menu>
    </>
    )

    return (
        <Panel panel_name="Time Navigation" appbar_content={appBarContent} >
            <TimeCharts />
        </Panel>
    );
});

export default TimeNavigationPanel;
