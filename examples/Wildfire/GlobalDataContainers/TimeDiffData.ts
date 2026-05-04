// ABOUTME: Observable container for time-difference chart data (ensemble datasets, min/max ranges).
// ABOUTME: Holds processed data from the data server and builds Chart.js-compatible dataset objects.

import { makeAutoObservable, runInAction } from "mobx";

export class TimeDiffData {

    private _dataNames: string[];
    private _datasets: { [key: string]: { datasets: any[] } };
    private _ensembleMin: number[];
    private _ensembleMax: number[];
    private _min: number;
    private _max: number;
    private _xRange: [number, number];

    constructor() {
        this._dataNames = [];
        this._datasets = {};
        this._ensembleMin = [];
        this._ensembleMax = [];
        this._min = 0;
        this._max = 0;
        this._xRange = [0, 0];
        makeAutoObservable(this);
    }

    get dataNames(): string[] { return this._dataNames; }
    get datasets(): { [key: string]: { datasets: any[] } } { return this._datasets; }
    get ensembleMin(): number[] { return this._ensembleMin; }
    get ensembleMax(): number[] { return this._ensembleMax; }
    get min(): number { return this._min; }
    get max(): number { return this._max; }
    get xRange(): [number, number] { return this._xRange; }

    loadFromQueryResult(queryResult: any, secondaryColor: string): void {
        const datasets: { [key: string]: { datasets: any[] } } = {};
        const dataNames = queryResult.data_names;
        const dataArrays = queryResult.data_arrays;

        dataNames.forEach((name: string) => {
            datasets[name] = {
                datasets: dataArrays[name].map((dataArray: any, edx: number) => {
                    return {
                        type: 'line',
                        label: `edx_${edx}_label_${name}`,
                        data: dataArray,
                        yAxisID: 'y',
                        pointRadius: 0,
                        borderColor: secondaryColor,
                        borderWidth: 1,
                        hidden: false,
                    };
                })
            };
        });

        runInAction(() => {
            this._dataNames = queryResult.data_names;
            this._ensembleMin = queryResult.ensemble_min;
            this._ensembleMax = queryResult.ensemble_max;
            this._min = queryResult.min;
            this._max = queryResult.max;
            this._xRange = queryResult.x_range;
            this._datasets = datasets;
        });
    }

    toObject() {
        return {
            data_names: this._dataNames,
            datasets: this._datasets,
            ensemble_min: this._ensembleMin,
            ensemble_max: this._ensembleMax,
            min: this._min,
            max: this._max,
            x_range: this._xRange,
        };
    }
}

export default TimeDiffData;
