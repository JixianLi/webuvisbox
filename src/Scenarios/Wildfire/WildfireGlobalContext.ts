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
    data_server_address?: string
    data_fetcher: WildfireDataFetcher;

    ensemble_names: string[];
    time_in_seconds: number[];
    current_time_index: number;

    current_ensemble_index: number;
    texture_manager = getTextureManager();

    scalars: ScalarFields;
    terrain: TerrainData;
    wind_glyphs_config: SingleInstanceWindGlyphsConfig;
    squid_glyphs: SquidsGlyphs;
    contour_config: ContourConfig;
    time_diff_config: TimeDiffConfig;
    time_diff_data: TimeDiffData;

    ensemble_colors: {
        "primary": string;
        "secondary": string;
    }

    ui_configs: {
        plot_label_size: number;
    }

    terrain_view_config: {
        current_ctf: PresetLinearColormap | null;
        current_otf: OpacityMap | null;
        current_ctf_name: string;
        current_otf_name: string;
    }

    contours: Float32Array[];

    _play: any

    _shared_camera?: SharedTrackballPerspectiveCamera;

    constructor() {
        this.name = "Wildfire";
        this.description = "A scenario for visualizing wildfire spread data.";
        this.data_server_address = "http://localhost:8000";
        this.data_fetcher = WildfireDataFetcher.getInstance(this.data_server_address);

        this._shared_camera = new SharedTrackballPerspectiveCamera();

        this.ensemble_names = [];
        this.time_in_seconds = [];
        this.current_time_index = 60;
        this.current_ensemble_index = 15;

        this.terrain = new TerrainData();
        this.scalars = new ScalarFields();

        this.ensemble_colors = {
            primary: "#EA0000",
            secondary: "#CDCDCD"
        };

        this.ui_configs = {
            plot_label_size: 22
        };

        this.contour_config = new ContourConfig();
        this.time_diff_config = new TimeDiffConfig();
        this.time_diff_data = new TimeDiffData();

        this.wind_glyphs_config = new SingleInstanceWindGlyphsConfig();
        this.wind_glyphs_config.setOnChanged(() => this.recomputeWindGlyphs());

        this.squid_glyphs = new SquidsGlyphs();
        this.squid_glyphs.setOnChanged(() => this.querySquidGlyphs());

        makeAutoObservable(this);
    }

    get shared_trackball_perspective_camera(): SharedTrackballPerspectiveCamera {
        return this._shared_camera!;
    }

    play() {
        if (this._play) return;

        const step = async () => {
            let next_time = this.current_time_index + this.time_diff_config.play_steps;
            if (next_time > this.time_in_seconds.length - 1) {
                next_time = 1;
            }
            await this.setTimeIndex(next_time);

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

    initialize(global_data_object: any): void {
        this.name = global_data_object.name || this.name;
        this.description = global_data_object.description || this.description;
        this.data_server_address = global_data_object.data_server_address || this.data_server_address;
        this.ensemble_names = global_data_object.ensemble_names || this.ensemble_names;
        this.time_in_seconds = global_data_object.time_index_to_seconds || this.time_in_seconds;
        this.current_time_index = global_data_object.current_time_index || this.current_time_index;
        this.current_ensemble_index = global_data_object.current_ensemble_index || this.current_ensemble_index;
        this.ensemble_colors = global_data_object.ensemble_colors || this.ensemble_colors;
        this.ui_configs = global_data_object.ui_configs || this.ui_configs;

        this.data_fetcher.setDataServerAddress(this.data_server_address!);
        this.terrain.loadFromObject(global_data_object.terrain || {});
        this.wind_glyphs_config.loadFromObject(global_data_object.wind_glyphs_config || {});
        this.squid_glyphs.loadFromObject(global_data_object.squid_glyphs || {});
        this.contour_config.loadFromObject(global_data_object.contour_configs || {});
        this.time_diff_config.loadFromObject(global_data_object.time_diff_configs || {});
    }

    async asyncInitialize(): Promise<void> {
        runInAction(async () => {
            await trackPromise(this.queryTerrainData());
            await trackPromise(this.queryTimeMap());
            await trackPromise(this.queryScalarData(this.current_ensemble_index, this.current_time_index));
            await trackPromise(this.queryContourData());
            await trackPromise(this.queryTimeDiffData());
            if (this.squid_glyphs.display) {
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
            data_server_address: this.data_server_address,
            ensemble_names: this.ensemble_names,
            time_index_to_seconds: this.time_in_seconds,
            current_time_index: this.current_time_index,
            current_ensemble_index: this.current_ensemble_index,
            ensemble_colors: this.ensemble_colors,
            ui_configs: this.ui_configs,
            contour_configs: this.contour_config.toObject(),
            time_diff_configs: this.time_diff_config.toObject(),

            terrain: this.terrain.toObject(),
            wind_glyphs_config: this.wind_glyphs_config.toObject(),
            squid_glyphs: this.squid_glyphs.toObject()
        };
    }

    updateTerrainViewConfig() {
        if (this.terrain_view_config === undefined) {
            this.terrain_view_config = {
                current_ctf: null,
                current_otf: null,
                current_ctf_name: "",
                current_otf_name: ""
            };
        }
        if (this.terrain_view_config.current_ctf === null) {
            this.terrain_view_config.current_ctf_name = "NFUEL_CAT";
            this.terrain_view_config.current_ctf = this.scalars.tfs["NFUEL_CAT"].ctf;
        }
        if (this.terrain_view_config.current_otf === null) {
            this.terrain_view_config.current_otf_name = "FUEL_FRAC";
            this.terrain_view_config.current_otf = this.scalars.tfs["FUEL_FRAC"].otf;
        }
    }

    private async queryScalarData(ensembleIndex: number, timeIndex: number): Promise<void> {
        const scalarResult = await this.data_fetcher.fetchScalarData({ idx: ensembleIndex, time: timeIndex });
        this.scalars.processReceivedScalarData(scalarResult);
        return Promise.resolve();
    }

    private async queryTerrainData() {
        const terrainResult = await this.data_fetcher.fetchTerrainData();
        runInAction(() => {
            this.ensemble_names = terrainResult.names;
            this.terrain.loadFromObject(terrainResult.terrain);

            const center = this.terrain.center;
            const diag = this.terrain.diag;

            this.shared_trackball_perspective_camera.setCamera(
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
        const timeDiffResult = await this.data_fetcher.fetchTimeDiffData();
        runInAction(() => {
            this.time_diff_data.loadFromQueryResult(timeDiffResult, this.ensemble_colors.secondary);
            this.time_diff_config.setXRange(this.time_diff_data.x_range);
            this.time_diff_config.setXDisplayRange([this.time_diff_data.x_range[0], this.time_diff_data.x_range[1]]);
        });
        return Promise.resolve();
    }

    private async queryTimeMap() {
        const time_map = await this.data_fetcher.fetchTimeMapData();
        runInAction(() => {
            this.time_in_seconds = time_map.time_in_seconds;
        });
        return Promise.resolve();
    }

    public async querySquidGlyphs() {
        const squidResult = await this.data_fetcher.fetchSquidData({
            time: this.current_time_index,
            scale: this.squid_glyphs.scale,
            sampling_stride: this.wind_glyphs_config.sampling_stride
        });
        runInAction(() => {
            console.log("Fetched squid glyph data:", squidResult);
            this.squid_glyphs.setVertices(squidResult.vertices);
            this.squid_glyphs.setFaces(squidResult.faces);
        });
        return Promise.resolve();
    }

    private async queryContourData() {
        const contourResults = await this.data_fetcher.fetchContourData({ time: this.current_time_index });
        runInAction(() => {
            this.contours = contourResults.contours;
        });
        return Promise.resolve();
    }

    public async setEnsembleIndex(index: number): Promise<void> {
        const query_index = clip(index, 0, this.ensemble_names.length - 1);

        if (this.current_ensemble_index === query_index) {
            return Promise.resolve();
        }
        runInAction(async () => {
            this.current_ensemble_index = query_index;
            this.queryScalarData(query_index, this.current_time_index);
            this.recomputeWindGlyphs();
        });
        return Promise.resolve();
    }

    public async setTimeIndex(index: number): Promise<void> {
        const clipped_index = Math.round(clip(index, 0, this.time_in_seconds.length - 1));
        if (this.current_time_index === clipped_index) {
            return Promise.resolve();
        }

        runInAction(() => {
            this.current_time_index = clipped_index;
        });

        await Promise.all([
            this.queryScalarData(this.current_ensemble_index, clipped_index),
            this.queryContourData(),
            this.querySquidGlyphs()
        ]);

        this.recomputeWindGlyphs();

        return Promise.resolve();
    }

    private recomputeWindGlyphs() {
        runInAction(() => {
            this.wind_glyphs_config.resetInstances();
            if (this.wind_glyphs_config.display) {
                const colormap = this.texture_manager.getColormap("WIND_MAG");
                const color_getter = colormap ? (magnitude: number, max_magnitude: number) => {
                    const t = magnitude / max_magnitude;
                    return colormap.getColor(t);
                } : (_magnitude: number, _max_magnitude: number) => d3.rgb(0, 0, 255);
                this.wind_glyphs_config.updateInstances(
                    {
                        u: this.scalars.scalar_data["UF"],
                        v: this.scalars.scalar_data["VF"],
                        mag: this.scalars.scalar_data["WIND_MAG"],
                        mag_max: this.scalars.scalar_tags["WIND_MAG"].max
                    },
                    {
                        positions: this.terrain.positions,
                        base_scale: this.terrain.base_scale
                    },
                    color_getter
                );
            }
        });
    }
}

export default WildfireGlobalContext;
