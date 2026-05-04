# Wildfire Scenario

## Overview

The Wildfire scenario provides interactive visualization and analysis tools for WRF-SFIRE (Weather Research and Forecasting with SFIRE) ensemble simulation data. It enables exploration of wildfire spread dynamics, terrain features, atmospheric conditions, and uncertainty quantification across multiple ensemble members and timesteps.

## Core Functionality

The scenario loads and visualizes multi-dimensional ensemble data from a backend server, providing:

- **3D Terrain Visualization**: Interactive rendering of terrain with overlaid scalar fields (fuel type, fire arrival time, burn fraction, etc.)
- **Ensemble Analysis**: Statistical visualization of ensemble spread and uncertainty
- **Temporal Navigation**: Playback and exploration across simulation timesteps
- **Wind Field Visualization**: Configurable wind glyph rendering
- **Contour Analysis**: Functional boxplots and band depth analysis of fire front contours
- **Transfer Function Editing**: Interactive colormap and opacity function editors

## Data Management

The `WildfireGlobalContext` class manages the scenario state and coordinates data flow:

### Data Sources
- `data_server_address`: Backend server URL for ensemble data
- `data_fetcher`: WildfireDataFetcher singleton instance
- `ensemble_names`: Array of ensemble member identifiers
- `time_in_seconds`: Temporal resolution array

### State Management
- `current_time_index`: Active timestep
- `current_ensemble_index`: Selected ensemble member
- `texture_manager`: Singleton managing colormaps and opacity maps

### Data Containers

#### ScalarFields
Manages scalar field data across ensembles:
- `scalar_names`: Available scalar variables (NFUEL_CAT, T2, FGRNHFX, etc.)
- `scalar_data`: Flattened Float32Array for each scalar
- `scalar_tags`: Metadata (min, max, dimensions, units)
- `tfs`: Transfer function (colormap) assignments per scalar

#### TerrainData
3D mesh data for terrain surface:
- `vertices`: Vertex positions
- `faces`: Triangle indices
- `uv`: Texture coordinates
- `normals`: Surface normals
- Dimensions and bounds metadata

#### SingleInstanceWindGlyphsConfig
Wind field visualization settings:
- Glyph type (arrows, cones, etc.)
- Sampling strategy and density
- Size, color, and spacing parameters
- Visibility toggles

### Visualization State

#### Terrain View Config
- `current_ctf/otf`: Active colormap and opacity transfer functions
- `current_ctf_name/otf_name`: Selected transfer function identifiers

#### Contour Configs
Fire front contour rendering parameters:
- Primary/secondary ensemble display toggles
- Tube radius and radial segments
- Scale factors for primary/secondary

#### Time Difference Configs
Ensemble time series analysis:
- `hover_time`: Interactive time selection
- `show_ensemble`: Individual member visibility
- `share_y_scale`: Linked y-axis scaling
- `x_range/x_display_range`: Zoom and pan state
- `play_steps`: Animation frame rate

### Shared Resources
- `_shared_camera`: SharedTrackballPerspectiveCamera for synchronized views
- `ensemble_colors`: Primary/secondary color scheme
- `ui_configs`: Global UI settings (plot label size, etc.)

## User Interface Panels

### Terrain Visualization Panel
Main 3D viewport displaying:
- Textured terrain mesh with scalar field overlay
- Wind glyphs
- Fire front contours (primary and ensemble members)
- Interactive camera controls

### Contour Boxplot Panel
Functional boxplot visualization:
- Median contour (primary)
- Quartile contours
- Outlier ensemble members
- Interactive hover and selection

### Contour Banddepth Panel
Band depth analysis chart:
- Depth curves for ensemble members
- Statistical ordering
- Outlier identification

### Contour Configuration Panel
Fire front contour rendering controls:
- Primary/secondary visibility toggles
- Tube radius adjustment
- Scale factor controls
- Radial segment quality setting

### Time Navigation Panel
Temporal exploration interface:
- Timeline scrubber
- Play/pause animation controls
- Ensemble member selector
- Time series plots with zoom/pan
- Ensemble statistics overlay

### Wind Glyph Configuration Panel
Wind field visualization settings:
- Glyph type selection
- Sampling method and density
- Size and spacing parameters
- Color and visibility controls

### Color Editor Panel
Interactive colormap editor:
- Scalar field selector
- Histogram visualization (log scale)
- Control point manipulation (click to add, right-click to remove)
- Real-time colormap preview
- Per-scalar colormap assignment

