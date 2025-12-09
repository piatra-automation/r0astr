# CSS Variables Reference

**Version:** v4
**Last Updated:** 2025-12-09
**Related Stories:** Story 4.5, Story 9.2

## Overview

r0astr uses CSS Custom Properties (CSS variables) for theming and appearance customization. All design tokens (colors, dimensions, typography, spacing, z-index) are defined as variables in the `:root` selector, enabling theme overrides and consistent design system management.

## Variable Categories

### Base Color Palette

Single source of truth for application colors:

```css
--pale-white: #d1d8e0;        /* Light text, button surfaces */
--pearl: #dfddde;              /* Subtle highlights */
--cream: #dad0bc;              /* Background, warm panels */
--dark-green: #01614f;         /* Accent color */
--mid-green: #01614f;          /* Mid-tone accent */
--burnt-red: #f64c04;          /* Warning, error states */
--puke: #e3ad43;               /* Secondary accent */
--darkness: #0b0600;           /* Dark backgrounds, holes */
--foreground: #00ffff;         /* Strudel pattern highlights (cyan) */
```

### Panel Colors

Semantic panel color system with base values and computed variants:

```css
/* Base panel colors */
--panel-base-warm: #dad0bc;    /* Warm beige for background */
--panel-base-cool: #d9d8d4;    /* Cool gray for hero/controls */
--panel-base-light: #d1d8e0;   /* Light panels (collapsed, master) */
--panel-base-dark: #1a1a1a;    /* Dark panels (expanded) */

/* Computed gradients (using color-mix) */
--panel-warm-light: color-mix(in srgb, var(--panel-base-warm) 85%, white 15%);
--panel-warm-dark: color-mix(in srgb, var(--panel-base-warm) 80%, black 20%);
--panel-cool-light: color-mix(in srgb, var(--panel-base-cool) 90%, white 10%);
--panel-cool-dark: var(--panel-base-cool);
--panel-light-highlight: color-mix(in srgb, var(--panel-base-light) 95%, white 5%);
--panel-light-shadow: color-mix(in srgb, var(--panel-base-light) 85%, black 15%);
```

### Screen Colors

```css
--screen-base: #076443;                                                    /* Base screen color */
--screen-bkg: var(--screen-base);                                          /* Background alias */
--screen-edge: #514041;                                                    /* Brown edge (static) */
--screen-top: color-mix(in srgb, var(--screen-base) 50%, black 50%);      /* Darker top edge */
--screen-bottom: color-mix(in srgb, var(--screen-base) 70%, white 30%);   /* Lighter bottom edge */
```

### Dimensions

Panel and component sizing:

```css
--hole-size: 16px;                   /* Button hole size */
--corner-ring-size: 42px;            /* Corner decoration size */
--button-width: 87px;                /* Standard button width */
--button-height: 42px;               /* Standard button height */
--hero-button-padding: 12px;         /* Hero screen button padding */
--panel-collapsed-height: 56px;      /* Collapsed panel height */
--panel-default-width: 400px;        /* Default panel width */
--panel-default-height: 300px;       /* Default panel height */
--panel-min-width: 300px;            /* Minimum panel width */
--panel-min-height: 200px;           /* Minimum panel height */
--hero-bar-height: 255px;            /* Hero bar height */
--speaker-width: 300px;              /* Speaker decoration width */
--master-panel-compact-width: 220px; /* Compact master panel width */
--top-bar-height: 42px;              /* Top bar height */
--site-logo-height: 100px;           /* Site logo height */
```

### Border Radius

Five-step radius scale:

```css
--radius-xs: 1px;   /* Extra small radius */
--radius-sm: 2px;   /* Small radius (holes) */
--radius-md: 4px;   /* Medium radius (buttons) */
--radius-lg: 6px;   /* Large radius */
--radius-xl: 8px;   /* Extra large radius */
```

### Spacing

Gap system for layout spacing:

```css
/* General spacing scale */
--gap-xs: 4px;      /* Extra small gap */
--gap-sm: 8px;      /* Small gap */
--gap-md: 12px;     /* Medium gap */
--gap-lg: 20px;     /* Large gap */
--gap-xl: 24px;     /* Extra large gap */

/* Layout-specific spacing */
--side-gap: 43px;     /* Gap from edge to buttons (all sides) */
--channel-gap: 43px;  /* Spacing between rows and columns */
```

