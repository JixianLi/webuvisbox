// ABOUTME: The volume rendering example's transfer functions: a colormap and an opacity map per dataset, registered
// ABOUTME: with the TextureManager, which keeps their GPU lookup texture current. Loaded only with the views.

import { runInAction } from "mobx";
import OpacityMap from "../../Renderers/Colormaps/OpacityMap";
import PresetLinearColormap from "../../Renderers/Colormaps/PresetLinearColormap";
import { getTextureManager } from "../../Renderers/Colormaps/TextureManager";
import type { DatasetName, VolumeRenderingGlobalContext } from "./VolumeRenderingGlobalContext";

export const COLORMAP_PRESETS = [
    "Cool to Warm", "Viridis (matplotlib)", "Inferno (matplotlib)", "Black-Body Radiation", "Turbo", "X Ray", "Grayscale",
];

// Starting points chosen for each dataset. Phantom: the brain (0.2) faint, lesions (0.3) strong, the skull translucent
// (it is 2–3 voxels thin, so after the phantom's blur its values peak well below 1.0: a ramp from 0.45 catches it). Marschner–Lobb: a narrow peak at 0.5, close to the isosurface the test is usually shown with.
const DEFAULTS: Record<DatasetName, { preset: string; positions: number[]; opacities: number[] }> = {
    phantom: {
        preset: "Cool to Warm",
        positions: [0, 0.17, 0.2, 0.23, 0.27, 0.3, 0.33, 0.45, 0.75, 1],
        opacities: [0, 0, 0.003, 0, 0, 0.5, 0, 0, 0.12, 0.25],
    },
    marschnerLobb: {
        preset: "Viridis (matplotlib)",
        positions: [0, 0.42, 0.5, 0.58, 1],
        opacities: [0, 0, 0.7, 0, 0],
    },
};

export interface TransferFunction { colormap: PresetLinearColormap; opacityMap: OpacityMap; textureName: string }

const byContext = new WeakMap<VolumeRenderingGlobalContext, Map<DatasetName, TransferFunction>>();

// One transfer function per dataset and opened example, so switching datasets keeps each one's edits.
export function transferFunctionFor(context: VolumeRenderingGlobalContext, dataset: DatasetName): TransferFunction {
    let functions = byContext.get(context);
    if (!functions) {
        functions = new Map();
        byContext.set(context, functions);
    }
    let transferFunction = functions.get(dataset);
    if (!transferFunction) {
        const defaults = DEFAULTS[dataset];
        transferFunction = {
            colormap: new PresetLinearColormap(defaults.preset),
            opacityMap: new OpacityMap([...defaults.positions], [...defaults.opacities]),
            textureName: `volume-rendering/${dataset}`,
        };
        const textureManager = getTextureManager();
        textureManager.registerColormap(transferFunction.textureName, transferFunction.colormap);
        textureManager.registerOpacityMap(transferFunction.textureName, transferFunction.opacityMap);
        functions.set(dataset, transferFunction);
    }
    return transferFunction;
}

export function resetTransferFunction(transferFunction: TransferFunction, dataset: DatasetName) {
    const defaults = DEFAULTS[dataset];
    transferFunction.colormap.setPreset(defaults.preset);
    runInAction(() => {
        transferFunction.opacityMap.opacityControlPoints = [...defaults.positions];
        transferFunction.opacityMap.opacityValues = [...defaults.opacities];
    });
}
