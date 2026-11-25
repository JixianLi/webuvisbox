# WebUVisBox

**WebUVisBox** (Web-based Uncertainty Visualization Toolbox) is a flexible, scenario-based framework for interactive visualization of scientific uncertainty data. Built with modern web technologies, it provides powerful tools for exploring ensemble simulations, scalar fields, and uncertainty quantification.

## Features

- 🎨 **Interactive Visualization**: Real-time 3D rendering with Three.js and React Three Fiber
- 📊 **Advanced Analytics**: Integrated statistical visualizations using D3
- 💬 **Agent-Tracing Renderers**: Chat surface and swim-lane sequence-diagram (`Trace`) for visualizing tool-calling agents
- 🔄 **Reactive State Management**: MobX-powered reactive updates across all components
- 🎯 **Scenario-Based Architecture**: Modular design supporting multiple domain-specific visualizations
- 📐 **Flexible Layout System**: Drag-and-drop panel management with React Grid Layout

## Tech Stack

- **Frontend**: React 19+ with TypeScript
- **3D Graphics**: Three.js, React Three Fiber, Drei
- **State Management**: MobX 6.16+
- **UI Components**: Material-UI (MUI) v9
- **Charting**: D3.js 7.9
- **Layout**: React Grid Layout 2
- **Build Tool**: Vite 8

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/JixianLi/webuvisbox.git
cd webuvisbox

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

The repository is split into a reusable library and a dev app that exercises it:

```
webuvisbox/
├── src/                         # Library (no scenario-specific code but the built-in examples, src/Examples/)
│   ├── App.tsx                  # Top-level component, accepts initialConfig prop
│   ├── ScenarioManager/         # Loads scenario config, manages lifecycle
│   ├── LayoutManager/           # Responsive grid layout
│   ├── Panels/                  # Base Panel component + grid container
│   ├── Renderers/               # Reusable renderers
│   │   ├── Chat/                # Chat surface (text + image content parts)
│   │   ├── Trace/               # Swim-lane sequence diagram
│   │   ├── Graph/               # Word cloud: force layout (similarity links, rectangle collision) in a worker + SVG view
│   │   ├── Mesh/                # 3D primitives
│   │   ├── Colormaps/           # Colormap + texture management
│   │   ├── Volume/              # Direct volume rendering (GPU ray marching)
│   │   ├── TransferFunction/    # Piecewise-linear transfer-function editor (opacity curve + color points)
│   │   ├── DepthRenderer/       # 3D depth-pass utilities
│   │   └── SharedCameraControl/ # Camera sync across multiple R3F canvases
│   ├── Scenarios/
│   │   ├── ScenarioRegistry.ts  # Registry singleton
│   │   └── index.ts             # Re-exports registry (no built-in scenarios)
│   ├── Types/                   # GlobalContext, Scenario, PanelLayouts
│   └── Helpers/
├── examples/                    # Dev app + example scenarios (Vite root)
│   ├── index.html
│   ├── main.tsx                 # Registers examples and mounts <App>
│   └── public/                  # Static files; a dev scenario's ScenarioConfigs/*.json would go here
└── package.json
```

The library contains the framework and its built-in examples (`src/Examples/`: ChatUI, Uncertain terrain, Lorenz
ensemble, Contour uncertainty, Volume rendering). They run entirely in the browser with generated data, and each imports
its scenario config from a JSON file beside it, which bundles it, so every app built on the library offers them in the
Scenario menu without serving a file or running a server. The dev app
under `examples/` mounts the library and is where a dev-only scenario would go.

The earlier server-backed examples, Wildfire and Uncertainty Tube, are archived on the
`archive/wildfire-and-uncertainty-tube` branch.

## Scenarios

### chatUI (no backend required) — **default**
A sandbox that exercises the library's `Chat` and `Trace` renderers. A simulated tool-calling agent walks between User, Model, and two Tools — with retries, occasional failures, and base64-encoded image responses — animated through a swim-lane sequence diagram on the left and a chat window on the right.

