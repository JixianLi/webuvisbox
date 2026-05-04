import { makeAutoObservable, runInAction } from "mobx";
import { PresetLinearColormap } from "@/Renderers/Colormaps/PresetLinearColormap";
import { OpacityMap } from "@/Renderers/Colormaps/OpacityMap";
import type { ScalarQueryResult } from "../DataFetcher";
import { getTextureManager } from "@/Renderers/Colormaps/TextureManager";

export class ScalarFields {
    private _scalarNames: string[] = [];
    textureManager = getTextureManager();
    private _scalarData: {
        [key: string]: Float32Array  // key is scalar name
    } = {};
    private _scalarTags: {
        [key: string]: {
            name: string;
            min: number;
            max: number;
            units: string;
            description: string;
        }
    } = {};

    private _rescaled?: Float32Array[] = undefined;
    private _tfs?: { [key: string]: { ctf: PresetLinearColormap, otf: OpacityMap } } = undefined;
    private _depths: number[] = [];
    private _ordering: number[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    // Getters return copies / readonly views so callers cannot modify internals
    get scalarNames(): ReadonlyArray<string> {
        return this._scalarNames;
    }

    get scalarData(): { [key: string]: Float32Array } {
        return this._scalarData;
    }

    get scalarTags(): { [key: string]: { name: string; min: number; max: number; units: string; description: string } } {
        return this._scalarTags;
    }

    get rescaled(): Float32Array[] | undefined {
        return this._rescaled;
    }

    get tfs(): { [key: string]: { ctf: PresetLinearColormap, otf: OpacityMap } } | undefined {
        return this._tfs;
    }

    get depths(): ReadonlyArray<number> {
        return this._depths;
    }

    get ordering(): ReadonlyArray<number> {
        return this._ordering;
    }

    private updateTFs(): void {
        runInAction(() => {
            if (this._tfs === undefined) {
                this._tfs = {};
            }
            this._scalarNames.forEach(name => {
                if (this._tfs[name] === undefined || this._tfs[name] === null) {
                    if (name === "NFUEL_CAT") {
                        const colormap = new PresetLinearColormap("Greens");
                        colormap.setControlPoints([0.0,0.076,1.0],
                            [[0.2,0.4,0.2],[0.4,0.7,0.4],[0.95,1.0,0.95]]);
                        this._tfs[name] = {
                            ctf: colormap,
                            otf: new OpacityMap([0, 1], [0, 1])
                        };
                    } else if (name === "boxplot") {
                        const colormap = new PresetLinearColormap("X Ray");
                        colormap.colorPoints[0] = [0.95,1.0,0.95]
                        this._tfs[name] = {
                            ctf: colormap,
                            otf: new OpacityMap([0, 1], [1, 1])
                        };


                    } else {
                        this._tfs[name] = {
                            ctf: new PresetLinearColormap("Cool to Warm"),
                            otf: new OpacityMap([0, 1], [0, 1])
                        };
                    }
                }
                this.textureManager.registerColormap(name, this._tfs[name].ctf);
                this.textureManager.registerOpacityMap(name, this._tfs[name].otf);
            });
        });
    }

    private rescaleScalarData() {
        const rescaled = [];
        this._scalarNames.forEach(name => {
            const raw = this._scalarData[name];
            const min = this._scalarTags[name].min;
            const max = this._scalarTags[name].max;
            const rescaledSf = new Float32Array(raw.length);
            for (let i = 0; i < raw.length; i++) {
                rescaledSf[i] = (raw[i] - min) / (max - min);
            }
            rescaled.push(rescaledSf);
        });
        runInAction(() => {
            this._rescaled = rescaled;
        });
    }


    public processReceivedScalarData(scalars: ScalarQueryResult): void {
        runInAction(() => {
            this._scalarNames = scalars.scalar_names;
            this._scalarData = scalars.scalar_data;
            this._scalarTags = scalars.scalar_tags;
            this._depths = scalars.depths;
            this._ordering = scalars.ordering;
            this.updateTFs();
            this.rescaleScalarData();
        })

    }

    loadFromJson(json: string): void {
        const obj = JSON.parse(json);
        this.loadFromObject(obj);
    }

    loadFromObject(_obj: any): void {
        // ...existing code...
    if (!_obj || !_obj.tfs) {
        return; // Do nothing if no tfs data
    }

    runInAction(() => {
        if (this._tfs === undefined) {
            this._tfs = {};
        }

        Object.keys(_obj.tfs).forEach(key => {
            const tfData = _obj.tfs[key];

            // Create new instances from the serialized data
            const ctf = PresetLinearColormap.fromObject(tfData.ctf);

            const otf = OpacityMap.fromObject(tfData.otf);

            // Store in our tfs object
            this._tfs[key] = { ctf, otf };

            // Register with texture manager
            this.textureManager.registerColormap(key, ctf);
            this.textureManager.registerOpacityMap(key, otf);
        });
    });

    }

    toObject(): any {

        const obj: any = {};
        Object.keys(this._tfs).forEach(key => {
            obj[key] = {
                ctf: this._tfs[key].ctf.toObject(),
                otf: this._tfs[key].otf.toObject()
            };
        });
        return { tfs: obj };
    }

    toJson(): string {
        return JSON.stringify(this.toObject());
    }

}

export default ScalarFields;
