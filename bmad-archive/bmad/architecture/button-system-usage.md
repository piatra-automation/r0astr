# Button System Usage Guide

**Version:** v1
**Last Updated:** 2025-11-30
**Status:** Ready for Implementation

## Overview

The r0astr button system provides a consistent, scalable way to create buttons using the "button-in-hole" pattern with 3D bevel effects. All button styling is now controlled via CSS variables, making it easy to maintain consistency and support theming/skins.

## Button Pattern: Button-in-Hole

All buttons (except top bar buttons) use a nested structure:

```html
<button class="btn-hole btn-square-lg">
  <div class="btn-surface">
    <span class="material-icons">play_arrow</span>
  </div>
</button>
```

**Visual Structure:**
```
┌─────────────────────────┐
│ .btn-hole (dark)        │ ← Outer container (the "hole")
│  ┌───────────────────┐  │   Background: var(--darkness)
│  │ .btn-surface      │  │   Padding: 2px (hole depth)
│  │   (light)         │  │
│  │    [ICON]         │  │ ← Inner button surface
│  │                   │  │   Background: var(--pale-white)
│  └───────────────────┘  │   Bevel borders (3D effect)
└─────────────────────────┘
```

---

## Available Button Sizes

### SQUARE Variants (icon-only)

#### `.btn-square-lg` - Large Square (Hero Buttons)
- **Padding:** 12px
- **Icon Size:** 32px
- **Use Case:** Primary hero bar controls (Play, Stop)

```html
<button class="btn-hole btn-square-lg">
  <div class="btn-surface">
    <span class="material-icons">play_arrow</span>
  </div>
</button>
```

#### `.btn-square-md` - Medium Square (Expanded Panels)
- **Padding:** 10px
- **Icon Size:** 28px
- **Use Case:** Panel controls in expanded state

```html
<button class="btn-hole btn-square-md">
  <div class="btn-surface">
    <span class="material-icons">pause</span>
  </div>
</button>
```

#### `.btn-square-sm` - Small Square (Collapsed Panels)
- **Padding:** 8.5px (71% scale)
- **Icon Size:** 23px
- **Use Case:** Panel controls in collapsed state
- **Note:** Uses `btn-hole-sm` for smaller hole depth (1.5px)

```html
<button class="btn-hole btn-hole-sm btn-square-sm">
  <div class="btn-surface btn-surface-sm">
    <span class="material-icons">stop</span>
  </div>
</button>
```

#### `.btn-square-xs` - Extra-Small Square (Utility)
- **Padding:** 8px
- **Icon Size:** 24px
- **Use Case:** Master mode toggle, compact utility buttons

```html
<button class="btn-hole btn-square-xs">
  <div class="btn-surface">
    <span class="material-icons">expand_more</span>
  </div>
</button>
```

---

### SLIM Variants (rectangular, text + icon)

#### `.btn-slim-lg` - Large Slim (Future)
- **Padding:** 12px 20px (vertical × horizontal)
- **Icon Size:** 28px
- **Use Case:** Buttons with text labels + icons

```html
<button class="btn-hole btn-slim-lg">
  <div class="btn-surface">
    <span class="material-icons">save</span>
    <span>Save</span>
  </div>
</button>
```

#### `.btn-slim-md` - Medium Slim (Future)
- **Padding:** 10px 16px
- **Icon Size:** 24px
- **Use Case:** Compact labeled buttons

```html
<button class="btn-hole btn-slim-md">
  <div class="btn-surface">
    <span class="material-icons">settings</span>
    <span>Config</span>
  </div>
</button>
```

---

### TINY Variant (minimal icon)

#### `.btn-tiny` - Tiny Icon-Only (Future)
- **Padding:** 6px
- **Icon Size:** 18px
- **Use Case:** Inline controls, delete buttons, minimal UI

```html
<button class="btn-hole btn-hole-sm btn-tiny">
  <div class="btn-surface btn-surface-sm">
    <span class="material-icons">close</span>
  </div>
</button>
```

---

## Color Variants (via custom classes)

### Action Colors (Add to button-specific classes)

```css
/* Play button - green icon */
.btn-action-play .material-icons {
  color: var(--dark-green);
}

/* Stop button - red icon */
.btn-action-stop .material-icons {
  color: var(--burnt-red);
}

/* Update button - yellow icon */
.btn-action-update .material-icons {
  color: var(--puke);
}
```

**Usage:**
```html
<button class="btn-hole btn-square-lg btn-action-play">
  <div class="btn-surface">
    <span class="material-icons">play_arrow</span>
  </div>
</button>
```

---

## Special States

### Disabled State

Automatically handled by `.btn-hole:disabled`:

