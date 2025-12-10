# UI Redesign Strategy

**Version:** v1 (Draft)
**Created:** 2025-12-10
**Status:** Planning

---

## Executive Summary

This document outlines the strategy for redesigning the r0astr interface from a workspace-with-draggable-panels model to an **expanding tree/folder structure** layout, while maintaining skinnable components and supporting both desktop (Electron) and touch (remote UI) platforms.

---

## Design Goals

### Primary Goals

1. **Tree/Folder Layout** - Replace draggable workspace with expanding accordion structure
2. **Unified Panel Treatment** - Master panel becomes `panel0`, shares behavior with other panels
3. **CSS Skinning** - All visual components (buttons, panels, colors) controllable via CSS variables
4. **Touch-Friendly** - Support touch interactions for remote UI on mobile/tablet devices
5. **Desktop-First** - Optimized for Electron desktop application

### Non-Goals (This Phase)

- Panel drag-and-drop (preserved for OTHER skins, not default layout)
- Panel resize (preserved for OTHER skins)
- Animated backgrounds (future skin feature)
- Sound packs (future enhancement)

---

## Current vs. Target Architecture

### Current Architecture

```
┌─────────────────────────────────────────────────────┐
│ [Logo] [Banner Subtitle] [Settings] [Load] [BPM]   │  ← Hero Section
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌────────────────┐  ┌────────────────┐           │
│   │ Panel 1        │  │ Panel 2        │           │  ← Draggable
│   │ (floating)     │  │ (floating)     │           │     Panels
│   └────────────────┘  └────────────────┘           │
│                                                     │
│        ┌──────────────────────────────────┐        │
│        │ Master Panel (special treatment) │        │
│        └──────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

### Target Architecture (Tree Pattern)

Uses native HTML `<details>/<summary>` for collapse/expand.

```
┌─────────────────────────────────────────────────────┐
│ [Logo] [Subtitle] [+Add] [Settings] [BPM]           │  ← Header Bar
├─────────────────────────────────────────────────────┤
│                                                     │
│ ○─ Project (root) ──────────────────────────────── │  ← Single root node
│ │                                                   │
│ ├─○ [+] Panel 0: Master  [▶][⬛][🗑]              │  ← Collapsed branch
│ │                                                   │
│ ├─○ [−] Panel 1: Bass    [▶][⬛][🗑]              │  ← Expanded branch
│ │ │                                                 │
│ │ ├─┌────────────────────────────────────────┐     │     ↳ Code leaf
│ │ │ │ note("c2 e2 g2").gain(slider(0.8))     │     │
│ │ │ │                                        │     │
│ │ │ └────────────────────────────────────────┘     │
│ │ │                                                 │
│ │ ├─○ [Gain ═══○════]                              │     ↳ Slider leaf
│ │ │                                                 │
│ │ └─○ [Cutoff ══○═══]                              │     ↳ Slider leaf
│ │                                                   │
│ ├─○ [+] Panel 2: Drums   [▶][⬛][🗑]              │  ← Collapsed branch
│ │                                                   │
│ └─○ [+] Panel 3: Melody  [▶][⬛][🗑]              │  ← Collapsed branch
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key Principles:**
- **Flat hierarchy**: Project → Panels (one level of branches)
- **Panel row (summary)**: Badge + Title + Control buttons ONLY
- **Expanded children (details content)**:
  - CodeMirror editor (leaf)
  - Visualization panels (leaves, if any)
  - Sliders/controls (leaves, moved OUT of header)
- **Native `<details>/<summary>`**: Browser handles toggle, no JS needed
- **CSS tree lines**: Borders + pseudo-elements for visual hierarchy

---

## Component Breakdown

### 1. Header Bar (replaces Hero Section)

**Purpose:** Global controls and branding

**Elements:**
- Logo (fixed position)
- Application subtitle
- Add Panel button (`+`)
- Settings button
- Global controls (BPM display, metronome, Update All, Stop All)

**CSS Variables:**
```css
--header-height: 56px;
--header-bg: var(--panel-base-cool);
--header-padding: 0 16px;
```

### 2. Panel Tree Structure

**HTML Structure using native `<details>/<summary>`:**

