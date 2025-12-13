# Creating Skins

!!! warning "In Development"
    The skins system is partially implemented. This guide covers current capabilities.

## Prerequisites

- Basic CSS knowledge
- Familiarity with CSS custom properties
- r0astr running locally

## Skin File Structure

```
my-skin/
├── skin.json           # Metadata
├── skin.css            # Styles
├── preview.png         # Screenshot (800x600)
└── README.md           # Description
```

## skin.json

```json
{
  "name": "My Custom Skin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A brief description of your skin",
  "preview": "preview.png",
  "compatibility": "0.8.0"
}
```

## skin.css

Override CSS variables:

```css
/* my-skin/skin.css */

:root {
  /* Background colors */
  --r0astr-bg-primary: #0d1117;
  --r0astr-bg-secondary: #161b22;

  /* Text colors */
  --r0astr-text-primary: #c9d1d9;
  --r0astr-text-secondary: #8b949e;

  /* Accent colors */
  --r0astr-accent: #58a6ff;
  --r0astr-accent-hover: #79c0ff;

  /* Panel styling */
  --r0astr-panel-bg: #0d1117;
  --r0astr-border: #30363d;
  --r0astr-border-radius: 8px;

  /* Buttons */
  --r0astr-button-bg: #21262d;
  --r0astr-button-hover: #30363d;
}
```

## Testing Locally

1. Add your CSS file to r0astr
2. Import it in `index.html`
3. Refresh and verify appearance

## CSS Variable Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `--r0astr-bg-primary` | Main background | `#1a1a2e` |
| `--r0astr-bg-secondary` | Secondary background | `#16213e` |
| `--r0astr-text-primary` | Main text color | `#eee` |
| `--r0astr-text-secondary` | Secondary text | `#aaa` |
| `--r0astr-accent` | Accent/highlight | `#6366f1` |
| `--r0astr-panel-bg` | Panel background | `#0f0f23` |
| `--r0astr-border` | Border color | `#333` |

## Best Practices

1. **Test both dark and light modes** if supporting both
2. **Maintain contrast** for accessibility (WCAG AA)
3. **Test with code** - Ensure syntax highlighting is readable
4. **Include preview** - Screenshots help users choose skins

## Submitting Your Skin

1. Create a GitHub repo for your skin
2. Add to the [Skin Gallery](skin-gallery.md) via PR
3. Include preview screenshot and description

---

*Full skin API coming in v1.0.*
