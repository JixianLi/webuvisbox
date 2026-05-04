import Panel from "@/Panels/Panel";
import IconButton from "@mui/material/IconButton";
import MenuIcon from '@mui/icons-material/Menu';
import React from "react";
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type UncertaintyTubeGlobalContext from "../UncertaintyTubeGlobalContext";
import { runInAction } from "mobx";
import CheckMenuItem from "@/Panels/CheckMenuItem";
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
        return <Panel panelName="Trajectories Visualization">
            <div>Loading...</div>
        </Panel>;
    }
    const globalData = scenario.globalContext as UncertaintyTubeGlobalContext;

    const trajectoryVisualizationConfig = globalData.trajectoryVisualization;

    const toggleShowPaths = () =>{
        runInAction(()=>{
            trajectoryVisualizationConfig.showPath = !trajectoryVisualizationConfig.showPath;
        });
    }

    const toggleShowUncertaintyPaths = () =>{
        runInAction(()=>{
            trajectoryVisualizationConfig.showUncertaintyPath = !trajectoryVisualizationConfig.showUncertaintyPath;
        });
    }

    const toggleShowUncertaintyTubes = () =>{
        runInAction(()=>{
            trajectoryVisualizationConfig.showUncertaintyTube = !trajectoryVisualizationConfig.showUncertaintyTube;
        });
    }

    const toggleShowSeeds = () =>{
        runInAction(()=>{
            trajectoryVisualizationConfig.showSeeds = !trajectoryVisualizationConfig.showSeeds;
        });
    }

    const toggleShowStats = () =>{
        runInAction(()=>{
            trajectoryVisualizationConfig.showStats = !trajectoryVisualizationConfig.showStats;
        });
    }

    const appbarContent = <>
        <IconButton size='small' edge='start' aria-label='menu' sx={{ mr: 2 }} onClick={menuIconClicked}>
            <MenuIcon />
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={menuClosed}>
            <MenuList dense>
                <CheckMenuItem
                    text="Show Paths"
                    checked={trajectoryVisualizationConfig.showPath}
                    onClick={toggleShowPaths}
                />
                <CheckMenuItem
                    text="Show Uncertainty Paths"
                    checked={trajectoryVisualizationConfig.showUncertaintyPath}
                    onClick={toggleShowUncertaintyPaths}
                />
                <CheckMenuItem
                    text="Show Uncertainty Tubes"
                    checked={trajectoryVisualizationConfig.showUncertaintyTube}
                    onClick={toggleShowUncertaintyTubes}
                />
                <CheckMenuItem
                    text="Show Seeds"
                    checked={trajectoryVisualizationConfig.showSeeds}
                    onClick={toggleShowSeeds}
                />
                <CheckMenuItem
                    text="Show Rendering Performance Stats"
                    checked={trajectoryVisualizationConfig.showStats}
                    onClick={toggleShowStats}
                />
            </MenuList>
        </Menu>
    </>

    return (
        <Panel panelName="Trajectories Visualization" appbarContent={appbarContent}>
            <TrajectoriesRenderer />
        </Panel>
    );
});
export default TrajectoriesVisualizationPanel;
