# Design

How WebUVisBox looks and arranges panels, and why. Values live in `src/Theme/DesignTokens.ts`; components read them
through the theme (`theme.tokens`), never as literal colors or sizes.

## Principles

- **The content is the loudest thing on screen.** Chrome is neutral, thin and quiet. The accent marks only what you can
  act on or what is selected.
- **Judging color needs a neutral surround.** A saturated frame next to an image shifts how its colors read
  (simultaneous contrast), so the neutral mode keeps to low-saturation grays and puts no accent near the content.
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
| `accentFill`, `accentOnSurface` | The accent as a fill (white text on it) and as a line or text on the surface; MUI's `primary.main` is `accentOnSurface` (contained buttons and switch tracks use `accentFill`) |
| `glass` | Fill, blur, saturation, edge and highlight of overlay panels |
| `px(size)` | A size at the current UI scale |

Color management: colors are written in sRGB (tokens, colormap presets, configs). Rendering follows three.js: the
canvas encodes sRGB on output (R3F's default; no `linear flat`), materials work in linear light, and TextureManager's
colormap textures hold linear values (`LinearSRGBColorSpace`). A custom shader sampling them ends with
`linearToOutputTexel` (or `#include <colorspace_fragment>`), as `VolumeRenderer` does.

Type: Inter (variable), with tabular figures so changing numbers do not jitter. Icons: Lucide, 1.75 stroke. Shapes:
panels 10px corners, controls 7px, navbar 44px, panel title row 34px.

## Display modes

| Mode | Built on | Surfaces | Accent | For |
|---|---|---|---|---|
| `bright` | MUI light | White panels on `#EEF0F0` | The navbar is the accent bar | Lit rooms, slides |
| `dark` | MUI dark | `#2C2D32` panels on `#232428` (brighter than MUI's default near-black) | Fills only; lighter tint `#E5484D` for lines and focus | Everyday work |
| `neutral` | MUI light | Warm grays: navbar and panel title rows `#544F4B` (84, 79, 75), canvas and panels `#807C76` (128, 124, 118) | None; dark gray fills, near-black lines | Judging color |

The neutral grays are warm (R > G > B), chosen by eye rather than hue-free. A mid gray gives poor text contrast in both
black and white: on `#807C76` white reaches 4.15:1 and black 5.06:1, so text there is black (secondary `#0D0C0B`,
4.7:1) and the dark title rows carry the white text (8.1:1).

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

## Panels

Every panel sits on the responsive grid: its `x`, `y`, `w`, `h` are given per breakpoint in `default_layouts`, so a
phone layout is just the `sm` layout (for example, panels stacked one above another). Each panel's `type` picks how it
is drawn; it can differ per breakpoint like the position:

| `type` | Drawn as | Takes grid space |
|---|---|---|
| `regular` (default) | A bordered tile | Yes; tiles push each other aside |
| `borderless` | Unframed on the canvas, content edge to edge (for the main view); keeps a thin title row | Yes |
| `overlay` | Glass, above the grid at its `x`, `y`, `w`; as tall as its content up to `h` rows, then it scrolls | No; it floats over what is under it |

Dragging a title row moves a panel: grid panels with the grid, overlays freely, snapping to the nearest cell on release.

Glass belongs to overlays only: it needs something behind it to blur. Over a render it shows the render's own colors,
averaged, which distorts color judgment far less than a saturated frame; still, use `regular` panels beside the view
where the whole content must stay visible.

Rows fill the window: `fit_rows` (per breakpoint) is how many grid rows span the height below the navbar, and the row
height follows from it. A breakpoint without `fit_rows` uses the bottom edge of its default layout (overlays
excluded), so a layout as written fills the window; give phones a smaller `fit_rows` than their layout's height so the
page scrolls.

Panel actions: fit to content (`regular` only; snaps to whole rows), collapse to the title row (`regular`, `overlay`),
close. A help button appears only when the panel has help content.

## Commands and shortcuts

Commands (`src/Commands/CommandRegistry.ts`) are named actions with an optional shortcut, registered by the framework and
by scenarios, and listed in the shortcut dialog (⇧/ or the navbar's keyboard button). Panel commands act on the panel
under the pointer. Shortcuts match the physical key (`KeyboardEvent.code`), so ⌥ on macOS still matches; shortcuts
without ⌥, ⌃ or ⌘ are ignored while typing in a field.

| Shortcut | Command |
|---|---|
| ⌥M | Next display mode |
| ⌥= / ⌥− / ⌥0 | Larger UI / smaller UI / UI at 100% |
| ⌥Enter | Full screen on or off (also the navbar's button; absent where the browser has no Fullscreen API, e.g. iPhone) |
| ⌥F / ⌥C / ⌥W | Fit / collapse or expand / close the panel under the pointer |
| ⌥⇧R | Reset layout |
| ⇧/ | Show keyboard shortcuts |

Add shortcuts sparingly: each one is a key a scenario can no longer use.

## Config

```json
{
  "appearance": { "accent": "#BE0000", "default_mode": "dark", "ui_scale": 1 },
  "panel_layouts": {
    "default_layouts": {
      "xl": [
        { "i": "Viewport", "type": "borderless", "x": 0, "y": 0, "w": 16, "h": 16, "visible": true },
        { "i": "Settings", "x": 16, "y": 0, "w": 6, "h": 16, "visible": true },
        { "i": "Legend", "type": "overlay", "x": 1, "y": 12, "w": 4, "h": 3, "visible": true }
      ]
    },
    "fit_rows": { "sm": 13 }
  }
}
```

Every key is optional: `type` defaults to `regular`, `fit_rows` to each layout's own height. Each panel still needs
`"visible": true` (see `CREATE_SCENARIO.md`, section 9). The mode and scale picked in the navbar are written back into
`appearance`, so a downloaded scenario opens as it was seen.
