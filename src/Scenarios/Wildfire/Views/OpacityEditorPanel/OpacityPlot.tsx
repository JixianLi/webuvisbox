import { observer } from "mobx-react-lite";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import type WildfireGlobalContext from "@/Scenarios/Wildfire/WildfireGlobalContext";
import type OpacityMap from "@/Renderers/Colormaps/OpacityMap";
import { useState, useRef } from "react";
import { Chart as ChartJS } from "react-chartjs-2";
import { Chart, type ChartEvent } from "chart.js";
import { getDataPosition } from "@/Renderers/Chartjs/ChartHelpers";
import { useTheme, Stack, Typography, Box } from "@mui/material";
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chart.js/auto';
import { computeHistogram } from "../ColorEditorPanel/HistogramHelpers";

// Register Chart.js annotation plugin
Chart.register(annotationPlugin);

interface OpacityPlotProps {
    scalar_name: string;
}

export const OpacityPlot = observer((props: OpacityPlotProps) => {
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
    const opacityMap = global_context.texture_manager.getOpacityMap(props.scalar_name) as OpacityMap;
    if (!opacityMap) {
        return <div style={{ padding: '20px', color: 'red' }}>
            No opacity map available for {props.scalar_name}
        </div>;
    }

    // Access observable properties directly to ensure MobX tracking
    const controlPoints = opacityMap.opacity_control_points;
    const opacityValues = opacityMap.opacity_values;

    // Compute histogram
    const { binEdges, binCounts, binCenters } = computeHistogram(scalar_data, 14, min, max);

    // Generate light gray bars
    const barColors = binCenters.map(() => 'rgba(200, 200, 200, 0.7)');

    // Get max count for annotation positioning
    const maxCount = Math.max(...binCounts, 1);

    // Create control point annotations with y-position representing opacity (0 to 1)
    const annotations: any = {};
    controlPoints.forEach((cp, index) => {
        const binIndex = cp * (binCenters.length - 1);
        const opacity = opacityValues[index];
        
        // Map opacity (0-1) to y-axis value (log scale, 1 to maxCount+1)
        const yValue = 1 + opacity * maxCount;
        
        annotations[`point-${index}`] = {
            type: 'point',
            xValue: binIndex,
            yValue: yValue,
            backgroundColor: selectedPointIndex === index ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            borderColor: selectedPointIndex === index ? 'rgba(255, 0, 0, 1)' : 'rgba(0, 0, 0, 1)',
            borderWidth: 2,
            radius: 6,
            pointStyle: 'circle'
        };
    });

    // Create line plot data for control points
    // Create a dense array with nulls where there are no control points
    const lineDataArray = new Array(binCenters.length).fill(null);
    controlPoints.forEach((cp, index) => {
        const binIndex = Math.round(cp * (binCenters.length - 1));
        const opacity = opacityValues[index];
        const yValue = 1 + opacity * maxCount;
        lineDataArray[binIndex] = yValue;
    });

    // Chart data
    const chartData = {
        labels: binEdges.slice(0, -1).map(edge => edge.toFixed(3)),
        datasets: [
            {
                label: 'Count',
                type: 'bar' as const,
                data: binCounts.map(count => count + 1), // Add 1 for log scale
                backgroundColor: barColors,
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                barPercentage: 1.0,
                categoryPercentage: 1.0,
                order: 2
            },
            {
                label: 'Opacity Function',
                type: 'line' as const,
                data: lineDataArray,
                borderColor: 'rgba(0, 0, 255, 0.8)',
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                tension: 0,
                spanGaps: true,
                order: 1
            }
        ]
    };

    // Handle chart click
    const handleChartClick = (event: ChartEvent, _elements: any[], _chart: Chart) => {
        const position = getDataPosition(chartRef, event);
        if (!position) return;

        const [dataX, dataY] = position;
        if (dataX === undefined || dataX === null || dataY === undefined || dataY === null) return;

        // dataX is the bin index (0 to numBins-1)
        const binIndex = Math.floor(dataX);
        if (binIndex < 0 || binIndex >= binCenters.length) return;
        
        // Convert bin index to normalized value [0, 1]
        const normalizedValue = binIndex / (binCenters.length - 1);

        // Convert y-position to opacity (0 to 1)
        // dataY is in log scale (1 to maxCount+1)
        const opacity = Math.max(0, Math.min(1, (dataY - 1) / maxCount));

        // Check if clicking near a control point (compare in bin index space)
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

        if (nearestPoint >= 0) {
            // Select the control point and update its opacity
            setSelectedPointIndex(nearestPoint);
            // Update opacity value of existing control point
            opacityMap.opacity_values[nearestPoint] = opacity;
        } else {
            // Add new control point with normalized value and opacity
            opacityMap.addOpacityControlPoint(normalizedValue, opacity);
            setSelectedPointIndex(null);
        }
    };

    // Handle context menu (right-click) to remove control point
    const handleContextMenu = (event: ChartEvent, _elements: any[], _chart: Chart) => {
        const position = getDataPosition(chartRef, event);
        if (!position) return;

        const [dataX] = position;
        if (dataX === undefined || dataX === null) return;

        // dataX is the bin index (0 to numBins-1)
        const binIndex = Math.floor(dataX);
        if (binIndex < 0 || binIndex >= binCenters.length) return;

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

        if (pointIndex >= 0) {
            opacityMap.removeOpacityControlPoint(pointIndex);
            setSelectedPointIndex(null);
            // Prevent default context menu
            event.native?.preventDefault();
        }
    };

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false as const, // Disable animations
        scales: {
            x: {
                grid: {
                    display: false
                },
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
                min: 1,
                grid: {
                    display: false
                },
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
        onClick: handleChartClick
    };

    // Add context menu listener to the chart container
    const handleContainerContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        
        const chart = chartRef.current;
        if (!chart) return;

        // Create a synthetic ChartEvent
        const rect = chart.canvas.getBoundingClientRect();
        const chartEvent = {
            type: 'contextmenu',
            native: e.nativeEvent,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        } as unknown as ChartEvent;

        handleContextMenu(chartEvent, [], chart);
    };

    return (
        <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
                <strong>Instructions:</strong> Click to add/adjust control point (y-position = opacity) • Right-click control point to remove
                {selectedPointIndex !== null && ` • Selected point ${selectedPointIndex + 1} of ${controlPoints.length} • Opacity: ${opacityValues[selectedPointIndex].toFixed(2)}`}
            </Typography>
            <Box sx={{ minHeight: '300px' }} onContextMenu={handleContainerContextMenu}>
                <ChartJS ref={chartRef} type='bar' data={chartData} options={chartOptions} />
            </Box>
        </Stack>
    );
});

export default OpacityPlot;
