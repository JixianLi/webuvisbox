# WebUVisBox

**WebUVisBox** (Web-based Uncertainty Visualization Toolbox) is a flexible, scenario-based framework for interactive visualization of scientific uncertainty data. Built with modern web technologies, it provides powerful tools for exploring ensemble simulations, scalar fields, and uncertainty quantification.

## Features

- 🎨 **Interactive Visualization**: Real-time 3D rendering with Three.js and React Three Fiber
- 📊 **Advanced Analytics**: Integrated statistical visualizations using Chart.js and D3
- 🔄 **Reactive State Management**: MobX-powered reactive updates across all components
- 🎯 **Scenario-Based Architecture**: Modular design supporting multiple domain-specific visualizations
- 📐 **Flexible Layout System**: Drag-and-drop panel management with React Grid Layout
- 🎨 **Customizable Transfer Functions**: Interactive colormap and opacity editors
- 🌐 **Data Server Integration**: Fetch and visualize remote ensemble datasets

## Tech Stack

- **Frontend**: React 19+ with TypeScript
- **3D Graphics**: Three.js, React Three Fiber, Drei
- **State Management**: MobX 6.13+
- **UI Components**: Material-UI (MUI) v7
- **Charting**: Chart.js 4.5, D3.js 7.9
- **Layout**: React Grid Layout
- **Build Tool**: Vite 7

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Data Server

**Note**: The data server backend is not provided by default with this repository. If you plan to use WebUVisBox with your own data, please email the author with details about your planned usage for inquiry. Example server code will be provided in future releases.

For development and testing, you can modify the `data_server_address` in scenario configuration files to point to your own data source.

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

```
webuvisbox/
├── src/
│   ├── Scenarios/              # Scenario plugin system
│   │   ├── index.ts            # Scenario discovery (imports all scenarios)
│   │   ├── ScenarioRegistry.ts # Registry singleton
│   │   ├── Wildfire/           # Wildfire simulation visualization
│   │   │   ├── index.ts        # Self-registration entry point
│   │   │   ├── WildfireGlobalContext.ts
│   │   │   └── Views/          # Panel components
│   │   └── UncertaintyTube/    # Flow uncertainty visualization
│   │       ├── index.ts        # Self-registration entry point
│   │       ├── UncertaintyTubeGlobalData.ts
│   │       └── Views/          # Panel components
│   ├── Renderers/              # Shared rendering components
│   │   ├── Colormaps/          # Color and opacity mapping
│   │   ├── Mesh/               # 3D mesh components
│   │   └── Chartjs/            # Chart utilities
│   ├── LayoutManager/          # Panel layout management
│   ├── Panels/                 # Reusable panel components
│   ├── Types/                  # TypeScript type definitions
│   └── Helpers/                # Utility functions
├── public/
│   └── ScenarioConfigs/        # Scenario configuration files
└── package.json
```

## Scenarios

### Wildfire Simulation
Visualize WRF-SFIRE ensemble simulations with:
- 3D terrain visualization with scalar field overlays
- Wind glyph rendering
- Contour boxplots and band depth analysis
- Interactive time navigation
- Customizable colormaps and opacity transfer functions

### Uncertainty Tube
Explore flow field uncertainty with:
- Seed placement and trajectory visualization
- Uncertainty tube rendering
- Ensemble member path analysis

## Configuration

Scenarios are configured via JSON files in `public/ScenarioConfigs/`. Each scenario defines:
- Panel layouts (responsive grid configurations)
- Data sources and ensemble members
- Initial visualization parameters
- UI configurations

Example structure:
```json
{
  "name": "Wildfire",
  "description": "WRF-SFire simulation data visualization",
  "panel_layouts": { ... },
  "global_data": { ... }
}
```

## Key Features

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

Scenarios self-register via a registry pattern. To add a new scenario:

1. Create your scenario folder:
```
src/Scenarios/YourScenario/
├── index.ts                      # Entry point (registers the scenario)
├── YourScenarioGlobalContext.ts  # State management (implements GlobalContext)
├── yourScenarioPanelMapping.tsx  # Maps panel IDs to components
└── Views/                        # Panel components
    └── YourPanel/
        └── YourPanel.tsx
```

2. Create `index.ts` to register your scenario:
```typescript
import { scenarioRegistry } from "../ScenarioRegistry";
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

3. Implement `GlobalContext` interface in your GlobalContext class:
```typescript
interface GlobalContext {
  initialize(global_data_object: any): void;
  asyncInitialize(): Promise<void>;
  toObject(): any;
}
```

4. Create configuration JSON in `public/ScenarioConfigs/YourScenario.json`

5. Add one import to `src/Scenarios/index.ts`:
```typescript
import "./YourScenario";
```

That's it! Your scenario is now available in the application.

### Creating Custom Panels

Panels extend the base `Panel` component and integrate with the MobX reactive system:

```tsx
import Panel from "@/Panels/Panel";
import { observer } from "mobx-react-lite";

export const MyPanel = observer(() => {
  const global_context = useScenario().global_context;
  
  return (
    <Panel panel_name="My Panel">
      {/* Your content */}
    </Panel>
  );
});
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

[Add your license information here]

## Acknowledgments

This project builds upon research in uncertainty visualization and ensemble data analysis.

## Contact

For questions and support, please open an issue on GitHub.

