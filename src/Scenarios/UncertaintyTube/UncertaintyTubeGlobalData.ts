import { makeAutoObservable } from "mobx";
import type { Point3D } from "@/Types/Geometry";
import type { GlobalContext } from "@/Types/GlobalContext";
import { runInAction } from "mobx";
import { VSUP } from "@/Renderers/Colormaps/VSUP";
import * as GenSeeds from "./GenSeeds";
import { decode64, encode64 } from "@/Helpers/DataHelper";
import PresetLinearColormap from "@/Renderers/Colormaps/PresetLinearColormap";
import { getTextureManager } from "@/Renderers/Colormaps/TextureManager";

export class UncertaintyTubeGlobalContext implements GlobalContext {
    data_server_address: string;
    seeds: Point3D[];

    texture_manager = getTextureManager();
    colormap: PresetLinearColormap;

    colormap_config: {
        type: string,
        preset_name?: string,
        texture_height?: number,
        texture_width?: number,
        [key: string]: any
    }

    sb_bounds: [number, number, number, number, number, number]; // xmin, xmax, ymin, ymax, zmin, zmax
    bb_bounds: [number, number, number, number, number, number]; // xmin, xmax, ymin, ymax, zmin, zmax

    seed_placement: {
        use_random_seeding: boolean;
        random_seed_count: number;
        use_uniform_seeding: boolean;
        num_uniform_seeds: [number, number, number]; // x, y, z
        use_manual_seeding: boolean;
        manual_seed_location: [number, number, number];
    }

    seedbox: {
        position: [number, number, number];
        size: [number, number, number];
        visible: boolean;
        active: boolean;
    };

    uncertainty_tubes: {
        loaded: boolean;
        vertices: Float32Array | null;
        faces: Uint32Array | null;
        uv: Float32Array | null;
    };

    query_config: {
        method: "swag" | "mcdropout";
        uncertainty_tube: boolean;
        eproj: number;
        sym: boolean;
    };

    views: string[];

    trajectory_visualization: {
        show_path: boolean;
        show_uncertainty_path: boolean;
        show_uncertainty_tube: boolean;
        show_seeds: boolean;
        show_stats: boolean;
    }

    render_config: {
        camera: { near: number, farMultiplier: number },
        paths: {
            primary: { color: string, radius_divisor: number, radial_segments: number },
            secondary: { color: string, radius_divisor: number, radial_segments: number }
        },
        seeds: { color: string, radius_divisor: number }
    }

    primary_trajectories: Float32Array[];
    secondary_trajectories: Float32Array[];

    center: [number, number, number] = [0, 0, 0];
    diag: number = 1;



    constructor() {
        this.data_server_address = "http://localhost:8000";
        this.seeds = [];

        this.seed_placement = {
            use_random_seeding: false,
            random_seed_count: 10,
            use_uniform_seeding: false,
            num_uniform_seeds: [5, 5, 5],
            use_manual_seeding: true,
            manual_seed_location: [0, 0, 0]
        };

        this.seedbox = {
            position: [0, 0, 0],
            size: [1, 1, 1],
            visible: false,
            active: false
        };

        this.uncertainty_tubes = {
            loaded: false,
            vertices: null,
            faces: null,
            uv: null
        };

        this.sb_bounds = [-1, 1, -1, 1, -1, 1];
        this.bb_bounds = [-1, 1, -1, 1, -1, 1];

        this.colormap = new PresetLinearColormap("Cool to Warm");
        this.colormap_config = {
            type: "linear",
            preset_name: "Cool to Warm",
            texture_height: 256,
            texture_width: 1
        }

        this.texture_manager.registerColormap("uncertainty_tube_colormap", this.colormap);

        this.query_config = {
            uncertainty_tube: true,
            method: "swag",
            eproj: 0.5,
            sym: false
        };

        this.trajectory_visualization = {
            show_path: true,
            show_uncertainty_path: true,
            show_uncertainty_tube: true,
            show_seeds: true,
            show_stats: false,
        };

        this.render_config = {
            camera: { near: 0.1, farMultiplier: 3.0 },
            paths: {
                primary: { color: "orange", radius_divisor: 500, radial_segments: 8 },
                secondary: { color: "lightgray", radius_divisor: 700, radial_segments: 3 }
            },
            seeds: { color: "red", radius_divisor: 100 }
        };

        this.primary_trajectories = [];
        this.secondary_trajectories = [];

        makeAutoObservable(this);

        this.get_active_bounds = this.get_active_bounds.bind(this);
        this.addSeeds = this.addSeeds.bind(this);
        this.deleteSeeds = this.deleteSeeds.bind(this);
    }

