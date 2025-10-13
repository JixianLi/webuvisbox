import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import WildfireGlobalData from "@/Scenarios/Wildfire/WildfireGlobalData";
import { useState, useRef } from "react";
import { Bubble } from "react-chartjs-2";
import 'chart.js/auto';
import type { ChartData, ChartOptions } from 'chart.js';
import { getDataPosition } from "@/Renderers/Chartjs/ChartHelpers";
import { useTheme } from "@mui/material";

interface BubbleProps {
    data: ChartData<'bubble'>;
    options: ChartOptions<'bubble'>;
}

export const ContourBanddepthPlot = observer(() => {
    const chart_ref = useRef(null);

    const scenario = useScenario();
    const global_data = scenario?.global_context as WildfireGlobalData;
    const ensemble_names = global_data?.ensemble_names;
    const depths = global_data?.scalars?.depths;
    const ordering = global_data?.scalars?.ordering;
    const [point_size, setPointSize] = useState(4);
    const theme = useTheme();

    if (!global_data || !global_data.scalars || !depths || !ensemble_names || !ordering) {
        return <div>Loading...</div>;
    }

    const current_ensemble_index = global_data.current_ensemble_index;
    const ui_configs = global_data.ui_configs;


    const point_location = new Array(depths.length);
    const point_radius = new Array(depths.length);
    const point_colors = new Array(depths.length);

    for (let i = 0; i < depths.length; i++) {
        point_location[i] = { x: i, y: depths[i] };
        if (i === current_ensemble_index) {
            point_radius[i] = point_size * 1.25;
            point_colors[i] = global_data!.ensemble_colors["primary"];
        } else {
            point_radius[i] = point_size;
            point_colors[i] = global_data!.ensemble_colors["secondary"];
        }
    }

    const plot_data = {
        datasets: [
            {
                label: "Contour Banddepth",
                data: point_location,
                backgroundColor: point_colors,
                pointRadius: point_radius,
                pointBackgroundColor: point_colors,
            }
        ]
    }

    const onChartResize = (e) => {
        const w = e.width;
        const h = e.height;
        const new_point_size = Math.max(2, Math.min(6, Math.min(w, h) / 80));
        setPointSize(new_point_size);
    }

    const options = {
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                type: "linear",
                min: -1, max: ensemble_names.length,
                title: {
                    display: true,
                    text: "Ensemble Member",
                    font: { size: ui_configs.plot_label_size },
                    color: theme.palette.text.primary
                },
                ticks: {
                    color: theme.palette.text.secondary,
                    stepSize: 1,
                    callback: function (value) {
                        const val = Number(value);
                        if (val === 0) {
                            return "0"
                        }
                        if (val % 5 === 0) {
                            return val.toString();
                        }
                    }
                },
                grid: { color: theme.palette.divider },
            },
            y: {
                type: "linear",
                title: {
                    display: true,
                    text: "Banddepth",
                    font: { size: ui_configs.plot_label_size },
                    color: theme.palette.text.primary
                },
                ticks: { color: theme.palette.text.secondary },
                grid: {
                    color: theme.palette.divider
                }
            }
        },
        interaction: { mode: 'point' },
        events: ['click', 'mousemove'],
        onClick: (e) => {
            const [data_x] = getDataPosition(chart_ref, e);
            global_data.setEnsembleIndex(Math.round(data_x));
        },
        onResize: onChartResize,
        plugins: {
            tooltip: {
                events: ['mousemove'],
                callbacks: {
                    label: (context) => {
                        const datapoint = context.dataset.data[context.dataIndex]
                        return ensemble_names[datapoint.x] + " order:" + ordering[context.dataIndex]
                    }
                },
                bodyFont: { size: 22 }
            },
            legend: { display: false }
        }
    }

    const bubble_props: BubbleProps = {
        data: plot_data,
        // @ts-expect-error
        options: options,
    }

    return (
        <Bubble ref={chart_ref} {...bubble_props} />
    );
});

export default ContourBanddepthPlot;