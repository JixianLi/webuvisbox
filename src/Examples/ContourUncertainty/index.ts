// ABOUTME: Contour uncertainty example entry point, built into the library: where an ensemble's contour lies, shown
// ABOUTME: several ways. Self-registers with the scenario registry on import (src/Examples).

import { scenarioRegistry } from "../../Scenarios/ScenarioRegistry";
import { ContourUncertaintyGlobalContext } from "./ContourUncertaintyGlobalContext";
import { contourUncertaintyPanelMappingFunction } from "./contourUncertaintyPanelMappingFunction";
// The scenario config is a plain JSON file, the same format a host serves from ScenarioConfigs/ or a user uploads;
// importing it bundles it, so the example needs no file to be served.
import CONTOUR_UNCERTAINTY_CONFIG from "./ContourUncertaintyConfig.json";

scenarioRegistry.register({
  name: CONTOUR_UNCERTAINTY_CONFIG.name,
  description: CONTOUR_UNCERTAINTY_CONFIG.description,
  createGlobalContext: () => new ContourUncertaintyGlobalContext(),
  panelMapping: contourUncertaintyPanelMappingFunction,
  defaultConfig: CONTOUR_UNCERTAINTY_CONFIG,
  isExample: true,
});

export { ContourUncertaintyGlobalContext, CONTOUR_UNCERTAINTY_CONFIG };
