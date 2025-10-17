import { makeAutoObservable, runInAction } from "mobx";
import type { GlobalContext } from "@/Types/GlobalContext";
import { trackPromise } from "react-promise-tracker";
import { PresetLinearColormap } from "@/Renderers/Colormaps/PresetLinearColormap";
import { getTextureManager } from "@/Renderers/Colormaps/TextureManager";
import OpacityMap from "@/Renderers/Colormaps/OpacityMap";
import { WildfireDataFetcher } from "./DataFetcher";
import { clip } from "@/Helpers/MathHelper";
import { SingleInstanceWindGlyphsConfig } from "./GlobalDataContainers/SingleInstanceWindGlyphsConfig";
import * as d3 from "d3";
import * as THREE from "three";
import TerrainData from "./GlobalDataContainers/TerrainData";
import { SharedTrackballPerspectiveCamera } from "@/Renderers/SharedCameraControl/SharedPerspectiveCamera";
import { ScalarFields } from "./GlobalDataContainers/ScalarFields";


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

    contours: Float32Array[]; // array of contours, each contour is an array of 3D points

    contour_configs: {
        display_primary: boolean;
        display_secondary: boolean;
        radius: number;
        primary_scale: number;
        secondary_scale: number;
        radial_segments: number;
    }

    time_diff_data: {
        data_names: string[];
        datasets: { [key: string]: { datasets: any[] } };
        ensemble_min: number[];
        ensemble_max: number[];
        min: number;
        max: number;
        x_range: [number, number];
    }

    time_diff_configs: {
        hover_time: number | null;
        show_hover_time: boolean;
        show_ensemble: boolean;
        show_zoom_box: boolean;
        share_y_scale: boolean;
        x_range: [number, number] | null;
        x_display_range: [number, number] | null;
        zoom_box_range: [number, number] | null;
        play_steps: number;
    }

    _play: any

    _shared_camera?: SharedTrackballPerspectiveCamera;

    constructor() {
        this.name = "Wildfire";
        this.description = "A scenario for visualizing wildfire spread data.";
        this.data_server_address = "http://localhost:8000"; // Default address, can be changed
        this.data_fetcher = WildfireDataFetcher.getInstance(this.data_server_address);

        this._shared_camera = new SharedTrackballPerspectiveCamera();

        // for wildfire attributes
        this.ensemble_names = [];
        this.time_in_seconds = [];
        this.current_time_index = 60;
        this.current_ensemble_index = 15;

        // empty terrain data structure
        this.terrain = new TerrainData();
        this.scalars = new ScalarFields();

        this.ensemble_colors = {
            primary: "#EA0000",
            secondary: "#CDCDCD"
        };

        this.ui_configs = {
            plot_label_size: 22
        };

        this.contour_configs = {
            display_primary: true,
            display_secondary: true,
            radius: 0.001,
            primary_scale: 2,
            secondary_scale: 1,
            radial_segments: 6
        }

        this.time_diff_configs = {
            hover_time: null,
            show_hover_time: true,
            show_ensemble: true,
            show_zoom_box: false,
            share_y_scale: false,
            x_range: null,
            x_display_range: null,
            zoom_box_range: null,
            play_steps: 5
        };

        this.wind_glyphs_config = new SingleInstanceWindGlyphsConfig();

        makeAutoObservable(this);
    }

    get shared_trackball_perspective_camera(): SharedTrackballPerspectiveCamera {
        return this._shared_camera!;
    }

    play() {
        this._play = setInterval(() => {
            let next_time = this.current_time_index + this.time_diff_configs.play_steps
            if (next_time > this.time_in_seconds.length - 1) {
                next_time = 0;
            }
            this.setTimeIndex(next_time);
        }, 1000);
    }

    stop() {
        clearInterval(this._play);
        this._play = null;
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
        this.contour_configs = global_data_object.contour_configs || this.contour_configs;
        this.time_diff_data = global_data_object.time_diff_data || this.time_diff_data;
        this.time_diff_configs = global_data_object.time_diff_configs || this.time_diff_configs;

        this.data_fetcher.setDataServerAddress(this.data_server_address!);
        this.terrain.loadFromObject(global_data_object.terrain || {});
        this.wind_glyphs_config.loadFromObject(global_data_object.wind_glyphs_config || {});
    }

    async asyncInitialize(): Promise<void> {
        runInAction(async () => {
            await trackPromise(this.queryTerrainData());
            await trackPromise(this.queryTimeMap());
            await trackPromise(this.queryScalarData(this.current_ensemble_index, this.current_time_index));
            await trackPromise(this.queryContourData());
            await trackPromise(this.queryTimeDiffData());

            this.updateTerrainViewConfig();
            this.windGlyphsUpdateInstances();
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
            contour_configs: this.contour_configs,
            time_diff_configs: this.time_diff_configs,

            terrain: this.terrain.toObject(),
            wind_glyphs_config: this.wind_glyphs_config.toObject()
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


    private buildDatasetsForTimeDiff(timeDiffResult: any) {
        const datasets: { [key: string]: { datasets: any[] } } = {};
        const data_names = timeDiffResult.data_names;
        const data_arrays = timeDiffResult.data_arrays;

        data_names.forEach((name: string) => {
            datasets[name] = {
                datasets: data_arrays[name].map((data_array, edx) => {
                    return {
                        type: 'line',
                        label: `edx_${edx}_label_${name}`,
                        data: data_array,
                        yAxisID: 'y',
                        pointRadius: 0,
                        borderColor: this.ensemble_colors.secondary,
                        borderWidth: 1,
                        hidden: false,
                    };
                })
            };
        });
        return datasets;
    }

    private async queryTimeDiffData() {
        const timeDiffResult = await this.data_fetcher.fetchTimeDiffData();
        runInAction(() => {
            this.time_diff_data = {
                data_names: timeDiffResult.data_names,
                ensemble_min: timeDiffResult.ensemble_min,
                ensemble_max: timeDiffResult.ensemble_max,
                min: timeDiffResult.min,
                max: timeDiffResult.max,
                x_range: timeDiffResult.x_range,
                datasets: this.buildDatasetsForTimeDiff(timeDiffResult)
            };
            this.time_diff_configs.x_display_range = [this.time_diff_data.x_range[0], this.time_diff_data.x_range[1]];
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
        // update current ensemble index and fetch new scalar data
        runInAction(async () => {
            this.current_ensemble_index = query_index;
            this.queryScalarData(query_index, this.current_time_index);
            this.windGlyphsUpdateInstances();
        });
        return Promise.resolve();
    }

    public async setTimeIndex(index: number): Promise<void> {
        const clipped_index = Math.round(clip(index, 0, this.time_in_seconds.length - 1));
        if (this.current_time_index === clipped_index) {
            return Promise.resolve();
        }
        runInAction(async () => {
            this.current_time_index = clipped_index;
            this.queryScalarData(this.current_ensemble_index, clipped_index);
            this.queryContourData();
            this.windGlyphsUpdateInstances();
        });
        return Promise.resolve();
    }

    contourConfigSetDisplayPrimary(display: boolean) {
        runInAction(() => {
            this.contour_configs.display_primary = display;
        });
    }

    contourConfigSetDisplaySecondary(display: boolean) {
        runInAction(() => {
            this.contour_configs.display_secondary = display;
        });
    }

    contourConfigSetPrimaryScale(scale: number) {
        const clipped_scale = clip(scale, 1, 100);
        runInAction(() => {
            this.contour_configs.primary_scale = clipped_scale;
        });
    }

    contourConfigSetSecondaryScale(scale: number) {
        const clipped_scale = clip(scale, 1, 100);
        runInAction(() => {
            this.contour_configs.secondary_scale = clipped_scale;
        });
    }

    timeDiffResetXDisplayRange() {
        runInAction(() => {
            this.time_diff_configs.x_display_range = [this.time_diff_data.x_range[0], this.time_diff_data.x_range[1]];
        });
    }

    timeDiffSetXDisplayRange(range: [number, number]) {
        runInAction(() => {
            this.time_diff_configs.x_display_range = range;
        });
    }

    timeDiffSetZoomBoxRange(range: [number, number] | null) {
        runInAction(() => {
            this.time_diff_configs.zoom_box_range = range;
        });
    }

    timeDiffToggleShowEnsemble() {
        runInAction(() => {
            this.time_diff_configs.show_ensemble = !this.time_diff_configs.show_ensemble;
        });
    }

    timeDiffToggleShareYScale() {
        runInAction(() => {
            this.time_diff_configs.share_y_scale = !this.time_diff_configs.share_y_scale;
        });
    }

    timeDiffSetShowZoomBox(show: boolean) {
        runInAction(() => {
            this.time_diff_configs.show_zoom_box = show;
        });
    }

    timeDiffSetShowHoverTime(show: boolean) {
        runInAction(() => {
            this.time_diff_configs.show_hover_time = show;
        });
    }

    timeDiffSetHoverTime(timeIndex: number) {
        const clipped_input = clip(timeIndex, this.time_diff_data.x_range[0], this.time_diff_data.x_range[1]);
        runInAction(() => {
            this.time_diff_configs.hover_time = Math.round(clipped_input);
        });
    }

    timeDiffSetPlaySteps(steps: number) {
        const clipped_steps = clip(steps, 1, 100);
        runInAction(() => {
            this.time_diff_configs.play_steps = clipped_steps;
        });
    }

    windGlyphsSetDisplay(display: boolean): void {
        runInAction(() => {
            this.wind_glyphs_config.setDisplay(display);
            if (this.wind_glyphs_config.display) {
                const start = performance.now();
                this.windGlyphsComputeGlyphs();
                const end = performance.now();
                console.log(`windGlyphsComputeGlyphs took ${(end - start).toFixed(2)} ms`);
            }
        });
    }

    windGlyphsSetScaleByMagnitude(scale_by_magnitude: boolean): void {
        runInAction(() => {
            this.wind_glyphs_config.setScaleByMagnitude(scale_by_magnitude);
            if (this.wind_glyphs_config.display) {
                this.windGlyphsUpdateInstances();
            }
        });
    }

    windGlyphsSetColorByMagnitude(color_by_magnitude: boolean): void {
        runInAction(() => {
            this.wind_glyphs_config.setColorByMagnitude(color_by_magnitude);
            if (this.wind_glyphs_config.display) {
                this.windGlyphsUpdateInstances();
            }
        });
    }


    /**
     * Returns the size of the scalar field (number of 3D positions).
     */
    private getScalarFieldSize(): number {
        return this.terrain.positions.length > 0 ? this.terrain.positions.length / 3 : 1;
    }

    windGlyphsSetSamplingStride(stride: number): void {
        runInAction(() => {
            // Ensure stride is a positive integer and less than scalar field size
            const scalarFieldSize = this.getScalarFieldSize();
            const clippedStride = Math.max(1, Math.min(Math.floor(stride), scalarFieldSize - 1));
            this.wind_glyphs_config.setSamplingStride(clippedStride);
            if (this.wind_glyphs_config.display) {
                this.windGlyphsUpdateInstances();
            }
        });
    }

    windGlyphsSetLengthScale(length_scale: number): void {
        runInAction(() => {
            this.wind_glyphs_config.setLengthScale(length_scale);
            if (this.wind_glyphs_config.display) {
                this.windGlyphsUpdateInstances();
            }
        });
    }

    windGlyphsSetSizeScale(size_scale: number): void {
        runInAction(() => {
            this.wind_glyphs_config.setSizeScale(size_scale);
            if (this.wind_glyphs_config.display) {
                this.windGlyphsUpdateInstances();
            }
        });
    }

    windGlyphsSetRadius(radius: number): void {
        runInAction(() => {
            this.wind_glyphs_config.setRadius(radius);
            if (this.wind_glyphs_config.display) {
                this.windGlyphsUpdateInstances();
            }
        });
    }

    windGlyphsSetColor(color: string | d3.RGBColor | [number, number, number, number] | [number, number, number]): void {
        this.wind_glyphs_config.setColor(color);
        if (this.wind_glyphs_config.display) {
            this.windGlyphsUpdateInstances();
        }
    }

    private windGlyphsComputeGlyphs() {
        const colormap = this.texture_manager.getColormap("WIND_MAG");
        const color_getter = colormap ? (magnitude, max_magnitude) => {
            const t = magnitude / max_magnitude;
            return colormap.getColor(t);
        } : (_magnitude, _max_magnitude) => d3.rgb(0, 0, 255);
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
        )
    }

    windGlyphsUpdateInstances(): void {
        runInAction(() => {
            this.wind_glyphs_config.resetInstances();
            if (this.wind_glyphs_config.display) {
                this.windGlyphsComputeGlyphs();
            }
        });
    }
}

export default WildfireGlobalContext;