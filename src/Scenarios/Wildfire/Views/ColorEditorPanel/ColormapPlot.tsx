import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
import type PresetLinearColormap from "@/Renderers/Colormaps/PresetLinearColormap";
import { useMemo, useState, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, type ChartEvent } from "chart.js";
import { getDataPosition } from "@/Renderers/Chartjs/ChartHelpers";
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chart.js/auto';
import {
    computeHistogram,
    generateBarColors,
    createControlPointAnnotations,
    findNearestControlPoint
} from "./HistogramHelpers";

// Register Chart.js annotation plugin
Chart.register(annotationPlugin);

interface ColormapPlotProps {
    scalar_name: string;
}

export const ColormapPlot = observer((props: ColormapPlotProps) => {
    const global_context = useScenario().global_context as WildfireGlobalContext;
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const chartRef = useRef<any>(null);

    // Get scalar data
    const scalar_data = global_context.scalars.scalar_data[props.scalar_name];
    const scalar_tag = global_context.scalars.scalar_tags[props.scalar_name];
    
    if (!scalar_data || !scalar_tag) {
        return <div style={{ padding: '20px', color: 'red' }}>
            No data available for {props.scalar_name}
        </div>;
    }

    const { min, max } = scalar_tag;
    const colormap = global_context.texture_manager.getColormap(props.scalar_name) as PresetLinearColormap;
    if (!colormap) {
        return <div style={{ padding: '20px', color: 'red' }}>
            No colormap available for {props.scalar_name}
        </div>;
    }

    // Compute histogram
    const { binEdges, binCounts, binCenters } = useMemo(() => 
        computeHistogram(scalar_data, 50, min, max),
        [scalar_data, min, max]
    );

    // Generate colored bars
    const barColors = useMemo(() => 
        generateBarColors(binCenters, colormap, min, max),
        [binCenters, colormap.color_control_points, colormap.color_points, min, max]
    );

    // Get max count for annotation positioning
    const maxCount = useMemo(() => Math.max(...binCounts, 1), [binCounts]);

    // Create control point annotations
    const annotations = useMemo(() => 
        createControlPointAnnotations(colormap, min, max, maxCount),
        [colormap.color_control_points, colormap.color_points, min, max, maxCount]
    );

    // Chart data
    const chartData = {
        labels: binEdges.slice(0, -1).map(edge => edge.toFixed(3)),
        datasets: [{
            label: 'Count',
            data: binCounts.map(count => count + 1), // Add 1 for log scale
            backgroundColor: barColors,
            borderColor: 'rgba(0,0,0,0.1)',
            borderWidth: 1,
            barPercentage: 1.0,
            categoryPercentage: 1.0
        }]
    };

    // Handle chart click
    const handleChartClick = (event: ChartEvent, _elements: any[], _chart: Chart) => {
        const position = getDataPosition(chartRef, event);
        if (!position) return;

        const [dataX] = position;
        if (dataX === undefined || dataX === null) return;

        // Convert label index to actual value
        const binIndex = Math.floor(dataX);
        if (binIndex < 0 || binIndex >= binCenters.length) return;
        
        const clickValue = binCenters[binIndex];

        // Check if clicking near a control point
        const nearestPoint = findNearestControlPoint(
            clickValue,
            colormap.color_control_points,
            min,
            max
        );

        if (nearestPoint >= 0) {
            // Select the control point
            setSelectedPointIndex(nearestPoint);
        } else {
            // Add new control point
            const normalizedValue = (clickValue - min) / (max - min);
            colormap.addColorConntrolPoint(normalizedValue);
            setSelectedPointIndex(null);
        }
    };

    // Handle double click to remove control point
    const handleDoubleClick = (event: ChartEvent, _elements: any[], _chart: Chart) => {
        const position = getDataPosition(chartRef, event);
        if (!position) return;

        const [dataX] = position;
        if (dataX === undefined || dataX === null) return;

        const binIndex = Math.floor(dataX);
        if (binIndex < 0 || binIndex >= binCenters.length) return;
        
        const clickValue = binCenters[binIndex];

        // Find control point to remove
        const pointIndex = findNearestControlPoint(
            clickValue,
            colormap.color_control_points,
            min,
            max
        );

        if (pointIndex >= 0) {
            colormap.removeColorControlPoint(pointIndex);
            setSelectedPointIndex(null);
        }
    };

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: `${props.scalar_name} (${scalar_tag.units || ''})`
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 10
                }
            },
            y: {
                type: 'logarithmic' as const,
                title: {
                    display: true,
                    text: 'Count (log scale)'
                },
                ticks: {
                    callback: function(value: any) {
                        // Display actual count (subtract the +1 we added)
                        const actualValue = Number(value) - 1;
                        if (actualValue <= 0) return '0';
                        return actualValue.toLocaleString();
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const count = context.parsed.y - 1; // Subtract the +1
                        return `Count: ${Math.round(count).toLocaleString()}`;
                    },
                    title: function(context: any) {
                        const binIndex = context[0].dataIndex;
                        const binStart = binEdges[binIndex].toFixed(3);
                        const binEnd = binEdges[binIndex + 1].toFixed(3);
                        return `Range: [${binStart}, ${binEnd})`;
                    }
                }
            },
            annotation: {
                annotations: annotations
            }
        },
        onClick: handleChartClick,
        onDoubleClick: handleDoubleClick
    };

    return (
        <div style={{ height: '400px', width: '100%', padding: '10px' }}>
            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                <strong>Instructions:</strong> Click to add control point • Double-click control point to remove
                {selectedPointIndex !== null && ` • Selected point ${selectedPointIndex + 1} of ${colormap.color_control_points.length}`}
            </div>
            <Bar ref={chartRef} data={chartData} options={chartOptions} />
        </div>
    );
});

export default ColormapPlot;