    async fetch_bounds() {
        const response = await fetch(`${this.data_server_address}/get_bounds`, {
            method: "GET"
        });
        const data = await response.json();
        runInAction(() => {
            this.sb_bounds = data.sb_bounds;
            this.bb_bounds = data.bb_bounds;

            this.seedbox.position = [this.sb_bounds[0], this.sb_bounds[2], this.sb_bounds[4]];
            this.seedbox.size = [
                (this.sb_bounds[1] - this.sb_bounds[0]) / 10,
                (this.sb_bounds[3] - this.sb_bounds[2]) / 10,
                (this.sb_bounds[5] - this.sb_bounds[4]) / 10
            ];

            this.center = [
                0.5 * (this.sb_bounds[0] + this.sb_bounds[1]),
                0.5 * (this.sb_bounds[2] + this.sb_bounds[3]),
                0.5 * (this.sb_bounds[4] + this.sb_bounds[5]),
            ];

            this.diag = Math.sqrt(
                (this.sb_bounds[1] - this.sb_bounds[0]) ** 2 +
                (this.sb_bounds[3] - this.sb_bounds[2]) ** 2 +
                (this.sb_bounds[5] - this.sb_bounds[4]) ** 2
            );
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

    async fetch_trajectories() {
        await fetch(`${this.data_server_address}/get_trajectories`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                seeds: this.seeds,
                query_config: this.query_config
            })
        }).then(response => response.json()).then(data => {
            runInAction(() => {
                data.trajectories_length;
                const stride = data.trajectories_length * data.trajectories_dim;
                this.primary_trajectories = this.buildCurves(decode64(data.primary_trajectories) as Float32Array, stride);
                this.secondary_trajectories = this.buildCurves(decode64(data.secondary_trajectories) as Float32Array, stride);

                if (this.query_config.uncertainty_tube) {
                    this.uncertainty_tubes.loaded = true;
                    this.uncertainty_tubes.vertices = decode64(data.uncertainty_tube.vertices) as Float32Array;
                    this.uncertainty_tubes.faces = decode64(data.uncertainty_tube.faces, 'uint32') as Uint32Array;
                    this.uncertainty_tubes.uv = decode64(data.uncertainty_tube.uv) as Float32Array;
                }
            });
        }).catch(error => {
            console.error("Failed to fetch trajectories:", error);
        });
    }

    buildColormap(colormap_config: any): PresetLinearColormap | null {
        const type = colormap_config?.type || "linear";
        const preset_name = colormap_config?.preset_name || "Cool to Warm";

        switch (type) {
            case "linear":
                return new PresetLinearColormap(preset_name);
            case "vsup":
                const depth = colormap_config?.depth || 5;
                const continuous = colormap_config?.continuous || false;
                const flip_y = colormap_config?.flip_y || false;
                const colormap = new VSUP(depth, continuous, flip_y, preset_name);
                if (colormap_config?.fading_color) {
                    colormap.setFadingColor(colormap_config.fading_color);
                }
                return colormap;
            default:
                console.warn(`Unknown colormap type: ${type}`);
        }
        return null;
    }

