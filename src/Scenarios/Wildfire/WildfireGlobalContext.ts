// ABOUTME: Central state coordinator for the Wildfire scenario.
// ABOUTME: Manages lifecycle, data fetching, and wires together sub-object configurations.

import * as d3 from "d3";
import * as THREE from "three";
import { makeAutoObservable, runInAction } from "mobx";
import { trackPromise } from "react-promise-tracker";

import type { GlobalContext } from "@/Types/GlobalContext";
import { clip } from "@/Helpers/MathHelper";
import { PresetLinearColormap } from "@/Renderers/Colormaps/PresetLinearColormap";
import { getTextureManager } from "@/Renderers/Colormaps/TextureManager";
import OpacityMap from "@/Renderers/Colormaps/OpacityMap";
import { SharedTrackballPerspectiveCamera } from "@/Renderers/SharedCameraControl/SharedPerspectiveCamera";
import { WildfireDataFetcher } from "./DataFetcher";
import { ScalarFields } from "./GlobalDataContainers/ScalarFields";
import { SingleInstanceWindGlyphsConfig } from "./GlobalDataContainers/SingleInstanceWindGlyphsConfig";
import { SquidsGlyphs } from "./GlobalDataContainers/SquidsGlyphs";
import TerrainData from "./GlobalDataContainers/TerrainData";
import { ContourConfig } from "./GlobalDataContainers/ContourConfig";
import { TimeDiffConfig } from "./GlobalDataContainers/TimeDiffConfig";
import { TimeDiffData } from "./GlobalDataContainers/TimeDiffData";


export class WildfireGlobalContext implements GlobalContext {
    name: string;
    description?: string
    dataServerAddress?: string
    dataFetcher: WildfireDataFetcher;

    ensembleNames: string[];
    timeInSeconds: number[];
    currentTimeIndex: number;

    currentEnsembleIndex: number;
    textureManager = getTextureManager();

    scalars: ScalarFields;
    terrain: TerrainData;
    windGlyphsConfig: SingleInstanceWindGlyphsConfig;
    squidGlyphs: SquidsGlyphs;
    contourConfig: ContourConfig;
    timeDiffConfig: TimeDiffConfig;
    timeDiffData: TimeDiffData;

    ensembleColors: {
        "primary": string;
        "secondary": string;
    }

    uiConfigs: {
        plotLabelSize: number;
    }

    terrainViewConfig: {
        currentCtf: PresetLinearColormap | null;
        currentOtf: OpacityMap | null;
        currentCtfName: string;
        currentOtfName: string;
    }

    contours: Float32Array[];

    _play: any

    _sharedCamera?: SharedTrackballPerspectiveCamera;

    constructor() {
        this.name = "Wildfire";
        this.description = "A scenario for visualizing wildfire spread data.";
        this.dataServerAddress = "http://localhost:8000";
        this.dataFetcher = WildfireDataFetcher.getInstance(this.dataServerAddress);

        this._sharedCamera = new SharedTrackballPerspectiveCamera();

        this.ensembleNames = [];
        this.timeInSeconds = [];
        this.currentTimeIndex = 60;
        this.currentEnsembleIndex = 15;

        this.terrain = new TerrainData();
        this.scalars = new ScalarFields();

        this.ensembleColors = {
            primary: "#EA0000",
            secondary: "#CDCDCD"
        };

        this.uiConfigs = {
            plotLabelSize: 22
        };

        this.contourConfig = new ContourConfig();
        this.timeDiffConfig = new TimeDiffConfig();
        this.timeDiffData = new TimeDiffData();

        this.windGlyphsConfig = new SingleInstanceWindGlyphsConfig();
        this.windGlyphsConfig.setOnChanged(() => this.recomputeWindGlyphs());

        this.squidGlyphs = new SquidsGlyphs();
        this.squidGlyphs.setOnChanged(() => this.querySquidGlyphs());

        makeAutoObservable(this);
    }

    get sharedTrackballPerspectiveCamera(): SharedTrackballPerspectiveCamera {
        return this._sharedCamera!;
    }