This is the scenario `npm run dev` boots into. It runs entirely client-side.

## Configuration

Every scenario is specified by a **scenario config**: a JSON file that names the scenario, lists its panels (views),
lays them out per screen size, and gives its initial state. The built-in examples' configs are good references:
`src/Examples/LorenzEnsemble/LorenzEnsembleConfig.json`, `src/Examples/VolumeRendering/VolumeRenderingConfig.json`, and
the others beside each example.

### The format

```json
{
  "name": "Lorenz ensemble",
  "description": "Chaos as uncertainty: paths of the Lorenz system from nearly the same start",
  "views": ["Trajectories", "Controls"],
  "panel_layouts": {
    "default_layouts": {
      "xl": [
        { "i": "Trajectories", "type": "borderless", "x": 0, "y": 0, "w": 18, "h": 16, "visible": true },
        { "i": "Controls", "x": 18, "y": 0, "w": 6, "h": 16, "visible": true }
      ],
      "lg": [
        { "i": "Trajectories", "type": "borderless", "x": 0, "y": 0, "w": 8, "h": 14, "visible": true },
        { "i": "Controls", "x": 8, "y": 0, "w": 4, "h": 14, "visible": true }
      ],
      "sm": [
        { "i": "Trajectories", "type": "borderless", "x": 0, "y": 0, "w": 4, "h": 9, "visible": true },
        { "i": "Controls", "x": 0, "y": 9, "w": 4, "h": 10, "visible": true }
      ]
    },
    "breakpoints": { "xl": 1440, "lg": 800, "sm": 0 },
    "cols": { "xl": 24, "lg": 12, "sm": 4 },
    "fit_rows": { "sm": 13 }
  },
  "appearance": { "default_mode": "dark" },
  "global_data": { "member_count": 50, "speed": 1.5 }
}
```

| Key | Meaning |
|---|---|
| `name` | Must equal the name the scenario registers under (`scenarioRegistry.register({ name, ... })`). |
| `description` | Shown next to the name in the navbar. |
| `views` | The panel IDs; each must be known to the scenario's panel mapping function. |
| `panel_layouts.default_layouts` | One layout per breakpoint (`xl` is required). Each entry places a view `i` on the grid (`x`, `y`, `w`, `h` in columns and rows) and may set `type` (`regular`, `borderless`, `overlay`), `visible`, `minW`, `minH`. |
| `panel_layouts.breakpoints`, `cols` | The window width at which each layout applies, and its number of grid columns. |
| `panel_layouts.fit_rows` | Optional, per breakpoint: how many rows fill the window height. |
| `appearance` | Optional: `accent` color, `default_mode` (`bright`, `dark`, `neutral`), `ui_scale`. |
| `global_data` | The scenario's own initial state, passed to its GlobalContext's `initialize()`. Keys are snake_case. |

`DESIGN.md` describes panel types and fitting rows; `CREATE_SCENARIO.md` lists layout rules the loader does not check.

### Supplying a config

1. **Serve it and pass its path** to the app, which fetches it at startup. Put the file under your app's `public/`:
   ```tsx
   <App initialConfig="ScenarioConfigs/MyScenario.json" />
   ```
2. **Register it as the scenario's default**, so the Scenario menu can open the scenario: `defaultConfigPath` fetches a
   served file, `defaultConfig` takes an imported one.
   ```ts
   scenarioRegistry.register({ name: "MyScenario", /* ... */ defaultConfigPath: "ScenarioConfigs/MyScenario.json" });
   // or, bundled: import MY_SCENARIO_CONFIG from "./MyScenarioConfig.json";  ...  defaultConfig: MY_SCENARIO_CONFIG
   ```
   The built-in examples use the bundled form, so they need no file to be served in any host (TypeScript needs
   `"resolveJsonModule": true` to import `.json`).
3. **Upload it** at runtime: Scenario → Upload Scenario, then pick a `.json` file. The scenario it names must be
   registered in the app.
