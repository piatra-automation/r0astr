# r0astr Skin System

The r0astr skin system allows complete customization of the UI layout and visual theme through modular skin packages.

## Architecture

Skins are self-contained packages that define:
- **HTML Templates** - Panel layout, slider controls, UI components
- **CSS Theme** - Visual styling, colors, spacing
- **Manifest** - Metadata and configuration

## Creating a New Skin

### 1. Create Skin Directory

```bash
public/skins/
└── your-skin-name/
    ├── skin.json           # Manifest
    ├── theme.css           # Visual styling
    └── templates/
        ├── panel.html      # Panel structure
        ├── slider.html     # Slider with label
        └── slider-collapsed.html  # Compact slider
```

### 2. Create Manifest (`skin.json`)

```json
{
  "name": "Your Skin Name",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Brief description",
  "layoutType": "tree",
  "cssVariables": {
    "--primary-color": "#00ff88",
    "--panel-bg": "rgba(0, 0, 0, 0.8)"
  },
  "templates": {
    "panel": "panel.html",
    "slider": "slider.html",
    "sliderCollapsed": "slider-collapsed.html"
  },
  "hoverTargets": [
    {
      "id": "menu-trigger",
      "controls": [".top-menu-bar"],
      "hint": "subtle-glow"
    }
  ]
}
```

#### Manifest Fields

