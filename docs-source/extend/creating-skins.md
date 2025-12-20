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
  }
}
```

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
6. Reload page

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
