# UncertaintyTube Scenario

## Overview

The UncertaintyTube scenario is a data visualization tool for particle trajectories with uncertainty in 3D flow fields. It renders uncertainty tubes that represent the potential variations in particle paths, providing an intuitive visual representation of trajectory uncertainty from ensemble flow simulations.

## Core Functionality

The scenario fetches trajectory and uncertainty data from a backend server and visualizes it in an interactive 3D environment. Users can place seed points (trajectory starting positions) and visualize:

- **Primary trajectories**: Mean or representative paths through the flow field
- **Secondary trajectories**: Individual ensemble member paths showing variation
- **Uncertainty tubes**: 3D tubular meshes encapsulating the spatial uncertainty around primary paths
- **Uncertainty paths**: Boundary paths defining the uncertainty envelope

The scenario supports multiple seed placement methods:
- **Random**: Scatter seeds randomly within the seedbox
- **Uniform**: Place seeds on a regular 3D grid
- **Manual**: Specify individual seed positions

## Data Management

The `UncertaintyTubeGlobalContext` class manages the scenario's state and data, including:

### Core Data
- `data_server_address`: Backend server URL for data fetching
- `seeds`: Array of 3D seed point coordinates
- `primary_trajectories`: Mean/representative particle paths
- `secondary_trajectories`: Ensemble member trajectories
- `uncertainty_tubes`: Mesh data (vertices, faces, UV coordinates) for tube rendering

### Bounding Boxes
- `bb_bounds`: Bounding box for the entire flow field domain
- `sb_bounds`: Seedbox bounds constraining seed placement area

### Configuration
- `colormap_config`: Colormap settings for uncertainty visualization
- `seed_placement`: Seed generation method and parameters
- `query_config`: Backend query parameters (method: "swag" or "mcdropout", uncertainty_tube flag, eproj ensemble size, symmetry)
- `trajectory_visualization`: Visibility toggles for different visual elements
- `render_config`: Camera and rendering parameters (colors, tube radii, segments)

## User Interface Panels

The scenario provides several interactive panels:

### Trajectories Visualization Panel
Main 3D view with toggles for:
- Primary and uncertainty paths
- Uncertainty tubes
- Seed points
- Statistics overlay

### Seed Placement Panel
Controls for seed generation:
- Selection of placement method (random/uniform/manual)
- Configuration of method-specific parameters
- Manual seed coordinate input

### Seedbox Configuration Panel
Interactive controls for:
- Seedbox position and size
- Seedbox visibility toggle
- Activation/deactivation

### Query Configuration Panel
Backend query settings:
- Uncertainty quantification method (SWAG/MC Dropout)
- Ensemble projection size
- Symmetry flag
- Uncertainty tube generation toggle

### Colormap Panel
Uncertainty visualization colormap:
- Colormap preset selection
- Visual uncertainty encoding configuration

## Rendering Components

The scenario uses custom React Three Fiber components:

### TrajectoriesRenderer
Main 3D scene renderer coordinating:
- Camera controls
- Lighting setup
- Component orchestration

### UncertaintyTubeMesh
Renders uncertainty tubes as textured 3D meshes:
- Vertex buffer geometry
- UV-mapped uncertainty coloring
- Optional visibility control

### UncertaintyPathMesh
Renders uncertainty boundary paths as line tubes:
- Primary and uncertainty path rendering
- Configurable radius and color
- Independent visibility toggles

### SeedBoxMesh
Visualizes the seed placement region:
- Interactive bounding box outline
- Position and size visualization

### SeedsMesh
Renders seed points as spheres:
- Instanced rendering for performance
- Configurable size and color

## Tech Stack

- **React 19+**: UI framework
- **@react-three/fiber**: Declarative 3D rendering with Three.js
- **@react-three/drei**: Helper components for 3D scenes
- **three.js**: WebGL 3D graphics library
- **MobX**: Reactive state management
- **@mui/material**: Material-UI component library
- **TypeScript**: Type-safe development

## Data Flow

1. User configures seeds via UI panels
2. Query configuration assembled from UI state
3. Request sent to backend data server
4. Server computes trajectories and uncertainty
5. Mesh data returned and stored in global context
6. React components reactively update 3D visualization
7. User interacts with 3D scene and adjusts parameters

## Key Features

- **Interactive 3D exploration**: Orbit controls, zoom, pan
- **Real-time parameter updates**: MobX-driven reactive rendering
- **Flexible uncertainty quantification**: Support for multiple UQ methods
- **Performance optimization**: Instanced rendering, efficient mesh updates
- **Modular architecture**: Reusable components and clean separation of concerns
