# Colormap Editor with Histogram Visualization Plan

## Overview
Create an interactive colormap editor in `ColormapPlot.tsx` that displays a log-scaled histogram of scalar data with colormap control points overlaid. This will allow users to visualize data distribution and adjust color mapping interactively.

## Requirements

### Input
- **Scalar function name** (string): Name of the scalar field to visualize
- Data source: `global_context.scalars`

### Data Retrieval
- **Min/Max values**: Retrieved from `global_context.scalars.scalar_tags[scalar_name].min` and `max`
- **Raw data**: `global_context.scalars.scalar_data[scalar_name]` (Float32Array)
- **Colormap**: `global_context.texture_manager.getColormap(scalar_name)` as `PresetLinearColormap`

### Visualization Features
1. **Histogram**:
   - Bins: 50-100 bins (configurable)
   - Scale: Logarithmic Y-axis
   - Colors: Each bin colored according to the colormap value range it represents
   
2. **Control Points**:
   - Display circles at colormap control point positions
   - Position: X-axis matches control point value (normalized 0-1, scaled to min-max)
   - Y-position: Top of histogram or fixed position above data
   - Interactive: Click to select, drag to move, double-click to delete

3. **Interactions**:
   - Click on histogram to add new control point
   - Drag control points to adjust position
   - Double-click control point to remove (except first/last)
   - Visual feedback for selected control point

## Implementation Plan

### Step 1: Data Processing
**File**: `ColormapPlot.tsx`

```typescript
interface ColormapPlotProps {
    scalar_name: string;
}

// In component:
1. Get scalar data from global_context
2. Calculate histogram bins (50-100 bins)
3. Compute bin counts with proper min/max scaling
4. Handle edge cases (empty data, single value)
```

**Functions needed**:
- `computeHistogram(data: Float32Array, bins: number, min: number, max: number)`
  - Returns: `{ binEdges: number[], binCounts: number[] }`
  
### Step 2: Chart.js Configuration
**Dependencies**: Already installed
- `chart.js`
- `react-chartjs-2`

**Chart Type**: Bar chart with custom styling

```typescript
Chart.js Configuration:
- Type: 'bar'
- Scales:
  - x: linear, min-max from scalar_tags
  - y: logarithmic (log10)
- Plugins:
  - tooltip: Show bin range and count
  - annotation: For control point circles
```

### Step 3: Colored Histogram Bars
**Implementation**:
```typescript
1. For each bin, calculate the center value
2. Normalize to [0, 1] range
3. Get color from colormap: colormap.getColor(normalizedValue)
4. Convert d3.RGBColor to CSS string
5. Set as backgroundColor for that bar
```

**Colormap Integration**:
```typescript
const colormap = texture_manager.getColormap(scalar_name);
const binColors = binCenters.map(center => {
    const normalized = (center - min) / (max - min);
    const color = colormap.getColor(normalized);
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
});
```

### Step 4: Control Point Overlay
**Using Chart.js Annotation Plugin**:
```typescript
import annotationPlugin from 'chartjs-plugin-annotation';

// Register plugin
Chart.register(annotationPlugin);

// Create annotations for control points
const annotations = colormap.color_control_points.map((cp, index) => ({
    type: 'point',
    xValue: cp * (max - min) + min, // Denormalize to data range
    yValue: maxHistogramValue * 1.1, // Position above histogram
    radius: 8,
    backgroundColor: rgbToString(colormap.color_points[index]),
    borderColor: '#000',
    borderWidth: 2,
    drawTime: 'afterDatasetsDraw'
}));
```

### Step 5: Interactivity
**Control Point Management**:

1. **Selection**:
   - Chart onClick handler to detect point selection
   - Store selected control point index in state
   
2. **Dragging**:
   - Use Chart.js drag plugin or custom implementation
   - Update `colormap.color_control_points[index]` on drag
   - Trigger MobX update to re-render
   
3. **Adding Points**:
   - Click on histogram → call `colormap.addColorControlPoint(value)`
   - Automatically interpolates color
   
4. **Removing Points**:
   - Double-click control point → call `colormap.removeColorControlPoint(index)`
   - First and last points cannot be removed

**MobX Integration**:
```typescript
// ColorEditorPanel should observe colormap changes
const colormap = observer((props) => {
    const colormap = texture_manager.getColormap(props.scalar_name);
    // Component auto-updates when colormap.color_control_points changes
});
```

### Step 6: Component Structure

