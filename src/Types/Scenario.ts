import type { GlobalContext } from "./GlobalContext";
import type { AppLayouts, FitRows, PanelLayouts, RGLBreakpoints, RGLCols } from "./PanelLayouts";
import type { DisplayMode } from "../Theme/DesignTokens";

export type ScenarioLayoutChoice = 'current' | 'default';

// A scenario config file as written in JSON (DESIGN.md, "Config").
export interface ScenarioConfig {
    name: string;
    description?: string;
    views?: string[];
    panel_layouts: {
        default_layouts: AppLayouts;
        breakpoints: RGLBreakpoints;
        cols?: RGLCols;
        fit_rows?: FitRows;
    };
    appearance?: {
        accent?: string;
        default_mode?: DisplayMode;
        ui_scale?: number;
    };
    global_data?: unknown;
}

export interface Scenario {
    name: string;
    description?: string;
    globalContext: GlobalContext;
    panelLayouts: PanelLayouts;
    views: string[]; // List of view names

    // Methods
    loadFromObject(config: ScenarioConfig): void;
    loadFromJson(json: string): void;
    toJson(layout?: ScenarioLayoutChoice): string;
    asyncInitialization(): Promise<void>;
}