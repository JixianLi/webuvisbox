
export interface GlobalContext {
    initialize(input: string | object): void;
    asyncInitialize(): Promise<void>;

    toObject(): any;
}