```html
<ul class="panel-tree">
  <!-- Panel branch (expandable) -->
  <li class="level-panel" data-panel-id="panel-0" data-panel-number="0">
    <details>
      <summary>
        <span class="panel-number-badge">0</span>
        <span class="panel-title" contenteditable="true">Master</span>
        <div class="panel-actions">
          <button class="btn-hole btn-play" title="Play">▶</button>
          <button class="btn-hole btn-stop" title="Stop">⬛</button>
          <button class="btn-hole btn-delete" title="Delete">🗑</button>
        </div>
      </summary>

      <!-- Children: code editor, sliders, visualizations -->
      <ul class="panel-children">
        <!-- Code editor leaf -->
        <li class="leaf-node leaf-editor">
          <div class="code-editor-wrapper">
            <div class="code-editor" id="editor-panel-0"></div>
          </div>
        </li>

        <!-- Slider leaves (dynamically added) -->
        <li class="leaf-node leaf-slider">
          <label>Gain</label>
          <input type="range" min="0" max="1" step="0.01" value="0.8">
          <span class="slider-value">0.80</span>
        </li>

        <!-- Visualization leaf (optional) -->
        <li class="leaf-node leaf-viz">
          <canvas class="waveform-canvas"></canvas>
        </li>
      </ul>
    </details>
  </li>

  <!-- More panels... -->
  <li class="level-panel" data-panel-id="panel-1" data-panel-number="1">
    <details>
      <summary>...</summary>
      <ul class="panel-children">...</ul>
    </details>
  </li>
</ul>
```

### 3. Panel Summary Row (collapsed state)

**Purpose:** Branch header with controls only (NO sliders)

**Elements:**
- Panel number badge (circular)
- Panel title (editable)
- Play button
- Stop button
- Delete button (hidden for panel-0)

**Layout:**
```
├─○ [0] Master           [▶][⬛][🗑]
```

**CSS:**
```css
.panel-tree summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  cursor: pointer;
  user-select: none;
}

.panel-tree summary::before {
  content: '+';  /* Collapsed indicator */
  /* ... circular marker styles */
}

.panel-tree details[open] > summary::before {
  content: '−';  /* Expanded indicator */
}

/* Hide native marker */
.panel-tree summary::marker,
.panel-tree summary::-webkit-details-marker {
  display: none;
}
```

### 4. Panel Children (expanded state)

**Purpose:** Leaves under the panel branch

**Leaf Types:**
1. **Code Editor** (`.leaf-editor`) - CodeMirror 6 instance
2. **Slider** (`.leaf-slider`) - Labeled range input
3. **Visualization** (`.leaf-viz`) - Canvas/waveform display

**Layout when expanded:**
```
├─○ [−] Panel 1: Bass    [▶][⬛][🗑]
│ │
│ ├─┌────────────────────────────────┐
│ │ │ note("c2").gain(slider(0.8))  │  ← Code editor leaf
│ │ └────────────────────────────────┘
│ │
│ ├─○ [Gain ═══════○═══]              ← Slider leaf
│ │
│ └─○ [Cutoff ═══○═════]              ← Slider leaf
```

**CSS:**
```css
.leaf-node {
  padding-left: calc(2 * var(--tree-spacing));
}

.leaf-editor {
  width: 90%;
  margin: 8px 0;
}

.leaf-slider {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

### 5. Tree Lines (CSS)

**Vertical lines** via `border-left` on `<li>`:
```css
.panel-tree ul li {
  border-left: 2px solid var(--tree-line-color);
  margin-left: var(--tree-spacing);
  padding-left: var(--tree-spacing);
}

.panel-tree ul li:last-child {
  border-color: transparent;  /* No line after last */
}
```

**Horizontal lines** via `::before`:
```css
.panel-tree ul li::before {
  content: '';
  position: absolute;
  width: var(--tree-spacing);
  height: 1px;
  background: var(--tree-line-color);
  left: 0;
  top: 50%;
}
```

### 6. Master Panel (Panel 0)

**Treatment:** Identical structure, different interpretation:
- Cannot be deleted (hide delete button)
- Always position 0
- Code parsed as global variable definitions
- Sliders become global refs

**Visual Accent:**
```css
.level-panel[data-panel-number="0"] > details > summary {
  border-left: 3px solid var(--dark-green);
}

