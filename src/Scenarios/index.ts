// ABOUTME: Scenario discovery entry point.
// ABOUTME: Imports all scenarios to trigger their self-registration.

import type { GlobalContext } from "@/Types/GlobalContext";
import type { ReactNode } from "react";
import { scenarioRegistry } from "./ScenarioRegistry";

// Import scenarios to trigger registration
import "./Wildfire";
import "./UncertaintyTube";

// Re-export registry for external use
export { scenarioRegistry } from "./ScenarioRegistry";
export type { ScenarioDefinition } from "./ScenarioRegistry";

// Convenience functions for backward compatibility
export function getGlobalContext(scenarioName: string): GlobalContext {
  return scenarioRegistry.get(scenarioName).createGlobalContext();
}

export function getPanelMappingFunction(
  scenarioName: string
): (panelId: string) => ReactNode | null {
  return scenarioRegistry.get(scenarioName).panelMapping;
}
