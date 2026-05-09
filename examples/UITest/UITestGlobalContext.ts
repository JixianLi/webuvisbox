// ABOUTME: Minimal MobX-backed global context for the UI test scenario.
// ABOUTME: Holds no scenario data — exists so panels can hang state on it as needed.

import { makeAutoObservable } from "mobx";
import type { GlobalContext } from "@/Types/GlobalContext";

export class UITestGlobalContext implements GlobalContext {
    constructor() {
        makeAutoObservable(this);
    }

    initialize(_globalData: any): void {}

    async asyncInitialize(): Promise<void> {}

    toObject(): any {
        return {};
    }
}

export default UITestGlobalContext;