.level-panel[data-panel-number="0"] .btn-delete {
  display: none;
}
```

---

## CSS Skinning Architecture

### Layer 1: CSS Variables (Base)

All visual properties defined as variables in `:root`:

```css
:root {
  /* Layout */
  --header-height: 56px;
  --panel-gap: 8px;

  /* Tree Structure */
  --tree-spacing: 1.5rem;        /* Horizontal indent per level */
  --tree-node-radius: 8px;       /* Size of circular node markers */
  --tree-line-color: #e0e0e0;    /* Color of tree lines */
  --tree-line-width: 2px;        /* Width of tree lines */

  /* Panel Row */
  --panel-row-height: 48px;
  --panel-row-bg: var(--panel-base-light);
  --panel-row-hover-bg: color-mix(in srgb, var(--panel-row-bg) 95%, black 5%);

  /* Panel Children (leaves) */
  --leaf-editor-width: 90%;
  --leaf-editor-min-height: 100px;
  --leaf-editor-max-height: 400px;
  --leaf-slider-height: 32px;

  /* Colors (existing system) */
  --panel-base-warm: #dad0bc;
  --panel-base-cool: #d9d8d4;
  --panel-base-light: #d1d8e0;
  --panel-base-dark: #1a1a1a;

  /* Button System (existing) */
  --btn-hole-bg: var(--darkness);
  --btn-surface-bg: var(--pale-white);
  --btn-padding-square-md: 10px;

  /* Computed Variants (existing) */
  --panel-warm-light: color-mix(in srgb, var(--panel-base-warm) 85%, white 15%);

  /* Animation */
  --transition-fast: 150ms ease;
  --transition-medium: 250ms ease;
  --expand-animation: 200ms ease-out;
}
```

### Layer 2: Component Classes

Reusable component styles referencing variables:

```css
/* Panel Row Component */
.panel-row {
  height: var(--panel-row-height);
  background: var(--panel-row-bg);
  display: flex;
  align-items: center;
  gap: var(--panel-row-gap);
  padding: 0 var(--panel-row-padding);
  transition: background var(--transition-fast);
}

.panel-row:hover {
  background: var(--panel-row-hover-bg);
}

/* Panel Card Component */
.panel-card {
  background: var(--panel-card-bg);
  border-radius: var(--panel-card-radius);
  padding: var(--panel-card-padding);
  overflow: hidden;
}

.panel-card.collapsed {
  height: 0;
  padding: 0;
  overflow: hidden;
}

.panel-card.expanded {
  height: auto;
  animation: expand var(--expand-animation);
}
```

### Layer 3: Skin Overrides

Skins override ONLY variables, never component classes:

```css
/* skin-retro-green/theme.css */
:root {
  /* Color overrides */
  --panel-base-warm: #1a2a1a;
  --panel-base-cool: #0a1a0a;
  --panel-base-light: #2a3a2a;
  --panel-base-dark: #000000;

  /* Button overrides */
  --btn-hole-bg: #001100;
  --btn-surface-bg: #00ff00;

  /* Layout overrides */
  --panel-row-height: 52px;
  --btn-padding-square-md: 12px;
}
```

---

## Expand/Collapse Mechanism

### Native `<details>/<summary>` Approach

**No JavaScript required for basic toggle** - browser handles it natively.

```html
<details>
  <summary>Panel Title [▶][⬛]</summary>
  <ul class="panel-children">
    <!-- Children appear when expanded -->
  </ul>
</details>
```

**States:**
- **Collapsed:** `<details>` (no `open` attribute)
- **Expanded:** `<details open>`

### CSS Indicator Styling

```css
.panel-tree details > summary::before {
  content: '+';
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--btn-surface-bg);
  border: 2px solid var(--tree-line-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.panel-tree details[open] > summary::before {
  content: '−';
}
```

### Optional: Animated Expansion

To animate the expansion (not native), use grid trick on children container:

```css
.panel-children {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease-out;
  overflow: hidden;
}

details[open] > .panel-children {
  grid-template-rows: 1fr;
}

.panel-children > * {
  overflow: hidden;
}
```

### JavaScript Integration (for state sync only)

```javascript
// Listen for native toggle event
document.querySelectorAll('.panel-tree details').forEach(details => {
  details.addEventListener('toggle', (e) => {
    const panelId = details.closest('.level-panel').dataset.panelId;
    const isExpanded = details.open;

    // Update state
    cardStates[panelId].expanded = isExpanded;

    // Handle accordion mode
    if (isExpanded && getSettings().collapseOnBlur) {
      collapseOtherPanels(panelId);
    }

    // Emit event for remote sync
    eventBus.emit('panel:toggle', { panelId, expanded: isExpanded });
  });
});

function collapseOtherPanels(exceptPanelId) {
  document.querySelectorAll('.panel-tree details[open]').forEach(details => {
    const panelId = details.closest('.level-panel').dataset.panelId;
    if (panelId !== exceptPanelId) {
      details.open = false;
    }
  });
}
```

### Programmatic Control

```javascript
// Expand a panel
function expandPanel(panelId) {
  const details = document.querySelector(`[data-panel-id="${panelId}"] details`);
  if (details) details.open = true;
}

// Collapse a panel
function collapsePanel(panelId) {
  const details = document.querySelector(`[data-panel-id="${panelId}"] details`);
  if (details) details.open = false;
}

// Toggle a panel
function togglePanel(panelId) {
  const details = document.querySelector(`[data-panel-id="${panelId}"] details`);
  if (details) details.open = !details.open;
}
```

---

## Touch Support

### Touch Targets

**Minimum touch target:** 44×44px (Apple HIG recommendation)

```css
:root {
  --touch-target-min: 44px;
}

@media (pointer: coarse) {
  /* Touch device overrides */
  --panel-row-height: max(var(--panel-row-height), var(--touch-target-min));
  --btn-padding-square-md: 14px;
}
```

### Touch Gestures

| Gesture | Action |
|---------|--------|
| Tap | Toggle expand/collapse |
| Tap button | Trigger button action |
| Swipe left | Reveal delete button |
| Long press | Open context menu (future) |

### Implementation

```javascript
// Touch-friendly slider handling
slider.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevent scroll
  startSliderDrag(e.touches[0]);
}, { passive: false });

