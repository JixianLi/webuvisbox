# Changelog

Changes that can affect a host project consuming webuvisbox (as a submodule). Newest first. Each entry says what a host
has to change, if anything.

## Unreleased

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