### Typography (Story 9.2)

Font family and size system:

```css
/* Font families */
--font-family-base: 'Supertone', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-monospace: monospace;
--font-family-icons: 'Material Icons';

/* Font sizes */
--font-size-base: 14px;   /* Base font size */
--font-size-lg: 18px;     /* Large text */
--font-size-sm: 12px;     /* Small text */
--font-size-xs: 10px;     /* Extra small text */
```

### Z-index Layers (Story 9.2)

13-layer semantic z-index system for stacking context management:

```css
--z-behind: -1;             /* Behind base layer */
--z-base: 1;                /* Base layer */
--z-above-base: 2;          /* Above base layer */
--z-screen: 999;            /* Screen layer */
--z-topbar: 1000;           /* Top bar */
--z-master-panel: 9999;     /* Master panel */
--z-hero: 10000;            /* Hero screen */
--z-panel: 10000;           /* Instrument panels */
--z-logo: 10001;            /* Logo layer */
--z-subtitle: 10001;        /* Subtitle layer */
--z-modal: 10001;           /* Modal dialogs */
--z-splash: 10002;          /* Splash screen */
--z-splash-content: 10003;  /* Splash screen content (highest) */
```

**Z-index Layer Design:**
- Layers 1-2: Base content
- Layer 999: Screen elements
- Layer 1000-9999: UI chrome (topbar, master panel)
- Layers 10000+: Interactive overlays (panels, modals, splash)

### Button System Variables

Button-in-hole pattern design tokens:

```css
/* Outer hole container */
--btn-hole-bg: var(--darkness);     /* Hole background */
--btn-hole-radius: 2px;             /* Hole border radius */
--btn-hole-depth: 2px;              /* Hole depth (normal) */
--btn-hole-depth-sm: 1.5px;         /* Hole depth (small) */
--btn-hole-hover-bg: #4a5a5f;       /* Hole hover background */

/* Inner button surface */
--btn-surface-bg: var(--pale-white);      /* Button surface color */
--btn-surface-radius: 4px;                /* Button surface radius */
--btn-surface-radius-sm: 3px;             /* Button surface radius (small) */

/* Button padding (determines size) */
--btn-padding-square-lg: 12px;            /* Hero buttons (large square) */
--btn-padding-square-md: 10px;            /* Expanded panel buttons (medium square) */
--btn-padding-square-sm: 8.5px;           /* Collapsed panel buttons (small square) */
--btn-padding-square-xs: 8px;             /* Master mode button (extra-small square) */
--btn-padding-slim-lg: 12px 20px;         /* Future: slim buttons (large) */
--btn-padding-slim-md: 10px 16px;         /* Future: slim buttons (medium) */
--btn-padding-tiny: 6px;                  /* Future: tiny icon buttons */

/* Icon sizes */
--btn-icon-lg: 32px;     /* Hero buttons */
--btn-icon-md: 28px;     /* Expanded panel buttons */
--btn-icon-sm: 24px;     /* Master mode, small buttons */
--btn-icon-xs: 23px;     /* Collapsed panel buttons */
--btn-icon-tiny: 18px;   /* Future: tiny buttons */

/* Shadows and lighting */
--btn-shadow-normal: 0 2px 4px rgba(0, 0, 0, 0.2);        /* Normal state shadow */
--btn-shadow-normal-sm: 0 1px 3px rgba(0, 0, 0, 0.2);     /* Normal state shadow (small) */
--btn-shadow-pressed: 0 1px 2px rgba(0, 0, 0, 0.1);       /* Pressed state shadow */
--btn-shadow-pressed-sm: 0 0.5px 1px rgba(0, 0, 0, 0.1);  /* Pressed state shadow (small) */
--btn-bevel-light: rgba(255, 255, 255, 0.2);              /* Bevel highlight */
--btn-bevel-dark: rgba(128, 128, 128, 0.5);               /* Bevel shadow */

/* Press animation */
--btn-press-move: 1px;      /* Movement on press (normal) */
--btn-press-move-sm: 0.5px; /* Movement on press (small) */
```

