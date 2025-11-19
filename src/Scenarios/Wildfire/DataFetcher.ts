import { decode64 } from "@/Helpers/DataHelper";

export interface ScalarQueryConfig {
    idx: number;
    time: number;
}

export interface ContourQueryConfig {
    time: number;
}

export interface SquidsQueryConfig {
    time: number;
    scale: number;
    sampling_stride: number;
}

export interface TerrainQueryResult {
    names: string[];
    terrain: {
        bounds: [number, number, number, number, number, number];
        positions: Float32Array;
        indices: Uint32Array;
        diag: number;
        center: [number, number, number];
        dims: [number, number, number];
        base_scale: number;
    }
}

export interface SquidsQueryResult {
    vertices: Float32Array;
    faces: Uint32Array;
}

export interface ScalarQueryResult {
    scalar_names: string[];
    scalar_data: { [key: string]: Float32Array };
    scalar_tags: {
        [key: string]: {
            name: string;
            min: number;
            max: number;
            units: string;
            description: string;
        }
    };
    depths: number[];
    ordering: number[];
}

export interface ContourQueryResult {
    contours: Float32Array[];
}

export interface TimeMapQueryResult {
    time_in_seconds: number[];
}

export interface TimeDiffQueryResult {
    data_names: string[];
    data_arrays: { [key: string]: { x: number, y: number }[] };
    ensemble_min: number[];
    ensemble_max: number[];
    min: number;
    max: number;
    x_range: [number, number];
}

export class WildfireDataFetcher {
    private static instance: WildfireDataFetcher;

    public static getInstance(data_server_address: string): WildfireDataFetcher {
        if (!WildfireDataFetcher.instance) {
            WildfireDataFetcher.instance = new WildfireDataFetcher(data_server_address);
        }
        WildfireDataFetcher.instance.setDataServerAddress(data_server_address);
        return WildfireDataFetcher.instance;
    }

    private data_server_address: string;

    constructor(data_server_address: string) {
        this.data_server_address = data_server_address;
    }

    public setDataServerAddress(address: string): void {
        WildfireDataFetcher.instance.data_server_address = address;
    }

    private computeTerrainGeometry(bounds): [[number, number, number], number] {
        const [x_min, x_max, y_min, y_max, z_min, z_max] = bounds;
        const center: [number, number, number] = [
            (x_min + x_max) / 2,
            (y_min + y_max) / 2,
            (z_min + z_max) / 2
        ];
        const diag = Math.sqrt(
            (x_max - x_min) ** 2 +
            (y_max - y_min) ** 2 +
            (z_max - z_min) ** 2
        );
        return [center, diag];
    }

    private parseTerrainData(data: any): TerrainQueryResult {
        const [center, diag] = this.computeTerrainGeometry(data.bounds);
        return {
            names: data.names,
            terrain: {
                bounds: data.bounds,
                positions: decode64(data.positions, "float32") as Float32Array,
                indices: decode64(data.indices, "uint32") as Uint32Array,
                diag: diag,
                center: center,
                dims: data.dims,
                base_scale: 1 / data.max_side
            }
        };
    }

    public fetchTerrainData = async (): Promise<TerrainQueryResult> => {
        const response = await fetch(`${WildfireDataFetcher.instance.data_server_address}/terrain`);
        if (!response.ok) {
            throw new Error(`Failed to fetch terrain data: ${response.statusText}`);
        }
        const data = await response.json();
        return this.parseTerrainData(data);
    }

    private parseScalarData(data: any): ScalarQueryResult {
        const scalar_names = [];
        const scalar_data = {};
        const scalar_tags = {};
        data.scalars.forEach((scalar: any) => {
            scalar_names.push(scalar.name);
            scalar_data[scalar.name] = decode64(scalar.data, "float32") as Float32Array;
            scalar_tags[scalar.name] = {
                name: scalar.name,
                min: scalar.min,
                max: scalar.max,
                units: scalar.units,
                description: scalar.description
            };
        });

        return {
            scalar_names: scalar_names,
            scalar_data: scalar_data,
            scalar_tags: scalar_tags,
            depths: data.depths,
            ordering: data.ordering
        };
    }

    public fetchScalarData = async (scalar_query_config: ScalarQueryConfig): Promise<ScalarQueryResult> => {
        const response = await fetch(`${this.data_server_address}/scalars`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(scalar_query_config)
        });
        return this.parseScalarData(await response.json());
    }

    public fetchContourData = async (contour_query_config: ContourQueryConfig): Promise<ContourQueryResult> => {
        const response = await fetch(`${this.data_server_address}/contours`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(contour_query_config)
        });

        const data = await response.json();
        return {
            contours: data.map((contours: number[][][]) => {
                const flatarray = contours.flat(2);
                return new Float32Array(flatarray);
            })
        };
    }

    public fetchTimeMapData = async (): Promise<TimeMapQueryResult> => {
        const response = await fetch(`${WildfireDataFetcher.instance.data_server_address}/time`);
        if (!response.ok) {
            throw new Error(`Failed to fetch time map data: ${response.statusText}`);
        }
        const data = await response.json();
        return {
            time_in_seconds: data.time.map((x: any) => x as number)
        };
    }

    private parseTimeDiffData(data: any): TimeDiffQueryResult {
        const data_arrays: { [key: string]: { x: number, y: number }[] } = {};
        const n_ensemble = data['area'].length;
        let ensemble_min: number[] = new Array(n_ensemble).fill(Infinity);
        let ensemble_max: number[] = new Array(n_ensemble).fill(-Infinity);
        let min = Infinity;
        let max = -Infinity;
        const data_names = Object.keys(data);

        data_names.forEach(name => {
            data_arrays[name] = data[name].map((array: number[], edx: number) => {
                return array.map((value: number, idx: number) => {
                    if (value < ensemble_min[edx]) {
                        ensemble_min[edx] = value;
                    }
                    if (value > ensemble_max[edx]) {
                        ensemble_max[edx] = value;
                    }
                    if (name !== 'area' && name !== 'fire_area') {
                        if (value < min) {
                            min = value;
                        }
                        if (value > max) {
                            max = value;
                        }
                    }
                    return { x: idx + 1, y: value };
                })
            });
        });
        return {
            data_names: data_names,
            data_arrays: data_arrays,
            ensemble_min: ensemble_min,
            ensemble_max: ensemble_max,
            min: min,
            max: max,
            x_range: [0, data[data_names[0]][0].length]
        };
    }

    public fetchTimeDiffData = async (): Promise<TimeDiffQueryResult> => {
        const response = await fetch(`${WildfireDataFetcher.instance.data_server_address}/diff`);
        if (!response.ok) {
            throw new Error(`Failed to fetch time diff data: ${response.statusText}`);
        }
        const data = this.parseTimeDiffData(await response.json());
        return data;
    }

    public fetchSquidData = async (squid_query_config: SquidsQueryConfig): Promise<SquidsQueryResult> => {
        const response = await fetch(`${this.data_server_address}/squids`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(squid_query_config)
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch wind glyph data: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('raw data:', data);
        return {
            vertices: decode64(data.vertices, "float32") as Float32Array,
            faces: decode64(data.faces, "uint32") as Uint32Array
        };
    }
}
