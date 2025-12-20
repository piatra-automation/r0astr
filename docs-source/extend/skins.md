# UI Skins System

r0astr features a powerful skin system that allows complete customization of the UI layout and visual theme through modular skin packages.

## What Are Skins?

Skins in r0astr are self-contained packages that define:

- **HTML Templates** - Panel layout, slider controls, UI components
- **CSS Theme** - Visual styling, colors, spacing, animations
- **Manifest** - Metadata, configuration, and CSS variable overrides

Unlike traditional themes that only change colors, r0astr skins can completely restructure the UI layout while maintaining compatibility with the underlying JavaScript.

## Features

✅ **Complete Layout Control** - Change from tree layout to grid, tabs, or floating windows
✅ **Visual Customization** - Override colors, fonts, spacing, animations
✅ **Configurable Hover Interactions** - Define custom hover targets for menus and UI elements
✅ **Offline-First** - Skins bundled with app, no external dependencies
✅ **Hot-Swappable** - Switch skins from settings without page reload
✅ **Community Shareable** - Package and distribute custom skins
✅ **Browser & Electron** - Works in all deployment modes

## Included Skins

### Default (Tree Layout)
The standard r0astr interface with collapsible tree-structured panels, inline sliders, and floating visualizers.

**Features:**

- Vertical tree layout
- Collapsible details panels
- Badge-based panel numbering
- Material icons
- Drag-to-reorder panels
- Top banner hover trigger for menu access

### Glass (Glassmorphism)
Modern frosted glass design with translucent panels, backdrop blur, and multi-point hover interactions.

**Features:**

- Dark purple gradient background
- Frosted glass panels with backdrop blur
- Glowing cyan accents
- Left-edge menu trigger (vertical slide-out)
- Bottom metronome trigger (glass strip)
- Pulsing glow animations on playing panels

## How Skins Work

### Storage
Your selected skin is stored in:

- **Browser**: `localStorage` as part of r0astr-settings
- **Electron**: `userData/r0astr-settings.json`
- **GitHub Pages**: Browser localStorage (persists across sessions)

### Loading Sequence

1. **Startup**: App loads settings from localStorage
2. **Skin Load**: Fetch manifest from `/skins/{skinName}/skin.json`
3. **CSS Injection**: Add skin's `theme.css` to document head
4. **Template Compilation**: Parse HTML templates into JavaScript functions
5. **Rendering**: Use templates when creating panels/sliders
6. **Caching**: Templates cached in memory for fast rendering

### Performance

- **Initial Load**: ~50-100ms (one-time fetch + compile)
- **Rendering**: <1ms per panel (templates cached in memory)
- **No I/O**: After initial load, all rendering is in-memory

## Using Skins

### Switching Skins

1. Click **CONFIG** button in top menu (hover top banner area to reveal menu)
2. Navigate to **Integrations** section
3. Select skin from **UI Skin / Theme** dropdown
4. Click **Save**
5. UI updates instantly - no reload needed!

!!! tip "Hot-Reload"
    Skins hot-reload automatically when you save settings. Your panel state is preserved during the transition.

## Hover Targets System

Skins can define custom hover targets that control when and how UI elements appear. This allows for edge-based menus, corner triggers, and interactive regions.

### How It Works

1. **Manifest Definition** - Skin defines hover targets in `skin.json`
2. **DOM Injection** - skinManager creates invisible hover regions
3. **CSS Control** - Skin CSS positions targets and defines interactions
4. **Pure CSS** - No JavaScript needed for hover behaviors

### Example: Glass Skin

The Glass skin demonstrates multi-point hover interactions:

**Left Edge** (15px cyan glow):
```
Hover → Menu slides out from left vertically
```

**Top-Right Corner** (pulsing hint):
```
Hover → Banner slides down (unused in current version)
```

**Bottom Strip** (visible glass bar):
```
Hover → Metronome slides up from bottom
```

### Hover Target Hints

Skins can use different visual hints for discoverability:

- `subtle-glow` - Faint edge glow (Glass left edge)
- `pulse` - Pulsing animation (Glass top corner)
- `visible` - Always visible strip (Glass bottom)
- `banner` - Inherit existing banner visibility (Default)
- `none` - Completely invisible

## Creating Your Own Skin

Ready to create a custom skin? Head to [Creating Skins](creating-skins.md) for a complete tutorial.

### Quick Start

```bash
# Create skin folder
mkdir -p public/skins/my-custom-skin/templates

# Copy default templates as starting point
cp -r public/skins/default/templates/* public/skins/my-custom-skin/templates/

# Create theme CSS
touch public/skins/my-custom-skin/theme.css

# Build and test
npm run build
```

## Architecture

### Template System

r0astr uses a simple Mustache-style templating engine:

```html
<!-- Template -->
<span class="panel-title">{{title}}</span>

<!-- Rendered -->
<span class="panel-title">Instrument 1</span>
```

### Required CSS Classes

For JavaScript functionality to work, templates must include specific CSS classes:

| Class | Purpose |
|-------|---------|
| `.panel-tree` | Main container |
| `.level-panel` | Panel wrapper |
| `.panel-title` | Editable title |
| `.code-editor` | CodeMirror mount |
| `.btn-playback` | Play/pause button |
| `.panel-controls-container` | Sliders area |

## Technical Details

For developers interested in the implementation:

- **SkinManager**: `/src/managers/skinManager.js`
- **Template Compilation**: Simple regex-based Mustache engine
- **Integration**: panelManager.js, sliderManager.js use `skinManager.render()`
- **Initialization**: `main.js` loads skin before rendering UI

## License

Skins inherit the project's **AGPL-3.0** license unless otherwise specified in `skin.json`.

## Next Steps

- [Creating Skins Tutorial](creating-skins.md) - Step-by-step guide
- [Skin Gallery](skin-gallery.md) - Browse community skins (coming soon)
