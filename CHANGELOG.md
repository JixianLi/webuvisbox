# Changelog

Changes that can affect a host project consuming webuvisbox (as a submodule). Newest first. Each entry says what a host
has to change, if anything.

## Unreleased

### Meshes and linked cameras

- `InstancedSphereMesh` writes the instance matrices directly (one draw call, no React element per point). The
  `keyPrefix` prop is removed (it keyed those elements); `color` and `specular` accept any three.js color. **Host
  action:** drop `keyPrefix` where passed.
- `BoxOutlineMesh`: `linewidth` is the line's thickness (the tube's diameter); it was used as the radius, so lines were
  twice as thick as asked. **Host action:** double `linewidth` to keep the old look. The geometry is no longer rebuilt
  when a new array with the same bounds is passed.
- `TexturedBufferedMesh` and `SingleColorBufferedMesh` take `visibleIndexCount`: draw a prefix of the triangles (a tube
  up to the current time) without rebuilding the geometry. `TexturedBufferedMesh` redraws a canvas drawing on demand
  when its colormap texture is rewritten (edited in TextureManager).
- `SharedTrackballControl`: views no longer take the shared pose over from each other every frame (a view applying the
  shared pose republished it); views on canvases drawing on demand (`frameloop="demand"`) follow the others and can be
  dragged (they had no frames for the trackball to move in); the first view to mount publishes its own camera as the
  shared pose (it started at (0, 0, 5)). `SharedTrackballPerspectiveCamera` counts published poses (`version`).

### Examples

- Lorenz ensemble shows the paper's Uncertainty Tube setup on generated data: three views linked by one camera
  (Trajectories, Uncertainty tube, Mean path), the attractor's bounding box, double press to reset. Its ensemble comes
  from an in-browser data server answering like a Python one (JSON with base64 binary arrays), and its downloaded
  config stores the seed.

### New in the library (shared helpers, formerly copied between scenarios)

- `Helpers/Random`: `seededRandom(seed)` (mulberry32) and `standardNormal(random)` (Box–Muller).
- `Helpers/DoublePress`: `createDoublePressDetector(onDoublePress, intervalMs = 300)`, from pointer-down times, so it
  works for touch as well as mouse.
- `Renderers/Camera/FitCameraToAspect`: places the camera at `position`, backed off by `minimumAspect / aspect` on a
  narrower canvas; saves the default controls' state, so their `reset()` returns to the fitted view.
- `Renderers/Camera/DoublePressToReset`: a double press on the canvas resets the default controls.
- `Panels/SliderOnRelease`: a slider that applies its value on release, for values expensive to apply.
  Nothing to change in a host; scenarios that copied one of these can import it instead.

### Colormaps and color management (convention: sRGB colors, linear-light textures)

- **TextureManager textures hold linear light** (`texture.colorSpace = LinearSRGBColorSpace`); before, they held the
  colormap's sRGB values unlabeled. Built-in three.js materials (`TexturedBufferedMesh`, `ScalarFieldMesh`, any
  `meshPhongMaterial` sampling the texture) now show the colormap's colors; before they looked washed out.
  **Host action:** render with R3F's default output (no `<Canvas linear flat>`; with it, colors now look too dark),
  and end a custom shader that samples these textures with `linearToOutputTexel(color)` (or three's
  `colorspace_fragment`). `VolumeRenderer` does so: its colors are unchanged, and semi-transparent samples now blend in
  linear light.
- `PresetLinearColormap.invert()` mirrors the map (the color at p moves to 1 - p); before, it reversed the colors but
  kept the positions, so maps with uneven points inverted wrongly.
- `VSUP` follows every edit (color points added, moved, removed, replaced, inverted; preset; fading color; depth); before,
  its discrete colors stayed as built, and a color cached at one depth was served at another.
- Subclasses of `PresetLinearColormap` can override `protected onColorsChanged()`, called after every edit.

### Scenario loading

- A load builds and initializes the new scenario beside the running one and swaps it in only when ready; the running
  scenario stays on screen meanwhile, with the progress bar at the top. A load that fails, at any step, leaves the
  running scenario as it was. Before, a config that passed the first checks but failed later blanked the grid.
- Loads started in quick succession: the last one started wins, even if an earlier one finishes later.
- `GlobalContext.dispose?()` (optional, new): called on the replaced context after a swap, and on a context whose load
  was abandoned. Hosts with timers, animation loops or pending requests in a context should stop them there.
- `ScenarioManager.invalidate()` is removed (a load no longer clears the running scenario first). `ScenarioManager` is
  now exported, with `beginLoad()`, `isLatestLoad()` and a `generation` counter (one per swap).
- The config is checked before anything is built, with a message naming the key: `appearance.default_mode` must be
  `bright`, `dark` or `neutral`; `appearance.ui_scale` within the menu's range (0.85 to 1.75); `appearance.accent` a
  CSS color (it ends up in style rules); each panel needs `i`, `x`, `y`, `w`, `h`. A host config that relied on an
  invalid value now fails to load with that message.
- `panel_layouts.breakpoints` is optional (default `xl` 1440, `lg` 800, `sm` 0). A breakpoint without a layout uses the
  nearest one that has one (the next wider first) instead of crashing when the window reaches that width, and the grid
  starts at the widest breakpoint instead of assuming one named `xl`.
- A panel that throws while rendering shows the error in its place; the rest of the app keeps working. The next
  scenario loaded clears it.

### Layout

- Reset Layout keeps hidden panels hidden (before, each left a full-size empty space in the grid).
- Dragging an overlay ends cleanly when the browser cancels the pointer (a touch turning into a scroll): the panel goes
  back to where it was.
- Commands and panel actions are now removed by the function `register` / `setPanelAction` returns (before, they
  stayed registered). A scenario's own commands no longer outlive it.

### Dependencies

- `r3f-perf` is no longer a dependency (unused by the library; last released 2024-11, still built on drei 9). A host
  that measures performance with it adds it to its own `package.json`.

### Types (TypeScript `strict` is now on in the library)

- `GlobalContext.initialize(globalData: unknown)` and `toObject(): object` replace `any`. Existing implementations
  still compile: a context may declare its own type for `globalData`, e.g.
  `initialize(globalData?: Partial<MyGlobalData>)`, and return a typed object from `toObject`.
- `AppLayout` now extends react-grid-layout's `LayoutItem` and no longer has a `[key: string]: any` index signature.
  Host code that stored its own fields on a layout item needs to declare them.
- `PanelLayouts.setCurrentLayout` takes react-grid-layout's `ResponsiveLayouts` (what `onLayoutChange` passes).
- New `ScenarioConfig` type (`src/Types/Scenario.ts`) describes the scenario config file; `Scenario.loadFromObject`
  takes it.
- `PresetLinearColormap.fromObject` and `VSUP.fromObject` take `Record<string, unknown>`; `OpacityMap.fromObject`
  takes `Partial<OpacityMapObject>`, and `OpacityMap.toObject` returns `OpacityMapObject`.
- `SharedTrackballControl`: `globalData` is typed `GlobalContext`, and the forwarded ref is typed as drei's
  `TrackballControls`.

### Behavior

- `SharedTrackballControl` keeps its own ref to the controls and exposes it through the forwarded ref. A callback ref
  passed by a host used to stop the camera syncing silently; it now works like an object ref.
- Uploading a JSON file whose content is not an object (e.g. a bare string) shows an error. A string used to be taken
  for a config URL and fetched.
- `VSUP._validateColorValue` is removed: it never changed anything.

### Examples

- ChatUI's downloaded config now stores the chat and trace font sizes (which it reads back), not the conversation
  (which it never read).
