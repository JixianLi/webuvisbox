import type { GlobalContext } from "./GlobalContext";
import type { PanelLayouts } from "./PanelLayouts";

export interface Scenario {
    name: string;
    description?: string;
    globalContext: GlobalContext;
    panelLayouts: PanelLayouts;
    views: string[]; // List of view names

    // Methods
    loadFromObject(config: any): void;
    loadFromJson(json: string): void;
    toJson(): string;
    asyncInitialization(): Promise<void>;
}