// ABOUTME: Central registry for scenario plugins.
// ABOUTME: Scenarios self-register at import time via scenarioRegistry.register().

import type { GlobalContext } from "../Types/GlobalContext";
import type { ReactNode } from "react";

export interface ScenarioDefinition {
  name: string;
  description?: string;
  createGlobalContext: () => GlobalContext;
  panelMapping: (panelId: string) => ReactNode | null;
  // Where its config comes from: a URL the host serves, or, for examples built into the library, the config itself.
  defaultConfigPath?: string;
  defaultConfig?: object;
  // Listed under Examples in the Scenario menu (built into the library), not under Scenarios.
  isExample?: boolean;
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

  definitions(): ScenarioDefinition[] {
    return Array.from(this.scenarios.values());
  }

  has(name: string): boolean {
    return this.scenarios.has(name);
  }
}

export const scenarioRegistry = new ScenarioRegistry();