4. **Write one from the running app**: Scenario → Download Scenario saves the open scenario's config, with its current
   `global_data` and its default layout (to include a rearranged layout, first use Layout → Save as Default Layout).
   Any of the ways above loads the file again.

## Key Features

### Chat Renderer
- Scrollable transcript with input row
- Multimodal `content`: plain strings or `ContentPart[]` (text + image)
- Inline image previews (data URL or remote URL)
- Pure presentational (props in, callbacks out) — stack-agnostic

### Trace Renderer
- Swim-lane sequence diagram (SVG) for actor-to-actor message flows
- Self-loop arrows for retry actions
- Kind-based arrow coloring (`prompt`, `tool_call`, `tool_result`, `retry`, `error`)
- Click-to-select with payload detail panel

### Transfer Function Editor
- Piecewise-linear, in the style of ParaView's: an opacity curve over the data's log-scale histogram, filled with the
  colormap, and a color strip with movable color points
- Drag points (mouse or touch), click or tap to add, Delete or "Remove point" to remove; type exact values
- Pick a color point's color; sampled presets (256 points) simplify to 8 editable points

### Volume Renderer
- GPU ray marching of a scalar volume (WebGL2 3D texture) through a transfer function
- Opacity corrected for the sampling rate, jittered ray starts, optional gradient lighting
- Lower resolution and sampling only while the view is dragged

### Responsive Layout Management
- Drag-and-drop panel repositioning
- Resizable panels
- Breakpoint-based layouts (xl, lg, sm)
- Panel visibility toggling

## Development

### Adding a New Scenario

Scenarios self-register via a registry pattern. To add an example scenario:

1. Create your scenario folder under `examples/`:
```
examples/YourScenario/
├── index.ts                      # Entry point (registers the scenario)
├── YourScenarioGlobalContext.ts  # State management (implements GlobalContext)
├── yourScenarioPanelMapping.tsx  # Maps panel IDs to components
└── Views/                        # Panel components
    └── YourPanel/
        └── YourPanel.tsx
```

2. Create `index.ts` to register your scenario:
```typescript
import { scenarioRegistry } from "@/Scenarios/ScenarioRegistry";
import { YourScenarioGlobalContext } from "./YourScenarioGlobalContext";
import { yourScenarioPanelMapping } from "./yourScenarioPanelMapping";

scenarioRegistry.register({
  name: "Your Scenario",
  description: "Description of your scenario",
  createGlobalContext: () => new YourScenarioGlobalContext(),
  panelMapping: yourScenarioPanelMapping,
  defaultConfigPath: "ScenarioConfigs/YourScenario.json",
});
```

Within the scenario folder, use relative imports for sibling files. Use the `@/` alias only to reach library code in `src/`. This keeps the scenario self-contained.

3. Implement the `GlobalContext` interface in your GlobalContext class:
```typescript
interface GlobalContext {
  initialize(globalDataObject: any): void;
  asyncInitialize(): Promise<void>;
  toObject(): any;
}
```

4. Create configuration JSON in `examples/public/ScenarioConfigs/YourScenario.json`

5. Add one import to `examples/main.tsx`:
```typescript
import "./YourScenario";
```

To boot your scenario by default, also update the `initialConfig` prop:
```tsx
<App initialConfig="ScenarioConfigs/YourScenario.json" />
```

### Creating Custom Panels

Panels extend the base `Panel` component and integrate with the MobX reactive system:

```tsx
import { Panel } from "@/Panels/Panel";
import { useScenario } from "@/ScenarioManager/ScenarioManager";
import { observer } from "mobx-react-lite";

export const MyPanel = observer(() => {
  const globalContext = useScenario().globalContext;

  return (
    <Panel panelName="My Panel">
      {/* Your content */}
    </Panel>
  );
});
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT; see [LICENSE](LICENSE).

## Acknowledgments

This project builds upon research in uncertainty visualization and ensemble data analysis.

## Contact

For questions and support, please open an issue on GitHub.

