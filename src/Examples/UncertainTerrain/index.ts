// ABOUTME: Uncertain terrain example entry point, built into the library: an ensemble of generated terrains shown with
// ABOUTME: a value-suppressing uncertainty palette. Self-registers with the scenario registry on import (src/Examples).

import { scenarioRegistry } from "../../Scenarios/ScenarioRegistry";
import { UncertainTerrainGlobalContext } from "./UncertainTerrainGlobalContext";
import { uncertainTerrainPanelMappingFunction } from "./uncertainTerrainPanelMappingFunction";
// The scenario config is a plain JSON file, the same format a host serves from ScenarioConfigs/ or a user uploads;
// importing it bundles it, so the example needs no file to be served.
import UNCERTAIN_TERRAIN_CONFIG from "./UncertainTerrainConfig.json";

scenarioRegistry.register({
  name: UNCERTAIN_TERRAIN_CONFIG.name,
  description: UNCERTAIN_TERRAIN_CONFIG.description,
  createGlobalContext: () => new UncertainTerrainGlobalContext(),
  panelMapping: uncertainTerrainPanelMappingFunction,
  defaultConfig: UNCERTAIN_TERRAIN_CONFIG,
  isExample: true,
});

export { UncertainTerrainGlobalContext, UNCERTAIN_TERRAIN_CONFIG };
