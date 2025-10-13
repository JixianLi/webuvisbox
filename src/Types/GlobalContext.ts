export interface GlobalContext{
    loadFromJson(json: string): void;
    loadFromObject(obj: any): void;
    toObject(): any;
    toJson(): string;
}