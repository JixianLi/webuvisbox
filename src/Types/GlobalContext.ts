
export interface GlobalContext {
    // globalData is the config's "global_data" as written (keys left out keep their defaults). toObject returns what a
    // downloaded config stores there, so initialize(toObject()) must restore the same state.
    initialize(globalData: unknown): void;
    asyncInitialize(): Promise<void>;
    toObject(): object;
    // Called once when this context is replaced (another scenario loaded) or a load of it is abandoned: stop timers,
    // animation loops and requests, and free what the context holds.
    dispose?(): void;
}