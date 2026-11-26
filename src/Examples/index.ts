// ABOUTME: Examples built into the library: importing this registers them, so every host's Scenario menu offers them
// ABOUTME: without serving a config file. App imports it.

// Registered, so listed in the Scenario menu, in this order.
import './TornadoEnsemble';
import './UncertainTerrain';
import './ContourUncertainty';
import './VolumeRendering';
import './ChatUI';

export { TORNADO_ENSEMBLE_CONFIG } from './TornadoEnsemble';
export { UNCERTAIN_TERRAIN_CONFIG } from './UncertainTerrain';
export { CONTOUR_UNCERTAINTY_CONFIG } from './ContourUncertainty';
export { VOLUME_RENDERING_CONFIG } from './VolumeRendering';
export { CHAT_UI_CONFIG } from './ChatUI';
