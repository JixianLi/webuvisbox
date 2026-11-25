// ABOUTME: Volume rendering example entry point, built into the library: ray-marched generated volumes with a
// ABOUTME: transfer-function editor. Self-registers with the scenario registry on import (src/Examples).

import { scenarioRegistry } from "../../Scenarios/ScenarioRegistry";
import { VolumeRenderingGlobalContext } from "./VolumeRenderingGlobalContext";
import { volumeRenderingPanelMappingFunction } from "./volumeRenderingPanelMappingFunction";
import { VOLUME_RENDERING_CONFIG } from "./VolumeRenderingConfig";

scenarioRegistry.register({
  name: VOLUME_RENDERING_CONFIG.name,
  description: VOLUME_RENDERING_CONFIG.description,
  createGlobalContext: () => new VolumeRenderingGlobalContext(),
  panelMapping: volumeRenderingPanelMappingFunction,
  defaultConfig: VOLUME_RENDERING_CONFIG,
  isExample: true,
});

export { VolumeRenderingGlobalContext, VOLUME_RENDERING_CONFIG };