### Opacity Editor Panel
Transfer function opacity editor:
- Scalar field selector
- Histogram with opacity function overlay
- Y-position represents opacity (0-1)
- Line plot connecting control points
- Interactive point editing

## Rendering Components

### TerrainRenderer
Main 3D scene coordinator:
- Terrain mesh with texture mapping
- Lighting setup (ambient + directional)
- Camera and controls
- Performance optimization (frustum culling, LOD)

### ContourRenderer
Fire front contour visualization:
- Instanced tube meshes for performance
- Primary/ensemble member differentiation
- Dynamic color and scale

### WindGlyphRenderer
Wind field glyph rendering:
- Instanced arrows/cones
- Data-driven positioning and orientation
- Color mapping to wind speed/direction

## Statistical Analysis

### Contour Functional Boxplot
- Extracts spatial contours from ensemble members
- Computes band depth for each contour
- Identifies median, quartiles, and outliers
- Interactive visualization with drill-down

### Time Difference Analysis
- Tracks arrival time differences across ensembles
- Generates time series datasets
- Computes ensemble min/max envelopes
- Supports interactive zoom and hover

### Ensemble Statistics
- Real-time computation of ensemble mean, variance
- Quantile estimation
- Outlier detection
- Statistical overlays on visualizations

## Data Flow

1. **Initialization**: Load scenario config from JSON
2. **Data Fetch**: Request ensemble data from backend server
3. **Processing**: Parse and structure scalar fields, terrain, contours
4. **Transfer Functions**: Initialize colormaps and opacity maps
5. **Rendering**: Reactive MobX updates trigger 3D scene refresh
6. **Interaction**: User actions update state, re-fetch data as needed
7. **Analysis**: Compute statistics on-demand for charts and overlays

## Tech Stack

- **React 19+**: Component framework
- **@react-three/fiber & drei**: Declarative Three.js integration
- **Three.js**: WebGL 3D rendering engine
- **MobX 6.13+**: Reactive state management
- **@mui/material v7**: Material Design UI components
- **Chart.js 4.5**: 2D charting (histograms, time series)
- **D3.js 7.9**: Data processing and statistical functions
- **React Grid Layout**: Flexible panel layout system
- **TypeScript**: Type-safe development

## Key Features

- **Multi-ensemble Analysis**: Compare and analyze 30+ ensemble members simultaneously
- **Temporal Playback**: Smooth animation through 100+ timesteps
- **Interactive Transfer Functions**: Real-time colormap and opacity editing with histogram feedback
- **Statistical Rigor**: Functional boxplots, band depth, ensemble statistics
- **Performance Optimized**: Instanced rendering, efficient data structures, lazy loading
- **Responsive Layout**: Drag-and-drop panels, breakpoint-aware layouts
- **Extensible Architecture**: Clean separation of data, rendering, and UI layers
- **Data Server Integration**: RESTful API for ensemble data queries

## Configuration

Scenario configuration is loaded from `public/ScenarioConfigs/Wildfire.json`:

```json
{
  "name": "Wildfire",
  "description": "WRF-SFire simulation data visualization",
  "panel_layouts": { /* responsive grid layouts */ },
  "global_data": {
    "data_server_address": "http://10.0.0.13:10001",
    "ensemble_names": ["zack_1.nc", "zack_2.nc", ...],
    "time_index_to_seconds": [0, 300, 600, ...],
    /* scalar field metadata, bounds, initial state */
  }
}
```

## Usage Workflow

1. **Load Scenario**: Application fetches Wildfire.json and initializes state
2. **Select Time**: Use Time Navigation panel to choose timestep
3. **Choose Scalar**: Select scalar field (e.g., FGRNHFX - burn fraction)
4. **Adjust Transfer Functions**: Edit colormap/opacity for optimal visualization
5. **Analyze Contours**: Explore functional boxplot and identify outliers
6. **Compare Ensembles**: Toggle ensemble members in time series plots
7. **Configure Wind**: Adjust wind glyph density and style
8. **Export**: Save scenario state or capture visualizations

## Advanced Features

### Linked Views
- Synchronized camera across 3D views
- Coordinated time selection in charts and 3D scene
- Hovering in one view highlights corresponding data in others

### Custom Colormaps
- Support for VSUP (Value-Suppressing Uncertainty Palette)
- Linear interpolation between control points
- Per-scalar colormap persistence

### Scalable Data Handling
- Lazy loading of timesteps and ensemble members
- Progressive data fetching
- Client-side caching with invalidation

### Extensibility
- Plugin architecture for new scalar fields
- Custom glyph types
- Additional statistical visualizations
