import TrajectoriesVisualizationPanel from "./Views/TrajectoriesVisualizationPanel";
import SeedPlacementPanel from "./Views/SeedPlacementPanel";
import SeedboxConfigPanel from "./Views/SeedboxConfig";
import QueryConfigPanel from "./Views/QueryConfigPanel";
import ColormapPanel from "./Views/ColormapPanel";
import UncertaintyTubesPanel from "./Views/UncertaintyTubesPanel";
import PredictedTrajectoriesPanel from "./Views/PredictedTrajectoriesPanel";
import UncertaintySamplesPanel from "./Views/UncertainSamplesPanel";
import type React from "react";

export function uncertaintyTubePanelMappingFunction(viewname:string): React.ReactNode {
    switch(viewname){
        case "Uncertainty Tubes":
            return <UncertaintyTubesPanel />;
        case "Predicted Trajectories":
            return <PredictedTrajectoriesPanel />;
        case "Uncertainty Samples":
            return <UncertaintySamplesPanel />;
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