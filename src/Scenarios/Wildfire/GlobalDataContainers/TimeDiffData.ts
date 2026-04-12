// ABOUTME: Observable container for time-difference chart data (ensemble datasets, min/max ranges).
// ABOUTME: Holds processed data from the data server and builds Chart.js-compatible dataset objects.

import { makeAutoObservable, runInAction } from "mobx";

export class TimeDiffData {

    private _data_names: string[];
    private _datasets: { [key: string]: { datasets: any[] } };
    private _ensemble_min: number[];
    private _ensemble_max: number[];
    private _min: number;
    private _max: number;
    private _x_range: [number, number];

    constructor() {
        this._data_names = [];
        this._datasets = {};
        this._ensemble_min = [];
        this._ensemble_max = [];
        this._min = 0;
        this._max = 0;
        this._x_range = [0, 0];
        makeAutoObservable(this);
    }

    get data_names(): string[] { return this._data_names; }
    get datasets(): { [key: string]: { datasets: any[] } } { return this._datasets; }
    get ensemble_min(): number[] { return this._ensemble_min; }
    get ensemble_max(): number[] { return this._ensemble_max; }
    get min(): number { return this._min; }
    get max(): number { return this._max; }
    get x_range(): [number, number] { return this._x_range; }

    loadFromQueryResult(queryResult: any, secondary_color: string): void {
        const datasets: { [key: string]: { datasets: any[] } } = {};
        const data_names = queryResult.data_names;
        const data_arrays = queryResult.data_arrays;

        data_names.forEach((name: string) => {
            datasets[name] = {
                datasets: data_arrays[name].map((data_array: any, edx: number) => {
                    return {
                        type: 'line',
                        label: `edx_${edx}_label_${name}`,
                        data: data_array,
                        yAxisID: 'y',
                        pointRadius: 0,
                        borderColor: secondary_color,
                        borderWidth: 1,
                        hidden: false,
                    };
                })
            };
        });

        runInAction(() => {
            this._data_names = queryResult.data_names;
            this._ensemble_min = queryResult.ensemble_min;
            this._ensemble_max = queryResult.ensemble_max;
            this._min = queryResult.min;
            this._max = queryResult.max;
            this._x_range = queryResult.x_range;
            this._datasets = datasets;
        });
    }

    toObject() {
        return {
            data_names: this._data_names,
            datasets: this._datasets,
            ensemble_min: this._ensemble_min,
            ensemble_max: this._ensemble_max,
            min: this._min,
            max: this._max,
            x_range: this._x_range,
        };
    }
}

export default TimeDiffData;
