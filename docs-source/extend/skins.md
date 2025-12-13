# Skins Overview

!!! warning "In Development"
    The skins system is partially implemented. Full theming support coming in v1.0.

## What Are Skins?

Skins allow you to customize r0astr's visual appearance without modifying core code.

## What Can Be Customized

Currently supported:

- **Colors** - Background, text, accents
- **Panel styling** - Borders, shadows, spacing

Coming in v1.0:

- Fonts and typography
- Layout variations
- Custom icons
- Animation preferences

## CSS Variables

r0astr uses CSS custom properties for theming:

```css
:root {
  --r0astr-bg-primary: #1a1a2e;
  --r0astr-bg-secondary: #16213e;
  --r0astr-text-primary: #eee;
  --r0astr-text-secondary: #aaa;
  --r0astr-accent: #6366f1;
  --r0astr-accent-hover: #818cf8;
  --r0astr-border: #333;
  --r0astr-panel-bg: #0f0f23;
  --r0astr-button-bg: #333;
}
```

## Applying a Skin

*Documentation coming soon.*

## Community Skins

See the [Skin Gallery](skin-gallery.md) for community-created themes.

## Creating Your Own

See [Creating Skins](creating-skins.md) for a step-by-step guide.

---

*Full theming API documentation coming with v1.0.*
