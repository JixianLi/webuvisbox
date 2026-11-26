# Changelog

Changes that can affect a host project consuming webuvisbox (as a submodule). Newest first. Each entry says what a host
has to change, if anything.

## Unreleased

### Look and behavior

- The theme's `primary.main` is the accent's on-surface tint (`tokens.accentOnSurface`), so lines and text drawn in
  the primary color (sliders, outlined and text buttons, focus rings, checkboxes) reach readable contrast in dark mode;
  contained buttons and switch tracks keep the fill (`tokens.accentFill`). Bright mode is unchanged (both are the
  accent). **Host action:** a component that used `palette.primary.main` as a fill should use `tokens.accentFill`.
- The navbar logo follows `accentFill`: hue-free in neutral mode, as DESIGN.md says.
- The upload dialog and its drop zone use the design tokens (it had fixed grays that looked wrong in dark and neutral).
- Panel shortcuts (⌥F, ⌥C, ⌥W) act on the panel under the pointer: leaving a panel stops it being their target unless
  keyboard focus is inside it. `CommandRegistry.clearActivePanel(panelId)` is new.
- Without `appearance.default_mode`, the display mode follows the operating system's light or dark setting live.
- The dev app's page no longer loads Google's Material Icons font (unused; a third-party request on every load).

### Glyphs, depth images, helpers

- `WordCloudLayoutRunner` takes an optional `onError(message)` (default: logged); a layout that failed in the worker
  used to leave the cloud silently unchanged.
- `InstancedConeMesh` writes instance matrices and colors directly (one draw call, no React element per glyph), and its
  orientation is fixed and documented: in a Z-up frame, tilt by `vRotation` about +X (toward +Z), then turn by
  `hRotation` about +Z. Before, `vRotation` was applied about both X and Y; with `vRotation = 0` (as the archived
  Wildfire used it) nothing changes. `keyPrefix` is removed; `color` now multiplies each instance's color (default
  white). **Host action:** drop `keyPrefix`; check any glyphs with a nonzero `vRotation`.
- `DepthOverride` measures only visible objects, and instanced meshes by their instances; it allocates nothing per
  frame and disposes its material. `computeSceneDepthRange` is exported. (Its shader is logarithmic, as before; the
  comments said linear.)
- `Helpers/saveGrayscalePng.ts` is renamed `Helpers/SaveGrayscalePng.ts` (the project's file naming); the function
  keeps its name. **Host action:** update the import path. Call it right after a render in the same task (a WebGL
  canvas keeps no copy of what it drew), as the terrain example's Depth panel does.

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

- ChatUI adds a Topics panel (`WordCloud`, laid out in its worker): the conversation's words, linked when they share a
  message. Its seeded conversation uses a bundled cat image, so loading it waits on no network request; asking the
  scripted agent for a cat still fetches a live one (bundled one when offline). Its actions stay actions when called
  detached (they were rebound after `makeAutoObservable`).
- Uncertain terrain shows the paper's Wildfire setup on generated data: colors by VSUP or by one field through
  `ScalarFieldMesh` and TextureManager, wind glyphs (`InstancedConeMesh`) fading where the members disagree, toggled
  from a Layers menu (`CheckMenuItem`), a Depth panel (`DepthOverride`, PNG export), controls laid out with `FormGrid`;
  the seed, encoding and wind settings are stored in its config (`wind_color` read with `parseColor`,
  `wind_glyph_scale` checked with `numberBetween`).
- The Lorenz ensemble example is replaced by **Tornado ensemble**, after the paper's Uncertainty Tube setup on
  generated data: pathlines traced through an ensemble of Burgers vortices whose axes wander more and more over time,
  in three views linked by one camera (Ensemble, Uncertainty tube, Mean path), with the ensemble's bounding box and a
  double press to reset. Lorenz members split between the attractor's two lobes, and the tube (one mean path, one
  cross-section) misrepresents an ensemble that splits; this one stays unimodal, which its tests check. Its ensemble
  comes from an in-browser data server answering like a Python one (JSON with base64 binary arrays), and its
  downloaded config stores the seed and the variability growth. **Host action:** `LORENZ_ENSEMBLE_CONFIG` is now
  `TORNADO_ENSEMBLE_CONFIG`; a saved config named "Lorenz ensemble" no longer loads.

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