    play() {
        if (this._play) return;

        const step = async () => {
            let nextTime = this.currentTimeIndex + this.timeDiffConfig.playSteps;
            if (nextTime > this.timeInSeconds.length - 1) {
                nextTime = 1;
            }
            await this.setTimeIndex(nextTime);

            if (this._play) {
                this._play = setTimeout(step, 1000);
            }
        };

        this._play = setTimeout(step, 0);
    }

    stop() {
        if (this._play) {
            clearTimeout(this._play);
            this._play = null;
        }
    }

    initialize(globalDataObject: any): void {
        this.name = globalDataObject.name || this.name;
        this.description = globalDataObject.description || this.description;
        this.dataServerAddress = globalDataObject.data_server_address || this.dataServerAddress;
        this.ensembleNames = globalDataObject.ensemble_names || this.ensembleNames;
        this.timeInSeconds = globalDataObject.time_index_to_seconds || this.timeInSeconds;
        this.currentTimeIndex = globalDataObject.current_time_index || this.currentTimeIndex;
        this.currentEnsembleIndex = globalDataObject.current_ensemble_index || this.currentEnsembleIndex;
        this.ensembleColors = globalDataObject.ensemble_colors || this.ensembleColors;
        this.uiConfigs = globalDataObject.ui_configs || this.uiConfigs;

        this.dataFetcher.setDataServerAddress(this.dataServerAddress!);
        this.terrain.loadFromObject(globalDataObject.terrain || {});
        this.windGlyphsConfig.loadFromObject(globalDataObject.wind_glyphs_config || {});
        this.squidGlyphs.loadFromObject(globalDataObject.squid_glyphs || {});
        this.contourConfig.loadFromObject(globalDataObject.contour_configs || {});
        this.timeDiffConfig.loadFromObject(globalDataObject.time_diff_configs || {});
    }

    async asyncInitialize(): Promise<void> {
        runInAction(async () => {
            await trackPromise(this.queryTerrainData());
            await trackPromise(this.queryTimeMap());
            await trackPromise(this.queryScalarData(this.currentEnsembleIndex, this.currentTimeIndex));
            await trackPromise(this.queryContourData());
            await trackPromise(this.queryTimeDiffData());
            if (this.squidGlyphs.display) {
                await trackPromise(this.querySquidGlyphs());
            }

            this.updateTerrainViewConfig();
            this.recomputeWindGlyphs();

        });
        return Promise.resolve();
    }

    toObject() {
        return {
            name: this.name,
            description: this.description,
            data_server_address: this.dataServerAddress,
            ensemble_names: this.ensembleNames,
            time_index_to_seconds: this.timeInSeconds,
            current_time_index: this.currentTimeIndex,
            current_ensemble_index: this.currentEnsembleIndex,
            ensemble_colors: this.ensembleColors,
            ui_configs: this.uiConfigs,
            contour_configs: this.contourConfig.toObject(),
            time_diff_configs: this.timeDiffConfig.toObject(),

            terrain: this.terrain.toObject(),
            wind_glyphs_config: this.windGlyphsConfig.toObject(),
            squid_glyphs: this.squidGlyphs.toObject()
        };
    }

    updateTerrainViewConfig() {
        if (this.terrainViewConfig === undefined) {
            this.terrainViewConfig = {
                currentCtf: null,
                currentOtf: null,
                currentCtfName: "",
                currentOtfName: ""
            };
        }
        if (this.terrainViewConfig.currentCtf === null) {
            this.terrainViewConfig.currentCtfName = "NFUEL_CAT";
            this.terrainViewConfig.currentCtf = this.scalars.tfs["NFUEL_CAT"].ctf;
        }
        if (this.terrainViewConfig.currentOtf === null) {
            this.terrainViewConfig.currentOtfName = "FUEL_FRAC";
            this.terrainViewConfig.currentOtf = this.scalars.tfs["FUEL_FRAC"].otf;
        }
    }

    private async queryScalarData(ensembleIndex: number, timeIndex: number): Promise<void> {
        const scalarResult = await this.dataFetcher.fetchScalarData({ idx: ensembleIndex, time: timeIndex });
        this.scalars.processReceivedScalarData(scalarResult);
        return Promise.resolve();
    }