```typescript
export const ColormapPlot = observer((props: ColormapPlotProps) => {
    const global_context = useScenario().global_context as WildfireGlobalContext;
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    
    // Get data
    const scalar_data = global_context.scalars.scalar_data[props.scalar_name];
    const { min, max } = global_context.scalars.scalar_tags[props.scalar_name];
    const colormap = global_context.texture_manager.getColormap(props.scalar_name);
    
    // Compute histogram
    const { binEdges, binCounts } = useMemo(() => 
        computeHistogram(scalar_data, 50, min, max), 
        [scalar_data, min, max]
    );
    
    // Generate colored bars
    const barColors = useMemo(() => 
        generateBarColors(binEdges, colormap, min, max),
        [binEdges, colormap, min, max]
    );
    
    // Chart data
    const chartData = {
        labels: binEdges.slice(0, -1).map(edge => edge.toFixed(2)),
        datasets: [{
            label: 'Data Distribution',
            data: binCounts,
            backgroundColor: barColors,
            borderColor: 'rgba(0,0,0,0.1)',
            borderWidth: 1
        }]
    };
    
    // Chart options with annotations
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: props.scalar_name }},
            y: { 
                type: 'logarithmic',
                title: { display: true, text: 'Count (log scale)'}
            }
        },
        plugins: {
            annotation: {
                annotations: createControlPointAnnotations(colormap, min, max, binCounts)
            }
        },
        onClick: handleChartClick
    };
    
    return (
        <div style={{ height: '400px', width: '100%' }}>
            <Bar data={chartData} options={chartOptions} />
        </div>
    );
});
```

## Helper Functions Needed

### 1. `computeHistogram()`
```typescript
function computeHistogram(
    data: Float32Array, 
    numBins: number, 
    min: number, 
    max: number
): { binEdges: number[], binCounts: number[] }
```

### 2. `generateBarColors()`
```typescript
function generateBarColors(
    binEdges: number[], 
    colormap: PresetLinearColormap, 
    min: number, 
    max: number
): string[]
```

### 3. `createControlPointAnnotations()`
```typescript
function createControlPointAnnotations(
    colormap: PresetLinearColormap,
    min: number,
    max: number,
    binCounts: number[]
): AnnotationOptions[]
```

### 4. `handleChartClick()`
```typescript
function handleChartClick(event: ChartEvent, elements: ActiveElement[], chart: Chart)
```

## Integration with ColorEditorPanel

```typescript
// In ColorEditorPanel.tsx
export function ColorEditorPanel() {
    const global_context = useScenario().global_context as WildfireGlobalContext;
    const scalar_names = global_context.scalars.scalar_names;
    const [current_scalar_name, setCurrentScalarName] = useState(scalar_names[0]);

    return (
        <Panel panel_name="Color Editor">
            <div style={{ padding: '10px' }}>
                <h3>Color Editor</h3>
                
                {/* Scalar selector */}
                <select 
                    value={current_scalar_name} 
                    onChange={(e) => setCurrentScalarName(e.target.value)}
                >
                    {scalar_names.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                
                {/* Histogram with colormap */}
                <ColormapPlot scalar_name={current_scalar_name} />
                
                {/* Additional controls */}
                <ColormapControls scalar_name={current_scalar_name} />
            </div>
        </Panel>
    );
}
```

## Edge Cases to Handle

1. **Empty or invalid data**:
   - Check if `scalar_data` exists and has length > 0
   - Display error message if missing

2. **Single value data**:
   - Create single bin histogram
   - Disable control point editing

3. **Min === Max**:
   - Cannot create meaningful histogram
   - Show constant value indicator

4. **Very small counts**:
   - Logarithmic scale: Add 1 to all counts to avoid log(0)
   - `displayCount = log10(count + 1)`

5. **Control point constraints**:
   - First point always at 0.0
   - Last point always at 1.0
   - Cannot move points past adjacent points
   - Minimum 2 control points

## Performance Considerations

1. **useMemo** for expensive computations:
   - Histogram calculation
   - Color generation
   - Annotation creation

2. **Debounce** control point dragging:
   - Update preview immediately (local state)
   - Commit to colormap after drag ends

3. **Data sampling** for large datasets:
   - If `scalar_data.length > 100,000`, sample randomly
   - Or use Web Worker for histogram computation

## Testing Checklist

- [ ] Histogram displays correctly for various data distributions
- [ ] Log scale handles zero/negative values appropriately
- [ ] Colors match colormap accurately
- [ ] Control points render at correct positions
- [ ] Click to add control point works
- [ ] Drag control point updates colormap
- [ ] Double-click removes control point
- [ ] First/last points cannot be removed
- [ ] Texture updates when colormap changes
- [ ] Works with different scalar fields
- [ ] Responsive to panel resizing

## Future Enhancements

1. Color picker for control points
2. Preset colormap selector
3. Export/import colormap configurations
4. Opacity map editor (similar interface)
5. Histogram bin count slider
6. Linear vs logarithmic scale toggle
7. Cumulative distribution overlay
8. Statistics display (mean, median, percentiles)
