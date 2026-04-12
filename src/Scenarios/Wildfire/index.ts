// ABOUTME: Wildfire scenario entry point.
// ABOUTME: Self-registers with the scenario registry on import.

import { scenarioRegistry } from "../ScenarioRegistry";
import { WildfireGlobalContext } from "./WildfireGlobalContext";
import { wildfirePanelMappingFunction } from "./wildfirePanelMappingFunction";

scenarioRegistry.register({
  name: "Wildfire",
  description: "WRF-SFire ensemble simulation visualization",
  createGlobalContext: () => new WildfireGlobalContext(),
  panelMapping: wildfirePanelMappingFunction,
  defaultConfigPath: "ScenarioConfigs/Wildfire.json",
});

export { WildfireGlobalContext };