slider.addEventListener('touchmove', (e) => {
  updateSliderValue(e.touches[0]);
}, { passive: true });
```

---

## Migration Path

### Phase 1: Tree Structure Foundation

1. **Create tree CSS** (`static/css/components/panel-tree.css`)
   - Tree lines (vertical/horizontal)
   - Node markers (+/−)
   - Indentation levels
   - Summary row styling

2. **Update index.html**
   - Replace `.container` with `.panel-tree` structure
   - Convert master panel to `panel-0` in tree
   - Remove `.screen` element

3. **Initial HTML structure:**
   ```html
   <ul class="panel-tree">
     <li class="level-panel" data-panel-id="panel-0" data-panel-number="0">
       <details open>
         <summary>
           <span class="panel-number-badge">0</span>
           <span class="panel-title">Master</span>
           <div class="panel-actions">...</div>
         </summary>
         <ul class="panel-children">
           <li class="leaf-node leaf-editor">...</li>
         </ul>
       </details>
     </li>
   </ul>
   ```

### Phase 2: Panel Creation/Deletion

1. **Update panelManager.js**
   - `createPanel()` generates tree `<li>` structure
   - `deletePanel()` removes tree node
   - Remove all drag/resize positioning code

2. **Panel template function:**
   ```javascript
   function createPanelHTML(panelId, panelNumber, title) {
     return `
       <li class="level-panel" data-panel-id="${panelId}" data-panel-number="${panelNumber}">
         <details>
           <summary>
             <span class="panel-number-badge">${panelNumber}</span>
             <span class="panel-title" contenteditable="true">${title}</span>
             <div class="panel-actions">
               <button class="btn-play">▶</button>
               <button class="btn-stop">⬛</button>
               <button class="btn-delete">🗑</button>
             </div>
           </summary>
           <ul class="panel-children">
             <li class="leaf-node leaf-editor">
               <div class="code-editor" id="editor-${panelId}"></div>
             </li>
           </ul>
         </details>
       </li>
     `;
   }
   ```

### Phase 3: Expand/Collapse + State Sync

1. **Listen for native toggle events**
   ```javascript
   document.querySelector('.panel-tree').addEventListener('toggle', (e) => {
     if (e.target.tagName === 'DETAILS') {
       const panelId = e.target.closest('.level-panel').dataset.panelId;
       cardStates[panelId].expanded = e.target.open;
       eventBus.emit('panel:toggle', { panelId, expanded: e.target.open });
     }
   }, true);
   ```

2. **Accordion mode (collapseOnBlur)**
   - On expand, check setting and collapse others

3. **Save/restore expanded state**
   - Store in panel state
   - Apply `open` attribute on restore

### Phase 4: Slider Leaves

1. **Move sliders OUT of summary row**
   - Sliders now children of panel, not inline
   - Each slider is a `.leaf-slider` node

2. **Update sliderManager.js**
   ```javascript
   function renderSliders(panelId, widgets) {
     const childrenList = document.querySelector(
       `[data-panel-id="${panelId}"] .panel-children`
     );

     // Remove existing slider leaves
     childrenList.querySelectorAll('.leaf-slider').forEach(el => el.remove());

     // Add new slider leaves after editor
     widgets.forEach(widget => {
       const li = document.createElement('li');
       li.className = 'leaf-node leaf-slider';
       li.innerHTML = `
         <label>${widget.label}</label>
         <input type="range" ...>
         <span class="slider-value">${widget.value}</span>
       `;
       childrenList.appendChild(li);
     });
   }
   ```

### Phase 5: Drag-to-Reorder

1. **Add drag handles to summary rows**
   - Drag indicator icon (⋮⋮)
   - HTML5 drag/drop API or library (SortableJS)

2. **Reorder logic:**
   ```javascript
   function handleDrop(draggedPanelId, targetIndex) {
     const tree = document.querySelector('.panel-tree');
     const items = [...tree.querySelectorAll('.level-panel')];
     const dragged = items.find(li => li.dataset.panelId === draggedPanelId);

     // Move in DOM
     tree.insertBefore(dragged, items[targetIndex]);

     // Reassign numbers
     reassignPanelNumbers();
   }
   ```

3. **Update keyboard shortcuts**
   - `CMD+OPT+N` activates panel at DOM index N

### Phase 6: Touch Optimization

1. **Touch detection**
   ```javascript
   if (window.matchMedia('(pointer: coarse)').matches) {
     document.body.classList.add('touch-device');
   }
   ```

2. **CSS touch adjustments**
   ```css
   .touch-device .panel-tree summary {
     min-height: 56px;
     padding: 16px;
   }

   .touch-device .panel-actions button {
     min-width: 44px;
     min-height: 44px;
   }
   ```

3. **Touch gestures**
   - Swipe left on summary → reveal delete button
   - Long press → reorder mode

---

## Component Inventory

### New Components

| Component | File | Purpose |
|-----------|------|---------|
| `.panel-list` | base.css | Container for all panels |
| `.panel-wrapper` | base.css | Individual panel container |
| `.panel-row` | base.css | Collapsed panel header |
| `.panel-container` | base.css | Animating height wrapper |
| `.panel-card` | base.css | Expanded panel content |
| `.expand-toggle` | base.css | Expand/collapse button |
| `.slider-inline` | base.css | Collapsed slider variant |

### Modified Components

| Component | Changes |
|-----------|---------|
| `.hero-section` | Replaced by header bar |
| `.master-panel` | Merged into `.panel-wrapper[data-panel-id="panel-0"]` |
| `.card` | Renamed to `.panel-card` |
| `.card-header` | Merged into `.panel-row` |

### Removed Components

| Component | Reason |
|-----------|--------|
| `.panel-collapsed` | Replaced by `.panel-wrapper:not(.expanded)` |
| `.panel-drag-handle` | Not in default layout |
| `.panel-resize-handle` | Not in default layout |
| `.workspace` | No longer a workspace concept |

---

## Skin Compatibility

### Default Layout Skin

The default "Tree" layout disables drag/resize:

```json
// skins/default/skin.json
{
  "name": "Default (Tree Layout)",
  "layout": "tree",
  "features": {
    "dragPanels": false,
    "resizePanels": false,
    "floatingPanels": false
  }
}
```

### Workspace Layout Skin

Future skin can enable workspace features:

```json
// skins/workspace/skin.json
{
  "name": "Workspace",
  "layout": "workspace",
  "features": {
    "dragPanels": true,
    "resizePanels": true,
    "floatingPanels": true
  }
}
```

### Feature Detection

```javascript
function initializeLayout() {
  const skinConfig = getSkinConfig();

  if (skinConfig.features.dragPanels) {
    enableDragHandles();
  }

  if (skinConfig.features.resizePanels) {
    enableResizeHandles();
  }

  if (skinConfig.layout === 'tree') {
    initializeTreeLayout();
  } else {
    initializeWorkspaceLayout();
  }
}
```

---

## File Changes

### New Files

```
static/css/
├── components/
│   ├── panel-list.css     # Panel list layout
│   ├── panel-row.css      # Collapsed row styles
│   ├── panel-card.css     # Expanded card styles
│   └── slider-inline.css  # Compact slider variant
```

### Modified Files

```
static/css/base.css        # Add new variables, remove workspace
index.html                 # Restructure panel DOM
src/main.js                # Remove drag/resize, add expand/collapse
src/managers/panelManager.js  # Update panel creation
```

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Panel positioning | Absolute (drag) | Static (list) |
| Master panel treatment | Special | Same as others |
| Touch target size | Mixed | Min 44px |
| Skin variables | ~50 | ~80 |
| Layout modes | 1 (workspace) | 2 (tree, workspace) |

---

## Design Decisions

### 1. Multiple Expanded Panels

**Decision:** Allow multiple panels expanded simultaneously

**Behavior:**
- Default: Multiple panels can be expanded at once
- Optional accordion mode via existing `settings.collapseOnBlur`
- When `collapseOnBlur: true`, expanding a panel collapses others

```javascript
function expandPanel(panelId) {
  const settings = getSettings();

  if (settings.collapseOnBlur) {
    // Accordion mode: collapse all others
    Object.keys(cardStates).forEach(id => {
      if (id !== panelId) {
        collapsePanel(id);
      }
    });
  }

  // Expand target panel
  const wrapper = document.querySelector(`[data-panel-id="${panelId}"]`);
  wrapper.classList.add('expanded');
  cardStates[panelId].expanded = true;
}
```

### 2. Drag-to-Reorder with Panel Number Reassignment

**Decision:** Allow drag to reorder in list

**Behavior:**
- Panels display in numerical order (always)
- Dragging a panel to new position **reassigns panel numbers**
- `CMD+OPT+1,2,3` hotkeys always target panel at index 1, 2, 3
- Badge shows current panel number (matches keyboard shortcut)

**Panel Number Badge:**
```html
<div class="panel-row">
  <span class="panel-number-badge">1</span>
  <button class="expand-toggle">▼</button>
  <!-- ... -->