    private async queryTerrainData() {
        const terrainResult = await this.dataFetcher.fetchTerrainData();
        runInAction(() => {
            this.ensembleNames = terrainResult.names;
            this.terrain.loadFromObject(terrainResult.terrain);

            const center = this.terrain.center;
            const diag = this.terrain.diag;

            this.sharedTrackballPerspectiveCamera.setCamera(
                new THREE.Vector3(center[0], center[1], center[2] + diag),
                new THREE.Vector3(center[0], center[1], center[2]),
                new THREE.Vector3(0, 1, 0),
                new THREE.Quaternion(),
                "initial_setup"
            );
        });
        return Promise.resolve();
    }

    private async queryTimeDiffData() {
        const timeDiffResult = await this.dataFetcher.fetchTimeDiffData();
        runInAction(() => {
            this.timeDiffData.loadFromQueryResult(timeDiffResult, this.ensembleColors.secondary);
            this.timeDiffConfig.setXRange(this.timeDiffData.xRange);
            this.timeDiffConfig.setXDisplayRange([this.timeDiffData.xRange[0], this.timeDiffData.xRange[1]]);
        });
        return Promise.resolve();
    }

    private async queryTimeMap() {
        const timeMap = await this.dataFetcher.fetchTimeMapData();
        runInAction(() => {
            this.timeInSeconds = timeMap.time_in_seconds;
        });
        return Promise.resolve();
    }

    public async querySquidGlyphs() {
        const squidResult = await this.dataFetcher.fetchSquidData({
            time: this.currentTimeIndex,
            scale: this.squidGlyphs.scale,
            sampling_stride: this.windGlyphsConfig.samplingStride
        });
        runInAction(() => {
            console.log("Fetched squid glyph data:", squidResult);
            this.squidGlyphs.setVertices(squidResult.vertices);
            this.squidGlyphs.setFaces(squidResult.faces);
        });
        return Promise.resolve();
    }

    private async queryContourData() {
        const contourResults = await this.dataFetcher.fetchContourData({ time: this.currentTimeIndex });
        runInAction(() => {
            this.contours = contourResults.contours;
        });
        return Promise.resolve();
    }

    public async setEnsembleIndex(index: number): Promise<void> {
        const queryIndex = clip(index, 0, this.ensembleNames.length - 1);

        if (this.currentEnsembleIndex === queryIndex) {
            return Promise.resolve();
        }
        runInAction(async () => {
            this.currentEnsembleIndex = queryIndex;
            this.queryScalarData(queryIndex, this.currentTimeIndex);
            this.recomputeWindGlyphs();
        });
        return Promise.resolve();
    }

    public async setTimeIndex(index: number): Promise<void> {
        const clippedIndex = Math.round(clip(index, 0, this.timeInSeconds.length - 1));
        if (this.currentTimeIndex === clippedIndex) {
            return Promise.resolve();
        }

        runInAction(() => {
            this.currentTimeIndex = clippedIndex;
        });

        await Promise.all([
            this.queryScalarData(this.currentEnsembleIndex, clippedIndex),
            this.queryContourData(),
            this.querySquidGlyphs()
        ]);

        this.recomputeWindGlyphs();

        return Promise.resolve();
    }

    private recomputeWindGlyphs() {
        runInAction(() => {
            this.windGlyphsConfig.resetInstances();
            if (this.windGlyphsConfig.display) {
                const colormap = this.textureManager.getColormap("WIND_MAG");
                const colorGetter = colormap ? (magnitude: number, maxMagnitude: number) => {
                    const t = magnitude / maxMagnitude;
                    return colormap.getColor(t);
                } : (_magnitude: number, _maxMagnitude: number) => d3.rgb(0, 0, 255);
                this.windGlyphsConfig.updateInstances(
                    {
                        u: this.scalars.scalarData["UF"],
                        v: this.scalars.scalarData["VF"],
                        mag: this.scalars.scalarData["WIND_MAG"],
                        magMax: this.scalars.scalarTags["WIND_MAG"].max
                    },
                    {
                        positions: this.terrain.positions,
                        baseScale: this.terrain.baseScale
                    },
                    colorGetter
                );
            }
        });
    }
}

export default WildfireGlobalContext;
