import { makeAutoObservable } from "mobx";

import type { GlobalContext } from "@/Types/GlobalContext";
import { runInAction } from "mobx";
import { VSUP } from "@/Renderers/Colormaps/VSUP";
import * as GenSeeds from "./GenSeeds";
import { decode64, encode64 } from "@/Helpers/DataHelper";
import { computeCenterAndDiag } from "@/Helpers/MathHelper";
import PresetLinearColormap from "@/Renderers/Colormaps/PresetLinearColormap";
import { getTextureManager } from "@/Renderers/Colormaps/TextureManager";

export class UncertaintyTubeGlobalContext implements GlobalContext {
    dataServerAddress: string;
    seeds: [number, number, number][];

    textureManager = getTextureManager();
    colormap: PresetLinearColormap;

    colormapConfig: {
        type: string,
        presetName?: string,
        textureHeight?: number,
        textureWidth?: number,
        [key: string]: any
    }

    sbBounds: [number, number, number, number, number, number]; // xmin, xmax, ymin, ymax, zmin, zmax
    bbBounds: [number, number, number, number, number, number]; // xmin, xmax, ymin, ymax, zmin, zmax

    seedPlacement: {
        useRandomSeeding: boolean;
        randomSeedCount: number;
        useUniformSeeding: boolean;
        numUniformSeeds: [number, number, number]; // x, y, z
        useManualSeeding: boolean;
        manualSeedLocation: [number, number, number];
    }

    seedbox: {
        position: [number, number, number];
        size: [number, number, number];
        visible: boolean;
        active: boolean;
    };

    uncertaintyTubes: {
        loaded: boolean;
        vertices: Float32Array | null;
        faces: Uint32Array | null;
        uv: Float32Array | null;
    };

    queryConfig: {
        method: "swag" | "mcdropout";
        uncertaintyTube: boolean;
        eproj: number;
        sym: boolean;
    };

    views: string[];

    trajectoryVisualization: {
        showPath: boolean;
        showUncertaintyPath: boolean;
        showUncertaintyTube: boolean;
        showSeeds: boolean;
        showStats: boolean;
    }

    renderConfig: {
        camera: { near: number, farMultiplier: number },
        paths: {
            primary: { color: string, radiusDivisor: number, radialSegments: number },
            secondary: { color: string, radiusDivisor: number, radialSegments: number }
        },
        seeds: { color: string, radiusDivisor: number }
    }

    primaryTrajectories: Float32Array[];
    secondaryTrajectories: Float32Array[];

    center: [number, number, number] = [0, 0, 0];
    diag: number = 1;



    constructor() {
        this.dataServerAddress = "http://localhost:8000";
        this.seeds = [];

        this.seedPlacement = {
            useRandomSeeding: false,
            randomSeedCount: 10,
            useUniformSeeding: false,
            numUniformSeeds: [5, 5, 5],
            useManualSeeding: true,
            manualSeedLocation: [0, 0, 0]
        };

        this.seedbox = {
            position: [0, 0, 0],
            size: [1, 1, 1],
            visible: false,
            active: false
        };

        this.uncertaintyTubes = {
            loaded: false,
            vertices: null,
            faces: null,
            uv: null
        };

        this.sbBounds = [-1, 1, -1, 1, -1, 1];
        this.bbBounds = [-1, 1, -1, 1, -1, 1];

        this.colormap = new PresetLinearColormap("Cool to Warm");
        this.colormapConfig = {
            type: "linear",
            presetName: "Cool to Warm",
            textureHeight: 256,
            textureWidth: 1
        }

        this.textureManager.registerColormap("uncertainty_tube_colormap", this.colormap);

        this.queryConfig = {
            uncertaintyTube: true,
            method: "swag",
            eproj: 0.5,
            sym: false
        };

        this.trajectoryVisualization = {
            showPath: true,
            showUncertaintyPath: true,
            showUncertaintyTube: true,
            showSeeds: true,
            showStats: false,
        };

        this.renderConfig = {
            camera: { near: 0.1, farMultiplier: 3.0 },
            paths: {
                primary: { color: "orange", radiusDivisor: 500, radialSegments: 8 },
                secondary: { color: "lightgray", radiusDivisor: 700, radialSegments: 3 }
            },
            seeds: { color: "red", radiusDivisor: 100 }
        };

        this.primaryTrajectories = [];
        this.secondaryTrajectories = [];

        makeAutoObservable(this);

        this.getActiveBounds = this.getActiveBounds.bind(this);
        this.addSeeds = this.addSeeds.bind(this);
        this.deleteSeeds = this.deleteSeeds.bind(this);
    }

