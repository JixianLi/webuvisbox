// ABOUTME: chatUI scenario entry point — a sandbox for testing rendering components, built into the library as an
// ABOUTME: example that loads in any host. Self-registers with the scenario registry on import (src/Examples).

import { scenarioRegistry } from "../../Scenarios/ScenarioRegistry";
import { ChatUIGlobalContext } from "./ChatUIGlobalContext";
import { chatUIPanelMappingFunction } from "./chatUIPanelMappingFunction";
// The scenario config is a plain JSON file, the same format a host serves from ScenarioConfigs/ or a user uploads;
// importing it bundles it, so the example needs no file to be served.
import CHAT_UI_CONFIG from "./ChatUIConfig.json";

scenarioRegistry.register({
  name: CHAT_UI_CONFIG.name,
  description: CHAT_UI_CONFIG.description,
  createGlobalContext: () => new ChatUIGlobalContext(),
  panelMapping: chatUIPanelMappingFunction,
  defaultConfig: CHAT_UI_CONFIG,
  isExample: true,
});

export { ChatUIGlobalContext, CHAT_UI_CONFIG };