    initialize(global_data: any): void {
        this.data_server_address = global_data.data_server_address || this.data_server_address;
        this.seeds = global_data.seeds || this.seeds;
        this.seed_placement = global_data.seed_placement || this.seed_placement;
        this.seedbox = global_data.seedbox || this.seedbox;
        this.sb_bounds = global_data.bounds || this.sb_bounds;
        this.query_config = global_data.query_config || this.query_config;
        this.colormap_config = global_data.colormap_config || this.colormap_config;
        this.colormap = this.buildColormap(this.colormap_config) || this.colormap;
        this.texture_manager.registerColormap("uncertainty_tube_colormap", this.colormap);
        this.trajectory_visualization = global_data.trajectory_visualization || this.trajectory_visualization;
        this.primary_trajectories = global_data.primary_trajectories ? [decode64(global_data.primary_trajectories) as Float32Array] : this.primary_trajectories;
        this.secondary_trajectories = global_data.secondary_trajectories ? [decode64(global_data.secondary_trajectories) as Float32Array] : this.secondary_trajectories;
        this.render_config = global_data.render_config || this.render_config;

        if (global_data.uncertainty_tubes) {
            this.uncertainty_tubes.loaded = global_data.uncertainty_tubes.loaded || this.uncertainty_tubes.loaded;
            this.uncertainty_tubes.vertices = global_data.uncertainty_tubes.vertices ? decode64(global_data.uncertainty_tubes.vertices) as Float32Array : this.uncertainty_tubes.vertices;
            this.uncertainty_tubes.faces = global_data.uncertainty_tubes.faces ? decode64(global_data.uncertainty_tubes.faces, 'uint32') as Uint32Array : this.uncertainty_tubes.faces;
            this.uncertainty_tubes.uv = global_data.uncertainty_tubes.uv ? decode64(global_data.uncertainty_tubes.uv) as Float32Array : this.uncertainty_tubes.uv;
        }
    }

    async asyncInitialize(): Promise<void> {
        console.log("UncertaintyTubeGlobalData asyncInitialize called");
        await this.fetch_bounds();
        if (this.seeds.length > 0) {
            await this.fetch_trajectories();
        }
    }

    toObject(): any {
        return {
            data_server_address: this.data_server_address,
            seed_placement: this.seed_placement,
            seedbox: this.seedbox,
            bounds: this.sb_bounds,
            trajectory_visualization: this.trajectory_visualization,
            render_config: this.render_config,
            query_config: this.query_config,
            colormap_config: this.colormap_config,
            seeds: this.seeds,

            uncertainty_tubes: {
                loaded: this.uncertainty_tubes.loaded,
                vertices: this.uncertainty_tubes.vertices ? encode64(this.uncertainty_tubes.vertices) : null,
                faces: this.uncertainty_tubes.faces ? encode64(this.uncertainty_tubes.faces) : null,
                uv: this.uncertainty_tubes.uv ? encode64(this.uncertainty_tubes.uv) : null
            },
            primary_trajectories: this.primary_trajectories.map(arr => encode64(arr)),
            secondary_trajectories: this.secondary_trajectories.map(arr => encode64(arr))
        };
    }

    get_active_bounds(): [number, number, number, number, number, number] {
        if (!this.seedbox.active) {
            return this.sb_bounds;
        } else {
            return [
                this.seedbox.position[0], this.seedbox.position[0] + this.seedbox.size[0],
                this.seedbox.position[1], this.seedbox.position[1] + this.seedbox.size[1],
                this.seedbox.position[2], this.seedbox.position[2] + this.seedbox.size[2]
            ];
        }
    }

    addSeeds() {
        const active_bounds = this.get_active_bounds();
        let seeds = [];
        if (this.seed_placement.use_random_seeding) {
            seeds = seeds.concat(GenSeeds.random_gen(active_bounds, this.seed_placement.random_seed_count));
        }
        if (this.seed_placement.use_uniform_seeding) {
            seeds = seeds.concat(GenSeeds.uniform_gen(active_bounds, ...this.seed_placement.num_uniform_seeds));
        }
        if (this.seed_placement.use_manual_seeding) {
            const [x, y, z] = this.seed_placement.manual_seed_location;
            seeds.push([x, y, z]);
        }
        runInAction(() => {
            this.seeds = this.seeds.concat(seeds);
        });
    }

    deleteSeeds() {
        runInAction(() => {
            this.seeds = [];
            this.primary_trajectories = [];
            this.secondary_trajectories = [];
            this.uncertainty_tubes = {
                loaded: false,
                vertices: null,
                faces: null,
                uv: null
            };
        });
    }

}

export default UncertaintyTubeGlobalContext;