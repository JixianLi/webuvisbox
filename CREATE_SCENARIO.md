# Creating a Scenario in an External Project

This guide walks through using webuvisbox as a framework in your own project, with a fictional `my-vis` host project consuming webuvisbox and one new scenario `MyScenario`.

## 1. Repo + submodule setup

```bash
mkdir my-vis && cd my-vis
git init
git submodule add https://github.com/JixianLi/webuvisbox.git vendor/webuvisbox
```

## 2. Host project layout

```
my-vis/
├── .gitmodules                       ← created by `git submodule add`
├── vendor/
│   └── webuvisbox/                   ← submodule (read-only to your host)
├── public/
│   └── ScenarioConfigs/
│       └── MyScenario.json
├── src/
│   ├── main.tsx
│   └── Scenarios/
│       └── MyScenario/
│           ├── index.ts
│           ├── MyScenarioGlobalContext.ts
│           ├── myScenarioPanelMappingFunction.tsx
│           └── Views/
│               └── HelloPanel.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 3. `package.json`

Copy webuvisbox's runtime `dependencies` verbatim from `vendor/webuvisbox/package.json`, and from its `devDependencies` the `@types/*` packages, `@vitejs/plugin-react`, `typescript` and `vite`. The host installs everything in one `node_modules` so React (and other singletons) don't get duplicated. Copy them from the submodule's current `package.json` rather than from an older list: a version mismatch with the library's code (e.g. MUI's major version) breaks the build.

```json
{
  "name": "my-vis",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": { "...": "copied from vendor/webuvisbox/package.json" },
  "devDependencies": { "...": "the @types/*, @vitejs/plugin-react, typescript and vite entries from it" }
}
```

Then `npm install` once at the host root.

## 4. `vite.config.ts`

Two aliases: `@core` for the library, `@` for your own source. The library's own files import each other with relative paths, so they don't depend on either alias.

`dedupe` keeps one copy of React, MobX, MUI and Emotion, the host's: if the library's own dependencies are installed
too (`npm install` inside `vendor/webuvisbox` to run its examples), the library's files would otherwise resolve them
from there, and two Reacts break every hook ("Invalid hook call").

The `define` and `optimizeDeps` entries carry over the library's workarounds (see its `vite.config.ts`): react-grid-layout reads `process.env.DRAGGABLE_DEBUG`, which throws `process is not defined` in the browser, and MUI needs the CJS `prop-types` and `react-is` pre-bundled for their default exports.

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  define: { "process.env.DRAGGABLE_DEBUG": "false" },
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "vendor/webuvisbox/src"),
      "@":     path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom", "mobx", "mobx-react-lite", "@mui/material", "@emotion/react", "@emotion/styled"],
  },
  optimizeDeps: {
    include: ["prop-types", "react-is", "react-grid-layout/legacy"],
    rolldownOptions: {
      transform: { define: { "process.env.DRAGGABLE_DEBUG": "false" } },
    },
  },
});
```

No `root:` override needed — `index.html`, `main.tsx`, and `public/` all sit at the host's project root, which is Vite's default.

## 5. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": false,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "paths": {
      "@core/*": ["./vendor/webuvisbox/src/*"],
      "@/*":     ["./src/*"]
    }
  },
  "include": ["src", "vendor/webuvisbox/src"]
}
```

## 6. `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My Vis</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 7. `src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@core/index.css";              // optional — library's global resets
import App from "@core/App";
import "@/Scenarios/MyScenario";       // side-effect import registers it

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App initialConfig="ScenarioConfigs/MyScenario.json" />
  </StrictMode>
);
```

## 8. The scenario itself

`src/Scenarios/MyScenario/index.ts`:

```ts
import { scenarioRegistry } from "@core/Scenarios/ScenarioRegistry";
import { MyScenarioGlobalContext } from "./MyScenarioGlobalContext";
import { myScenarioPanelMappingFunction } from "./myScenarioPanelMappingFunction";

scenarioRegistry.register({
  name: "MyScenario",
  description: "A new scenario",
  createGlobalContext: () => new MyScenarioGlobalContext(),
  panelMapping: myScenarioPanelMappingFunction,
  defaultConfigPath: "ScenarioConfigs/MyScenario.json",
});
```

`src/Scenarios/MyScenario/MyScenarioGlobalContext.ts` — implements `GlobalContext`:

```ts
import { makeAutoObservable } from "mobx";
import type { GlobalContext } from "@core/Types/GlobalContext";

export class MyScenarioGlobalContext implements GlobalContext {
  message: string = "";

  constructor() {
    makeAutoObservable(this);
  }

  initialize(globalData: any): void {
    this.message = globalData?.message ?? "hello";
  }

  async asyncInitialize(): Promise<void> { /* fetch data, etc. */ }

  toObject(): any {
    return { message: this.message };
  }
}
```

`src/Scenarios/MyScenario/myScenarioPanelMappingFunction.tsx`:

```tsx
import HelloPanel from "./Views/HelloPanel";

