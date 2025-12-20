# UI Refactor Plan

**Created:** 2024-12-20
**Status:** Planning

## Overview

Clean extraction and simplification of the r0astr UI layer. The current implementation has CSS conflicts, legacy code, and a monolithic main.js that needs breaking up.

---

## Current State (Problems)

1. **CSS Conflict:** `synthwave.css` loads last and uses `!important` on nearly everything, making `panel-tree.css` ineffective
2. **Legacy Code:** `layout.css` has 600+ lines for `.card` (old layout) that's unused
3. **Monolith:** `main.js` is 3,582 lines - audio, UI, everything mixed together
4. **Duplicate Styling:** Panel styles defined in `panel-tree.css` AND `layout.css` AND `synthwave.css`
5. **Unused Code:** `dragResize.js` for legacy card drag/resize

---

## Phase 1: Kill Dead Code & Simplify CSS

### Delete Files
- [ ] `src/ui/dragResize.js` (200 lines - unused legacy card drag/resize)
- [ ] `static/css/themes/synthwave.css` (948 lines - problematic theme)

### Remove from index.html
- [ ] `<link rel="stylesheet" href="/static/css/themes/synthwave.css">`

### Keep
- `src/ui/panelReorder.js` (drag to reorder rows - still needed)

### Clean Up
- [ ] Remove legacy `.card` styles from `layout.css` (~400 lines)
- [ ] Remove dragResize.js imports from main.js or wherever used

**Result:** ~1,500 lines removed, no more `!important` conflicts

---

## Phase 2: Consolidate CSS

### Target Structure (4 files instead of 8)

| New File | Contains | Source |
|----------|----------|--------|
| `variables.css` | CSS custom properties only | Keep as-is (220 lines) |
| `base.css` | Body, typography, reset, utilities | Extract from layout.css |
| `panels.css` | Panel tree, rows, headers, controls, editor | Merge panel-tree.css + relevant layout.css bits + editor.css |
| `components.css` | Buttons, sliders, modals | Merge buttons.css, controls.css, modals.css |

### New index.html CSS imports
```html
<link rel="stylesheet" href="/static/css/variables.css">
<link rel="stylesheet" href="/static/css/base.css">
<link rel="stylesheet" href="/static/css/panels.css">
<link rel="stylesheet" href="/static/css/components.css">
```

---

## Phase 3: Refactor main.js

### Current: 1 file, 3,582 lines

### Target: 8+ focused modules

| New Module | Lines (est) | Responsibility |
|------------|-------------|----------------|
| `src/audio/strudelEngine.js` | ~400 | Strudel init, repl, evaluate, scheduler |
| `src/audio/audioContext.js` | ~100 | Web Audio context management |
| `src/audio/sampleLoader.js` | ~150 | Sample loading, progress tracking |
| `src/panels/panelPlayback.js` | ~300 | Play/stop/update panel patterns |
| `src/panels/panelEditor.js` | ~400 | CodeMirror setup, editor management |
| `src/panels/panelState.js` | ~200 | cardStates, playing/stale tracking |
| `src/init.js` | ~200 | DOM ready, event listeners, boot sequence |
| `src/main.js` | ~300 | Entry point, imports, orchestration |

### Extraction Order
1. Extract audio context management
2. Extract Strudel engine setup
3. Extract sample loading
4. Extract panel playback logic
5. Extract CodeMirror/editor setup
6. Extract state management
7. Clean up main.js as orchestrator

---

## Phase 4: Simple Default Style

### Design Principles
- No `!important` anywhere
- Simple dark theme with good contrast
- Flexbox column layout for panel tree
- Consistent spacing and border radius

### Core Panel Tree CSS (target)
```css
.panel-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 1000px;
  margin: 0 auto;
  padding: 90px 16px 60px;  /* clear fixed header */
  list-style: none;
}

.level-panel,
.add-panel-row {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  overflow: hidden;
}

.level-panel > details > summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  list-style: none;
}

.level-panel > details > summary::-webkit-details-marker {
  display: none;
}
```

---

## Execution Checklist

### Step 1: Delete synthwave.css
- [ ] Remove `<link>` from index.html
- [ ] Delete `static/css/themes/synthwave.css`
- [ ] Verify page still works (will look plain but functional)

### Step 2: Clean panel-tree.css
- [ ] Rewrite to simple column layout
- [ ] Remove tree-line decorations
- [ ] Test expand/collapse still works

### Step 3: Delete dragResize.js
- [ ] Remove file
- [ ] Remove imports from main.js
- [ ] Test nothing breaks

### Step 4: Prune layout.css
- [ ] Remove all `.card` styles (lines ~445-760)
- [ ] Remove other legacy styles
- [ ] Keep: body, banner-bar, top-menu-bar, metronome, screen

### Step 5: Consolidate remaining CSS
- [ ] Create base.css from layout.css extracts
- [ ] Create panels.css from panel-tree.css + editor.css
- [ ] Create components.css from buttons.css + controls.css + modals.css
- [ ] Update index.html imports
- [ ] Delete old CSS files

### Step 6: Refactor main.js
- [ ] Create src/audio/ directory
- [ ] Create src/panels/ directory
- [ ] Extract modules one by one
- [ ] Test after each extraction

---

## File Inventory (Before)

### CSS (8 files, ~4,700 lines)
- `variables.css` - 220 lines
- `layout.css` - 939 lines
- `buttons.css` - 1,076 lines
- `controls.css` - 407 lines
- `editor.css` - 93 lines
- `modals.css` - 370 lines
- `panel-tree.css` - 726 lines
- `themes/synthwave.css` - 948 lines

### JS UI (6 files)
- `src/ui/confirmModal.js` - 91 lines
- `src/ui/dragResize.js` - 200 lines (DELETE)
- `src/ui/fileIO.js` - 205 lines
- `src/ui/panelReorder.js` - 238 lines
- `src/ui/settingsModal.js` - 808 lines
- `src/ui/snippetModal.js` - 439 lines

### JS Main
- `src/main.js` - 3,582 lines (REFACTOR)

---

## File Inventory (After - Target)

### CSS (4 files, ~2,000 lines target)
- `variables.css` - ~200 lines
- `base.css` - ~300 lines
- `panels.css` - ~600 lines
- `components.css` - ~900 lines

### JS UI (5 files)
- `src/ui/confirmModal.js` - 91 lines
- `src/ui/fileIO.js` - 205 lines
- `src/ui/panelReorder.js` - 238 lines
- `src/ui/settingsModal.js` - 808 lines
- `src/ui/snippetModal.js` - 439 lines

### JS Audio (3 new files)
- `src/audio/strudelEngine.js` - ~400 lines
- `src/audio/audioContext.js` - ~100 lines
- `src/audio/sampleLoader.js` - ~150 lines

### JS Panels (3 new files)
- `src/panels/panelPlayback.js` - ~300 lines
- `src/panels/panelEditor.js` - ~400 lines
- `src/panels/panelState.js` - ~200 lines

### JS Core (2 files)
- `src/init.js` - ~200 lines
- `src/main.js` - ~300 lines (orchestrator only)
