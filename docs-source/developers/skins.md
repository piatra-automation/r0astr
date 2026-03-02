# Skins

r0astr features a skin system that allows customization of the UI layout and visual theme through modular skin packages.

## What Are Skins?

Skins are self-contained packages that define:

- **HTML Templates** — Panel layout, slider controls, UI components
- **CSS Theme** — Visual styling, colors, spacing, animations
- **Manifest** — Metadata, configuration, and CSS variable overrides

Unlike traditional themes that only change colors, r0astr skins can completely restructure the UI layout while maintaining compatibility with the underlying JavaScript.

## Included Skins

### Default (Tree Layout)

The standard r0astr interface with collapsible tree-structured panels, inline sliders, and floating visualizers.

- Vertical tree layout with drag-to-reorder
- Collapsible details panels
- Badge-based panel numbering
- Top banner hover trigger for menu access

### Glass (Glassmorphism)

Modern frosted glass design with translucent panels and backdrop blur.

- Dark purple gradient background
- Frosted glass panels with backdrop blur
- Glowing cyan accents
- Left-edge menu trigger (vertical slide-out)
- Bottom metronome trigger (glass strip)
- Pulsing glow animations on playing panels

### Split Column (3-Column Layout)

A three-column layout that separates panel headers, code editors, and controls into distinct columns with a global toolbar.

- Panel headers as a side-menu in the left column
- Code editors stacked in the center column
- Sliders and controls aggregated in the right column
- Global buttons (Update All, Play All, Stop All) in a fixed toolbar
- Click-to-select header behavior (no toggle)

This skin uses the [Layout System](creating-skins.md#layout-system) to decompose panels into parts distributed across page regions.

## Switching Skins

1. Click **CONFIG** in the top menu (hover the top banner area to reveal it)
2. Navigate to **Integrations**
3. Select a skin from the **UI Skin / Theme** dropdown
4. Click **Save**

Skins hot-reload automatically — no page refresh needed. Panel state is preserved during the transition.

## How Skins Work

### Loading Sequence

1. App loads settings from localStorage
2. Fetch manifest from `/skins/{skinName}/skin.json`
3. Inject skin's `theme.css` into document head
4. Parse HTML templates into rendering functions
5. Templates cached in memory for fast rendering

### Storage

- **Browser**: localStorage as part of r0astr-settings
- **Electron**: `userData/r0astr-settings.json`

All modes work offline with bundled skins.

## Skin Structure

A skin is a folder in `public/skins/` containing:

```
your-skin-name/
├── skin.json           # Manifest (name, version, templates, cssVariables, hoverTargets)
├── theme.css           # Visual styling
└── templates/
    ├── panel.html      # Panel structure
    ├── slider.html     # Labeled slider
    └── slider-collapsed.html  # Compact slider
```

Templates use Mustache-style `{{variable}}` placeholders. For JavaScript functionality to work, templates must include specific CSS classes:

| Class | Purpose |
|-------|---------|
| `.panel-tree` | Main container (in index.html) |
| `.level-panel` | Panel wrapper |
| `.panel-title` | Editable title |
| `.code-editor` | CodeMirror mount point |
| `.btn-playback` | Play/pause button |
| `.panel-controls-container` | Sliders area |

## Technical Details

- **SkinManager**: `src/managers/skinManager.js`
- **Template Compilation**: Simple regex-based Mustache engine
- **Integration**: panelManager and sliderManager use `skinManager.render()`
- **Initialization**: `main.js` loads skin before rendering UI

## License

Skins inherit the project's **AGPL-3.0** license unless otherwise specified in `skin.json`.