</div>
```

```css
.panel-number-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--darkness);
  color: var(--pale-white);
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Reorder Logic:**
```javascript
function reorderPanels(draggedPanelId, targetIndex) {
  // Get current panel order
  const panelList = document.querySelector('.panel-list');
  const wrappers = [...panelList.querySelectorAll('.panel-wrapper')];

  // Move DOM element
  const draggedWrapper = wrappers.find(w => w.dataset.panelId === draggedPanelId);
  const targetWrapper = wrappers[targetIndex];
  panelList.insertBefore(draggedWrapper, targetWrapper);

  // Reassign panel numbers
  reassignPanelNumbers();

  // Emit sync event
  eventBus.emit('panels:reordered', { order: getPanelOrder() });
}

function reassignPanelNumbers() {
  const wrappers = document.querySelectorAll('.panel-wrapper');

  wrappers.forEach((wrapper, index) => {
    const panelId = wrapper.dataset.panelId;
    const newNumber = index; // 0-based (panel-0 is master)

    // Update badge
    const badge = wrapper.querySelector('.panel-number-badge');
    if (badge) badge.textContent = newNumber;

    // Update state
    if (cardStates[panelId]) {
      cardStates[panelId].number = newNumber;
    }

    // Update data attribute
    wrapper.dataset.panelNumber = newNumber;
  });
}
```

