// ABOUTME: UI test scenario entry point — a sandbox for testing rendering components.
// ABOUTME: Self-registers with the scenario registry on import.

import { scenarioRegistry } from "@/Scenarios/ScenarioRegistry";
import { UITestGlobalContext } from "./UITestGlobalContext";
import { uiTestPanelMappingFunction } from "./uiTestPanelMappingFunction";

scenarioRegistry.register({
  name: "UI test",
  description: "Two-panel sandbox for testing new rendering components",
  createGlobalContext: () => new UITestGlobalContext(),
  panelMapping: uiTestPanelMappingFunction,
  defaultConfigPath: "ScenarioConfigs/UITest.json",
});

export { UITestGlobalContext };
