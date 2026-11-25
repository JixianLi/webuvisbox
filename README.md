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
ensemble, Contour uncertainty). They run entirely in the browser with generated data, and their configs are inlined, so
every app built on the library offers them in the Scenario menu without serving a file or running a server. The dev app
under `examples/` mounts the library and is where a dev-only scenario would go.

The earlier server-backed examples, Wildfire and Uncertainty Tube, are archived on the
`archive/wildfire-and-uncertainty-tube` branch.

## Scenarios

### chatUI (no backend required) — **default**
A sandbox that exercises the library's `Chat` and `Trace` renderers. A simulated tool-calling agent walks between User, Model, and two Tools — with retries, occasional failures, and base64-encoded image responses — animated through a swim-lane sequence diagram on the left and a chat window on the right.

This is the scenario `npm run dev` boots into. It runs entirely client-side.

## Configuration

Scenarios are configured via JSON files in `examples/public/ScenarioConfigs/`. Each scenario defines:
- Panel layouts (responsive grid configurations)
- Data sources and ensemble members
- Initial visualization parameters
- UI configurations

Example structure:
```json
{
  "name": "chatUI",
  "description": "Two-panel sandbox for testing new rendering components",
  "panel_layouts": { ... },
  "global_data": { ... }
}
```

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

### Interactive Colormap Editor
- Histogram-based scalar distribution visualization
- Click to add control points
- Right-click to remove control points
- Real-time colormap updates

### Opacity Transfer Function Editor
- Y-position represents opacity (0-1)
- Line plot shows opacity function
- Interactive control point editing
- Light gray histogram background

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

