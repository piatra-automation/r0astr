# Button System Analysis

**Version:** v1 (Draft)
**Last Updated:** 2025-11-30
**Purpose:** Map out button styles for homogenization

## Button Types Overview

### 1. Hero Buttons (Square, Nested)
**Location:** Hero bar controls (Play/Stop/Record/Add/Update)
**Pattern:** Button-in-hole (nested structure)

```css
.hero-btn {
  background: var(--darkness);      /* Hole background */
  border-radius: 2px;
  padding: 2px;                      /* Hole depth */
  border: none;
}

.hero-btn-inner {
  background: var(--pale-white);    /* Button surface */
  border-radius: 4px;
  padding: 12px;                     /* Button size */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  /* Bevel borders */
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom: 1px solid rgba(128, 128, 128, 0.5);
  border-right: 1px solid rgba(128, 128, 128, 0.5);
}

.hero-btn:active .hero-btn-inner {
  /* Press animation */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transform: translateY(1px);

  /* Invert bevel */
  border-top: 1px solid rgba(128, 128, 128, 0.5);
  border-left: 1px solid rgba(128, 128, 128, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.hero-btn .material-icons {
  font-size: 32px;
}
```

**Dimensions:**
- Hole depth (outer padding): `2px`
- Hole radius: `2px`
- Button radius: `4px`
- Button padding: `12px`
- Icon size: `32px`
- Shadow (normal): `0 2px 4px rgba(0, 0, 0, 0.2)`
- Shadow (pressed): `0 1px 2px rgba(0, 0, 0, 0.1)`
- Press movement: `1px`

---

### 2. Top Bar Buttons (Short/Wide, Direct)
**Location:** Top bar (SAVE, LOAD, OSC, MIDI, CONFIG)
**Pattern:** Direct button (NO nested structure)

```css
.top-bar-btn {
  position: fixed;
  width: 87px;
  height: 42px;
  border-radius: 1px;
  border: 2px solid;
  border-color: rgba(255, 255, 255, 0.2)
                rgba(128, 128, 128, 0.5)
                rgba(128, 128, 128, 0.5)
                rgba(255, 255, 255, 0.2);

  /* Multi-layered shadow */
  box-shadow:
    2px 2px 3px rgba(99, 99, 99, 0.5),
    4px 4px 6px rgba(99, 99, 99, 0.5),
    6px 6px 8px rgba(99, 99, 99, 0.5);
}

.top-bar-btn:hover {
  /* Reduce shadow by 25% */
  box-shadow:
    1.5px 1.5px 3px rgba(99, 99, 99, 0.5),
    3px 3px 6px rgba(99, 99, 99, 0.5),
    4.5px 4.5px 8px rgba(99, 99, 99, 0.5);
}

.top-bar-btn:active {
  /* Invert bevel, remove shadow */
  border-color: rgba(128, 128, 128, 0.5)
                rgba(255, 255, 255, 0.2)
                rgba(255, 255, 255, 0.2)
                rgba(128, 128, 128, 0.5);
  box-shadow: none !important;
  transform: translateY(1px);
}
```

**Dimensions:**
- Width: `87px` (var(--button-width))
- Height: `42px` (var(--button-height))
- Border radius: `1px`
- Border width: `2px`
- Shadow layers: 3 (progressive depth)
- Press movement: `1px`

---

### 3. Panel Control Buttons - Expanded (Square, Nested)
**Location:** Expanded panel header
**Pattern:** Button-in-hole (similar to hero, smaller)

```css
.card:not(.panel-collapsed) .control-btn {
  background: var(--darkness);
  border-radius: 2px;
  padding: 2px;
}

.card:not(.panel-collapsed) .control-btn-inner {
  background: var(--pale-white);
  border-radius: 4px;
  padding: 10px;                     /* Slightly smaller than hero */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.card:not(.panel-collapsed) .control-btn .material-icons {
  font-size: 28px;                   /* Slightly smaller than hero */
}
```

