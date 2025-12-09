# Color System Architecture

**Version:** v1
**Last Updated:** 2025-11-30
**Status:** Active

## Overview

The r0astr color system uses CSS `color-mix()` to automatically compute lighter and darker color variants from base colors. This allows changing a single base color and having all gradients, highlights, and shadows automatically recompute.

## Philosophy

**Single Source of Truth**: Define base colors once, compute all variants automatically.

**Example:**
```css
/* Change this one value */
--panel-base-warm: #dad0bc;

/* These automatically update */
--panel-warm-light: color-mix(in srgb, var(--panel-base-warm) 85%, white 15%);
--panel-warm-dark: color-mix(in srgb, var(--panel-base-warm) 80%, black 20%);

/* Gradient uses computed values */
background: linear-gradient(to bottom right, var(--panel-warm-light), var(--panel-warm-dark));
```

---

## Base Color Definitions

All base colors are defined in `:root` in `/static/css/style.css`:

```css
/* Panel Base Colors (single source of truth) */
--panel-base-warm: #dad0bc;        /* Warm beige for background */
--panel-base-cool: #d9d8d4;        /* Cool gray for hero/controls */
--panel-base-light: #d1d8e0;       /* Light panels (collapsed, master) */
--panel-base-dark: #1a1a1a;        /* Dark panels (expanded) */

/* Screen Base Color */
--screen-base: #076443;            /* Green screen background */
```

---

## Computed Color Variants

### Warm Panel Gradients

Used for main background (body::before).

```css
--panel-warm-light: color-mix(in srgb, var(--panel-base-warm) 85%, white 15%);
--panel-warm-dark: color-mix(in srgb, var(--panel-base-warm) 80%, black 20%);
```

**Formula:**
- **Light variant**: Mix 85% base + 15% white
- **Dark variant**: Mix 80% base + 20% black

**Usage:**
```css
background: linear-gradient(to bottom right, var(--panel-warm-light), var(--panel-warm-dark));
```

### Cool Panel Gradients

Used for hero section and control areas.

```css
--panel-cool-light: color-mix(in srgb, var(--panel-base-cool) 90%, white 10%);
--panel-cool-dark: var(--panel-base-cool);
```

**Formula:**
- **Light variant**: Mix 90% base + 10% white (subtle lightening)
- **Dark variant**: Use base color as-is

**Usage:**
```css
background: linear-gradient(to bottom right, var(--panel-cool-light), var(--panel-cool-dark));
```

### Light Panel Highlights

Used for bevel borders on light panels (collapsed panels, master panel).

```css
--panel-light-highlight: color-mix(in srgb, var(--panel-base-light) 95%, white 5%);
--panel-light-shadow: color-mix(in srgb, var(--panel-base-light) 85%, black 15%);
```

**Formula:**
- **Highlight**: Mix 95% base + 5% white (very subtle)
- **Shadow**: Mix 85% base + 15% black

**Usage:**
```css
border-top: 1px solid var(--panel-light-highlight);
border-bottom: 1px solid var(--panel-light-shadow);
```

### Screen Color Variants

Used for screen borders (top/bottom edges lighter/darker than base).

```css
--screen-base: #076443;
--screen-bkg: var(--screen-base);
--screen-top: color-mix(in srgb, var(--screen-base) 50%, black 50%);      /* Darker */
--screen-bottom: color-mix(in srgb, var(--screen-base) 70%, white 30%);   /* Lighter */
--screen-edge: #514041;  /* Brown edge (static, not computed) */
```

**Formula:**
- **Top edge**: Mix 50% base + 50% black (dark shadow)
- **Bottom edge**: Mix 70% base + 30% white (highlight)

---

## Panel Design Classes

Reusable classes for different panel visual styles.

### `.base-panel`

Warm gradient background (main app background).

```css
.base-panel {
  background: linear-gradient(to bottom right, var(--panel-warm-light), var(--panel-warm-dark));
}
```

**Use case:** Body background, warm-toned containers

### `.control-panel`

Cool gradient background (hero section, control areas).

```css
.control-panel {
  background: linear-gradient(to bottom right, var(--panel-cool-light), var(--panel-cool-dark));
}
```

**Use case:** Hero bar, master control panels

### `.highlight-panel`

Light solid background with 3D bevel borders.

