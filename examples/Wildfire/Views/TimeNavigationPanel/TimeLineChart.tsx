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

function createYScaleOptions(name: string, data: any, configs: any, edx: number = 0, labelFontSize: number = 18, theme: any = null) {
    let displayName = name
    if (displayName === 'area') {
        displayName = 'Δ Area'
    } else if (displayName === 'fire_area') {
        displayName = 'Total Area'
    }
    const ys = {
        ticks: { display: false },
        grid: { color: theme.palette.divider },
        border: { color: theme.palette.text.primary, width: 2 },
        title: {
            text: displayName, display: true, font: { size: labelFontSize },
            color: theme.palette.text.primary,
        }
    }
    if (name !== 'area' && name !== "fire_area" && configs.shareYScale) {
        let minY, maxY
        if (configs.showEnsemble) {
            minY = data.min
            maxY = data.max
        } else {
            minY = data.ensembleMin[edx]
            maxY = data.ensembleMax[edx]
        }
        const marginY = (maxY - minY) / 20
        ys["min"] = minY - marginY
        ys["max"] = maxY + marginY
    }
    return ys
}

const TimeLineChart = observer((props: TimeLineChartProps) => {
    const chartRef = useRef<Chart<'line'>>(null);
    const scenario = useScenario();
    const globalData = scenario.globalContext as WildfireGlobalContext;
    const timeDiffData = globalData.timeDiffData;
    const configs = globalData.timeDiffConfig;
    const timeInSeconds = globalData.timeInSeconds;
    const ensembleColors = globalData.ensembleColors;
    const [mouseDown, setMouseDown] = useState(false);
    const [mouseDownX, setMouseDownX] = useState(0);
    const theme = useTheme();

    const name = props.name;
    const edx = globalData.currentEnsembleIndex;
    const data = [...toJS(timeDiffData.datasets[name].datasets)];
    const showEnsemble = configs.showEnsemble;


    for (let i = 0; i < data.length; i++) {
        data[i].hidden = showEnsemble ? false : i !== edx;
        data[i].borderColor = i === edx ? ensembleColors.primary : ensembleColors.secondary;
        data[i].borderWidth = i === edx ? 5 : 1;
        data[i].order = i === edx ? 0 : 1;
    }

    const xScaleOptions = {
        type: 'linear' as 'linear',
        min: configs.xDisplayRange[0],
        max: configs.xDisplayRange[1],
        tick: { display: true, color: theme.palette.text.secondary },
        grid: { color: theme.palette.divider },
        border: { color: theme.palette.text.primary, width: 2 }
    }
    const yScaleOptions = createYScaleOptions(name, timeDiffData, configs, edx, globalData.uiConfigs.plotLabelSize, theme);

    const time = globalData.currentTimeIndex;
    const seconds = (time) => { return timeInSecondsToString(timeInSeconds[time], "HH:MM"); }
    const hoverTime = configs.hoverTime;
    const showHoverTime = configs.showHoverTime;
    const zoomRange = configs.zoomBoxRange ? configs.zoomBoxRange : [0, 0];
    const showZoomBox = configs.showZoomBox;

    const currentTimeAnnotation = {
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
            , font: { size: globalData.uiConfigs.plotLabelSize * 0.8 }
        },
    }

    const hoverTimeAnnotation = {
        type: 'line',
        display: showHoverTime,
        value: hoverTime,
        scaleID: 'x', borderColor: theme.palette.text.secondary, borderWidth: 1,
        label: {
            display: true,
            content: "Time:" + hoverTime + "(" + seconds(hoverTime) + ")", position: 'start',
            font: { size: globalData.uiConfigs.plotLabelSize * 0.8 }
        },
    }

    const zoomBoxAnnotation = {
        type: 'box' as 'box',
        display: showZoomBox,
        backgroundColor: 'rgba(150,150,150,0.2)',
        borderWidth: 0,
        xMin: zoomRange[0],
        xMax: zoomRange[1],
    }

    const options = {
        maintainAspectRatio: false,
        animation: false as false,
        events: [],
        scales: {
            x: xScaleOptions,
            y: yScaleOptions,
        },
        plugins: {
            legend: {
                display: false,
            },
            annotation: {
                annotations: {
                    query_time: currentTimeAnnotation,
                    hover_time: hoverTimeAnnotation,
                    zoom_box: zoomBoxAnnotation,
                }
            }
        }
    }

    const onMouseEnter = (event) => {
        const [x] = getDataPosition(chartRef, event);
        configs.setHoverTime(x, timeDiffData.xRange);
        configs.setShowHoverTime(true);
    }

    const onMouseLeave = () => {
        configs.setShowZoomBox(false);
        configs.setZoomBoxRange(null);
        configs.setShowHoverTime(false);
        setMouseDown(false);
        setMouseDownX(0);
    }

    const onMouseUp = (event) => {
        if (mouseDown) {
            const [x] = getDataPosition(chartRef, event);
            setMouseDown(false);
            configs.setShowZoomBox(false);
            configs.setZoomBoxRange(null);
            if (x !== mouseDownX) {
                const xMin = Math.min(x, mouseDownX);
                const xMax = Math.max(x, mouseDownX);
                configs.setXDisplayRange([xMin, xMax]);
                configs.setShowZoomBox(false);
            } else {
                globalData.setTimeIndex(Math.round(x));
            }
        }
    }

    const onMouseMove = (event) => {
        const [x] = getDataPosition(chartRef, event);
        if (mouseDown) {
            if (x !== mouseDownX) {
                configs.setShowZoomBox(true);
                configs.setZoomBoxRange(x < mouseDownX ? [x, mouseDownX] : [mouseDownX, x]);
            } else {
                configs.setShowZoomBox(false);
            }
        }
        configs.setHoverTime(x, timeDiffData.xRange);
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
        let nearestEdx = -1;
        let minDist = Infinity;
        console.log("data:", data);
        data.forEach((dataset, edx) => {
            const dataArray = dataset.data;
            const tdx = Math.round(x);
            const dist = Math.abs(dataArray[tdx].y - y);
            if (dist < minDist) {
                minDist = dist;
                nearestEdx = edx;
            }
        })

        globalData.setEnsembleIndex(nearestEdx);
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