**Keyboard Shortcut Update:**
```javascript
// CMD+OPT+N activates panel at index N (not by ID)
function activatePanelByIndex(index) {
  const wrappers = document.querySelectorAll('.panel-wrapper');
  if (index < wrappers.length) {
    const panelId = wrappers[index].dataset.panelId;
    activatePanel(panelId);
  }
}
```

### 3. Screen Element

**Decision:** Remove green screen background for clarity

- Optimize for clarity over aesthetics initially
- Can add back as optional skin feature later
- Code editors have their own background (dark theme)

### 4. Remote UI

**Decision:** Simplified touch-only layout, also skinnable

**Remote Layout Features:**
- Larger touch targets (56px minimum)
- No keyboard shortcuts (touch-only)
- Simplified slider controls
- Same skinning system applies

**Remote Skin Example:**
```json
// skins/remote-touch/skin.json
{
  "name": "Remote Touch",
  "layout": "tree",
  "platform": "touch",
  "features": {
    "dragPanels": false,
    "resizePanels": false,
    "keyboardShortcuts": false,
    "expandedEditor": false
  },
  "cssVariables": {
    "--panel-row-height": "56px",
    "--btn-padding-square-md": "16px",
    "--touch-target-min": "56px"
  }
}
```

---

## Next Steps

1. **Phase 1: Panel List Structure** - Convert workspace to panel list DOM
2. **Phase 2: Expand/Collapse** - Implement grid-based animation
3. **Phase 3: Drag Reorder** - Add drag-to-reorder with number reassignment
4. **Phase 4: Master Normalization** - Merge master panel as panel-0
5. **Phase 5: Touch Optimization** - Add touch detection and overrides
6. **Phase 6: Remote Skin** - Create simplified touch-only skin

---

**Maintained By:** Development Team
**Review Cycle:** Update after design approval
