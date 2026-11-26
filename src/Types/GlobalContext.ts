
export interface GlobalContext {
    // globalData is the config's "global_data" as written (keys left out keep their defaults). toObject returns what a
    // downloaded config stores there, so initialize(toObject()) must restore the same state.
    initialize(globalData: unknown): void;
    asyncInitialize(): Promise<void>;
    toObject(): object;
}