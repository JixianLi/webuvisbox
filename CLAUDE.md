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

### Library / Examples Split

The repo is split into a reusable library (`src/`) and a dev app that exercises it (`examples/`):

```
src/                      # Library — no scenario-specific code
├── App.tsx               # Top-level app component (takes initialConfig prop)
├── ScenarioManager/      # Loads config, drives scenario lifecycle
├── LayoutManager/        # Responsive grid layout
├── Panels/               # Base Panel component + grid container
├── Renderers/            # Shared 3D meshes, colormaps, chart helpers
├── Scenarios/
│   ├── ScenarioRegistry.ts   # Registry singleton + ScenarioDefinition type
│   └── index.ts              # Re-exports registry; registers no scenarios
├── Types/                # GlobalContext, Scenario, PanelLayouts interfaces
└── Helpers/

examples/                 # Dev app + example scenarios (Vite root)
├── index.html            # Entry HTML, loads main.tsx
├── main.tsx              # Imports each example to register, mounts <App>
├── public/
│   └── ScenarioConfigs/  # JSON configs served at URL root
├── Wildfire/             # Example scenario
└── UncertaintyTube/      # Example scenario
```

Vite's `root` is set to `examples/`, so `npm run dev` boots from there. Build output stays at project root (`dist/`) via `build.outDir`.

### Scenario Registration

Scenarios self-register at import time. `src/Scenarios/ScenarioRegistry.ts` is a singleton; importing a scenario's `index.ts` triggers its `scenarioRegistry.register(...)` call. The registry is consumed by the library; registration is owned by whoever runs the app (currently `examples/main.tsx`).

A scenario folder looks like:

```
{ScenarioName}/
├── index.ts                              # Calls scenarioRegistry.register({...})
├── {ScenarioName}GlobalContext.ts        # MobX state, implements GlobalContext
├── {scenarioName}PanelMappingFunction.tsx  # Maps panel IDs to JSX
└── Views/                                # Panel components
```

To add a new example scenario:
1. Create `examples/YourScenario/` matching the layout above
2. In `index.ts`, call `scenarioRegistry.register({...})` — import the registry from `@/Scenarios/ScenarioRegistry`
3. Implement the `GlobalContext` interface (`initialize()`, `asyncInitialize()`, `toObject()`)
4. Add `examples/public/ScenarioConfigs/YourScenario.json`
5. Add `import "./YourScenario"` to `examples/main.tsx`

Within a scenario folder, prefer **relative imports** for files inside the same scenario. Use `@/` only to reach library code in `src/`. This keeps each scenario self-contained and ready to extract into its own repo.

### Core Flow

`main.tsx` → `<App initialConfig="...">` → `ScenarioProvider` fetches the config → `LayoutManager` → `ResponsiveGridLayout` → Panel components.

- **ScenarioManager**: Loads JSON config, creates GlobalContext via `getGlobalContext()`, manages init lifecycle
- **PanelLayoutManager**: Handles responsive grid layouts with breakpoints
- **GlobalContext implementations**: MobX observables managing all scenario state and data fetching

### Key Patterns

- **MobX everywhere**: All state is reactive. Use `observer()` wrapper for components, `makeAutoObservable()` in stores
- **Panel mapping**: Each scenario has `{name}PanelMappingFunction.tsx` that maps string IDs to JSX
- **Path alias**: `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`). Examples consume library code through this alias.
- **Config-driven layouts**: Panel positions/sizes defined in `examples/public/ScenarioConfigs/*.json`

### 3D Rendering Stack

- `@react-three/fiber` for declarative Three.js
- `@react-three/drei` for helper components (OrbitControls, etc.)
- Custom mesh components in `src/Renderers/Mesh/` and scenario-specific Views

### Configuration Files

Scenario configs in `examples/public/ScenarioConfigs/*.json` define:
- `name`: Must match the name used in `scenarioRegistry.register()`
- `panel_layouts`: Responsive grid layouts per breakpoint (xl, lg, sm)
- `global_data`: Scenario-specific initial state passed to GlobalContext

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Directories | PascalCase | `Helpers/`, `Renderers/`, `Scenarios/` |
| Component files (.tsx) | PascalCase | `Panel.tsx`, `HeaderBar.tsx` |
| Non-component files (.ts) | PascalCase | `DataHelper.ts`, `MathHelper.ts` |
| React components | PascalCase | `FormGrid`, `CheckMenuItem` |
| Classes | PascalCase | `WildfireGlobalContext`, `PanelLayoutManager` |
| Interfaces / Types | PascalCase, no `I` prefix | `Scenario`, `PanelProps` |
| Variables and properties | camelCase | `currentTimeIndex`, `ensembleNames` |
| Functions | camelCase | `computeHistogram()`, `timeInSecondsToString()` |
| Custom hooks | `useXxx` | `useThemeMode()`, `useScenario()` |
| Constants | UPPER_CASE | `STEP_DIVISOR` |
| MobX store properties | camelCase | `ensembleNames`, `currentTimeIndex` |
| Scenario config JSON keys | snake_case | `panel_layouts`, `global_data` |

## Data Server

The app fetches ensemble data from a backend server. The server URL is configured in scenario JSON (`global_data.data_server_address`). The backend is not included in this repo.
