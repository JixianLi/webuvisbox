import { makeAutoObservable } from "mobx";
import { decode64 } from "@/Helpers/DataHelper";


class TerrainData {
    private _positions: Float32Array;
    private _indices: Uint32Array;
    private _dims: [number, number, number];
    private _bounds: [number, number, number, number, number, number];
    private _center: [number, number, number];
    private _diag: number;
    private _base_scale: number;

    constructor() {
        this._positions = new Float32Array();
        this._indices = new Uint32Array();
        this._dims = [0, 0, 0];
        this._bounds = [0, 0, 0, 0, 0, 0];
        this._center = [0, 0, 0];
        this._diag = 0;
        this._base_scale = 1.0;
        makeAutoObservable(this);
    }

    // Public getters - everyone can read
    get positions(): Float32Array { return this._positions; }
    get indices(): Uint32Array { return this._indices; }
    get dims(): [number, number, number] { return this._dims; }
    get bounds(): [number, number, number, number, number, number] { return this._bounds; }
    get center(): [number, number, number] { return this._center; }
    get diag(): number { return this._diag; }
    get base_scale(): number { return this._base_scale; }

    loadFromJson(json: string): void {
        const obj = JSON.parse(json);
        this.loadFromObject(obj);
    }

    loadFromObject(obj: any): void {
        if (obj && typeof obj.positions === "string") {
            this._positions = decode64(obj.positions, 'float32') as Float32Array;
        } else if (obj && obj.positions instanceof Float32Array) {
            this._positions = obj.positions;
        } else {
            this._positions = new Float32Array();
        }

        if (obj && typeof obj.indices === "string") {
            this._indices = decode64(obj.indices, 'uint32') as Uint32Array;
        } else if (obj && obj.indices instanceof Uint32Array) {
            this._indices = obj.indices;
        } else {
            this._indices = new Uint32Array();
        }

        this._dims = Array.isArray(obj.dims) ? obj.dims : [0, 0, 0];
        this._bounds = Array.isArray(obj.bounds) ? obj.bounds : [0, 0, 0, 0, 0, 0];
        this._center = Array.isArray(obj.center) ? obj.center : [0, 0, 0];
        this._diag = typeof obj.diag === "number" ? obj.diag : 0;
        this._base_scale = typeof obj.base_scale === "number" ? obj.base_scale : 1.0;
    }

    toObject() {
        return {
            dims: this._dims,
            bounds: this._bounds,
            center: this._center,
            diag: this._diag,
            base_scale: this._base_scale,
        };
    }

    toJson(): string {
        return JSON.stringify(this.toObject());
    }
}

export default TerrainData;