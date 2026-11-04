// ABOUTME: chatUI scenario entry point — a sandbox for testing rendering components, built into the library as an
// ABOUTME: example that loads in any host. Self-registers with the scenario registry on import (src/Examples).

import { scenarioRegistry } from "../../Scenarios/ScenarioRegistry";
import { ChatUIGlobalContext } from "./ChatUIGlobalContext";
import { chatUIPanelMappingFunction } from "./chatUIPanelMappingFunction";
import { CHAT_UI_CONFIG } from "./ChatUIConfig";

scenarioRegistry.register({
  name: "chatUI",
  description: "Two-panel sandbox for testing new rendering components",
  createGlobalContext: () => new ChatUIGlobalContext(),
  panelMapping: chatUIPanelMappingFunction,
  defaultConfig: CHAT_UI_CONFIG,
  isExample: true,
});

export { ChatUIGlobalContext, CHAT_UI_CONFIG };
