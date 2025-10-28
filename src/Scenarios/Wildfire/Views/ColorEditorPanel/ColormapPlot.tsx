import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
import type PresetLinearColormap from "@/Renderers/Colormaps/PresetLinearColormap";
import { useState, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, type ChartEvent } from "chart.js";
import { getDataPosition } from "@/Renderers/Chartjs/ChartHelpers";
import { useTheme } from "@mui/material";
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chart.js/auto';
import {
    computeHistogram,
    generateBarColors,
    createControlPointAnnotations
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

    const ui_configs = global_context.ui_configs;
    const theme = useTheme();

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

    // Access observable properties directly to ensure MobX tracking
    const controlPoints = colormap.color_control_points;
    // Also access color_points to ensure MobX tracks it
    colormap.color_points;

    // Compute histogram
    const { binEdges, binCounts, binCenters } = computeHistogram(scalar_data, 50, min, max);

    // Generate colored bars - MobX will track changes to controlPoints/colorPoints
    const barColors = generateBarColors(binCenters, colormap, min, max);

    // Get max count for annotation positioning
    const maxCount = Math.max(...binCounts, 1);

    // Create control point annotations - MobX will track changes
    const annotations = createControlPointAnnotations(colormap, maxCount, binCenters.length);

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
        console.log('Single click event triggered');
        const position = getDataPosition(chartRef, event);
        if (!position) return;

        const [dataX] = position;
        if (dataX === undefined || dataX === null) return;

        // dataX is the bin index (0 to numBins-1)
        const binIndex = Math.floor(dataX);
        if (binIndex < 0 || binIndex >= binCenters.length) return;
        
        // Convert bin index to normalized value [0, 1]
        const normalizedValue = binIndex / (binCenters.length - 1);

        console.log('Single click - binIndex:', binIndex, 'normalized:', normalizedValue, 
            'control points in bins:', controlPoints.map(cp => cp * (binCenters.length - 1)));

        // Check if clicking near a control point (compare in bin index space)
        // Find nearest control point manually
        let nearestPoint = -1;
        let nearestDistance = Infinity;
        const tolerance = 2.0;
        
        controlPoints.forEach((cp, index) => {
            const cpBinIndex = cp * (binCenters.length - 1);
            const distance = Math.abs(binIndex - cpBinIndex);
            if (distance < tolerance && distance < nearestDistance) {
                nearestDistance = distance;
                nearestPoint = index;
            }
        });

        console.log('Found nearest point:', nearestPoint, 'distance:', nearestDistance);

        if (nearestPoint >= 0) {
            // Select the control point
            console.log('Selecting control point', nearestPoint);
            setSelectedPointIndex(nearestPoint);
        } else {
            // Add new control point with normalized value
            console.log('Adding new control point at', normalizedValue);
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

        // dataX is the bin index (0 to numBins-1)
        const binIndex = Math.floor(dataX);
        if (binIndex < 0 || binIndex >= binCenters.length) return;

        console.log('Double click - binIndex:', binIndex, 'control points in bins:', 
            controlPoints.map(cp => cp * (binCenters.length - 1)));

        // Find control point to remove manually
        let pointIndex = -1;
        let nearestDistance = Infinity;
        const tolerance = 2.0;
        
        controlPoints.forEach((cp, index) => {
            const cpBinIndex = cp * (binCenters.length - 1);
            const distance = Math.abs(binIndex - cpBinIndex);
            if (distance < tolerance && distance < nearestDistance) {
                nearestDistance = distance;
                pointIndex = index;
            }
        });

        console.log('Found point index:', pointIndex, 'distance:', nearestDistance);

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
                    text: `${props.scalar_name} (${scalar_tag.units || ''})`,
                    font: { size: ui_configs.plot_label_size },
                    color: theme.palette.text.primary
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 5
                }
            },
            y: {
                type: 'logarithmic' as const,
                title: {
                    display: true,
                    text: 'Count (log scale)',
                    font: { size: ui_configs.plot_label_size },
                    color: theme.palette.text.primary
                },
                ticks: {
                    display: false
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
        <div style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                <strong>Instructions:</strong> Click to add control point • Double-click control point to remove
                {selectedPointIndex !== null && ` • Selected point ${selectedPointIndex + 1} of ${controlPoints.length}`}
            </div>
            <div style={{ height: '400px', width: '100%', position: 'relative' }}>
                <Bar ref={chartRef} data={chartData} options={chartOptions} />
            </div>
        </div>
    );
});

export default ColormapPlot;
