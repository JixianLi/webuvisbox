// ABOUTME: Wildfire scenario entry point.
// ABOUTME: Self-registers with the scenario registry on import.

import { scenarioRegistry } from "../ScenarioRegistry";
import { WildfireGlobalContext } from "./WildfireGlobalContext";
import { wildFirePanelMappingFunction } from "./wildFirePanelMappingFunction";

scenarioRegistry.register({
  name: "Wildfire",
  description: "WRF-SFire ensemble simulation visualization",
  createGlobalContext: () => new WildfireGlobalContext(),
  panelMapping: wildFirePanelMappingFunction,
  defaultConfigPath: "ScenarioConfigs/Wildfire.json",
});

export { WildfireGlobalContext };