```html
<button class="btn-hole btn-square-lg" disabled>
  <div class="btn-surface">
    <span class="material-icons">play_arrow</span>
  </div>
</button>
```

**Behavior:**
- Cursor changes to `not-allowed`
- Hole background becomes semi-transparent
- Surface opacity reduces to 50%

### Pressing State (Programmatic)

Add `.pressing` class to trigger press animation without actual click:

```html
<button class="btn-hole btn-square-lg pressing">
  <div class="btn-surface">
    <span class="material-icons">play_arrow</span>
  </div>
</button>
```

**Useful for:**
- Keyboard shortcuts (visual feedback)
- Touch gestures
- Remote control indicators

---

## CSS Variables Reference

### Hole (Outer Container)

| Variable | Default | Description |
|----------|---------|-------------|
| `--btn-hole-bg` | `var(--darkness)` | Hole background color |
| `--btn-hole-radius` | `2px` | Hole corner radius |
| `--btn-hole-depth` | `2px` | Standard hole depth (padding) |
| `--btn-hole-depth-sm` | `1.5px` | Small hole depth (collapsed panels) |
| `--btn-hole-hover-bg` | `#4a5a5f` | Hover state background |

### Surface (Inner Button)

| Variable | Default | Description |
|----------|---------|-------------|
| `--btn-surface-bg` | `var(--pale-white)` | Button surface background |
| `--btn-surface-radius` | `4px` | Standard surface corner radius |
| `--btn-surface-radius-sm` | `3px` | Small surface corner radius |

### Padding (Button Size)

| Variable | Default | Use Case |
|----------|---------|----------|
| `--btn-padding-square-lg` | `12px` | Hero buttons |
| `--btn-padding-square-md` | `10px` | Expanded panel buttons |
| `--btn-padding-square-sm` | `8.5px` | Collapsed panel buttons |
| `--btn-padding-square-xs` | `8px` | Master mode button |
| `--btn-padding-slim-lg` | `12px 20px` | Large slim buttons (future) |
| `--btn-padding-slim-md` | `10px 16px` | Medium slim buttons (future) |
| `--btn-padding-tiny` | `6px` | Tiny icon buttons (future) |

### Icon Sizes

| Variable | Default | Use Case |
|----------|---------|----------|
| `--btn-icon-lg` | `32px` | Hero buttons |
| `--btn-icon-md` | `28px` | Expanded panel buttons |
| `--btn-icon-sm` | `24px` | Master mode, small buttons |
| `--btn-icon-xs` | `23px` | Collapsed panel buttons |
| `--btn-icon-tiny` | `18px` | Tiny buttons (future) |

### Shadows

| Variable | Default | Description |
|----------|---------|-------------|
| `--btn-shadow-normal` | `0 2px 4px rgba(0,0,0,0.2)` | Standard button shadow |
| `--btn-shadow-normal-sm` | `0 1px 3px rgba(0,0,0,0.2)` | Small button shadow |
| `--btn-shadow-pressed` | `0 1px 2px rgba(0,0,0,0.1)` | Pressed state (flattened) |
| `--btn-shadow-pressed-sm` | `0 0.5px 1px rgba(0,0,0,0.1)` | Small pressed state |

### Bevel Lighting (3D Effect)

| Variable | Default | Description |
|----------|---------|-------------|
| `--btn-bevel-light` | `rgba(255,255,255,0.2)` | Light edge (top/left) |
| `--btn-bevel-dark` | `rgba(128,128,128,0.5)` | Dark edge (bottom/right) |

### Press Animation

| Variable | Default | Description |
|----------|---------|-------------|
| `--btn-press-move` | `1px` | Standard button press movement |
| `--btn-press-move-sm` | `0.5px` | Small button press movement |

---

## How the System Works

### 1. Bevel Lighting (3D Effect)

**Normal State:**
```css
border-top: 1px solid var(--btn-bevel-light);    /* Light from above */
border-left: 1px solid var(--btn-bevel-light);   /* Light from left */
border-bottom: 1px solid var(--btn-bevel-dark);  /* Shadow below */
border-right: 1px solid var(--btn-bevel-dark);   /* Shadow right */
```

**Pressed State (Inverted):**
```css
border-top: 1px solid var(--btn-bevel-dark);     /* Shadow above */
border-left: 1px solid var(--btn-bevel-dark);    /* Shadow left */
border-bottom: 1px solid var(--btn-bevel-light); /* Light below */
border-right: 1px solid var(--btn-bevel-light);  /* Light right */
```

### 2. Press Animation

When button is pressed (`:active` or `.pressing`):
1. **Bevel lighting inverts** (creates "pushed in" effect)
2. **Shadow flattens** (reduces depth by 50%)
3. **Button moves down** (1px or 0.5px for small buttons)

