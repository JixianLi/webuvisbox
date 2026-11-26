// ABOUTME: State of the volume rendering example: which generated dataset is shown, lighting and sampling quality.
// ABOUTME: Imports no rendering code or colormaps, so registering the example stays light; those load with the views.

import { makeAutoObservable } from "mobx";
import type { GlobalContext } from "../../Types/GlobalContext";
import { histogram, MARSCHNER_LOBB_SIZE, marschnerLobb, sheppLoganPhantom, type Volume } from "./VolumeDatasets";

export type DatasetName = "phantom" | "marschnerLobb";

export const DATASETS: Record<DatasetName, { label: string; generate: () => Volume; description: string }> = {
    phantom: {
        label: "Head phantom",
        generate: () => sheppLoganPhantom(128),
        description: "3D Shepp–Logan head phantom, 128³: skull, brain, ventricles and small lesions of distinct densities.",
    },
    marschnerLobb: {
        label: "Marschner–Lobb",
        generate: () => marschnerLobb(MARSCHNER_LOBB_SIZE),
        description: "Marschner–Lobb test signal, 41³: fine rings near the sampling limit that test reconstruction.",
    },
};

export const HISTOGRAM_BINS = 128;

interface VolumeRenderingGlobalData {
    dataset: DatasetName;
    lighting: boolean;
    samples_per_voxel: number;
}

export class VolumeRenderingGlobalContext implements GlobalContext {
    dataset: DatasetName = "phantom";
    lighting = true;
    samplesPerVoxel = 1;

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    initialize(globalData?: Partial<VolumeRenderingGlobalData>): void {
        this.dataset = globalData?.dataset ?? this.dataset;
        this.lighting = globalData?.lighting ?? this.lighting;
        this.samplesPerVoxel = globalData?.samples_per_voxel ?? this.samplesPerVoxel;
    }

    async asyncInitialize(): Promise<void> {}

    toObject(): VolumeRenderingGlobalData {
        return { dataset: this.dataset, lighting: this.lighting, samples_per_voxel: this.samplesPerVoxel };
    }

    get volume() {
        return DATASETS[this.dataset].generate();
    }

    get histogram() {
        return histogram(this.volume.data, HISTOGRAM_BINS);
    }

    setDataset(dataset: DatasetName) {
        this.dataset = dataset;
    }

    setLighting(lighting: boolean) {
        this.lighting = lighting;
    }

    setSamplesPerVoxel(samplesPerVoxel: number) {
        this.samplesPerVoxel = samplesPerVoxel;
    }
}
