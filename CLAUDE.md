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
src/                      # Library — no scenario-specific code, except the built-in examples in Examples/
├── App.tsx               # Top-level app component (takes initialConfig prop): theme, commands, layout
├── Theme/                # Design tokens (three display modes, UI scale) and the MUI theme built from them
├── Commands/             # Command registry: named actions, keyboard shortcuts, the shortcut list
├── ScenarioManager/      # Loads config, drives scenario lifecycle
├── LayoutManager/        # Navbar; the responsive panel grid, with overlay panels above it
├── Panels/               # Base Panel component (frame by panel type, fit, collapse) + grid container
├── Examples/             # Built-in examples (ChatUI, Uncertain terrain, Lorenz ensemble, Contour uncertainty, Volume rendering): config in a JSON file imported (bundled), registered by App, in every host's menu
├── Renderers/            # Reusable renderers: Chat, Trace (swim lanes), Graph (word-cloud force layout + SVG view), Mesh, Colormaps, Volume (ray marching), TransferFunction (editor)
├── Scenarios/
│   ├── ScenarioRegistry.ts   # Registry singleton + ScenarioDefinition type
│   └── index.ts              # Re-exports registry; registers no scenarios
├── Types/                # GlobalContext, Scenario, PanelLayouts interfaces
└── Helpers/

examples/                 # Dev app + example scenarios (Vite root)
├── index.html            # Entry HTML, loads main.tsx
├── main.tsx              # Imports each example to register, mounts <App> on the built-in ChatUI
└── public/               # Static files served at URL root (a dev scenario's ScenarioConfigs/*.json)
```

Vite's `root` is set to `examples/`, so `npm run dev` boots from there. Build output stays at project root (`dist/`) via `build.outDir`.

### Scenario Registration

Scenarios self-register at import time. `src/Scenarios/ScenarioRegistry.ts` is a singleton; importing a scenario's `index.ts` triggers its `scenarioRegistry.register(...)` call. The registry is consumed by the library; registration is owned by whoever runs the app (currently `examples/main.tsx`), except for the built-in examples in
`src/Examples/`, which `App` registers so that they work in any host project without a config file to serve. The
Scenario menu lists every registered scenario that has a config (`defaultConfig` or `defaultConfigPath`), examples
first; a scenario that fails to load (missing or invalid config, unregistered name) shows an error on screen and the
current one keeps running.

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
3. Implement the `GlobalContext` interface (`initialize()`, `asyncInitialize()`, `toObject()`, optionally `dispose()`)
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
  Library code in `src/` imports its own files with relative paths, never `@/`: host projects point their own aliases
  elsewhere (see `CREATE_SCENARIO.md`), so a self-import through `@/` would resolve into the host's source.
- **Config-driven layouts**: Panel positions/sizes defined in scenario config JSON files: `src/Examples/*/*Config.json`
  for the built-in examples, `examples/public/ScenarioConfigs/*.json` for dev-only scenarios

### 3D Rendering Stack

- `@react-three/fiber` for declarative Three.js
- `@react-three/drei` for helper components (OrbitControls, etc.)
- Custom mesh components in `src/Renderers/Mesh/` and scenario-specific Views

### Configuration Files

Scenario configs are JSON files (never TypeScript objects, so the examples show the format users write). The built-in
examples import theirs (`src/Examples/*/*Config.json`) so no file has to be served; a host serves its own. They define:
- `name`: Must match the name used in `scenarioRegistry.register()`
- `panel_layouts`: Responsive grid layouts per breakpoint (xl, lg, sm); optionally each panel's `type`
  (`regular`, `borderless`, `overlay`) and, per breakpoint, `fit_rows` (how many rows fill the window height)
- `appearance` (optional): `accent`, `default_mode` (`bright`, `dark`, `neutral`), `ui_scale`
- `global_data`: Scenario-specific initial state passed to GlobalContext

`DESIGN.md` describes the design system: tokens and modes, panel types, fitting rows to the window, and the shortcuts.

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Directories | PascalCase | `Helpers/`, `Renderers/`, `Scenarios/` |
| Component files (.tsx) | PascalCase | `Panel.tsx`, `HeaderBar.tsx` |
| Non-component files (.ts) | PascalCase | `DataHelper.ts`, `MathHelper.ts` |
| React components | PascalCase | `FormGrid`, `CheckMenuItem` |
| Classes | PascalCase | `LorenzEnsembleGlobalContext`, `PanelLayoutManager` |
| Interfaces / Types | PascalCase, no `I` prefix | `Scenario`, `PanelProps` |
| Variables and properties | camelCase | `currentTimeIndex`, `ensembleNames` |
| Functions | camelCase | `computeHistogram()`, `timeInSecondsToString()` |
| Custom hooks | `useXxx` | `useDisplaySettings()`, `useScenario()` |
| Constants | UPPER_CASE | `STEP_DIVISOR` |
| MobX store properties | camelCase | `ensembleNames`, `currentTimeIndex` |
| Scenario config JSON keys | snake_case | `panel_layouts`, `global_data` |

## Examples Are Standalone

Every example runs entirely in the browser with generated or bundled data: no data server, no backend. Keep it that
way for new examples. The earlier server-backed examples (Wildfire, Uncertainty Tube) and the Chart.js charts they used
are archived on the `archive/wildfire-and-uncertainty-tube` branch; main has no Chart.js dependency.
