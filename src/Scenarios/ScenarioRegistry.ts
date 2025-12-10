// ABOUTME: Central registry for scenario plugins.
// ABOUTME: Scenarios self-register at import time via scenarioRegistry.register().

import type { GlobalContext } from "@/Types/GlobalContext";
import type { ReactNode } from "react";

export interface ScenarioDefinition {
  name: string;
  description?: string;
  createGlobalContext: () => GlobalContext;
  panelMapping: (panelId: string) => ReactNode | null;
  defaultConfigPath: string;
}

class ScenarioRegistry {
  private scenarios = new Map<string, ScenarioDefinition>();

  register(scenario: ScenarioDefinition): void {
    if (this.scenarios.has(scenario.name)) {
      console.warn(`Scenario "${scenario.name}" already registered, overwriting`);
    }
    this.scenarios.set(scenario.name, scenario);
  }

  get(name: string): ScenarioDefinition {
    const scenario = this.scenarios.get(name);
    if (!scenario) {
      throw new Error(
        `Unknown scenario: "${name}". Available: ${this.list().join(", ")}`
      );
    }
    return scenario;
  }

  list(): string[] {
    return Array.from(this.scenarios.keys());
  }

  has(name: string): boolean {
    return this.scenarios.has(name);
  }
}

export const scenarioRegistry = new ScenarioRegistry();
