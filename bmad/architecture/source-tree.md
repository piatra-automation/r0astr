# Source Tree and Module Organization

**Version:** v4
**Last Updated:** 2025-11-16

## Overview

r0astr source tree is currently minimal - single entry point with inline styles. Future refactoring will introduce modular architecture for maintainability.

## Current Structure (v0.2.0)

```
r0astr/
├── index.html              # Main UI structure (210 lines)
│   ├── Inline CSS (lines 8-169)
│   ├── 4 static cards (lines 172-204)
│   └── Script import (line 210)
├── src/
│   └── main.js             # Application entry point (~300 lines)
│       ├── Strudel imports (lines 1-11)
│       ├── Default patterns (lines 20-25)
│       ├── Card state (lines 28-33)
│       ├── Audio context init (lines 36-41)
│       ├── initializeCards() (lines 44-56)
│       ├── initializeStrudel() (lines 59-120)
│       ├── renderSliders() (lines 123-169)
│       └── toggleCard() (lines 172-251)
├── package.json            # npm dependencies and scripts
├── package-lock.json       # Locked dependency versions
├── vite.config.mjs         # Vite configuration (AudioWorklet plugin)
├── docs/
│   ├── prd/                # Product requirements
│   │   ├── index.md        # PRD overview
│   │   ├── epic-1-dynamic-panel-management.md
│   │   ├── epic-2-enhanced-panel-ui.md
│   │   ├── epic-3-splash-hero-screen.md
│   │   ├── epic-4-settings-system.md
│   │   ├── epic-5-server-endpoints.md
│   │   └── epic-6-staleness-detection.md
│   ├── architecture/       # Technical documentation
│   │   ├── index.md        # Architecture overview
│   │   ├── tech-stack.md
│   │   ├── coding-standards.md
│   │   ├── source-tree.md (this file)
│   │   └── strudel-integration-gotchas.md
│   ├── stories/            # User stories (empty, future)
│   ├── qa/                 # QA documentation (empty, future)
│   ├── brownfield-architecture.md  # Comprehensive v0.1.0 analysis
│   └── remote-control.md   # WebSocket remote control docs (v0.2.0)
├── .claude/
│   ├── piatra.json         # Piatra project tracking
│   └── settings.local.json # Local Claude Code settings
├── .vscode/
│   └── settings.json       # VSCode configuration
├── LICENSE                 # AGPL-3.0-or-later
├── CHANGELOG.md            # Version history
├── VERSION                 # Current version (0.2.0)
├── README.md               # User documentation
├── CLAUDE.md               # AI agent instructions
└── delete_me/              # Legacy Strudel monorepo (safe to delete)
```

## Entry Point: `index.html`

### Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>r0astr - Multi-Instrument Live Coding</title>
  <style>
    /* Inline CSS (lines 8-169) */
    /* TODO: Extract to external CSS with variables */
  </style>
</head>
<body>
  <h1>r0astr</h1>

  <!-- Master Panel (lines 172-185) -->
  <div class="card master-panel" id="master-panel">
    <div class="card-header">
      <h3>Master Panel (Global Controls)</h3>
    </div>
    <textarea class="code-input master-code" id="master-code">...</textarea>
  </div>

  <!-- 4 Instrument Cards (lines 187-204) -->
  <div class="card" id="card-1">...</div>
  <div class="card" id="card-2">...</div>
  <div class="card" id="card-3">...</div>
  <div class="card" id="card-4">...</div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### Key Sections
| Lines | Purpose |
|-------|---------|
| 8-169 | Inline CSS (dark theme, card layout, slider styles) |
| 172-185 | Master panel (global sliders, TEMPO) |
| 187-204 | 4 instrument cards (static, to be refactored) |
| 210 | Script import (ES module) |

## Master Panel: Special Protected Panel

The master panel (`#master-panel`) is a **special non-deletable panel** that serves as the global control center for all instrument panels.

### Purpose and Function
- **Global Sliders**: Define sliders accessible across all panels (e.g., `SLIDER_LPF`, `SLIDER_GAIN`)
- **TEMPO Control**: Shared tempo slider with CPS conversion (30 CPM = 120 BPM)
- **Shared Variables**: JavaScript variables defined here are available in all instrument patterns

### Protection Mechanism
The master panel cannot be deleted via UI or programmatic means:

1. **Constant Identifier**: `MASTER_PANEL_ID = 'master-panel'` (exported from `panelManager.js`)
2. **Delete Protection**: `deletePanel()` checks for master panel ID and returns false with warning
3. **No Delete Button**: `renderPanel()` conditionally skips delete button for master panel
4. **HTML Structure**: Master panel has unique ID and class: `<div class="master-panel" id="master-panel">`

### Code References
```javascript
// src/managers/panelManager.js
export const MASTER_PANEL_ID = 'master-panel';

export function deletePanel(panelId, ...) {
  if (panelId === MASTER_PANEL_ID) {
    console.warn('Cannot delete master panel - it contains global controls');
    return false;
  }
  // ... deletion logic
}
```