**Dimensions:**
- Hole depth: `2px`
- Hole radius: `2px`
- Button radius: `4px`
- Button padding: `10px` (vs hero: 12px)
- Icon size: `28px` (vs hero: 32px)
- Shadow (normal): `0 2px 4px rgba(0, 0, 0, 0.2)`
- Shadow (pressed): `0 1px 2px rgba(0, 0, 0, 0.1)`
- Press movement: `1px`

---

### 4. Panel Control Buttons - Collapsed (Square, Nested, 71% Scale)
**Location:** Collapsed panel header
**Pattern:** Button-in-hole (71% of hero button size)

```css
.card.panel-collapsed .control-btn {
  background: var(--darkness);
  border-radius: 2px;
  padding: 1.5px;                    /* 71% of 2px */
}

.card.panel-collapsed .control-btn-inner {
  background: var(--pale-white);
  border-radius: 3px;                /* 71% of 4px */
  padding: 8.5px;                    /* 71% of 12px */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.card.panel-collapsed .control-btn .material-icons {
  font-size: 23px;                   /* 71% of 32px */
}
```

**Dimensions:**
- Hole depth: `1.5px` (71% of 2px)
- Hole radius: `2px`
- Button radius: `3px` (71% of 4px)
- Button padding: `8.5px` (71% of 12px)
- Icon size: `23px` (71% of 32px)
- Shadow (normal): `0 1px 3px rgba(0, 0, 0, 0.2)`
- Shadow (pressed): `0 0.5px 1px rgba(0, 0, 0, 0.1)`
- Press movement: `0.5px` (71% of 1px)

---

### 5. Master Mode Button (Square, Nested)
**Location:** Master panel toggle button
**Pattern:** Button-in-hole

```css
.master-mode-btn {
  background: var(--darkness);
  border-radius: 2px;
  padding: 2px;
}

.master-mode-btn-inner {
  background: var(--pale-white);
  border-radius: 4px;
  padding: 8px;                      /* Smaller than hero */
}

.master-mode-btn .material-icons {
  font-size: 24px;
}
```

**Dimensions:**
- Hole depth: `2px`
- Hole radius: `2px`
- Button radius: `4px`
- Button padding: `8px`
- Icon size: `24px`

---

## Pattern Analysis

### Common Patterns

#### 1. Button-in-Hole Structure (Nested)
Used by: Hero buttons, Panel control buttons, Master mode button

**Outer container (the "hole"):**
- Background: `var(--darkness)` (black)
- Border radius: `2px` (consistent)
- Padding: `2px` (standard) or `1.5px` (collapsed panel scale)
- Border: `none`

**Inner button (the "button surface"):**
- Background: `var(--pale-white)` (light)
- Border radius: `4px` (standard) or `3px` (collapsed scale)
- Padding: varies (12px, 10px, 8.5px, 8px)
- Bevel borders: white+20% top/left, gray+50% bottom/right
- Shadow: `0 [depth]px [depth*2]px rgba(0, 0, 0, 0.2)`

#### 2. Bevel Lighting (3D effect)
**Normal state:**
```css
border-top: 1px solid rgba(255, 255, 255, 0.2);    /* Light top */
border-left: 1px solid rgba(255, 255, 255, 0.2);   /* Light left */
border-bottom: 1px solid rgba(128, 128, 128, 0.5); /* Dark bottom */
border-right: 1px solid rgba(128, 128, 128, 0.5);  /* Dark right */
```

**Pressed state (inverted):**
```css
border-top: 1px solid rgba(128, 128, 128, 0.5);    /* Dark top */
border-left: 1px solid rgba(128, 128, 128, 0.5);   /* Dark left */
border-bottom: 1px solid rgba(255, 255, 255, 0.2); /* Light bottom */
border-right: 1px solid rgba(255, 255, 255, 0.2);  /* Light right */
```

#### 3. Press Animation
All buttons share this pattern:
```css
.button:active .button-inner {
  /* Invert bevel lighting */
  /* Reduce shadow (flatten) */
  /* Move down */
  box-shadow: 0 [depth/2]px [depth]px rgba(0, 0, 0, 0.1);
  transform: translateY([depth]px);
}
```

**Shadow reduction formula:**
- Normal: `0 [depth]px [depth*2]px rgba(0, 0, 0, 0.2)`
- Pressed: `0 [depth/2]px [depth]px rgba(0, 0, 0, 0.1)`