### 3. Size Scaling

All sizes use consistent ratios:

| Size | Padding | Icon | Hole Depth | Press Move |
|------|---------|------|------------|------------|
| Large | 12px | 32px | 2px | 1px |
| Medium | 10px (83%) | 28px (87.5%) | 2px | 1px |
| Small | 8.5px (71%) | 23px (72%) | 1.5px (75%) | 0.5px (50%) |
| XS | 8px (67%) | 24px (75%) | 2px | 1px |

---

## Migration Guide

### Old Button Code (Hero Button Example)

```html
<button class="hero-btn action-play">
  <div class="hero-btn-inner">
    <span class="material-icons">play_arrow</span>
  </div>
</button>
```

```css
.hero-btn {
  background: var(--darkness);
  border-radius: 2px;
  padding: 2px;
  /* ... 30+ lines of specific styling ... */
}
```

### New Button Code

```html
<button class="btn-hole btn-square-lg btn-action-play">
  <div class="btn-surface">
    <span class="material-icons">play_arrow</span>
  </div>
</button>
```

```css
/* Only need color override */
.btn-action-play .material-icons {
  color: var(--dark-green);
}
```

**Benefits:**
- ✅ 30+ lines → 3 lines of CSS
- ✅ Automatic press animation
- ✅ Automatic hover states
- ✅ Automatic disabled states
- ✅ Skin-friendly (all variables)

---

## Customizing for Skins

### Override Button Colors

```css
/* Custom skin CSS */
:root {
  --btn-hole-bg: #000033;           /* Dark blue hole */
  --btn-surface-bg: #ffcc00;        /* Gold surface */
  --btn-bevel-light: rgba(255, 255, 200, 0.3);
  --btn-bevel-dark: rgba(100, 80, 0, 0.5);
}
```

### Override Button Sizes

```css
/* Make all buttons 20% larger */
:root {
  --btn-padding-square-lg: 14.4px;  /* 12px × 1.2 */
  --btn-padding-square-md: 12px;    /* 10px × 1.2 */
  --btn-icon-lg: 38px;              /* 32px × 1.2 */
  --btn-icon-md: 33px;              /* 28px × 1.2 */
}
```

### Custom Button Shadow Effects

```css
/* Neon glow effect */
:root {
  --btn-shadow-normal: 0 0 10px rgba(0, 255, 0, 0.6),
                       0 0 20px rgba(0, 255, 0, 0.3);
  --btn-shadow-pressed: 0 0 5px rgba(0, 255, 0, 0.4);
}
```

---

## Best Practices

### DO ✅

- Use `.btn-square-*` for icon-only buttons
- Use `.btn-slim-*` for text + icon buttons
- Add action classes (`.btn-action-play`) for color variants
- Use `btn-hole-sm` + `btn-surface-sm` together for small buttons
- Override variables in skin CSS files

### DON'T ❌

- Don't create custom button padding inline
- Don't bypass the nested structure
- Don't mix size variants (e.g., `.btn-square-lg` + `.btn-square-md`)
- Don't hardcode colors - use variables
- Don't apply styles directly to `.btn-hole` or `.btn-surface` (use variants)

---

## Future Enhancements

### Planned Features

1. **Text Labels**
   - `.btn-slim-*` variants with spacing for text
   - Icon + text layout utilities

2. **Loading State**
   - Spinning icon animation
   - `.btn-loading` class

3. **Badge Support**
   - Count badges on buttons (e.g., "3 pending")
   - `.btn-badge` wrapper

4. **Icon-Text Gap Control**
   - Variable for spacing between icon and text
   - `--btn-icon-text-gap: 8px;`

---

## Examples

### Hero Bar Play Button

```html
<button class="btn-hole btn-square-lg btn-action-play" id="play-all-btn">
  <div class="btn-surface">
    <span class="material-icons">play_arrow</span>
  </div>
</button>
```

### Panel Control Button (Collapsed)

```html
<button class="btn-hole btn-hole-sm btn-square-sm btn-action-stop">
  <div class="btn-surface btn-surface-sm">
    <span class="material-icons">stop</span>
  </div>
</button>
```

### Master Panel Toggle

```html
<button class="btn-hole btn-square-xs" id="master-mode-toggle">
  <div class="btn-surface">
    <span class="material-icons">expand_more</span>
  </div>
</button>
```

### Future: Slim Button with Text

```html
<button class="btn-hole btn-slim-lg">
  <div class="btn-surface">
    <span class="material-icons">save</span>
    <span>Save All</span>
  </div>
</button>
```

---

**Maintained By:** Development Team
**Review Cycle:** Update when new button variants are added
