# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebUVisBox (Web-based Uncertainty Visualization Toolbox) is a React/TypeScript application for interactive visualization of scientific ensemble simulation data. It provides 3D visualization of uncertainty data with configurable panels and layouts.

## Commands

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # TypeScript check + production build (tsc -b && vite build)
npm run lint     # ESLint on all files
npm run preview  # Preview production build
```

## Architecture

### Scenario-Based Design

The app uses a scenario pattern where each domain (Wildfire, UncertaintyTube) is self-contained:

```
src/Scenarios/{ScenarioName}/
├── {ScenarioName}GlobalContext.ts  # MobX state management (implements GlobalContext interface)
├── {scenarioName}PanelMappingFunction.tsx  # Maps panel IDs to React components
├── Views/                          # Panel components organized by feature
│   └── {PanelName}/
│       └── {PanelName}.tsx
└── GlobalDataContainers/           # Data structure classes (Wildfire only)
```

To add a new scenario:
1. Create scenario folder in `src/Scenarios/`
2. Implement `GlobalContext` interface (`initialize()`, `asyncInitialize()`, `toObject()`)
3. Create panel mapping function
4. Add JSON config in `public/ScenarioConfigs/`
5. Register in `src/Scenarios/ScenarioExtension.ts`
6. Update `src/ScenarioManager/ScenarioManager.tsx` default fetch if needed

### Core Flow

`App.tsx` → `ScenarioProvider` (context) → `LayoutManager` → `ResponsiveGridLayout` → Panel components

- **ScenarioManager**: Loads JSON config, creates GlobalContext via `getGlobalContext()`, manages init lifecycle
- **PanelLayoutManager**: Handles responsive grid layouts with breakpoints
- **GlobalContext implementations**: MobX observables managing all scenario state and data fetching

### Key Patterns

- **MobX everywhere**: All state is reactive. Use `observer()` wrapper for components, `makeAutoObservable()` in stores
- **Panel mapping**: Each scenario has `{name}PanelMappingFunction.tsx` that maps string IDs to JSX
- **Path alias**: `@/` maps to `src/` (configured in vite.config.ts and tsconfig.app.json)
- **Config-driven layouts**: Panel positions/sizes defined in `public/ScenarioConfigs/*.json`

### Shared Components

```
src/Renderers/
├── Colormaps/         # Transfer function textures and editors
├── Mesh/              # Reusable Three.js mesh components
├── Chartjs/           # Chart.js utilities
└── SharedCameraControl/  # Synchronized camera across 3D views

src/Panels/
├── Panel.tsx          # Base panel wrapper with drag handle
└── GridLayoutContainer.tsx
```

### 3D Rendering Stack

- `@react-three/fiber` for declarative Three.js
- `@react-three/drei` for helper components (OrbitControls, etc.)
- Custom mesh components in `src/Renderers/Mesh/` and scenario-specific Views

### Configuration Files

Scenario configs in `public/ScenarioConfigs/*.json` define:
- `name`: Must match case in `ScenarioExtension.ts` switch statement
- `panel_layouts`: Responsive grid layouts per breakpoint (xl, lg, sm)
- `global_data`: Scenario-specific initial state passed to GlobalContext

## Data Server

The app fetches ensemble data from a backend server. The server URL is configured in scenario JSON (`global_data.data_server_address`). The backend is not included in this repo.