**Movement formula:**
- Hero/Expanded: `1px`
- Collapsed (71% scale): `0.5px`

---

## Size Relationships

### Hero Button (Base Size: 100%)
- Hole depth: `2px`
- Button radius: `4px`
- Button padding: `12px`
- Icon size: `32px`
- Shadow depth: `2px`
- Press movement: `1px`

### Expanded Panel Button (87.5% of Hero)
- Hole depth: `2px`
- Button radius: `4px`
- Button padding: `10px` (83% of 12px)
- Icon size: `28px` (87.5% of 32px)
- Shadow depth: `2px`
- Press movement: `1px`

### Collapsed Panel Button (71% of Hero)
- Hole depth: `1.5px` (75% of 2px)
- Button radius: `3px` (75% of 4px)
- Button padding: `8.5px` (71% of 12px)
- Icon size: `23px` (72% of 32px)
- Shadow depth: `1px` (50% of 2px)
- Press movement: `0.5px` (50% of 1px)

### Master Mode Button (Custom)
- Hole depth: `2px`
- Button radius: `4px`
- Button padding: `8px` (67% of 12px)
- Icon size: `24px` (75% of 32px)

---

## Opportunities for Homogenization

### 1. Create Standardized Button Sizes
Define button variants as CSS variables:

```css
:root {
  /* Button-in-hole outer (the "hole") */
  --btn-hole-bg: var(--darkness);
  --btn-hole-radius: 2px;
  --btn-hole-depth-lg: 2px;
  --btn-hole-depth-sm: 1.5px;

  /* Button-in-hole inner (the "button") */
  --btn-surface-bg: var(--pale-white);
  --btn-surface-radius-lg: 4px;
  --btn-surface-radius-sm: 3px;

  /* Button sizes (padding) */
  --btn-padding-hero: 12px;        /* Hero buttons */
  --btn-padding-lg: 10px;          /* Expanded panel buttons */
  --btn-padding-md: 8px;           /* Master mode button */
  --btn-padding-sm: 8.5px;         /* Collapsed panel buttons */

  /* Icon sizes */
  --btn-icon-hero: 32px;
  --btn-icon-lg: 28px;
  --btn-icon-md: 24px;
  --btn-icon-sm: 23px;

  /* Shadows */
  --btn-shadow-depth-lg: 2px;
  --btn-shadow-depth-sm: 1px;

  /* Press animation */
  --btn-press-move-lg: 1px;
  --btn-press-move-sm: 0.5px;

  /* Bevel colors (3D lighting) */
  --btn-bevel-light: rgba(255, 255, 255, 0.2);
  --btn-bevel-dark: rgba(128, 128, 128, 0.5);
}
```

### 2. Create Reusable Shadow Mixins (via CSS Custom Properties)
```css
:root {
  /* Normal shadows */
  --btn-shadow-lg: 0 2px 4px rgba(0, 0, 0, 0.2);
  --btn-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);

  /* Pressed shadows (flattened) */
  --btn-shadow-lg-pressed: 0 1px 2px rgba(0, 0, 0, 0.1);
  --btn-shadow-sm-pressed: 0 0.5px 1px rgba(0, 0, 0, 0.1);

  /* Top bar multi-layer shadows */
  --btn-shadow-topbar:
    2px 2px 3px rgba(99, 99, 99, 0.5),
    4px 4px 6px rgba(99, 99, 99, 0.5),
    6px 6px 8px rgba(99, 99, 99, 0.5);

  --btn-shadow-topbar-hover:
    1.5px 1.5px 3px rgba(99, 99, 99, 0.5),
    3px 3px 6px rgba(99, 99, 99, 0.5),
    4.5px 4.5px 8px rgba(99, 99, 99, 0.5);
}
```

### 3. Create Shared Button Classes

