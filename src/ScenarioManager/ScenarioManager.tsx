import { makeAutoObservable } from "mobx";
import type { GlobalContext } from "../Types/GlobalContext";
import type { PanelLayouts } from "../Types/PanelLayouts";
import type { Scenario, ScenarioConfig, ScenarioLayoutChoice } from "../Types/Scenario";
import PanelLayoutManager from "../LayoutManager/PanelLayoutManager";
import { createContext, useContext, useEffect, useState } from "react";
import { trackPromise } from "react-promise-tracker";
import { getGlobalContext } from "../Scenarios";
import { DEFAULT_APPEARANCE, type Appearance, type DisplayMode } from "../Theme/DesignTokens";
import { checkConfig } from "./ScenarioConfigCheck";

interface PreparedScenario {
    name: string;
    description?: string;
    views: string[];
    panelLayouts: PanelLayouts;
    appearance: Appearance;
    globalContext: GlobalContext;
}

// Builds everything a scenario needs without touching the running one.
function prepareScenario(config: ScenarioConfig): PreparedScenario {
    const layouts = config.panel_layouts;
    const panelLayouts = new PanelLayoutManager(layouts.default_layouts, layouts.breakpoints, layouts.cols, layouts.fit_rows);
    const globalContext = getGlobalContext(config.name);
    try {
        globalContext.initialize(config.global_data);
    } catch (error) {
        globalContext.dispose?.();
        throw error;
    }
    return {
        name: config.name,
        description: config.description,
        views: config.views ?? [],
        panelLayouts,
        appearance: {
            accent: config.appearance?.accent ?? DEFAULT_APPEARANCE.accent,
            defaultMode: config.appearance?.default_mode,
            uiScale: config.appearance?.ui_scale ?? DEFAULT_APPEARANCE.uiScale,
        },
        globalContext,
    };
}

export class ScenarioManager implements Scenario {
    name: string = "UVisBox";
    description?: string;
    // Unset until the first config loads; readers check `initialized` first.
    globalContext!: GlobalContext;
    views: string[] = [];
    panelLayouts!: PanelLayouts;
    appearance: Appearance = DEFAULT_APPEARANCE;
    initialized: boolean = false;
    fullyLoaded: boolean = false;
    // Why the last load failed, shown on screen until dismissed; null when it did not.
    loadError: string | null = null;
    // Counts the scenarios swapped in. The grid remounts on each, so no panel outlives the context it was built with.
    generation: number = 0;
    private latestLoad: number = 0;

    constructor() {
        makeAutoObservable<ScenarioManager, 'latestLoad'>(this, { latestLoad: false });
    }

    async asyncInitialization(): Promise<void> {
        return this.globalContext.asyncInitialize();
    }

    // Swaps the scenario in at once, without its asyncInitialize (completeInitialization runs that first).
    loadFromObject(config: ScenarioConfig): void {
        this.swapIn(prepareScenario(config));
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

    toObject(layout: ScenarioLayoutChoice = 'default'): ScenarioConfig {
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

    // Loads are numbered; only the latest one may swap its scenario in.
    beginLoad(): number {
        this.latestLoad += 1;
        return this.latestLoad;
    }

    isLatestLoad(load: number): boolean {
        return load === this.latestLoad;
    }

    // The new scenario is built and initialized beside the running one and swapped in only when ready, so a load that
    // fails, or that a newer load overtakes, leaves the running scenario as it was.
    async completeInitialization(config: ScenarioConfig, load: number = this.beginLoad()): Promise<void> {
        const prepared = prepareScenario(config);
        try {
            await prepared.globalContext.asyncInitialize();
        } catch (error) {
            prepared.globalContext.dispose?.();
            throw error;
        }
        if (!this.isLatestLoad(load)) {
            prepared.globalContext.dispose?.();
            return;
        }
        this.swapIn(prepared);
    }

    private swapIn(prepared: PreparedScenario): void {
        const previous: GlobalContext | undefined = this.globalContext;
        this.name = prepared.name;
        this.description = prepared.description;
        this.views = prepared.views;
        this.panelLayouts = prepared.panelLayouts;
        this.appearance = prepared.appearance;
        this.globalContext = prepared.globalContext;
        this.initialized = true;
        this.fullyLoaded = true;
        this.generation += 1;
        if (previous && previous !== prepared.globalContext) {
            previous.dispose?.();
        }
    }
}

// A scenario to load: a config object, or the URL of a config file.
export type ScenarioSource = object | string;

async function fetchConfig(url: string): Promise<unknown> {
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
        throw new Error(`${url} is not valid JSON: ${error instanceof Error ? error.message : error}`, { cause: error });
    }
}

// The progress bar (LayoutManager's LoadingIndicator) shows while a load runs; the running scenario stays on screen.
export function loadScenario(manager: ScenarioManager, source: ScenarioSource): Promise<void> {
    const load = manager.beginLoad();
    const run = async () => {
        try {
            const config: unknown = typeof source === 'string' ? await fetchConfig(source) : source;
            if (!manager.isLatestLoad(load)) {
                return;
            }
            checkConfig(config);
            manager.setLoadError(null);
            await manager.completeInitialization(config, load);
        } catch (error) {
            // A newer load is under way: this one's failure no longer describes what the user asked for.
            if (!manager.isLatestLoad(load)) {
                return;
            }
            const message = error instanceof Error ? error.message : String(error);
            console.error('Failed to load scenario:', error);
            manager.setLoadError(message);
        }
    };
    return trackPromise(run());
}

export function loadScenarioFromText(manager: ScenarioManager, text: string): Promise<void> {
    let config: unknown;
    try {
        config = JSON.parse(text);
    } catch (error) {
        manager.setLoadError(`The uploaded file is not valid JSON: ${error instanceof Error ? error.message : error}`);
        return Promise.resolve();
    }
    // A string would be taken for a config URL and fetched.
    if (!config || typeof config !== 'object') {
        manager.setLoadError('The uploaded file is not a JSON object.');
        return Promise.resolve();
    }
    return loadScenario(manager, config);
}

const scenario = createContext<ScenarioManager | null>(null);

export function ScenarioProvider({ children, initialConfig }: { children: React.ReactNode; initialConfig: ScenarioSource }) {
    const [scenarioManager] = useState(() => new ScenarioManager());

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