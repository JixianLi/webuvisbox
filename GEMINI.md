# GEMINI.md

## Project Overview

This project is a web-based data visualization application named "webuvisbox". It is built with React, TypeScript, and Vite. The application uses a "scenario" concept to load and display different datasets. The scenarios are defined by JSON files, and the application can switch between them. The visualization part is handled by `@react-three/fiber` for 3D graphics and `chart.js` for 2D charts. The application's state is managed by `mobx` and the overall UI is built with `@mui/material`.

The core of the application is the `ScenarioManager` class, which is responsible for loading and managing scenarios. The `ScenarioProvider` makes the `ScenarioManager` available to all components in the application. The `useScenario` hook is a convenient way for components to access the `ScenarioManager`.

The application loads a default scenario from `public/ScenarioConfigs/Wildfire.json` on startup.

## Technologies

- **Framework**: React
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: @mui/material
- **State Management**: mobx
- **3D Graphics**: @react-three/fiber, @react-three/drei, three
- **2D Charts**: chart.js, react-chartjs-2, d3
- **Routing**: None
- **Linting**: ESLint

## Building and Running

### Prerequisites

- Node.js and npm are required.

### Development

To start the development server, run:

```bash
npm run dev
```

This will start the Vite development server and open the application in your default browser.

### Building

To build the project for production, run:

```bash
npm run build
```

This will create a `dist` directory with the production-ready files.

### Linting

To lint the project's code, run:

```bash
npm run lint
```

### Previewing the Production Build

To preview the production build locally, run:

```bash
npm run preview
```

## Development Conventions

### State Management

The application uses `mobx` for state management. The `ScenarioManager` class is the main store, and it is made available to all components through the `ScenarioProvider` and `useScenario` hook.

### Component Structure

The application is structured into several directories:

- `src/ScenarioManager`: Contains the `ScenarioManager` and other global state.
- `src/Helpers`: Contains helper functions.
- `src/LayoutManager`: Contains the main layout of the application, including the `HeaderBar`.
- `src/Panels`: Contains reusable UI panel components.
- `src/Renderers`: Contains components related to 3D rendering, including colormaps and meshes.
- `src/Scenarios`: Contains the different scenarios that can be loaded, with each scenario having its own data, views, and logic.
- `src/Types`: Contains TypeScript type definitions.

### Styling

The application uses `@mui/material` for UI components and styling. The theme is defined in `src/App.tsx`.

### 3D Graphics

The application uses `@react-three/fiber` and `@react-three/drei` for 3D graphics. The 3D renderers are defined in the `src/Renderers` directory.

### Data Visualization

The application uses `d3` and `chart.js` for data visualization. The charts are indiviually defined in the `src/Scenarios/` directory with their associated views.
