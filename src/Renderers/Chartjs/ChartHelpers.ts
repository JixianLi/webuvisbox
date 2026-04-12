import * as helpers from "chart.js/helpers"
import 'chart.js/auto';
import type { ChartEvent } from "chart.js";

export function getDataPosition(chartRef: any, e: Event | ChartEvent | TouchEvent | MouseEvent) {
    const chart = chartRef.current;
    if (!chart) return null;

    const pos = helpers.getRelativePosition(e, chart);
    const xScale = chart.scales['x'].getValueForPixel(pos.x);
    const yScale = chart.scales['y'].getValueForPixel(pos.y);
    return [xScale, yScale];
}

