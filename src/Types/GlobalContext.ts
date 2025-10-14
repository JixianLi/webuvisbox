
export interface GlobalContext {
    initialize(global_data_object: any): void;
    asyncInitialize(): Promise<void>;
    toObject(): any;
}