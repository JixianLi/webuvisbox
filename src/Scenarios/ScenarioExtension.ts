import type { GlobalContext } from "@/Types/GlobalContext";
import { UncertaintyTubeGlobalContext } from "./UncertaintyTube/UncertaintyTubeGlobalData";
import { WildfireGlobalContext } from "./Wildfire/WildfireGlobalData";
import { uncertaintyTubePanelMappingFunction } from "@/Scenarios/UncertaintyTube/uncertaintyTubePanelMappingFunction";
import { wildFirePanelMappingFunction } from "@/Scenarios/Wildfire/wildFirePanelMappingFunction";
import type { ReactNode } from "react";


export function getGlobalContext(scenario_name: string): GlobalContext {
    switch (scenario_name) {
        case "Uncertainty Tube":
            return new UncertaintyTubeGlobalContext();
        case "Wildfire":
            return new WildfireGlobalContext();
        default:
        throw new Error(`Unknown GlobalData type: ${scenario_name}`);
    }
}

export function getPanelMappingFunction(scenario_name: string): (string) => ReactNode | null {
    switch (scenario_name) {
        case "Uncertainty Tube":
            return uncertaintyTubePanelMappingFunction;
        case "Wildfire":
            return wildFirePanelMappingFunction;
        default:
            throw new Error(`Unknown scenario name: ${scenario_name}`);
    }
}