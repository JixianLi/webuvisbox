# Design

How WebUVisBox looks and arranges panels, and why. Values live in `src/Theme/DesignTokens.ts`; components read them
through the theme (`theme.tokens`), never as literal colors or sizes.

## Principles

- **The content is the loudest thing on screen.** Chrome is neutral, thin and quiet. The accent marks only what you can
  act on or what is selected.
- **Judging color needs a neutral surround.** A saturated frame next to an image shifts how its colors read
  (simultaneous contrast), so the neutral mode keeps every gray hue-free and puts no accent near the content.
- **Generic first.** Scenarios differ (renders, maps, charts, chat); a design choice must hold for all of them.
- **Sharing is by config, not URL.** Everything a view needs (mode, scale, arrangement) is a scenario config entry, so
  links stay short and a downloaded scenario opens as it was seen.

## Tokens

| Token | Meaning |
|---|---|
| `canvas` | Behind the panels |
| `surface`, `surfaceRaised` | Panels; menus and popovers |
| `controlFill`, `border` | Text fields and selects; 1px hairlines (no shadows on panels) |
| `text`, `textSecondary`, `textMuted` | Three levels of ink |
| `accentFill`, `accentOnSurface` | The accent as a fill (white text on it) and as a line or text on the surface |
| `glass` | Fill, blur, saturation, edge and highlight of floating panels |
| `px(size)` | A size at the current UI scale |

Type: Inter (variable), with tabular figures so changing numbers do not jitter. Icons: Lucide, 1.75 stroke. Shapes:
panels 10px corners, controls 7px, navbar 44px, panel title row 34px.

## Display modes

| Mode | Built on | Surfaces | Accent | For |
|---|---|---|---|---|
| `bright` | MUI light | White panels on `#EEF0F0` | The navbar is the accent bar | Lit rooms, slides |
| `dark` | MUI dark | `#2C2D32` panels on `#232428` (brighter than MUI's default near-black) | Fills only; lighter tint `#E5484D` for lines and focus | Everyday work |
| `neutral` | MUI dark | Hue-free mid grays (`#545454` on `#4A4A4A`) | None; light gray instead | Judging color |

A true 18% middle gray gives poor text contrast in both black and white, so neutral sits darker, around L* 35.

### Accent and the University of Utah brand

The default accent is Utah Red, `#BE0000` (University of Utah brand colors toolkit, 2023: "Do not use the CMYK or SPOT
formulas for projects where the final product will be viewed on a digital screen"). The toolkit's rules and how they
map here:

- Core colors are Utah Red, black and white, and "prominent use of Utah Red reinforces the University brand": the bright
  mode's navbar is Utah Red; panels carry no red bars.
- Accent colors (Red Rocks, Wasatch Sunrise, Great Salt Lake, ...) are "subordinate", at most 10% of a composition, and
  "never used to represent the brand": not used in the chrome. They suit charts, which the toolkit names as their use.
- `#E5484D` (dark mode's lines and focus ring) is not a brand color: Utah Red on the dark surface reaches only about 2:1
  contrast, below the 3:1 a focus indicator needs.

A scenario sets its own accent with `appearance.accent`.

## UI scale

One factor over every size (type, controls, headers, spacing): 85% to 175%, from the navbar's menu, ⌥= and ⌥−, or
`appearance.ui_scale`. Content (a render's resolution, a chart's data) is unaffected. For larger screenshots and
projection without the browser's zoom, which also changes layout breakpoints.

## Panels and placement

Each panel has a role, `content` (what you look at) or `tool` (what you adjust; the default). `tool_placement` decides
where tools go:

| `tool_placement` | Content panels | Tool panels |
|---|---|---|
| `grid` (default) | In the grid with the tools, as before | In the grid |
| `docked` | Share the area left over, split by draggable dividers (`content_split`) | An inspector column on one side |
| `overlay` | Share the whole area | An inspector floating over the content |

A panel reads its placement (`usePanelPlacement`) and frames itself: `tile` and `content` are bordered surfaces,
`stage` (the only content panel) is unframed and fills its area, `floating` (in the inspector) is glass.

The inspector is moved by dragging any tool panel's title row; an outline shows the corner it will snap to, and
`inspector_anchor` keeps it (`top_left`, `top_right`, `bottom_left`, `bottom_right`; docked uses only the side).
Corners rather than free positions: a layout stays the same on every screen and nothing can be lost off-screen.

Glass belongs to floating panels only: it needs something behind it to blur. Over a render it shows the render's own
colors, averaged, which distorts color judgment far less than a saturated frame; still, prefer `docked` where the whole
content must stay visible.

Panel actions: fit to content (grid only; snaps to the 50px row grid), collapse to the title row, close. A help button
appears only when the panel has help content.

## Commands and shortcuts

Commands (`src/Commands/CommandRegistry.ts`) are named actions with an optional shortcut, registered by the framework and
by scenarios, and listed in the shortcut dialog (⇧/ or the navbar's keyboard button). Panel commands act on the panel
under the pointer. Shortcuts match the physical key (`KeyboardEvent.code`), so ⌥ on macOS still matches; shortcuts
without ⌥, ⌃ or ⌘ are ignored while typing in a field.

| Shortcut | Command |
|---|---|
| ⌥M | Next display mode |
| ⌥= / ⌥− / ⌥0 | Larger UI / smaller UI / UI at 100% |
| ⌥F / ⌥C / ⌥W | Fit / collapse or expand / close the panel under the pointer |
| ⌥⇧R | Reset layout |
| ⇧/ | Show keyboard shortcuts |

Add shortcuts sparingly: each one is a key a scenario can no longer use.

## Config

```json
{
  "appearance": { "accent": "#BE0000", "default_mode": "dark", "ui_scale": 1 },
  "panel_layouts": {
    "tool_placement": "docked",
    "inspector_anchor": "top_right",
    "content_split": [0.6, 0.4],
    "default_layouts": { "xl": [{ "i": "Viewport", "role": "content", "x": 0, "y": 0, "w": 16, "h": 16, "visible": true }] }
  }
}
```

Every key is optional; a config without them looks and lays out as before, in the new style. Each panel still needs
`"visible": true`, and docked and overlay placements use only the `xl` layout (see `CREATE_SCENARIO.md`, section 9). The mode and scale picked
in the navbar are written back into `appearance`, so a downloaded scenario opens as it was seen.
