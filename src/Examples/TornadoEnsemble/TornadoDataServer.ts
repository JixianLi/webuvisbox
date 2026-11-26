// ABOUTME: The tornado example's data server, run in the browser: answers an ensemble query the way a Python server
// ABOUTME: (UVisBox) would, with a JSON Response whose arrays are base64-encoded binary. Swap fetchTornado for fetch(url).

import { encode64 } from "../../Helpers/DataHelper";
import { generateEnsemble, normalizedSpread, SAMPLE_COUNT } from "./TornadoFlow";
import { buildTube, uncertaintyTube } from "./EnsembleTube";

// Request body of POST /ensemble.
export interface EnsembleQuery {
    member_count: number;
    variability_growth: number;
    seed: number;
}

// Response body: every array is the base64 of its little-endian bytes (float32, or uint32 for indices), as a Python
// server sends numpy arrays (base64.b64encode(array.tobytes())); JSON numbers would be several times larger and slower
// to parse.
export interface EnsembleResponse {
    member_count: number;
    sample_count: number;
    paths: string;              // float32, member by member, SAMPLE_COUNT points of x y z each
    mean: string;               // float32, SAMPLE_COUNT points of x y z
    spread: string;             // float32, per sample
    bounds: [number, number, number, number, number, number];   // x min, x max, y min, y max, z min, z max
    uncertainty_tube: TubeResponse;
    mean_path_tube: TubeResponse;
}

export interface TubeResponse {
    vertices: string;           // float32
    normals: string;            // float32
    uv: string;                 // float32
    indices: string;            // uint32
}

export const TUBE_RADIAL_SEGMENTS = 16;
// In the flow's units (the paths span about 5 × 5 × 5).
const MINIMUM_TUBE_RADIUS = 0.02;
const MEAN_PATH_RADIUS = 0.04;

function encodeTube(tube: ReturnType<typeof buildTube>): TubeResponse {
    return { vertices: encode64(tube.vertices), normals: encode64(tube.normals), uv: encode64(tube.uv),
             indices: encode64(tube.indices) };
}

function boundsOf(paths: Float32Array[]): EnsembleResponse["bounds"] {
    const bounds: EnsembleResponse["bounds"] = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
    for (const path of paths) {
        for (let index = 0; index < path.length; index += 3) {
            for (let axis = 0; axis < 3; axis++) {
                bounds[axis * 2] = Math.min(bounds[axis * 2], path[index + axis]);
                bounds[axis * 2 + 1] = Math.max(bounds[axis * 2 + 1], path[index + axis]);
            }
        }
    }
    return bounds;
}

function answer(query: EnsembleQuery): EnsembleResponse {
    const { paths, mean, spread } = generateEnsemble(query.member_count, query.variability_growth, query.seed);
    const allPaths = new Float32Array(paths.length * SAMPLE_COUNT * 3);
    paths.forEach((path, member) => allPaths.set(path, member * SAMPLE_COUNT * 3));
    const spreadValue = (sample: number) => normalizedSpread(spread[sample]);
    return {
        member_count: paths.length,
        sample_count: SAMPLE_COUNT,
        paths: encode64(allPaths),
        mean: encode64(mean),
        spread: encode64(spread),
        bounds: boundsOf(paths),
        uncertainty_tube: encodeTube(uncertaintyTube(paths, mean, spreadValue, TUBE_RADIAL_SEGMENTS, MINIMUM_TUBE_RADIUS)),
        mean_path_tube: encodeTube(buildTube(mean, () => [MEAN_PATH_RADIUS, MEAN_PATH_RADIUS], spreadValue,
                                             TUBE_RADIAL_SEGMENTS)),
    };
}

// Takes what fetch takes and answers with a Response, so the client reads it exactly as it would a remote server's.
export async function fetchTornado(endpoint: string, init: { method: "POST"; body: string }): Promise<Response> {
    // Answered on a later task, as a network response would be, so the caller's code does not run synchronously.
    await new Promise(resolve => setTimeout(resolve, 0));
    if (endpoint !== "/ensemble") {
        return new Response(JSON.stringify({ error: `No endpoint ${endpoint}` }), { status: 404 });
    }
    const body = JSON.stringify(answer(JSON.parse(init.body) as EnsembleQuery));
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
}