export function myScenarioPanelMappingFunction(viewName: string): React.ReactNode {
  switch (viewName) {
    case "Hello": return <HelloPanel />;
    default: throw new Error(`Unknown view: ${viewName}`);
  }
}
```

`src/Scenarios/MyScenario/Views/HelloPanel.tsx`:

```tsx
import { observer } from "mobx-react-lite";
import { Panel } from "@core/Panels/Panel";
import { useScenario } from "@core/ScenarioManager/ScenarioManager";
import type { MyScenarioGlobalContext } from "../MyScenarioGlobalContext";

export default observer(function HelloPanel() {
  const ctx = useScenario().globalContext as MyScenarioGlobalContext;
  return <Panel panelName="Hello">{ctx.message}</Panel>;
});
```

Note the import pattern: **`@core/...` for library code, relative paths for sibling files within the scenario.**

## 9. The scenario config

`public/ScenarioConfigs/MyScenario.json`:

```json
{
  "name": "MyScenario",
  "description": "A new scenario",
  "views": ["Hello"],
  "panel_layouts": {
    "default_layouts": {
      "xl": [{ "i": "Hello", "x": 0, "y": 0, "w": 8, "h": 4, "visible": true }],
      "lg": [{ "i": "Hello", "x": 0, "y": 0, "w": 6, "h": 4, "visible": true }],
      "sm": [{ "i": "Hello", "x": 0, "y": 0, "w": 4, "h": 4, "visible": true }]
    },
    "breakpoints": { "xl": 1440, "lg": 800, "sm": 0 },
    "cols":        { "xl": 16,   "lg": 12,  "sm": 4 }
  },
  "global_data": {
    "message": "Hello from MyScenario"
  }
}
```

Layout rules the loader does not check (breaking them leaves a blank page with no error on screen):

- **Every size in `breakpoints` needs a layout in `default_layouts`, and one of them must be `xl`.** The layout manager
  starts at `xl` and learns the window's size only after its first render, so a config without an `xl` layout fails
  in that render (`Cannot read properties of undefined (reading 'filter')`).
- **Each size needs at least one panel with `"visible": true`.** A panel is shown only when `visible` is `true`; a
  missing `visible` counts as hidden.
- **`fit_rows` defaults to each layout's own height** (the bottom edge of its lowest non-overlay panel), so every
  size fills the window as written. A phone layout taller than one screen needs its own `fit_rows` (for example 13),
  or its rows shrink until the whole layout fits on one screen.

## 10. Run it

```bash
npm run dev
```

Visit `http://localhost:5173`.

---

## Things to know

- **Versioning**: the submodule pins to a SHA. Update with `git submodule update --remote vendor/webuvisbox`. Treat the library's public surface (`Scenarios/ScenarioRegistry.ts`, `Types/GlobalContext.ts`, `App.tsx`'s props) as a contract — those are what your host code couples to.
- **Dep drift**: if webuvisbox updates a peer dep (say MUI v7 → v8), you bump it in your host's `package.json` too. Mismatches usually surface as duplicate-React errors at boot time.
- **Don't `npm install` inside the submodule.** Causes a duplicate `node_modules`; Vite ends up bundling two copies of React and breaks hooks.
- **Data server**: the library expects `globalContext.asyncInitialize()` to fetch your data. The example scenarios hit a backend whose URL is in their JSON config (`global_data.data_server_address`). Your scenario decides what (if anything) to fetch.
- **The library's `App` is opinionated** — it ships MUI theming, the layout manager, and the scenario provider. If you want a totally different shell, you'd consume the lower-level pieces (`ScenarioProvider`, `LayoutManager`, `useScenario`) and assemble your own. For most cases, just use `App`.
