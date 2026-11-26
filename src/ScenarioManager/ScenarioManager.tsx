import { makeAutoObservable, runInAction } from "mobx";
import type { GlobalContext} from "../Types/GlobalContext";
import type { PanelLayouts } from "../Types/PanelLayouts";
import type { Scenario, ScenarioLayoutChoice } from "../Types/Scenario";
import PanelLayoutManager from "../LayoutManager/PanelLayoutManager";
import { createContext, useContext, useEffect, useState } from "react";
import { getGlobalContext, scenarioRegistry } from "../Scenarios";
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
    // Why the last load failed, shown on screen until dismissed; null when it did not.
    loadError: string | null = null;

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
                                                       panelLayoutsConfig.fit_rows);
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

    toObject(layout: ScenarioLayoutChoice = 'default'): any {
        const layouts = layout === 'current'
            ? this.panelLayouts.snapshotCurrentLayouts()
            : this.panelLayouts.defaultLayouts;
        return {
            name: this.name,
            description: this.description,
            views: this.views,
            panel_layouts: {
                default_layouts: layouts,
                breakpoints: this.panelLayouts.breakpoints,
                cols: this.panelLayouts.cols,
                fit_rows: this.panelLayouts.fitRows,
            },
            appearance: {
                accent: this.appearance.accent,
                default_mode: this.appearance.defaultMode,
                ui_scale: this.appearance.uiScale,
            },
            global_data: this.globalContext.toObject(),
        };
    }

    toJson(layout: ScenarioLayoutChoice = 'default'): string {
        return JSON.stringify(this.toObject(layout), null, 2);
    }

    setLoadError(message: string | null): void {
        this.loadError = message;
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

// A scenario to load: a config object, or the URL of a config file.
export type ScenarioSource = object | string;

async function fetchConfig(url: string): Promise<object> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`${url}: the server answered ${response.status} ${response.statusText}.`);
    }
    // A dev server answers a missing file with its index.html (status 200), so the type tells a missing file apart.
    if (!(response.headers.get('content-type') ?? '').includes('json')) {
        throw new Error(`${url} was not found: the server answered with a page, not a JSON config.`);
    }
    try {
        return await response.json();
    } catch (error) {
        throw new Error(`${url} is not valid JSON: ${error instanceof Error ? error.message : error}`);
    }
}

// Checked before the current scenario is torn down, so a bad config leaves it running.
function checkConfig(config: any): void {
    if (!config || typeof config !== 'object') {
        throw new Error('The config is not a JSON object.');
    }
    if (!config.name) {
        throw new Error('The config has no "name".');
    }
    if (!scenarioRegistry.has(config.name)) {
        throw new Error(`No scenario named "${config.name}" is registered in this app (registered: ${scenarioRegistry.list().join(', ')}).`);
    }
    if (!config.panel_layouts?.default_layouts) {
        throw new Error(`The config of "${config.name}" has no panel_layouts.default_layouts.`);
    }
}

export async function loadScenario(manager: ScenarioManager, source: ScenarioSource): Promise<void> {
    try {
        const config = typeof source === 'string' ? await fetchConfig(source) : source;
        checkConfig(config);
        manager.setLoadError(null);
        await manager.completeInitialization(config);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to load scenario:', error);
        manager.setLoadError(message);
    }
}

export function loadScenarioFromText(manager: ScenarioManager, text: string): Promise<void> {
    let config: object;
    try {
        config = JSON.parse(text);
    } catch (error) {
        manager.setLoadError(`The uploaded file is not valid JSON: ${error instanceof Error ? error.message : error}`);
        return Promise.resolve();
    }
    return loadScenario(manager, config);
}

const scenario = createContext<ScenarioManager | null>(null);

export function ScenarioProvider({ children, initialConfig }: { children: React.ReactNode; initialConfig: ScenarioSource }) {
    const [scenarioManager] = useState<ScenarioManager>(new ScenarioManager());

    useEffect(() => {
        loadScenario(scenarioManager, initialConfig);
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