    async fetchBounds() {
        const response = await fetch(`${this.dataServerAddress}/get_bounds`, {
            method: "GET"
        });
        const data = await response.json();
        runInAction(() => {
            this.sbBounds = data.sb_bounds;
            this.bbBounds = data.bb_bounds;

            this.seedbox.position = [this.sbBounds[0], this.sbBounds[2], this.sbBounds[4]];
            this.seedbox.size = [
                (this.sbBounds[1] - this.sbBounds[0]) / 10,
                (this.sbBounds[3] - this.sbBounds[2]) / 10,
                (this.sbBounds[5] - this.sbBounds[4]) / 10
            ];

            const [center, diag] = computeCenterAndDiag(this.sbBounds);
            this.center = center;
            this.diag = diag;
        });
    }

    buildCurves(array: Float32Array, stride: number): Float32Array[] {
        // assume array is a flat Float32Array of points [x1,y1,z1, x2,y2,z2, ...]
        // stride is the number of points per curve
        const curves: Float32Array[] = [];
        for (let i = 0; i < array.length; i += stride) {
            const curve = array.slice(i, i + stride);
            curves.push(curve);
        }
        return curves;
    }

    async fetchTrajectories() {
        try {
            const response = await fetch(`${this.dataServerAddress}/get_trajectories`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    seeds: this.seeds,
                    query_config: this.queryConfig
                })
            });
            const data = await response.json();
            runInAction(() => {
                const startTimer = performance.now()
                const stride = data.trajectories_length * data.trajectories_dim;
                this.primaryTrajectories = this.buildCurves(decode64(data.primary_trajectories) as Float32Array, stride);
                this.secondaryTrajectories = this.buildCurves(decode64(data.secondary_trajectories) as Float32Array, stride);

                if (this.queryConfig.uncertaintyTube) {
                    this.uncertaintyTubes.loaded = true;
                    this.uncertaintyTubes.vertices = decode64(data.uncertainty_tube.vertices) as Float32Array;
                    this.uncertaintyTubes.faces = decode64(data.uncertainty_tube.faces, 'uint32') as Uint32Array;
                    this.uncertaintyTubes.uv = decode64(data.uncertainty_tube.uv) as Float32Array;
                }
                const endTimer = performance.now()
                console.log(`Data parsing from server took ${endTimer - startTimer} milliseconds`)
            });
        } catch (error) {
            console.error("Failed to fetch trajectories:", error);
        }
    }

    buildColormap(colormapConfig: any): PresetLinearColormap | null {
        const type = colormapConfig?.type || "linear";
        const presetName = colormapConfig?.preset_name || "Cool to Warm";

        switch (type) {
            case "linear":
                return new PresetLinearColormap(presetName);
            case "vsup":
                const depth = colormapConfig?.depth || 5;
                const continuous = colormapConfig?.continuous || false;
                const flipY = colormapConfig?.flip_y || false;
                const colormap = new VSUP(depth, continuous, flipY, presetName);
                if (colormapConfig?.fading_color) {
                    colormap.setFadingColor(colormapConfig.fading_color);
                }
                return colormap;
            default:
                console.warn(`Unknown colormap type: ${type}`);
        }
        return null;
    }

    initialize(globalData: any): void {
        this.dataServerAddress = globalData.data_server_address || this.dataServerAddress;
        this.seeds = globalData.seeds || this.seeds;
        this.seedPlacement = globalData.seed_placement || this.seedPlacement;
        this.seedbox = globalData.seedbox || this.seedbox;
        this.sbBounds = globalData.bounds || this.sbBounds;
        this.queryConfig = globalData.query_config || this.queryConfig;
        this.colormapConfig = globalData.colormap_config || this.colormapConfig;
        this.colormap = this.buildColormap(this.colormapConfig) || this.colormap;
        this.textureManager.registerColormap("uncertainty_tube_colormap", this.colormap);
        this.trajectoryVisualization = globalData.trajectory_visualization || this.trajectoryVisualization;
        this.primaryTrajectories = globalData.primary_trajectories ? [decode64(globalData.primary_trajectories) as Float32Array] : this.primaryTrajectories;
        this.secondaryTrajectories = globalData.secondary_trajectories ? [decode64(globalData.secondary_trajectories) as Float32Array] : this.secondaryTrajectories;
        this.renderConfig = globalData.render_config || this.renderConfig;

        if (globalData.uncertainty_tubes) {
            this.uncertaintyTubes.loaded = globalData.uncertainty_tubes.loaded || this.uncertaintyTubes.loaded;
            this.uncertaintyTubes.vertices = globalData.uncertainty_tubes.vertices ? decode64(globalData.uncertainty_tubes.vertices) as Float32Array : this.uncertaintyTubes.vertices;
            this.uncertaintyTubes.faces = globalData.uncertainty_tubes.faces ? decode64(globalData.uncertainty_tubes.faces, 'uint32') as Uint32Array : this.uncertaintyTubes.faces;
            this.uncertaintyTubes.uv = globalData.uncertainty_tubes.uv ? decode64(globalData.uncertainty_tubes.uv) as Float32Array : this.uncertaintyTubes.uv;
        }
    }

    async asyncInitialize(): Promise<void> {
        console.log("UncertaintyTubeGlobalContext asyncInitialize called");
        try {
            await this.fetchBounds();
            if (this.seeds.length > 0) {
                await this.fetchTrajectories();
            }
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        }
    }

    toObject(): any {
        return {
            data_server_address: this.dataServerAddress,
            seed_placement: this.seedPlacement,
            seedbox: this.seedbox,
            bounds: this.sbBounds,
            trajectory_visualization: this.trajectoryVisualization,
            render_config: this.renderConfig,
            query_config: this.queryConfig,
            colormap_config: this.colormapConfig,
            seeds: this.seeds,

            uncertainty_tubes: {
                loaded: this.uncertaintyTubes.loaded,
                vertices: this.uncertaintyTubes.vertices ? encode64(this.uncertaintyTubes.vertices) : null,
                faces: this.uncertaintyTubes.faces ? encode64(this.uncertaintyTubes.faces) : null,
                uv: this.uncertaintyTubes.uv ? encode64(this.uncertaintyTubes.uv) : null
            },
            primary_trajectories: this.primaryTrajectories.map(arr => encode64(arr)),
            secondary_trajectories: this.secondaryTrajectories.map(arr => encode64(arr))
        };
    }

    getActiveBounds(): [number, number, number, number, number, number] {
        if (!this.seedbox.active) {
            return this.sbBounds;
        } else {
            return [
                this.seedbox.position[0], this.seedbox.position[0] + this.seedbox.size[0],
                this.seedbox.position[1], this.seedbox.position[1] + this.seedbox.size[1],
                this.seedbox.position[2], this.seedbox.position[2] + this.seedbox.size[2]
            ];
        }
    }

    addSeeds() {
        const activeBounds = this.getActiveBounds();
        let seeds = [];
        if (this.seedPlacement.useRandomSeeding) {
            seeds = seeds.concat(GenSeeds.randomGen(activeBounds, this.seedPlacement.randomSeedCount));
        }
        if (this.seedPlacement.useUniformSeeding) {
            seeds = seeds.concat(GenSeeds.uniformGen(activeBounds, ...this.seedPlacement.numUniformSeeds));
        }
        if (this.seedPlacement.useManualSeeding) {
            const [x, y, z] = this.seedPlacement.manualSeedLocation;
            seeds.push([x, y, z]);
        }
        runInAction(() => {
            this.seeds = this.seeds.concat(seeds);
        });
    }

    deleteSeeds() {
        runInAction(() => {
            this.seeds = [];
            this.primaryTrajectories = [];
            this.secondaryTrajectories = [];
            this.uncertaintyTubes = {
                loaded: false,
                vertices: null,
                faces: null,
                uv: null
            };
        });
    }

}

export default UncertaintyTubeGlobalContext;
