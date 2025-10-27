import type PresetLinearColormap from "@/Renderers/Colormaps/PresetLinearColormap";

export interface HistogramData {
    binEdges: number[];
    binCounts: number[];
    binCenters: number[];
}

/**
 * Compute histogram from scalar data
 * @param data - Float32Array of scalar values
 * @param numBins - Number of bins for the histogram
 * @param min - Minimum value for binning
 * @param max - Maximum value for binning
 * @returns Histogram data with bin edges, counts, and centers
 */
export function computeHistogram(
    data: Float32Array,
    numBins: number,
    min: number,
    max: number
): HistogramData {
    // Handle edge cases
    if (!data || data.length === 0) {
        return { binEdges: [], binCounts: [], binCenters: [] };
    }

    if (min === max) {
        // Single value - create one bin
        return {
            binEdges: [min, max],
            binCounts: [data.length],
            binCenters: [min]
        };
    }

    // Create bin edges
    const binEdges: number[] = [];
    const binWidth = (max - min) / numBins;
    for (let i = 0; i <= numBins; i++) {
        binEdges.push(min + i * binWidth);
    }

    // Initialize bin counts
    const binCounts = new Array(numBins).fill(0);

    // Count values in each bin
    for (let i = 0; i < data.length; i++) {
        const value = data[i];
        
        // Skip values outside range
        if (value < min || value > max) continue;

        // Find bin index
        let binIndex = Math.floor((value - min) / binWidth);
        
        // Handle edge case: value exactly equals max
        if (binIndex >= numBins) {
            binIndex = numBins - 1;
        }

        binCounts[binIndex]++;
    }

    // Calculate bin centers
    const binCenters = binEdges.slice(0, -1).map((edge) => 
        edge + binWidth / 2
    );

    return { binEdges, binCounts, binCenters };
}

/**
 * Generate colors for histogram bars based on colormap
 * @param binCenters - Center values of histogram bins
 * @param colormap - PresetLinearColormap to use for coloring
 * @param min - Minimum value for normalization
 * @param max - Maximum value for normalization
 * @returns Array of CSS color strings
 */
export function generateBarColors(
    binCenters: number[],
    colormap: PresetLinearColormap,
    min: number,
    max: number
): string[] {
    return binCenters.map(center => {
        // Normalize to [0, 1] range
        const normalized = max === min ? 0.5 : (center - min) / (max - min);
        
        // Get color from colormap
        const color = colormap.getColor(normalized);
        
        // Return as CSS rgb string
        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    });
}

/**
 * Create control point annotations for Chart.js
 * @param colormap - PresetLinearColormap with control points
 * @param min - Minimum value for denormalization
 * @param max - Maximum value for denormalization
 * @param maxCount - Maximum bin count for positioning
 * @returns Array of annotation configurations
 */
export function createControlPointAnnotations(
    colormap: PresetLinearColormap,
    min: number,
    max: number,
    maxCount: number
): any[] {
    const yPosition = maxCount * 1.15; // Position above histogram

    return colormap.color_control_points.map((cp, index) => {
        // Denormalize control point to data range
        const xValue = cp * (max - min) + min;
        
        // Get color for this control point
        const [r, g, b] = colormap.color_points[index];
        const bgColor = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;

        return {
            type: 'point',
            xValue: xValue,
            yValue: yPosition,
            radius: 8,
            backgroundColor: bgColor,
            borderColor: '#000',
            borderWidth: 2,
            drawTime: 'afterDatasetsDraw',
            // Add metadata for interaction
            id: `control-point-${index}`,
            controlPointIndex: index
        };
    });
}

/**
 * Convert RGB color array to CSS string
 * @param rgb - Array of [r, g, b] values in [0, 1] range
 * @returns CSS rgb string
 */
export function rgbToString(rgb: number[]): string {
    const [r, g, b] = rgb;
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

/**
 * Find control point near a chart position
 * @param clickX - X position in data coordinates
 * @param controlPoints - Array of control point values (normalized 0-1)
 * @param min - Minimum value for denormalization
 * @param max - Maximum value for denormalization
 * @param tolerance - Click tolerance in data units
 * @returns Index of nearest control point, or -1 if none found
 */
export function findNearestControlPoint(
    clickX: number,
    controlPoints: number[],
    min: number,
    max: number,
    tolerance: number = (max - min) * 0.02 // 2% of range
): number {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    controlPoints.forEach((cp, index) => {
        const cpValue = cp * (max - min) + min;
        const distance = Math.abs(clickX - cpValue);

        if (distance < tolerance && distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
        }
    });

    return nearestIndex;
}
