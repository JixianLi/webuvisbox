// ABOUTME: Tornado ensemble example entry point, built into the library: pathlines through an ensemble of tornado-like
// ABOUTME: flows, summarized by an uncertainty tube. Self-registers with the scenario registry on import (src/Examples).

import { scenarioRegistry } from "../../Scenarios/ScenarioRegistry";
import { TornadoEnsembleGlobalContext } from "./TornadoEnsembleGlobalContext";
import { tornadoEnsemblePanelMappingFunction } from "./tornadoEnsemblePanelMappingFunction";
// The scenario config is a plain JSON file, the same format a host serves from ScenarioConfigs/ or a user uploads;
// importing it bundles it, so the example needs no file to be served.
import TORNADO_ENSEMBLE_CONFIG from "./TornadoEnsembleConfig.json";

scenarioRegistry.register({
  name: TORNADO_ENSEMBLE_CONFIG.name,
  description: TORNADO_ENSEMBLE_CONFIG.description,
  createGlobalContext: () => new TornadoEnsembleGlobalContext(),
  panelMapping: tornadoEnsemblePanelMappingFunction,
  defaultConfig: TORNADO_ENSEMBLE_CONFIG,
  isExample: true,
});

export { TornadoEnsembleGlobalContext, TORNADO_ENSEMBLE_CONFIG };
