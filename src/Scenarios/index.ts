// ABOUTME: Scenario discovery entry point.
// ABOUTME: Imports all scenarios to trigger their self-registration.

// Import scenarios to trigger registration
import "./Wildfire";
import "./UncertaintyTube";

// Re-export registry for external use
export { scenarioRegistry } from "./ScenarioRegistry";
export type { ScenarioDefinition } from "./ScenarioRegistry";
