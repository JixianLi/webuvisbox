# WebUVisBox - Interactive Uncertainty Visualization Framework

## Overview

WebUVisBox is a scenario-based interactive uncertainty visualization framework built with React, TypeScript, and modern web technologies. The framework provides a flexible foundation for developers to create responsive, interactive visualization applications by managing layout, data flow, and component orchestration, allowing developers to focus on implementing domain-specific visualization scenarios.

## Core Architecture

### Key Concept: Scenario-Based Design

The framework is built around the concept of **Scenarios** - self-contained visualization applications that encapsulate:
- **Global Data Context**: Domain-specific data management and state
- **View Components**: Interactive visualization panels and controls
- **Layout Configuration**: Responsive grid layouts and panel arrangements
- **Communication Layer**: Data flow and interaction handling between components

### Technology Stack

- **Frontend**: React 19+ with TypeScript
- **State Management**: MobX for reactive state management
- **UI Framework**: Material-UI (MUI) for components and theming
- **3D Visualization**: Three.js with React Three Fiber
- **2D Charts**: Chart.js with React integration
- **Layout Management**: React Grid Layout for responsive panels
- **Build Tool**: Vite for fast development and building

## Project Structure

```
src/
├── App.tsx                      # Main application entry point
├── main.tsx                     # React application bootstrap
├── GlobalContext/
│   └── ScenarioManager.tsx      # Central scenario management and context
├── LayoutManager/
│   ├── LayoutManager.tsx        # Main layout orchestration
│   ├── PanelLayoutManager.ts    # Grid layout state management
│   └── HeaderBar/               # Application header and controls
├── Types/
│   ├── Scenario.ts              # Scenario interface definition
│   ├── GlobalData.ts            # Global data interface
│   ├── PanelLayouts.ts          # Layout configuration types
│   └── Geometry.ts              # 3D geometry utilities
├── Scenarios/                   # Individual scenario implementations
│   ├── UncertaintyTube/         # Neural network flow uncertainty visualization
│   └── Wildfire/                # Wildfire simulation visualization
├── Renderers/                   # Reusable visualization components
│   ├── Chartjs/                 # 2D chart utilities
│   ├── Colormaps/               # Color mapping and texture management
│   ├── Mesh/                    # 3D mesh rendering components
│   └── SharedCameraControl/     # 3D camera controls
├── Panels/                      # UI panel components
└── Helpers/                     # Utility functions and data helpers
```

## Core Interfaces

### Scenario Interface
```typescript
interface Scenario {
    name: string;
    description?: string;
    global_data: GlobalData;
    panel_layouts: PanelLayouts;
    views: string[];
    
    loadFromObject(config: any): void;
    loadFromJson(json: string): void;
    toJson(): string;
    asyncInitialization(): Promise<void>;
}
```

### GlobalData Interface
```typescript
interface GlobalData {
    loadFromJson(json: string): void;
    loadFromObject(obj: any): void;
    toObject(): any;
    toJson(): string;
}
```

## Framework Features

### 1. Responsive Layout Management
- **Grid-based layouts** with breakpoint support (xl, lg, md, sm, xs)
- **Draggable and resizable panels** with customizable constraints
- **Dynamic panel visibility** and arrangement
- **Persistent layout state** with save/load capabilities

### 2. Scenario Management
- **Hot-swappable scenarios** via JSON configuration
- **Async initialization** support for data loading
- **State persistence** and serialization
- **Error handling** and recovery mechanisms

### 3. Data Flow Architecture
- **Centralized state management** with MobX observables
- **Reactive data binding** between components
- **Event-driven communication** between panels
- **Efficient re-rendering** with observer pattern

### 4. Visualization Capabilities
- **3D rendering** with Three.js integration
- **2D charting** with Chart.js
- **Custom mesh rendering** for scientific visualization
- **Colormap management** and texture utilities
- **Interactive camera controls** and navigation

### 5. Development Experience
- **TypeScript support** with strict type checking
- **Hot module replacement** for fast development
- **Component isolation** for testing and debugging
- **Extensible plugin architecture**

## Current Scenario Implementations

### 1. Uncertainty Tube Scenario
**Purpose**: Visualizing model uncertainty in neural network flow maps

**Views**:
- Trajectories Visualization (3D flow field rendering)
- Seed Placement (Interactive seed point placement)
- Seedbox Configuration (Parameter controls)
- Query Configuration (Uncertainty analysis settings)
- Colormap Configuration (Visual encoding settings)

**Data Management**: Handles flow field data, uncertainty quantification, and trajectory computation

### 2. Wildfire Scenario
**Purpose**: Wildfire simulation and environmental data visualization

**Views**:
- Terrain Visualization (3D landscape rendering)
- Contour Configuration (Elevation and data contours)
- Wind Glyph Configuration (Vector field visualization)
- Time Navigation (Temporal data controls)
- Contour Band Depth (Multi-layered data analysis)

**Data Management**: Manages terrain data, weather simulations, and temporal datasets

## Configuration System

### Scenario Configuration
Scenarios are defined via JSON configuration files located in `public/ScenarioConfigs/`:

```json
{
  "name": "Scenario Name",
  "description": "Scenario description",
  "views": ["View1", "View2", "View3"],
  "panel_layouts": {
    "default_layouts": { /* responsive grid definitions */ },
    "breakpoints": { /* screen size breakpoints */ },
    "cols": { /* column counts per breakpoint */ }
  },
  "global_data": { /* scenario-specific data configuration */ }
}
```

### Layout Configuration
- **Responsive breakpoints**: xl (1200px+), lg (996px+), md (768px+), sm (576px+), xs (<576px)
- **Grid system**: Configurable column counts and row heights
- **Panel properties**: Position, size, visibility, resize handles, and constraints

## Development Workflow

### Adding a New Scenario

1. **Create Scenario Directory**: `src/Scenarios/YourScenario/`
2. **Implement GlobalData**: Extend the `GlobalData` interface
3. **Create View Components**: Individual panels and visualizations
4. **Define View Router**: `getYourScenarioView.tsx` function
5. **Register Scenario**: Add to `ScenarioManager.tsx` switch statements
6. **Create Configuration**: JSON file in `public/ScenarioConfigs/`

### Adding New Views to Existing Scenarios

1. **Create View Component**: Implement the panel UI and logic
2. **Update View Router**: Add case to scenario's view function
3. **Update Configuration**: Add view name to scenario JSON
4. **Define Layout**: Add panel layout configuration

## Key Benefits for Developers

1. **Focus on Domain Logic**: Framework handles layout, routing, and state management
2. **Rapid Prototyping**: Hot-swappable configurations and components
3. **Responsive by Default**: Automatic layout adaptation across devices
4. **Extensible Architecture**: Easy to add new scenarios and visualization types
5. **Type Safety**: Full TypeScript support with interface definitions
6. **Performance Optimized**: Efficient rendering with MobX and React optimization

## Future Extensibility

The framework is designed to support:
- **Custom renderer plugins** for specialized visualizations
- **Data source adapters** for various backends
- **Export capabilities** for visualizations and configurations
- **Collaborative features** with real-time state synchronization
- **Plugin ecosystem** for third-party scenario implementations

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The framework loads the default scenario from `public/ScenarioConfigs/Wildfire.json` on startup, but can be configured to load any available scenario through the header menu system.