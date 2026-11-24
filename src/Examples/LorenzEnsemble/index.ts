// ABOUTME: Lorenz ensemble example entry point, built into the library: chaotic divergence of nearly identical starts
// ABOUTME: shown as uncertainty. Self-registers with the scenario registry on import (src/Examples).

import { scenarioRegistry } from "../../Scenarios/ScenarioRegistry";
import { LorenzEnsembleGlobalContext } from "./LorenzEnsembleGlobalContext";
import { lorenzEnsemblePanelMappingFunction } from "./lorenzEnsemblePanelMappingFunction";
import { LORENZ_ENSEMBLE_CONFIG } from "./LorenzEnsembleConfig";

scenarioRegistry.register({
  name: LORENZ_ENSEMBLE_CONFIG.name,
  description: LORENZ_ENSEMBLE_CONFIG.description,
  createGlobalContext: () => new LorenzEnsembleGlobalContext(),
  panelMapping: lorenzEnsemblePanelMappingFunction,
  defaultConfig: LORENZ_ENSEMBLE_CONFIG,
  isExample: true,
});

export { LorenzEnsembleGlobalContext, LORENZ_ENSEMBLE_CONFIG };