### Accessibility
Master panel participates in standard panel behaviors EXCEPT deletion:
- ✅ Can be moved/dragged (Epic 2, Story 2.3)
- ✅ Can be resized (Epic 2, Story 2.2)
- ✅ Participates in z-index management (Epic 2, Story 2.4)
- ✅ Can be toggled between visible/compact modes
- ❌ Cannot be deleted (protected)

### Example Usage
```javascript
// In master panel:
let SLIDER_LPF = slider(800, 100, 5000);
let TEMPO = slider(30, 15, 45);

// In any instrument panel:
note('c2 e2 g2').lpf(SLIDER_LPF).gain(0.6)
```

## Application Logic: `src/main.js`

### Module Organization (~300 lines)

```javascript
// ===== 1. IMPORTS (lines 1-11) =====
import { repl, evalScope, ref } from '@strudel/core';
import { transpiler } from '@strudel/transpiler';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick, registerSynthSounds } from '@strudel/webaudio';
import { registerSoundfonts } from '@strudel/soundfonts';
import { sliderWithID } from '@strudel/codemirror';

window.sliderValues = {}; // Global reactive state

// ===== 2. CONFIGURATION (lines 14-25) =====
const DEFAULT_SAMPLE_DELAY = 3000;
const defaultPatterns = {
  'card-1': '...',
  'card-2': '...',
  'card-3': '...',
  'card-4': '...',
};

// ===== 3. STATE MANAGEMENT (lines 28-33) =====
const cardStates = {
  'card-1': { playing: false },
  'card-2': { playing: false },
  'card-3': { playing: false },
  'card-4': { playing: false },
};

// ===== 4. AUDIO INITIALIZATION (lines 36-41) =====
const ctx = getAudioContext();
initAudioOnFirstClick();

// ===== 5. UI INITIALIZATION (lines 44-56) =====
function initializeCards() {
  // Set default patterns in textareas
  // Attach event listeners to Play/Pause buttons
}

// ===== 6. STRUDEL INITIALIZATION (lines 59-120) =====
async function initializeStrudel() {
  // Import Strudel modules
  // Register synths and soundfonts
  // Create shared REPL instance
  // Pre-load dirt-samples
  // Initialize master panel
}

// ===== 7. SLIDER RENDERING (lines 123-169) =====
function renderSliders(cardId, widgets) {
  // Extract slider metadata from transpiler output
  // Generate HTML <input type="range"> elements
  // Bind to sliderValues reactive state
}

// ===== 8. PATTERN CONTROL (lines 172-251) =====
function toggleCard(cardId) {
  // Get pattern code from textarea
  // Transpile code (slider() → sliderWithID())
  // Render sliders from widget metadata
  // Evaluate pattern with .p(cardId)
  // Update button state (Play ↔ Pause)
}

// ===== 9. MASTER PANEL (lines 254-300) =====
// Parse master panel sliders with regex (NOT transpiler)
// Handle TEMPO slider with CPS conversion
// Initialize global sliders on Strudel ready
```

### Function Reference

| Function | Lines | Purpose | Complexity |
|----------|-------|---------|------------|
| `initializeCards()` | 44-56 | Set default patterns, attach button listeners | Low |
| `initializeStrudel()` | 59-120 | Async Strudel setup, sample loading | High |
| `renderSliders()` | 123-169 | Generate slider UI from transpiler widgets | Medium |
| `toggleCard()` | 172-251 | Play/pause pattern, transpile, evaluate | High |
| `parseMasterPanel()` | 254-280 | Regex-based slider extraction (master only) | Medium |
| `initializeMasterPanel()` | 282-300 | Setup global sliders and TEMPO | Medium |

## Future Modular Architecture (Roadmap)

### Planned Refactor (Post-Epic 1)

```
src/
├── main.js                 # Entry point, orchestration only
├── core/
│   ├── audioContext.js     # Shared AudioContext singleton
│   ├── scheduler.js        # Strudel scheduler wrapper
│   └── repl.js             # Strudel REPL initialization
├── managers/
│   ├── panelManager.js     # Panel CRUD, state management
│   ├── settingsManager.js  # localStorage, JSON persistence
│   ├── themeManager.js     # CSS variables, skin loading (future)
│   └── snippetManager.js   # Code snippet library (future)
├── ui/
│   ├── panelRenderer.js    # Dynamic panel HTML generation
│   ├── sliderRenderer.js   # Slider widget rendering
│   ├── modalRenderer.js    # Settings modal, splash screen
│   └── dragResize.js       # Drag/resize library wrapper
├── api/
│   ├── server.js           # HTTP/WebSocket server
│   └── routes/
│       ├── panels.js       # Panel endpoints
│       └── settings.js     # Settings endpoints
└── utils/
    ├── idGenerator.js      # Unique ID generation
    ├── validation.js       # Input validation
    └── logger.js           # Console logging wrapper
```

