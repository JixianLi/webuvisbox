// ABOUTME: Lorenz ensemble example entry point, built into the library: chaotic divergence of nearly identical starts
// ABOUTME: shown as uncertainty. Self-registers with the scenario registry on import (src/Examples).

import { scenarioRegistry } from "../../Scenarios/ScenarioRegistry";
import { LorenzEnsembleGlobalContext } from "./LorenzEnsembleGlobalContext";
import { lorenzEnsemblePanelMappingFunction } from "./lorenzEnsemblePanelMappingFunction";
// The scenario config is a plain JSON file, the same format a host serves from ScenarioConfigs/ or a user uploads;
// importing it bundles it, so the example needs no file to be served.
import LORENZ_ENSEMBLE_CONFIG from "./LorenzEnsembleConfig.json";

scenarioRegistry.register({
  name: LORENZ_ENSEMBLE_CONFIG.name,
  description: LORENZ_ENSEMBLE_CONFIG.description,
  createGlobalContext: () => new LorenzEnsembleGlobalContext(),
  panelMapping: lorenzEnsemblePanelMappingFunction,
  defaultConfig: LORENZ_ENSEMBLE_CONFIG,
  isExample: true,
});

export { LorenzEnsembleGlobalContext, LORENZ_ENSEMBLE_CONFIG };
