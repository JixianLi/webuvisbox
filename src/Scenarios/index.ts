// ABOUTME: Public registry surface for the scenario plugin system.
// ABOUTME: Re-exports the registry and provides convenience accessors; does not register any scenarios.

import type { GlobalContext } from "@/Types/GlobalContext";
import type { ReactNode } from "react";
import { scenarioRegistry } from "./ScenarioRegistry";

export { scenarioRegistry } from "./ScenarioRegistry";
export type { ScenarioDefinition } from "./ScenarioRegistry";

export function getGlobalContext(scenarioName: string): GlobalContext {
  return scenarioRegistry.get(scenarioName).createGlobalContext();
}

export function getPanelMappingFunction(
  scenarioName: string
): (panelId: string) => ReactNode | null {
  return scenarioRegistry.get(scenarioName).panelMapping;
}