### Migration Strategy
1. **Extract panelManager.js** (Epic 1, Story 1.1)
   - Move panel CRUD logic from main.js
   - Centralize panel state management
2. **Extract settingsManager.js** (Epic 4, Story 4.1)
   - Implement localStorage persistence
   - Settings schema and validation
3. **Extract sliderRenderer.js** (Epic 6, Story 6.2)
   - Separate slider rendering from toggleCard()
   - Reusable across panels and master panel
4. **Extract ui/panelRenderer.js** (Epic 2, Story 2.3)
   - Dynamic panel HTML generation
   - Drag/resize integration

## File Naming Conventions

### JavaScript Files
- **camelCase** for source files: `panelManager.js`, `settingsManager.js`
- **Descriptive names** - Reflect module purpose, not implementation

### HTML/CSS Files
- **kebab-case** for static assets: `index.html`, `main.css` (future)

### Documentation Files
- **kebab-case** for markdown: `tech-stack.md`, `source-tree.md`

### Data Files
- **kebab-case** for JSON: `piatra.json`, `dev-workflow-state.json`

## Import/Export Patterns

### ES Modules
```javascript
// ✅ Good: Named exports for utility functions
// panelManager.js
export function createPanel(options) { ... }
export function deletePanel(panelId) { ... }

// main.js
import { createPanel, deletePanel } from './managers/panelManager.js';
```

```javascript
// ✅ Good: Default export for singletons
// audioContext.js
const ctx = getAudioContext();
export default ctx;

// main.js
import audioContext from './core/audioContext.js';
```

### Avoid Circular Dependencies
```javascript
// ❌ Bad: Circular dependency
// panelManager.js imports settingsManager.js
// settingsManager.js imports panelManager.js

// ✅ Good: Extract shared dependency to utils/
// Both import from utils/state.js
```

## Build Output: `dist/`

### Production Build Structure
```
dist/
├── index.html              # Optimized HTML
├── assets/
│   ├── index-[hash].js     # Bundled JavaScript (~500KB)
│   ├── index-[hash].css    # Extracted CSS (future)
│   └── audio-worklet-[hash].js  # AudioWorklet processor
└── samples/                # Pre-loaded samples (optional)
```

### Vite Build Process
1. Parse `index.html`, extract script imports
2. Bundle `src/main.js` and all dependencies
3. Bundle AudioWorklet processors (vite-plugin-bundle-audioworklet)
4. Minify and hash assets
5. Output to `dist/`

## Testing Structure (Future)

```
tests/
├── unit/
│   ├── panelManager.test.js
│   ├── settingsManager.test.js
│   └── utils/
│       └── idGenerator.test.js
├── integration/
│   ├── strudel.test.js
│   └── api/
│       └── panels.test.js
└── e2e/
    ├── audio-playback.spec.js
    └── panel-management.spec.js
```

## Key Module Dependencies

### `src/main.js` Imports
| Import | Package | Purpose |
|--------|---------|---------|
| `repl, evalScope, ref` | @strudel/core | Pattern evaluation, reactive refs |
| `transpiler` | @strudel/transpiler | Code transpilation, widget extraction |
| `getAudioContext, webaudioOutput` | @strudel/webaudio | Web Audio integration |
| `registerSynthSounds` | @strudel/webaudio | Synth registration |
| `registerSoundfonts` | @strudel/soundfonts | SoundFont loading |
| `sliderWithID` | @strudel/codemirror | Slider widget factory |

### Future Module Dependencies
| Module | Dependencies | Purpose |
|--------|-------------|---------|
| `panelManager.js` | main.js, settingsManager.js | Panel state, CRUD |
| `settingsManager.js` | None (pure localStorage) | Settings persistence |
| `sliderRenderer.js` | panelManager.js | Slider UI generation |
| `api/server.js` | panelManager.js, WebSocket | Remote control API |

## Critical Paths for Development

### Adding New Panel (Epic 1)
1. **Modify:** `src/managers/panelManager.js` (create panel)
2. **Modify:** `src/ui/panelRenderer.js` (generate HTML)
3. **Modify:** `src/main.js` (attach event listeners)
4. **Test:** Panel appears, Play/Pause works

### Adding Settings UI (Epic 4)
1. **Create:** `src/managers/settingsManager.js`
2. **Create:** `src/ui/modalRenderer.js` (settings modal HTML)
3. **Modify:** `index.html` (add settings button)
4. **Test:** Settings save to localStorage, restore on load

### Implementing Staleness Detection (Epic 6)
1. **Modify:** `src/managers/panelManager.js` (add stale flag)
2. **Modify:** `src/main.js` (detect textarea changes)
3. **Modify:** `index.html` (add UPDATE button)
4. **Test:** Stale panels show UPDATE, clicking syncs code

---

**Maintained By:** Development Team
**Review Cycle:** Update with refactoring or new module additions
