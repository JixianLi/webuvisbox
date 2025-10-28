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
│   ├── Scenarios/           # Scenario-specific implementations
│   │   ├── Wildfire/       # Wildfire simulation visualization
│   │   └── UncertaintyTube/ # Flow uncertainty visualization
│   ├── Renderers/          # Rendering components
│   │   ├── Colormaps/      # Color and opacity mapping
│   │   ├── Mesh/           # 3D mesh components
│   │   └── Chartjs/        # Chart utilities
│   ├── LayoutManager/      # Panel layout management
│   ├── Panels/             # Reusable panel components
│   ├── Types/              # TypeScript type definitions
│   └── Helpers/            # Utility functions
├── public/
│   └── ScenarioConfigs/    # Scenario configuration files
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

1. Create scenario folder in `src/Scenarios/YourScenario/`
2. Implement `GlobalContext` for your scenario
3. Create view components in `Views/` subfolder
4. Add panel mapping function
5. Create configuration JSON in `public/ScenarioConfigs/`

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


You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
