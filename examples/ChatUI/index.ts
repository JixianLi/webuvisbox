// ABOUTME: chatUI scenario entry point — a sandbox for testing rendering components.
// ABOUTME: Self-registers with the scenario registry on import.

import { scenarioRegistry } from "@/Scenarios/ScenarioRegistry";
import { ChatUIGlobalContext } from "./ChatUIGlobalContext";
import { chatUIPanelMappingFunction } from "./chatUIPanelMappingFunction";

scenarioRegistry.register({
  name: "chatUI",
  description: "Two-panel sandbox for testing new rendering components",
  createGlobalContext: () => new ChatUIGlobalContext(),
  panelMapping: chatUIPanelMappingFunction,
  defaultConfigPath: "ScenarioConfigs/ChatUI.json",
});

export { ChatUIGlobalContext };
