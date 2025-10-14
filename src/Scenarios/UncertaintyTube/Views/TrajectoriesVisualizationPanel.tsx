import Panel from "@/Panels/Panel";
import IconButton from "@mui/material/IconButton";
import MenuIcon from '@mui/icons-material/Menu';
import React from "react";
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "@/Scenarios/UncertaintyTube/UncertaintyTubeGlobalData";
import { runInAction } from "mobx";
import MenuToggleItem from "@/Panels/MenuToggleItem";
import TrajectoriesRenderer from "./TrajectoriesVisualization/TrajectoriesRenderer";


const TrajectoriesVisualizationPanel = observer(() => {
    const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);

    const menuIconClicked = (e: React.MouseEvent<HTMLElement>) => {
        setAnchor(e.currentTarget);
    }
    const menuClosed = () => {
        setAnchor(null);
    }

    const scenario = useScenario();
    if (!scenario.initialized) {
        return <Panel panel_name="Trajectories Visualization">
            <div>Loading...</div>
        </Panel>;
    }
    const global_data = scenario.global_context as UncertaintyTubeGlobalContext;

    const trajectory_visualization_config = global_data.trajectory_visualization;

    const toggleShowPaths = () =>{
        runInAction(()=>{
            trajectory_visualization_config.show_path = !trajectory_visualization_config.show_path;
        });
    }

    const toggleShowUncertaintyPaths = () =>{
        runInAction(()=>{
            trajectory_visualization_config.show_uncertainty_path = !trajectory_visualization_config.show_uncertainty_path;
        });
    }

    const toggleShowUncertaintyTubes = () =>{
        runInAction(()=>{
            trajectory_visualization_config.show_uncertainty_tube = !trajectory_visualization_config.show_uncertainty_tube;
        });
    }

    const toggleShowSeeds = () =>{
        runInAction(()=>{
            trajectory_visualization_config.show_seeds = !trajectory_visualization_config.show_seeds;
        });
    }

    const toggleShowStats = () =>{
        runInAction(()=>{
            trajectory_visualization_config.show_stats = !trajectory_visualization_config.show_stats;
        });
    }

    const appbar_content = <>
        <IconButton size='small' edge='start' aria-label='menu' sx={{ mr: 2 }} onClick={menuIconClicked}>
            <MenuIcon />
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={menuClosed}>
            <MenuList dense>
                <MenuToggleItem
                    text="Show Paths"
                    checked={trajectory_visualization_config.show_path}
                    onClick={toggleShowPaths}
                />
                <MenuToggleItem
                    text="Show Uncertainty Paths"
                    checked={trajectory_visualization_config.show_uncertainty_path}
                    onClick={toggleShowUncertaintyPaths}
                />
                <MenuToggleItem
                    text="Show Uncertainty Tubes"
                    checked={trajectory_visualization_config.show_uncertainty_tube}
                    onClick={toggleShowUncertaintyTubes}
                />
                <MenuToggleItem
                    text="Show Seeds"
                    checked={trajectory_visualization_config.show_seeds}
                    onClick={toggleShowSeeds}
                />
                <MenuToggleItem
                    text="Show Rendering Performance Stats"
                    checked={trajectory_visualization_config.show_stats}
                    onClick={toggleShowStats}
                />
            </MenuList>
        </Menu>
    </>
    
    return (
        <Panel panel_name="Trajectories Visualization" appbar_content={appbar_content}>
            <TrajectoriesRenderer />
        </Panel>
    );
});
export default TrajectoriesVisualizationPanel;