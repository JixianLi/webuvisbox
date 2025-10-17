import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "../../WildfireGlobalContext";
import { useRef, useState } from "react";
import { toJS } from "mobx";

import annotationPlugin from 'chartjs-plugin-annotation';
import { Chart } from 'chart.js'
import { Line } from "react-chartjs-2";
import { getDataPosition } from "@/Renderers/Chartjs/ChartHelpers";
import 'chart.js/auto';
import { useTheme } from "@mui/material";
import { timeInSecondsToString } from "@/Helpers/MathHelper";
Chart.register(annotationPlugin);

interface TimeLineChartProps {
    name: string;
}

function create_y_scale_options(name: string, data: any, configs: any, edx: number = 0, label_font_size: number = 18, theme: any = null) {
    let display_name = name
    if (display_name === 'area') {
        display_name = 'Δ Area'
    } else if (display_name === 'fire_area') {
        display_name = 'Total Area'
    }
    const ys = {
        ticks: { display: false },
        grid: { color: theme.palette.divider },
        border: { color: theme.palette.text.primary, width: 2 },
        title: {
            text: display_name, display: true, font: { size: label_font_size },
            color: theme.palette.text.primary,
        }
    }
    if (name !== 'area' && name !== "fire_area" && configs.share_y_scale) {
        let min_y, max_y
        if (configs.show_ensemble) {
            min_y = data.min
            max_y = data.max
        } else {
            min_y = data.ensemble_min[edx]
            max_y = data.ensemble_max[edx]
        }
        const margin_y = (max_y - min_y) / 20
        ys["min"] = min_y - margin_y
        ys["max"] = max_y + margin_y
    }
    return ys
}

const TimeLineChart = observer((props: TimeLineChartProps) => {
    const chartRef = useRef<Chart<'line'>>(null);
    const scenario = useScenario();
    const global_data = scenario.global_context as WildfireGlobalContext;
    const time_diff_data = global_data.time_diff_data;
    const configs = global_data.time_diff_configs;
    const time_in_seconds = global_data.time_in_seconds;
    const ensemble_colors = global_data.ensemble_colors;
    const [mouse_down, setMouseDown] = useState(false);
    const [mouse_down_x, setMouseDownX] = useState(0);
    const theme = useTheme();

    const name = props.name;
    const edx = global_data.current_ensemble_index;
    const data = [...toJS(time_diff_data.datasets[name].datasets)];
    const show_ensemble = configs.show_ensemble;


    for (let i = 0; i < data.length; i++) {
        data[i].hidden = show_ensemble ? false : i !== edx;
        data[i].borderColor = i === edx ? ensemble_colors.primary : ensemble_colors.secondary;
        data[i].borderWidth = i === edx ? 5 : 1;
        data[i].order = i === edx ? 0 : 1;
    }

    const x_scale_options = {
        type: 'linear' as 'linear',
        min: configs.x_display_range[0],
        max: configs.x_display_range[1],
        tick: { display: true, color: theme.palette.text.secondary },
        grid: { color: theme.palette.divider },
        border: { color: theme.palette.text.primary, width: 2 }
    }
    const y_scale_options = create_y_scale_options(name, time_diff_data, configs, edx, global_data.ui_configs.plot_label_size, theme);

    const time = global_data.current_time_index;
    const seconds = (time) => { return timeInSecondsToString(time_in_seconds[time], "HH:MM"); }
    const hover_time = configs.hover_time;
    const show_hover_time = configs.show_hover_time;
    const zoom_range = configs.zoom_box_range ? configs.zoom_box_range : [0, 0];
    const show_zoom_box = configs.show_zoom_box;

    const current_time_annotation = {
        type: 'line',
        display: true,
        value: time,
        borderColor: theme.palette.text.primary,
        borderWidth: 5,
        scaleID: 'x',
        label: {
            display: true,
            content: "Time:" + time + "(" + seconds(time) + ")",
            position: 'start'
            , font: { size: global_data.ui_configs.plot_label_size * 0.8 }
        }, 
    }

    const hover_time_annotation = {
        type: 'line',
        display: show_hover_time,
        value: hover_time,
        scaleID: 'x', borderColor: theme.palette.text.secondary, borderWidth: 1,
        label: {
            display: true,
            content: "Time:" + hover_time + "(" + seconds(hover_time) + ")", position: 'start',
            font: { size: global_data.ui_configs.plot_label_size * 0.8 }
        },
    }

    const zoom_box_annotation = {
        type: 'box' as 'box',
        display: show_zoom_box,
        backgroundColor: 'rgba(150,150,150,0.2)',
        borderWidth: 0,
        xMin: zoom_range[0],
        xMax: zoom_range[1],
    }

    const options = {
        maintainAspectRatio: false,
        animation: false as false,
        events: [],
        scales: {
            x: x_scale_options,
            y: y_scale_options,
        },
        plugins: {
            legend: {
                display: false,
            },
            annotation: {
                annotations: {
                    query_time: current_time_annotation,
                    hover_time: hover_time_annotation,
                    zoom_box: zoom_box_annotation,
                }
            }
        }
    }

    const onMouseEnter = (event) => {
        const [x] = getDataPosition(chartRef, event);
        global_data.timeDiffSetHoverTime(x);
        global_data.timeDiffSetShowHoverTime(true);
    }

    const onMouseLeave = () => {
        global_data.timeDiffSetShowZoomBox(false);
        global_data.timeDiffSetZoomBoxRange(null);
        global_data.timeDiffSetShowHoverTime(false);
        setMouseDown(false);
        setMouseDownX(0);
    }

    const onMouseUp = (event) => {
        if (mouse_down) {
            const [x] = getDataPosition(chartRef, event);
            setMouseDown(false);
            global_data.timeDiffSetShowZoomBox(false);
            global_data.timeDiffSetZoomBoxRange(null);
            if (x !== mouse_down_x) {
                const x_min = Math.min(x, mouse_down_x);
                const x_max = Math.max(x, mouse_down_x);
                global_data.timeDiffSetXDisplayRange([x_min, x_max]);
                global_data.timeDiffSetShowZoomBox(false);
            } else {
                global_data.setTimeIndex(Math.round(x));
            }
        }
    }

    const onMouseMove = (event) => {
        const [x] = getDataPosition(chartRef, event);
        if (mouse_down) {
            if (x !== mouse_down_x) {
                global_data.timeDiffSetShowZoomBox(true);
                global_data.timeDiffSetZoomBoxRange(x < mouse_down_x ? [x, mouse_down_x] : [mouse_down_x, x]);
            } else {
                global_data.timeDiffSetShowZoomBox(false);
            }
        }
        global_data.timeDiffSetHoverTime(x);
    }

    const onMouseDown = (event) => {
        const [x] = getDataPosition(chartRef, event);
        if (event.button === 0) {
            setMouseDown(true)
            setMouseDownX(x)
        }
    }


    const onContextMenu = (event) => {
        event.preventDefault();
        const [x, y] = getDataPosition(chartRef, event);
        // find the nearest edx
        let nearest_edx = -1;
        let min_dist = Infinity;
        console.log("data:", data);
        data.forEach((dataset, edx) => {
            const data_array = dataset.data;
            const tdx = Math.round(x);
            const dist = Math.abs(data_array[tdx].y - y);
            if (dist < min_dist) {
                min_dist = dist;
                nearest_edx = edx;
            }
        })

        global_data.setEnsembleIndex(nearest_edx);
    }

    return (
        // @ts-expect-error wrong options format (not really)
        <Line ref={chartRef} data={{ datasets: data }} options={options}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onContextMenu={onContextMenu}
        />
    );
});

export default TimeLineChart;