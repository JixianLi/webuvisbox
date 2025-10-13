import * as helpers from "chart.js/helpers"
import 'chart.js/auto';
import type { ChartEvent } from "node_modules/chart.js/dist/plugins/plugin.tooltip";

export function getDataPosition(chart_ref: any, e: Event | ChartEvent | TouchEvent | MouseEvent) {
    const chart = chart_ref.current;
    if (!chart) return null;

    const pos = helpers.getRelativePosition(e, chart);
    const xScale = chart.scales['x'].getValueForPixel(pos.x);
    const yScale = chart.scales['y'].getValueForPixel(pos.y);
    return [xScale, yScale];
}

