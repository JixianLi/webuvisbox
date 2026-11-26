# Changelog

Changes that can affect a host project consuming webuvisbox (as a submodule). Newest first. Each entry says what a host
has to change, if anything.

## Unreleased

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
