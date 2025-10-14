import { makeAutoObservable, runInAction } from "mobx";
import type { GlobalContext} from "@/Types/GlobalContext";
import type { PanelLayouts } from "@/Types/PanelLayouts";
import type { Scenario } from "@/Types/Scenario";
import PanelLayoutManager from "@/LayoutManager/PanelLayoutManager";
import { createContext, useContext, useEffect, useState } from "react";
import UncertaintyTubeGlobalData from "@/Scenarios/UncertaintyTube/UncertaintyTubeGlobalData";
import WildfireGlobalData from "@/Scenarios/Wildfire/WildfireGlobalData";

function createGlobalContext(scenario_name: string): GlobalContext {
    let global_context: GlobalContext;

    if (scenario_name === "Uncertainty Tube") {
        global_context = new UncertaintyTubeGlobalData();
    } else if (scenario_name === "Wildfire") {
        global_context = new WildfireGlobalData();
    } else {
        throw new Error(`Unknown GlobalData type: ${scenario_name}`);
    }
    return global_context as GlobalContext;
}

class ScenarioManager implements Scenario {
    name: string;
    description?: string;
    global_context: GlobalContext;
    views: string[];
    panel_layouts: PanelLayouts;
    initialized: boolean = false;
    fully_loaded: boolean = false;

    constructor(config?: any) {
        if (config) {
            this.loadFromObject(config);
        } else {
            this.name = "UVisBox";
            this.description = "A default scenario";
        }

        makeAutoObservable(this);
    }

    // createGlobalContext(scenario_name: string): void {
    //     runInAction((() => {
    //         switch (scenario_name) {
    //             case "Uncertainty Tube":
    //                 this.global_context = new UncertaintyTubeGlobalData();
    //                 break;
    //             case "Wildfire":
    //                 this.global_context = new WildfireGlobalData();
    //                 break;
    //             default:
    //                 this.global_context = {} as GlobalContext;
    //                 throw new Error(`Unknown GlobalData type: ${scenario_name}`);
    //         }
    //     }))
    // }

    async asyncInitialization(): Promise<void> {
        return this.global_context.asyncInitialize();
    }

    loadFromObject(config: any): void {
        runInAction(() => {
            this.name = config.name || this.name || "UVisBox";
            this.description = config.description || this.description || "A default scenario";
            this.views = config.views || this.views || [];
            const panel_layouts = config.panel_layouts
            this.panel_layouts = new PanelLayoutManager(panel_layouts.default_layouts, panel_layouts.breakpoints, panel_layouts.cols);
            this.global_context = createGlobalContext(this.name);
            this.global_context.initialize(config.global_data);
        });
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
                default_layouts: this.panel_layouts.default_layouts,
                breakpoints: this.panel_layouts.breakpoints,
                cols: this.panel_layouts.cols
            },
            global_data: this.global_context.toObject(),
        };
    }

    toJson(): string {
        return JSON.stringify({
            name: this.name,
            description: this.description,
            views: this.views,
            panel_layouts: {
                default_layouts: this.panel_layouts.default_layouts,
                breakpoints: this.panel_layouts.breakpoints,
                cols: this.panel_layouts.cols
            },
            global_data: this.global_context.toObject(),
        }, null, 2);
    }

    invalidate(): void {
        runInAction(() => {
            this.initialized = false;
            this.fully_loaded = false;
        });
    }

    async completeInitialization(config: any): Promise<void> {
        // Load base configuration
        this.loadFromObject(config);

        // Perform async operations
        await this.asyncInitialization();

        // Ensure layouts are properly initialized
        if (this.panel_layouts && config.panel_layouts) {
            this.panel_layouts.reinitializeLayouts(config.panel_layouts.default_layouts);
        }

        runInAction(() => {
            this.initialized = true;
            this.fully_loaded = true;
        });
    }
}

const scenario = createContext<ScenarioManager | null>(null);

export function ScenarioProvider({ children }: { children: React.ReactNode }) {
    const [scenarioManager] = useState<ScenarioManager>(new ScenarioManager());

    useEffect(() => {
        fetch("ScenarioConfigs/Wildfire.json")
            .then(response => response.json())
            .then(data => scenarioManager.completeInitialization(data))
            .catch(error => {
                console.error("Failed to initialize scenario:", error);
            });
    }, [scenarioManager]);

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