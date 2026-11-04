import { makeAutoObservable, runInAction } from "mobx";
import type { GlobalContext} from "../Types/GlobalContext";
import type { PanelLayouts } from "../Types/PanelLayouts";
import type { Scenario } from "../Types/Scenario";
import PanelLayoutManager from "../LayoutManager/PanelLayoutManager";
import { createContext, useContext, useEffect, useState } from "react";
import { getGlobalContext } from "../Scenarios";
import { DEFAULT_APPEARANCE, type Appearance, type DisplayMode } from "../Theme/DesignTokens";

class ScenarioManager implements Scenario {
    name: string;
    description?: string;
    globalContext: GlobalContext;
    views: string[];
    panelLayouts: PanelLayouts;
    appearance: Appearance = DEFAULT_APPEARANCE;
    initialized: boolean = false;
    fullyLoaded: boolean = false;

    constructor(config?: any) {
        if (config) {
            this.loadFromObject(config);
        } else {
            this.name = "UVisBox";
            this.description = "A default scenario";
        }

        makeAutoObservable(this);
    }

    async asyncInitialization(): Promise<void> {
        return this.globalContext.asyncInitialize();
    }

    loadFromObject(config: any): void {
        runInAction(() => {
            this.name = config.name || this.name || "UVisBox";
            this.description = config.description || this.description || "A default scenario";
            this.views = config.views || this.views || [];
            const panelLayoutsConfig = config.panel_layouts;
            this.panelLayouts = new PanelLayoutManager(panelLayoutsConfig.default_layouts, panelLayoutsConfig.breakpoints, panelLayoutsConfig.cols,
                                                       panelLayoutsConfig.tool_placement,
                                                       panelLayoutsConfig.inspector_anchor, panelLayoutsConfig.content_split);
            this.appearance = {
                accent: config.appearance?.accent ?? DEFAULT_APPEARANCE.accent,
                defaultMode: config.appearance?.default_mode,
                uiScale: config.appearance?.ui_scale ?? DEFAULT_APPEARANCE.uiScale,
            };
            this.globalContext = getGlobalContext(this.name);
            this.globalContext.initialize(config.global_data);
        });
    }

    // The display mode and UI scale the user picks become the scenario's, so a saved or downloaded config opens as seen.
    setDisplayMode(mode: DisplayMode): void {
        this.appearance = { ...this.appearance, defaultMode: mode };
    }

    setUiScale(uiScale: number): void {
        this.appearance = { ...this.appearance, uiScale };
    }

    loadFromJson(json: string): void {
        const config = JSON.parse(json);
        this.loadFromObject(config);
    }

    toObject(): any {
        return {
            name: this.name,
            description: this.description,
            views: this.views,
            panel_layouts: {
                default_layouts: this.panelLayouts.defaultLayouts,
                breakpoints: this.panelLayouts.breakpoints,
                cols: this.panelLayouts.cols,
                tool_placement: this.panelLayouts.toolPlacement,
                inspector_anchor: this.panelLayouts.inspectorAnchor,
                content_split: this.panelLayouts.contentSplit,
            },
            appearance: {
                accent: this.appearance.accent,
                default_mode: this.appearance.defaultMode,
                ui_scale: this.appearance.uiScale,
            },
            global_data: this.globalContext.toObject(),
        };
    }

    toJson(): string {
        return JSON.stringify({
            name: this.name,
            description: this.description,
            views: this.views,
            panel_layouts: {
                default_layouts: this.panelLayouts.defaultLayouts,
                breakpoints: this.panelLayouts.breakpoints,
                cols: this.panelLayouts.cols,
                tool_placement: this.panelLayouts.toolPlacement,
                inspector_anchor: this.panelLayouts.inspectorAnchor,
                content_split: this.panelLayouts.contentSplit,
            },
            appearance: {
                accent: this.appearance.accent,
                default_mode: this.appearance.defaultMode,
                ui_scale: this.appearance.uiScale,
            },
            global_data: this.globalContext.toObject(),
        }, null, 2);
    }

    invalidate(): void {
        runInAction(() => {
            this.initialized = false;
            this.fullyLoaded = false;
        });
    }

    async completeInitialization(config: any): Promise<void> {
        // Reset state before loading new scenario
        this.invalidate();

        // Load base configuration
        this.loadFromObject(config);

        // Perform async operations
        await this.asyncInitialization();

        // Ensure layouts are properly initialized
        // NOTE: Commented out to fix visible:false panel initialization
        // This was originally added to solve a race condition in built mode
        // Needs additional testing before re-enabling
        // if (this.panelLayouts && config.panel_layouts) {
        //     this.panelLayouts.reinitializeLayouts(config.panel_layouts.default_layouts);
        // }

        runInAction(() => {
            this.initialized = true;
            this.fullyLoaded = true;
        });
    }
}

const scenario = createContext<ScenarioManager | null>(null);

export function ScenarioProvider({ children, initialConfig }: { children: React.ReactNode; initialConfig: string }) {
    const [scenarioManager] = useState<ScenarioManager>(new ScenarioManager());

    useEffect(() => {
        fetch(initialConfig)
            .then(response => response.json())
            .then(data => scenarioManager.completeInitialization(data))
            .catch(error => {
                console.error("Failed to initialize scenario:", error);
            });
    }, [scenarioManager, initialConfig]);

    return (
        <scenario.Provider value={scenarioManager}>
            {children}
        </scenario.Provider>
    );

}

export function useScenario(): ScenarioManager {
    const context = useContext(scenario);
    if (!context) {
        throw new Error("useScenario must be used within a ScenarioProvider");
    }
    return context;
}