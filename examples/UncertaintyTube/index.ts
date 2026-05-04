// ABOUTME: UncertaintyTube scenario entry point.
// ABOUTME: Self-registers with the scenario registry on import.

import { scenarioRegistry } from "@/Scenarios/ScenarioRegistry";
import { UncertaintyTubeGlobalContext } from "./UncertaintyTubeGlobalContext";
import { uncertaintyTubePanelMappingFunction } from "./uncertaintyTubePanelMappingFunction";

scenarioRegistry.register({
  name: "Uncertainty Tube",
  description: "Neural network flow predictions with uncertainty quantification",
  createGlobalContext: () => new UncertaintyTubeGlobalContext(),
  panelMapping: uncertaintyTubePanelMappingFunction,
  defaultConfigPath: "ScenarioConfigs/UncertaintyTube.json",
});

export { UncertaintyTubeGlobalContext };
