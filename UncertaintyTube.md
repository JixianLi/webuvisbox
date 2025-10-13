# UncertaintyTube Scenario

## Overview

The UncertaintyTube scenario is a data visualization tool for particle trajectories with uncertainty. It renders 3D tubes that represent the uncertainty of the particle paths, providing a clear visual representation of the potential variations in the trajectories.

## Core Functionality

The scenario fetches trajectory and uncertainty data from a backend server and visualizes it in a 3D environment. The user can interact with the visualization by placing seed points, which are the starting points for the trajectories. The scenario supports different methods for seed placement, including random, uniform, and manual placement.

## Data Management

The `UncertaintyTubeGlobalData` class manages the scenario's state. This class stores all the data related to the visualization, including:

- The address of the data server.
- The seed points for the trajectories.
- The colormap used for the uncertainty visualization.
- The bounding boxes for the scene.
- Configuration options for the visualization and data queries.

## User Interface

The user can control the visualization through a set of UI panels. These panels provide options for:

- **Trajectory Visualization:** Toggling the visibility of different elements in the scene, such as the trajectories, uncertainty tubes, and seed points.
- **Seed Placement:** Selecting the seed placement method and configuring its parameters.
- **Seedbox Configuration:** Defining a bounding box to constrain the seed placement area.
- **Query Configuration:** Customizing the query sent to the backend to fetch the data.
- **Colormap Configuration:** Changing the colormap used for the uncertainty visualization.

## Rendering

The scenario uses custom React components to render the 3D scene. These components are built on top of the `@react-three/fiber` library and include:

- `TrajectoriesRenderer`: The main renderer for the 3D scene.
- `UncertaintyTubeMesh`: A mesh component for rendering the uncertainty tubes.
- `SeedsMesh`: A mesh component for rendering the seed points.

## Tech Stack

- **React**: For the UI components.
- **@react-three/fiber**: For the 3D rendering.
- **three.js**: As a dependency of @react-three/fiber.
- **mobx**: For state management.
- **@mui/material**: For the UI components.
- **TypeScript**: For the language.