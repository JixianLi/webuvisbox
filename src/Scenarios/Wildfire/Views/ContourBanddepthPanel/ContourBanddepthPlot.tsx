import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
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
    const chartRef = useRef(null);

    const scenario = useScenario();
    const globalContext = scenario?.globalContext as WildfireGlobalContext;
    const ensembleNames = globalContext?.ensembleNames;
    const depths = globalContext?.scalars?.depths;
    const ordering = globalContext?.scalars?.ordering;
    const [pointSize, setPointSize] = useState(4);
    const theme = useTheme();

    if (!globalContext || !globalContext.scalars || !depths || !ensembleNames || !ordering) {
        return <div>Loading...</div>;
    }

    const currentEnsembleIndex = globalContext.currentEnsembleIndex;
    const uiConfigs = globalContext.uiConfigs;


    const pointLocation = new Array(depths.length);
    const pointRadius = new Array(depths.length);
    const pointColors = new Array(depths.length);

    for (let i = 0; i < depths.length; i++) {
        pointLocation[i] = { x: i, y: depths[i] };
        if (i === currentEnsembleIndex) {
            pointRadius[i] = pointSize * 1.25;
            pointColors[i] = globalContext!.ensembleColors["primary"];
        } else {
            pointRadius[i] = pointSize;
            pointColors[i] = globalContext!.ensembleColors["secondary"];
        }
    }

    const plotData = {
        datasets: [
            {
                label: "Contour Banddepth",
                data: pointLocation,
                backgroundColor: pointColors,
                pointRadius: pointRadius,
                pointBackgroundColor: pointColors,
            }
        ]
    }

    const onChartResize = (e) => {
        const w = e.width;
        const h = e.height;
        const newPointSize = Math.max(2, Math.min(6, Math.min(w, h) / 80));
        setPointSize(newPointSize);
    }

    const options = {
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                type: "linear",
                min: -1, max: ensembleNames.length,
                title: {
                    display: true,
                    text: "Ensemble Member",
                    font: { size: uiConfigs.plotLabelSize },
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
                    font: { size: uiConfigs.plotLabelSize },
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
            const [dataX] = getDataPosition(chartRef, e);
            globalContext.setEnsembleIndex(Math.round(dataX));
        },
        onResize: onChartResize,
        plugins: {
            tooltip: {
                events: ['mousemove'],
                callbacks: {
                    label: (context) => {
                        const datapoint = context.dataset.data[context.dataIndex]
                        return ensembleNames[datapoint.x] + " order:" + ordering[context.dataIndex]
                    }
                },
                bodyFont: { size: uiConfigs.plotLabelSize }
            },
            legend: { display: false }
        }
    }

    const bubbleProps: BubbleProps = {
        data: plotData,
        // @ts-expect-error
        options: options,
    }

    return (
        <Bubble ref={chartRef} {...bubbleProps} />
    );
});

export default ContourBanddepthPlot;