### Appearance Settings

Configurable appearance properties:

```css
--code-font-size: 14px;          /* Code editor font size */
--panel-opacity: 0.95;           /* Panel opacity */
--transition-duration: 0.2s;     /* Animation duration */
```

### Projection Margins

Dynamically updated by themeManager.js:

```css
--projection-margin-top: 0px;
--projection-margin-right: 0px;
--projection-margin-bottom: 0px;
--projection-margin-left: 0px;
```

### Theme Colors

Default dark theme with light theme overrides:

```css
/* Default dark theme */
--bg-color: var(--cream);
--card-bg: #1a1a1a;
--text-color: #fff;
--border-color: #00ff00;
--header-color: #00ff00;
```

## Usage Examples

### Basic Variable Usage

```css
/* Use var() to reference CSS variables */
.panel {
  background-color: var(--panel-base-light);
  border-radius: var(--radius-sm);
  padding: var(--gap-md);
  z-index: var(--z-panel);
  font-family: var(--font-family-base);
}
```

### Button-in-Hole Pattern

```css
/* Outer hole */
.button-hole {
  background: var(--btn-hole-bg);
  border-radius: var(--btn-hole-radius);
  padding: var(--btn-hole-depth);
}

/* Inner button */
.button-surface {
  background: var(--btn-surface-bg);
  border-radius: var(--btn-surface-radius);
  padding: var(--btn-padding-square-md);
  box-shadow: var(--btn-shadow-normal);
}

/* Pressed state */
.button-surface:active {
  box-shadow: var(--btn-shadow-pressed);
  transform: translateY(var(--btn-press-move));
}
```

### Computed Color Variants

```css
/* Use color-mix for dynamic color variants */
.panel-gradient {
  background: linear-gradient(
    to bottom,
    var(--panel-warm-light),
    var(--panel-warm-dark)
  );
}
```

### Responsive Typography

```css
.title {
  font-family: var(--font-family-base);
  font-size: var(--font-size-lg);
}

.code-editor {
  font-family: var(--font-family-monospace);
  font-size: var(--code-font-size);
}

.icon {
  font-family: var(--font-family-icons);
  font-size: var(--btn-icon-md);
}
```

### Z-index Stacking

```css
.topbar {
  z-index: var(--z-topbar);  /* 1000 */
}

.panel {
  z-index: var(--z-panel);   /* 10000 */
}

.modal {
  z-index: var(--z-modal);   /* 10001 - above panels */
}

.splash {
  z-index: var(--z-splash);  /* 10002 - above modals */
}
```

## Theme Customization

### Creating a Custom Theme

Override variables in a theme-specific CSS file or `<style>` block:

```css
/* custom-theme.css */
:root {
  /* Override base colors */
  --pale-white: #e0f7fa;      /* Light cyan */
  --darkness: #01579b;        /* Deep blue */
  --burnt-red: #ff5722;       /* Bright orange-red */

  /* Override panel colors */
  --panel-base-warm: #b3e5fc;
  --panel-base-cool: #81d4fa;

  /* Override dimensions */
  --hole-size: 20px;          /* Larger holes */
  --panel-default-width: 450px;

  /* Override typography */
  --font-size-base: 16px;     /* Larger base font */

  /* Z-index values remain unchanged (semantic layer system) */
}
```

### Runtime Theme Switching

Use JavaScript to dynamically override variables:

```javascript
// Change single variable
document.documentElement.style.setProperty('--pale-white', '#00ff00');

// Apply theme object
const theme = {
  '--pale-white': '#e0f7fa',
  '--darkness': '#01579b',
  '--panel-base-warm': '#b3e5fc'
};

Object.entries(theme).forEach(([prop, value]) => {
  document.documentElement.style.setProperty(prop, value);
});
```

### Dark/Light Theme Toggle

```css
/* Default dark theme in :root */
:root {
  --bg-color: var(--cream);
  --card-bg: #1a1a1a;
  --text-color: #fff;
}

/* Light theme override */
body.theme-light {
  --bg-color: #f0f0f0;
  --card-bg: #ffffff;
  --text-color: #000000;
}
```

```javascript
// Toggle theme
document.body.classList.toggle('theme-light');
```

