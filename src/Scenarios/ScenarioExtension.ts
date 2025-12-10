// ABOUTME: Backward-compatible exports for scenario access.
// ABOUTME: Delegates to ScenarioRegistry; prefer importing from "@/Scenarios" directly.

import type { GlobalContext } from "@/Types/GlobalContext";
import type { ReactNode } from "react";
import { scenarioRegistry } from "./ScenarioRegistry";

// Ensure all scenarios are registered by importing the index
import "./index";

export function getGlobalContext(scenario_name: string): GlobalContext {
  return scenarioRegistry.get(scenario_name).createGlobalContext();
}

export function getPanelMappingFunction(
  scenario_name: string
): (panelId: string) => ReactNode | null {
  return scenarioRegistry.get(scenario_name).panelMapping;
}