```css
.highlight-panel {
  background: var(--panel-base-light);
  border-top: 1px solid color-mix(in srgb, var(--panel-base-light) 80%, white 20%);
  border-left: 1px solid color-mix(in srgb, var(--panel-base-light) 80%, white 20%);
  border-bottom: 1px solid color-mix(in srgb, var(--panel-base-light) 70%, black 30%);
  border-right: 1px solid color-mix(in srgb, var(--panel-base-light) 70%, black 30%);
}
```

**Use case:** Collapsed panels, master panel, raised surfaces

**Bevel effect:**
- Top/left borders: 80% base + 20% white (light edge)
- Bottom/right borders: 70% base + 30% black (shadow edge)

### `.screen-panel`

Dark background with subtle transparency.

```css
.screen-panel {
  background: color-mix(in srgb, var(--panel-base-dark) 95%, transparent 5%);
}
```

**Use case:** Expanded code editor panels, dark content areas

---

## How color-mix() Works

**Syntax:**
```css
color-mix(in <colorspace>, <color1> <percentage>, <color2> <percentage>)
```

**Parameters:**
- `in srgb`: Use sRGB color space (standard for web)
- `<color1> <percentage>`: First color and its weight
- `<color2> <percentage>`: Second color and its weight

**Examples:**

```css
/* 70% blue + 30% white = light blue */
color-mix(in srgb, blue 70%, white 30%)

/* 50% red + 50% black = dark red */
color-mix(in srgb, red 50%, black 50%)

/* Using CSS variables */
color-mix(in srgb, var(--my-color) 80%, white 20%)
```

**Percentages must add up to 100%** (or can be omitted for 50/50 mix).

---

## Changing Colors Globally

### Change Background Warmth

Update the warm panel base color:

```css
:root {
  --panel-base-warm: #e8dcc4;  /* Warmer beige */
}
```

**Result:**
- Body background gradient automatically updates
- All `.base-panel` elements update

### Change Hero Section Coolness

Update the cool panel base color:

```css
:root {
  --panel-base-cool: #e0e4e8;  /* Cooler, bluer gray */
}
```

**Result:**
- Hero section gradient automatically updates
- All `.control-panel` elements update

### Change Screen Color

Update the screen base color:

```css
:root {
  --screen-base: #0a7a53;  /* Brighter green */
}
```

**Result:**
- Screen background updates
- Top border (darker variant) automatically updates
- Bottom border (lighter variant) automatically updates

### Change All Light Panels

Update the light panel base color:

```css
:root {
  --panel-base-light: #c5d0da;  /* Bluer light panels */
}
```

**Result:**
- Collapsed panels update
- Master panel updates
- Bevel borders automatically recompute

---

## Gradient Direction Standard

**All gradients flow from top-left to bottom-right:**

```css
background: linear-gradient(to bottom right, <light-color>, <dark-color>);
```

This creates consistent lighting from top-left corner (as if lit from above-left).

---

## Browser Compatibility

CSS `color-mix()` is supported in:
- ✅ Chrome 111+ (March 2023)
- ✅ Firefox 113+ (May 2023)
- ✅ Safari 16.2+ (December 2022)
- ✅ Edge 111+ (March 2023)

**Fallback:** For older browsers, the computed value will fail silently. Consider adding explicit fallback colors:

```css
/* Fallback for older browsers */
background: #dad0bc;

/* Modern browsers use computed gradient */
background: linear-gradient(to bottom right, var(--panel-warm-light), var(--panel-warm-dark));
```

---

## Best Practices

### DO ✅

- Use base colors (`--panel-base-*`, `--screen-base`) for single source of truth
- Use computed variants (`--panel-warm-light`, `--panel-cool-dark`) in styles
- Apply panel design classes (`.base-panel`, `.control-panel`) for consistent theming
- Adjust mix percentages to control contrast (more white = lighter, more black = darker)

### DON'T ❌

- Don't hardcode gradient colors (use computed variants instead)
- Don't create multiple base colors for the same semantic meaning
- Don't use `color-mix()` inline everywhere (define variants in :root)
- Don't mix color spaces (stick to `in srgb` for consistency)

---

## Future Enhancements

### Planned Features

1. **Dynamic Color Theming**
   - Allow users to override base colors via settings
   - Real-time preview of color changes

2. **Additional Color Spaces**
   - `in oklch` for perceptually uniform lightness
   - Better handling of vibrant colors

3. **Semantic Color Naming**
   - `--color-primary`, `--color-secondary`
   - Map to current base colors for easier customization

4. **Skin Integration**
   - Skins can override only base colors
   - All computed variants update automatically

---

**Maintained By:** Development Team
**Review Cycle:** Update when color system expands