## Naming Conventions

### Semantic Naming Philosophy

Variables use **semantic names** that describe purpose, not value:

- ✅ **Good:** `--panel-base-warm`, `--font-size-base`, `--z-modal`
- ❌ **Bad:** `--beige-color`, `--14px`, `--z-10001`

### Naming Patterns

| Category | Pattern | Example |
|----------|---------|---------|
| Colors | `--{element}-{variant}` | `--panel-base-warm` |
| Dimensions | `--{element}-{property}` | `--panel-default-width` |
| Typography | `--font-{property}-{size}` | `--font-size-base` |
| Spacing | `--gap-{size}` | `--gap-md` |
| Z-index | `--z-{layer}` | `--z-modal` |
| Button | `--btn-{part}-{property}` | `--btn-hole-bg` |

### Size Scale Convention

Size modifiers follow consistent naming:
- `xs` = extra small
- `sm` = small
- `md` = medium (often implicit base)
- `lg` = large
- `xl` = extra large

## Browser Compatibility

### CSS Custom Properties Support

| Browser | Min Version | Released |
|---------|-------------|----------|
| Chrome | 49+ | March 2016 |
| Firefox | 31+ | July 2014 |
| Safari | 9.1+ | March 2016 |
| Edge | 15+ | April 2017 |

All target browsers support CSS variables. **No polyfill required.**

### Color-mix() Support

| Browser | Min Version | Released |
|---------|-------------|----------|
| Chrome | 111+ | March 2023 |
| Firefox | 113+ | May 2023 |
| Safari | 16.2+ | December 2022 |

`color-mix()` is used for computed gradients. Browsers without support will fall back to base colors (graceful degradation).

## Maintenance Guidelines

### When to Add New Variables

Add variables when:
- A value is reused in 2+ places
- A value should be themeable
- A value represents a design token (color, spacing, etc.)

Don't add variables for:
- One-off values unique to single component
- Computed values better handled in JavaScript
- Values that break semantic naming

### Updating Variables

1. **Never change semantic meaning** - If `--panel-base-warm` changes from beige to blue, create a new variable
2. **Document changes** - Update this file when adding/removing variables
3. **Test theme overrides** - Ensure custom themes still work after changes
4. **Maintain z-index layers** - Don't reorder z-index values; add new layers between existing ones if needed

### Variable Organization

Variables are organized in `static/css/base.css` by category with comments:

```css
:root {
  /* Base Color Palette */
  --pale-white: #d1d8e0;
  /* ... */

  /* Panel Base Colors */
  --panel-base-warm: #dad0bc;
  /* ... */

  /* Typography (Story 9.2) */
  --font-family-base: 'Supertone', sans-serif;
  /* ... */
}
```

Keep categories grouped and commented for maintainability.

## Migration from Hardcoded Values

### Finding Hardcoded Values

```bash
# Find hardcoded hex colors
grep -r "#[0-9a-fA-F]\{6\}" static/css/

# Find hardcoded px values (careful: excludes :root definitions)
grep -r "[0-9]\+px" static/css/ | grep -v ":root"

# Find hardcoded z-index
grep -r "z-index: [0-9]" static/css/ | grep -v ":root"
```

### Replacement Strategy

1. Identify hardcoded value
2. Check if equivalent variable exists
3. If not, create semantic variable in `:root`
4. Replace usage with `var(--variable-name)`
5. Test visual regression

Example:
```css
/* Before */
.panel {
  background: #dad0bc;
  padding: 12px;
  z-index: 10000;
}

/* After */
.panel {
  background: var(--panel-base-warm);
  padding: var(--gap-md);
  z-index: var(--z-panel);
}
```

## Reference

### Related Documentation

- [Frontend Architecture](frontend-architecture.md) - Overall frontend design
- [Coding Standards](coding-standards.md) - CSS naming conventions
- [Tech Stack](tech-stack.md) - Browser compatibility requirements

### Related Stories

- **Story 4.5:** Initial CSS variable system (colors, dimensions, spacing)
- **Story 9.2:** Typography and z-index variables

---

**Maintained By:** Development Team
**Review Cycle:** Update when adding/removing variables or changing theme system