#### Base button-in-hole structure:
```css
.btn-hole {
  background: var(--btn-hole-bg);
  border-radius: var(--btn-hole-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-surface {
  background: var(--btn-surface-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  /* Bevel lighting */
  border-top: 1px solid var(--btn-bevel-light);
  border-left: 1px solid var(--btn-bevel-light);
  border-bottom: 1px solid var(--btn-bevel-dark);
  border-right: 1px solid var(--btn-bevel-dark);

  transform: translateY(0);
  transition: all 0.1s ease;
}

/* Press animation */
.btn-hole:active .btn-surface,
.btn-hole.pressing .btn-surface {
  /* Invert bevel */
  border-top: 1px solid var(--btn-bevel-dark);
  border-left: 1px solid var(--btn-bevel-dark);
  border-bottom: 1px solid var(--btn-bevel-light);
  border-right: 1px solid var(--btn-bevel-light);
}
```

#### Size variants:
```css
/* Hero size */
.btn-hole-hero {
  padding: var(--btn-hole-depth-lg);
}
.btn-surface-hero {
  padding: var(--btn-padding-hero);
  border-radius: var(--btn-surface-radius-lg);
  box-shadow: var(--btn-shadow-lg);
}
.btn-hole-hero:active .btn-surface-hero {
  box-shadow: var(--btn-shadow-lg-pressed);
  transform: translateY(var(--btn-press-move-lg));
}

/* Large (expanded panel) */
.btn-hole-lg {
  padding: var(--btn-hole-depth-lg);
}
.btn-surface-lg {
  padding: var(--btn-padding-lg);
  border-radius: var(--btn-surface-radius-lg);
  box-shadow: var(--btn-shadow-lg);
}
.btn-hole-lg:active .btn-surface-lg {
  box-shadow: var(--btn-shadow-lg-pressed);
  transform: translateY(var(--btn-press-move-lg));
}

/* Small (collapsed panel) */
.btn-hole-sm {
  padding: var(--btn-hole-depth-sm);
}
.btn-surface-sm {
  padding: var(--btn-padding-sm);
  border-radius: var(--btn-surface-radius-sm);
  box-shadow: var(--btn-shadow-sm);
}
.btn-hole-sm:active .btn-surface-sm {
  box-shadow: var(--btn-shadow-sm-pressed);
  transform: translateY(var(--btn-press-move-sm));
}
```

### 4. Standardize Top Bar Buttons
Top bar buttons are outliers (no nested structure). Consider:

**Option A:** Keep as-is (different pattern for different context)
**Option B:** Convert to button-in-hole pattern for consistency

If choosing Option B:
```css
.top-bar-btn {
  /* Outer hole */
  background: var(--darkness);
  padding: 2px;
  border-radius: var(--btn-hole-radius);
}

.top-bar-btn-inner {
  /* Inner button */
  width: 83px; /* 87px - (2px padding × 2) */
  height: 38px; /* 42px - (2px padding × 2) */
  background: var(--pale-white);
  border-radius: var(--btn-surface-radius-lg);
  /* ... rest of styling */
}
```

---

## Recommended Refactoring Strategy

### Phase 1: Define Variables
1. Add all button-related CSS variables to `:root`
2. Add shadow variables
3. Add bevel color variables

### Phase 2: Create Utility Classes
1. Create base `.btn-hole` and `.btn-surface` classes
2. Create size variant classes (`.btn-hole-hero`, `.btn-surface-lg`, etc.)
3. Test with one button type first

### Phase 3: Migrate Existing Buttons
1. Migrate hero buttons
2. Migrate panel control buttons (expanded)
3. Migrate panel control buttons (collapsed)
4. Migrate master mode button
5. Decide on top bar button approach

### Phase 4: Document Button System
1. Create button component guide
2. Document usage patterns
3. Add examples for each size variant

---

## Benefits of Homogenization

1. **Consistency** - All buttons behave the same way
2. **Maintainability** - Change one variable, update all buttons
3. **Scalability** - Easy to add new button sizes
4. **Skin Support** - Skins can override button variables globally
5. **Code Reduction** - Remove ~200 lines of duplicate CSS
6. **Predictability** - Developers know how buttons work

---

**Next Steps:**
- Review this analysis
- Decide on refactoring approach
- Implement Phase 1 (variables)
- Test with single button type
- Gradually migrate all buttons