- **name** - Display name for the skin
- **version** - Semantic version (1.0.0)
- **author** - Creator name
- **description** - Brief description
- **layoutType** - Layout style identifier
- **cssVariables** - CSS custom properties to override
- **templates** - Template file mappings
- **hoverTargets** (optional) - Array of hover interaction configs
- **layout** (optional) - Layout region system for multi-column layouts (see [Layout System](#layout-system) below)

### 3. Create Templates

Templates use Mustache-style `{{variable}}` placeholders.

**panel.html** - Panel structure:
```html
<details{{expanded}}>
  <summary>
    <span class="panel-number-badge">{{panelNumber}}</span>
    <span class="panel-title">{{title}}</span>
    <div class="panel-actions">
      <button class="btn-playback" data-card="{{panelId}}">
        <span class="material-icons">play_arrow</span>
      </button>
      <button class="btn-delete" style="{{deleteButtonStyle}}">
        <span class="material-icons">delete</span>
      </button>
    </div>
  </summary>
  <div class="panel-editor-container">
    <div class="code-editor" id="editor-{{panelId}}"></div>
    <div class="error-message" data-card="{{panelId}}"></div>
  </div>
</details>
<div class="panel-controls-container">
  <div class="leaf-viz">
    <div id="viz-container-{{panelId}}"></div>
  </div>
</div>
```

**slider.html** - Labeled slider:
```html
<label>{{label}}</label>
<input type="range"
  min="{{min}}"
  max="{{max}}"
  step="{{step}}"
  value="{{value}}"
  data-slider-id="{{sliderId}}">
<span class="slider-value">{{valueFormatted}}</span>
```

**slider-collapsed.html** - Compact slider:
```html
<input type="range"
  min="{{min}}"
  max="{{max}}"
  step="{{step}}"
  value="{{value}}"
  data-slider-id="{{sliderId}}">
```

### 4. Create Theme CSS (`theme.css`)

Override CSS variables or add custom styles:

```css
:root {
  --primary-color: #ff6b35;
  --panel-bg: rgba(20, 20, 30, 0.95);
  --panel-border: 2px solid var(--primary-color);
}

.level-panel {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.panel-number-badge {
  background: var(--primary-color);
  color: black;
}
```

### 5. Configure Hover Targets (Optional)

Hover targets allow you to create interactive regions that trigger UI elements.

#### Hover Target Configuration

Each hover target in the manifest has:

```json
{
  "id": "unique-identifier",
  "controls": [".selector1", ".selector2"],
  "hint": "visual-hint-type"
}
```

**Fields:**

- `id` - Unique identifier for CSS targeting
- `controls` - Array of CSS selectors for elements to show on hover
- `hint` - Visual hint type (see below)

#### Visual Hint Types

- `subtle-glow` - Faint edge glow (good for edge triggers)
- `pulse` - Pulsing animation (draws attention)
- `visible` - Always visible (like a button)
- `banner` - Uses existing element visibility
- `none` - Completely invisible (discovery by accident)

#### CSS Implementation

Position and style hover targets in your theme CSS:

```css
/* Position the hover target */
.skin-hover-target[data-hover-id="menu-trigger"] {
  top: 0;
  left: 0;
  width: 20px;
  height: 100vh;
  background: linear-gradient(to right, rgba(255, 107, 53, 0.2), transparent);
  transition: all 0.3s ease;
}

/* Optional: Enhance on hover */
.skin-hover-target[data-hover-id="menu-trigger"]:hover {
  width: 30px;
  box-shadow: 0 0 20px rgba(255, 107, 53, 0.5);
}

/* Position the controlled element */
.top-menu-bar {
  top: 50%;
  left: 0;
  transform: translateX(-100%) translateY(-50%);
  transition: transform 0.3s ease;
}

/* Show element on hover */
.skin-hover-target[data-hover-id="menu-trigger"]:hover ~ .top-menu-bar,
.top-menu-bar:hover {
  transform: translateX(0) translateY(-50%);
  opacity: 1;
  pointer-events: auto;
}
```

#### Example: Multi-Point Hover (Glass Skin)

```json
{
  "hoverTargets": [
    {
      "id": "left-edge-menu",
      "controls": [".top-menu-bar"],
      "hint": "subtle-glow"
    },
    {
      "id": "bottom-metronome",
      "controls": [".metronome-section"],
      "hint": "visible"
    }
  ]
}
```

**CSS:**

```css
/* Left edge menu trigger */
.skin-hover-target[data-hover-id="left-edge-menu"] {
  top: 0;
  left: 0;
  width: 15px;
  height: 100vh;
  background: linear-gradient(to right, rgba(0, 212, 255, 0.15), transparent);
}

/* Bottom metronome trigger */
.skin-hover-target[data-hover-id="bottom-metronome"] {
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
}
```

## Layout System

The layout system allows skins to decompose panels into separate parts and distribute them across independent page regions. Instead of each panel being a single monolithic `<details>` element, a layout skin can place panel headers, editors, and controls into different columns or areas.

Skins **without** a `layout` key use the classic monolithic render path — each panel is a self-contained `<li>` in the panel tree. No changes needed for simple skins.

### Enabling Layout Mode

Add a `layout` key to your `skin.json`:

```json
{
  "name": "My Multi-Column Skin",
  "layout": {
    "regions": {
      "toolbar": { "selector": "#region-toolbar" },
      "left":    { "selector": "#region-left" },
      "center":  { "selector": "#region-center" },
      "right":   { "selector": "#region-right" }
    },
    "panelParts": {
      "header":   { "region": "left" },
      "editor":   { "region": "center" },
      "controls": { "region": "right" }
    },
    "headerClickBehavior": "select"
  },
  "templates": {
    "page": "page-layout.html",
    "panel-header": "panel-header.html",
    "panel-editor": "panel-editor.html",
    "panel-controls": "panel-controls.html"
  }
}
```

### Layout Configuration Fields

#### `regions`

Defines named regions that map to DOM containers in your page template. Each region has a `selector` used to find the element after the page template is rendered.

```json
"regions": {
  "toolbar": { "selector": "#region-toolbar" },
  "left":    { "selector": "#region-left" },
  "center":  { "selector": "#region-center" },
  "right":   { "selector": "#region-right" }
}
```

You can define any number of regions with any names. The selectors must match elements in your `page-layout.html` template.

#### `panelParts`

Maps each panel part type to a target region. When a panel is rendered in layout mode, each part is placed into its assigned region instead of being nested inside a single `<li>`.

```json
"panelParts": {
  "header":   { "region": "left" },
  "editor":   { "region": "center" },
  "controls": { "region": "right" }
}
```

**Available part types:**

| Part | Description | Typical Region |
|------|-------------|---------------|
| `header` | Panel title, badges, play/delete buttons | Side menu / left column |
| `editor` | CodeMirror code editor with error display | Main content area |
| `controls` | Sliders, visualizations | Side panel / right column |

Parts are inserted in **panel-number order** within each region (panel 0 first, then panel 1, etc.), so the master panel always appears at the top of each column.

#### `headerClickBehavior`

Controls what happens when a user clicks on a panel header in layout mode.

```json
"headerClickBehavior": "select"
```

| Value | Behavior | Best For |
|-------|----------|----------|
| `"toggle"` | Clicking toggles expand/collapse (default) | Layouts where headers are inline with content |
| `"select"` | Clicking always expands and focuses the panel. Panels are never collapsed by clicking their header. | Layouts where headers act as side-menu items (e.g., 3-column split) |

When `"select"` is set:

- Clicking a collapsed panel's header expands it and focuses the editor
- Clicking an already-active panel's header re-focuses the editor (no collapse)
- The active panel's header, editor, and controls all receive a `.focused` CSS class

When `"toggle"` is set (or omitted):

- Clicking an expanded panel's header collapses it and removes the focus highlight
- The `showControlsWhenCollapsed` user setting is respected — controls stay visible for playing panels when the editor is collapsed

### Resizable Regions

Set `"resizableRegions": true` in your layout config to let users drag column borders to resize them. Widths persist to localStorage automatically.

```json
"layout": {
  "regions": { ... },
  "panelParts": { ... },
  "resizableRegions": true
}
```

In your `page-layout.html`, place `<div class="layout-resizer">` elements between adjacent regions. Use `data-resize-left` and `data-resize-right` attributes to identify which regions each handle sits between:

```html
<div class="layout-region layout-region-left" id="region-left">...</div>
<div class="layout-resizer" data-resize-left="region-left" data-resize-right="region-center"></div>
<div class="layout-region layout-region-center" id="region-center">...</div>
<div class="layout-resizer" data-resize-left="region-center" data-resize-right="region-right"></div>
<div class="layout-region layout-region-right" id="region-right">...</div>
```

The drag handle resizes the **left** region; center columns using `flex: 1` adjust automatically. Use CSS `min-width` / `max-width` on regions to constrain drag bounds. Double-clicking a resizer resets the column to its default width.

Your theme CSS should use CSS custom properties for default widths so saved values can override them:

```css
.layout-region-left {
  width: var(--layout-left-width, 200px);
  min-width: 160px;
  max-width: 300px;
}
```

Style the resizer handle and active drag state:

```css
.layout-resizer { width: 5px; cursor: col-resize; background: rgba(255,255,255,0.1); }
.layout-resizer:hover { background: rgba(255,255,255,0.25); }
.layout-resizer.resizing { background: var(--primary-color); }
body.resizing-columns { cursor: col-resize !important; user-select: none; }
```

### Page Template

Layout skins must provide a `page-layout.html` template that defines the overall page structure. This template is rendered once and inserted into the main content area; individual panel parts are then placed into the region containers.

```html
<!-- page-layout.html -->
<div class="layout-toolbar" id="region-toolbar"></div>
<div class="layout-three-column">
  <div class="layout-region layout-region-left" id="region-left">
    <div class="region-label">Panels</div>
  </div>
  <div class="layout-region layout-region-center" id="region-center">
    <div class="region-label">Editors</div>
  </div>
  <div class="layout-region layout-region-right" id="region-right">
    <div class="region-label">Controls</div>
  </div>
</div>
```

### Part Templates

Each part type has its own template. These replace the monolithic `panel.html` when layout mode is active.

**panel-header.html** — Rendered into the header region:

```html
<div class="layout-panel-header">
  <span class="panel-number-badge" draggable="true">{{panelNumber}}</span>
  <div class="panel-actions-left">
    <button class="btn-playback" data-card="{{panelId}}">
      <span class="material-icons">play_arrow</span>
    </button>
  </div>
  <span class="panel-title" data-panel-id="{{panelId}}">{{title}}</span>
  <div class="panel-actions">
    <button class="btn-duplicate" data-panel="{{panelId}}" style="{{duplicateButtonStyle}}">
      <span class="material-icons">content_copy</span>
    </button>
    <button class="btn-delete" data-panel="{{panelId}}" style="{{deleteButtonStyle}}">
      <span class="material-icons">delete</span>
    </button>
  </div>
</div>
```

**panel-editor.html** — Rendered into the editor region:

```html
<div class="panel-editor-container">
  <div class="layout-editor-header">
    <span class="panel-number-badge">{{panelNumber}}</span>
    <span class="panel-title-ref">{{title}}</span>
  </div>
  <div class="code-editor-wrapper">
    <div class="code-editor" id="editor-{{panelId}}" data-card="{{panelId}}"></div>
  </div>
  <div class="error-message" data-card="{{panelId}}" style="display: none;"></div>
</div>
```

**panel-controls.html** — Rendered into the controls region:

```html
<div class="panel-controls-container">
  <div class="leaf-viz" style="display: none;">
    <div id="viz-container-{{panelId}}" class="viz-container"></div>
  </div>
</div>
```

### Toolbar Region

If your layout defines a region named `toolbar`, the master panel's global action buttons (Update All, Play All, Stop All) are automatically extracted from the master panel and placed into the toolbar as a fixed bar. This keeps global controls always accessible regardless of scroll position.

The toolbar auto-hides when empty (no buttons extracted):

```css
.layout-toolbar:empty {
  display: none;
}
```

### Focus Highlight in Layout Mode

When a panel is active and expanded, all of its layout parts receive the CSS class `.focused`. Use this to highlight the active panel across columns:

```css
/* Highlight active panel header */
.layout-part-header.focused .layout-panel-header {
  border-color: var(--primary-color, #51cf66);
  border-left: 3px solid var(--primary-color, #51cf66);
  background: rgba(81, 207, 102, 0.08);
}

/* Highlight active panel editor */
.layout-part-editor.focused .panel-editor-container {
  border-color: var(--primary-color, #51cf66);
}

/* Highlight active panel controls */
.layout-part-controls.focused {
  border-left: 2px solid var(--primary-color, #51cf66);
}
```

The `.focused` class is only applied when the panel is **both active and expanded**. Collapsing a panel removes the highlight. Clicking in a CodeMirror editor or clicking a panel header (in `"select"` mode) updates the highlight.

### Layout Part Data Attributes

Each part container element carries data attributes for identification:

| Attribute | Value | Example |
|-----------|-------|---------|
| `data-panel-id` | Panel identifier | `"panel-0"`, `"panel-1696000000"` |
| `data-part-name` | Part type | `"header"`, `"editor"`, `"controls"` |

These can be used for CSS targeting:

```css
/* Style master panel header differently */
.layout-part-header[data-panel-id="panel-0"] .layout-panel-header {
  background: rgba(255, 215, 0, 0.05);
}
```

### Example: Split Column Skin

The built-in Split Column skin demonstrates a full 3-column layout:

| Region | Content | Width |
|--------|---------|-------|
| `toolbar` | Global buttons (Update All, Play All, Stop All) | Full width, fixed bar |
| `left` | Panel headers (side menu) | 200px fixed |
| `center` | Code editors | Flexible (fills remaining space) |
| `right` | Slider controls and visualizations | 280px fixed |

With `"headerClickBehavior": "select"`, clicking a panel header in the left column always selects and focuses that panel — it acts as a navigation menu rather than a toggle.

## Required CSS Classes

Your templates MUST include these classes for JS functionality:

| Class | Purpose | Required On |
|-------|---------|-------------|
| `.panel-tree` | Main panel container | Existing in index.html |
| `.level-panel` | Individual panel wrapper | Panel template |
| `.panel-number-badge` | Panel number | Panel template |
| `.panel-title` | Editable title | Panel template |
| `.code-editor` | CodeMirror mount point | Panel template |
| `.panel-controls-container` | Slider/viz area | Panel template |
| `.btn-playback` | Play/pause button | Panel template |
| `.btn-delete` | Delete button | Panel template |
| `.leaf-slider` | Slider wrapper | Slider template |
| `.slider-value` | Value display | Slider template |

## Template Variables

### Panel Template

- `{{panelId}}` - Unique panel ID (e.g., "panel-1234567890")
- `{{panelNumber}}` - Panel number (0, 1, 2, ...)
- `{{title}}` - Panel title (e.g., "Instrument 1")
- `{{expanded}}` - " open" or "" for details state
- `{{deleteButtonStyle}}` - "display: none;" for master panel, "" otherwise

### Slider Template

- `{{sliderId}}` - Unique slider ID
- `{{label}}` - Slider label (e.g., "Cutoff")
- `{{min}}` - Minimum value
- `{{max}}` - Maximum value
- `{{step}}` - Step size
- `{{value}}` - Current value (number)
- `{{valueFormatted}}` - Formatted value (e.g., "123.45")

## Activating Your Skin

1. Place skin folder in `public/skins/your-skin-name/`
2. Build: `npm run build`
3. Open Settings → Integrations → UI Skin
4. Select your skin from dropdown
5. Save settings
6. UI hot-reloads automatically - no page refresh needed!

!!! tip "Development Workflow"
    - **CSS changes**: Vite HMR updates automatically
    - **Template changes**: Require page reload
    - **Manifest changes**: Require page reload
    - **Skin switching**: Hot-reloads (panel state preserved)

## Skin Storage

- **Browser**: localStorage (`r0astr-settings.skin`)
- **Electron**: app userData folder
- **GitHub Pages**: localStorage (persists across sessions)

All modes work offline with bundled skins.

## Example Skins

### Minimal Skin
Stripped-down layout with no badges, minimal controls.

### Grid Layout
Traditional card grid instead of tree structure.

### WinAmp Classic
Retro WinAmp-inspired design with skinnable sprites.

## Development Tips

1. **Live Reload CSS**: Edit theme.css - Vite HMR updates automatically
2. **Template Changes**: Require page reload
3. **Test with multiple panels**: Create 3-4 panels to test overflow
4. **Check responsive behavior**: Test at different window sizes
5. **Validate required classes**: Missing classes break JS functionality

## Troubleshooting

**Skin doesn't load:**
- Check browser console for fetch errors
- Verify skin.json is valid JSON
- Check template file paths in manifest

**UI broken after skin change:**
- Verify all required CSS classes present
- Check template placeholders match expected variables
- Fallback: Reset to default skin in localStorage

**Hover targets not working:**
- Ensure z-index is above all UI elements (use `z-index: 10101`)
- Check that hidden elements have `pointer-events: none`
- Verify hover selectors use `~` for sibling combinators
- Remember hover targets are injected as direct body children

**Page won't reload:**
- Clear localStorage: `localStorage.removeItem('r0astr-settings')`
- Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

## Contributing Skins

Share your skins! Create a PR with:
1. Skin folder in `public/skins/`
2. Screenshot in `docs/skins/`
3. Update this README with your skin description

## License

Skins inherit the project's AGPL-3.0 license unless otherwise specified in skin.json.
