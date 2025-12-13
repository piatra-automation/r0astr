# Skins Overview

Customize r0astr's visual appearance with themes.

!!! warning "In Development"
    The skins system is partially implemented. Full theming support coming in v1.0.

---

## What Are Skins?

Skins allow you to customize r0astr's visual appearance without modifying core code. Change colors, borders, and styling to match your preferences or performance setup.

### Use Cases

- **Dark mode enthusiasts** - Pure black OLED themes
- **Accessibility** - High contrast themes
- **Branding** - Match your performance aesthetic
- **Creativity** - Express your style

---

## What Can Be Customized

### Currently Supported

| Element | Customizable |
|---------|-------------|
| Background colors | Yes |
| Text colors | Yes |
| Accent colors | Yes |
| Panel styling | Yes |
| Borders | Yes |
| Button colors | Yes |

### Coming in v1.0

- Custom fonts and typography
- Layout variations
- Custom icons
- Animation preferences
- Component-level theming

---

## CSS Variables

r0astr uses CSS custom properties for theming. Override these in your skin:

### Color Palette

```css
:root {
  /* Background colors */
  --r0astr-bg-primary: #1a1a2e;      /* Main background */
  --r0astr-bg-secondary: #16213e;    /* Secondary background */
  --r0astr-bg-tertiary: #0f0f23;     /* Tertiary background */

  /* Text colors */
  --r0astr-text-primary: #eee;       /* Main text */
  --r0astr-text-secondary: #aaa;     /* Secondary text */
  --r0astr-text-muted: #666;         /* Muted text */

  /* Accent colors */
  --r0astr-accent: #6366f1;          /* Primary accent */
  --r0astr-accent-hover: #818cf8;    /* Accent hover state */
  --r0astr-accent-active: #4f46e5;   /* Accent active state */

  /* Status colors */
  --r0astr-success: #22c55e;         /* Success/playing */
  --r0astr-warning: #f59e0b;         /* Warning states */
  --r0astr-error: #ef4444;           /* Error states */
}
```

### Panel Styling

```css
:root {
  /* Panel container */
  --r0astr-panel-bg: #0f0f23;
  --r0astr-panel-border: #333;
  --r0astr-panel-radius: 8px;
  --r0astr-panel-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);

  /* Panel header */
  --r0astr-header-bg: #16213e;
  --r0astr-header-border: #333;
}
```

### Buttons and Controls

```css
:root {
  /* Buttons */
  --r0astr-button-bg: #333;
  --r0astr-button-hover: #444;
  --r0astr-button-active: #555;
  --r0astr-button-text: #eee;
  --r0astr-button-radius: 4px;

  /* Sliders */
  --r0astr-slider-track: #333;
  --r0astr-slider-thumb: #6366f1;
  --r0astr-slider-fill: #4f46e5;
}
```

### Code Editor

```css
:root {
  /* Editor area */
  --r0astr-editor-bg: #0d0d1a;
  --r0astr-editor-text: #d4d4d4;
  --r0astr-editor-selection: rgba(99, 102, 241, 0.3);
  --r0astr-editor-line-numbers: #666;
}
```

---

## Applying a Skin

### Method 1: Browser Dev Tools (Testing)

1. Open r0astr in your browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to Elements/Inspector
4. Find the `:root` element
5. Add or modify CSS variables
6. Changes are temporary (refresh to reset)

### Method 2: Custom CSS File

1. Create a `skin.css` file with your overrides
2. Add to r0astr's HTML:
   ```html
   <link rel="stylesheet" href="skin.css">
   ```
3. Reload the page

### Method 3: Local Development

1. Clone the r0astr repository
2. Modify `src/styles.css`
3. Run `npm run dev` to preview

---

## Quick Theme Examples

### Pure Black (OLED)

```css
:root {
  --r0astr-bg-primary: #000000;
  --r0astr-bg-secondary: #0a0a0a;
  --r0astr-panel-bg: #000000;
  --r0astr-border: #222;
}
```

### High Contrast

```css
:root {
  --r0astr-bg-primary: #000000;
  --r0astr-text-primary: #ffffff;
  --r0astr-accent: #00ff00;
  --r0astr-border: #ffffff;
}
```

### Warm Tones

```css
:root {
  --r0astr-bg-primary: #1a1612;
  --r0astr-bg-secondary: #2d2520;
  --r0astr-accent: #f59e0b;
  --r0astr-accent-hover: #fbbf24;
}
```

---

## Testing Your Skin

### Checklist

- [ ] Text is readable on all backgrounds
- [ ] Buttons are visible and distinct
- [ ] Playing/stopped states are clear
- [ ] Code syntax highlighting is visible
- [ ] Slider controls are usable
- [ ] Works in both fullscreen and windowed modes

### Accessibility

Consider contrast ratios:

- Text: Minimum 4.5:1 contrast ratio (WCAG AA)
- Large text: Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio

Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify.

---

## Next Steps

<div class="grid cards" markdown>

-   :material-palette:{ .lg .middle } **Create Your Own**

    ---

    Step-by-step guide to creating a custom skin.

    [:octicons-arrow-right-24: Creating Skins](creating-skins.md)

-   :material-view-gallery:{ .lg .middle } **Browse Gallery**

    ---

    See community-created themes.

    [:octicons-arrow-right-24: Skin Gallery](skin-gallery.md)

</div>

---

*Full theming API documentation coming with v1.0.*
