import TrajectoriesVisualizationPanel from "./Views/TrajectoriesVisualizationPanel";
import SeedPlacementPanel from "./Views/SeedPlacementPanel";
import SeedboxConfigPanel from "./Views/SeedboxConfig";
import QueryConfigPanel from "./Views/QueryConfigPanel";
import ColormapPanel from "./Views/ColormapPanel";
import type React from "react";

export function uncertaintyTubePanelMappingFunction(viewname:string): React.ReactNode {
    switch(viewname){
        case "Trajectories Visualization":
            return <TrajectoriesVisualizationPanel />;
        case "Seed Placement":
            return <SeedPlacementPanel />;
        case "Seedbox Config":
            return <SeedboxConfigPanel />;
        case "Query Config":
            return <QueryConfigPanel />;
        case "Colormap Config":
            return <ColormapPanel />;
        default:
            throw new Error(`Unknown view name: ${viewname}`);
            return null;
    }
}

export default uncertaintyTubePanelMappingFunction;