// ABOUTME: The volume rendering example's scenario config, built into the library (same shape as a
// ABOUTME: ScenarioConfigs/*.json). A borderless volume view, the transfer-function editor below it, controls beside.

export const VOLUME_RENDERING_CONFIG = {
    "name": "Volume rendering",
    "description": "Ray-marched volumes and a ParaView-style transfer-function editor, on generated test volumes",
    "views": ["Volume", "Transfer function", "Controls"],
    "panel_layouts": {
        "default_layouts": {
            "xl": [
                { "i": "Volume", "type": "borderless", "x": 0, "y": 0, "w": 18, "h": 10, "visible": true },
                { "i": "Transfer function", "x": 0, "y": 10, "w": 18, "h": 6, "visible": true },
                { "i": "Controls", "x": 18, "y": 0, "w": 6, "h": 16, "visible": true }
            ],
            "lg": [
                { "i": "Volume", "type": "borderless", "x": 0, "y": 0, "w": 8, "h": 9, "visible": true },
                { "i": "Transfer function", "x": 0, "y": 9, "w": 8, "h": 5, "visible": true },
                { "i": "Controls", "x": 8, "y": 0, "w": 4, "h": 14, "visible": true }
            ],
            "sm": [
                { "i": "Volume", "type": "borderless", "x": 0, "y": 0, "w": 4, "h": 8, "visible": true },
                { "i": "Transfer function", "x": 0, "y": 8, "w": 4, "h": 6, "visible": true },
                { "i": "Controls", "x": 0, "y": 14, "w": 4, "h": 9, "visible": true }
            ]
        },
        "breakpoints": { "xl": 1440, "lg": 800, "sm": 0 },
        "cols": { "xl": 24, "lg": 12, "sm": 4 },
        "fit_rows": { "sm": 13 }
    },
    "global_data": {
        "dataset": "phantom",
        "lighting": true,
        "samples_per_voxel": 1
    }
};
