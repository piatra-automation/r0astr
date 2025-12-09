# Epic 9: Code Architecture Refactor

## Overview

Refactor r0astr codebase to establish clean separation of concerns, modular architecture, and maintainable patterns. This epic focuses on **code organization without visual changes** - extracting inline styles, modularizing monolithic files, and implementing foundational patterns that enable future extensibility (skin system, testing, maintainability).

**Type:** Technical Foundation (Non-user-facing)
**Priority:** High (Prerequisite for Epic 10: Skin System)
**Estimated Effort:** 5-8 stories

## Business Value

- **Maintainability**: Modular code is easier to debug, test, and extend
- **Foundation for Skins**: CSS variable system enables user skin customization
- **Developer Velocity**: Clear patterns reduce cognitive load for future changes
- **Code Quality**: Separation of concerns prevents bugs and coupling
- **Technical Debt Reduction**: Addresses brownfield architecture issues before they compound

## Current State Problems

**From `bmad/brownfield-architecture.md` and `bmad/architecture/frontend-architecture.md`:**

1. **Inline CSS (400+ lines in index.html)**: No theming, hard to maintain, blocks skin system
2. **Monolithic main.js (~800 lines)**: Mixed concerns (Strudel init, panel CRUD, sliders, WebSocket)
3. **No Module Separation**: All logic in single file, tight coupling
4. **No CSS Variables**: Hardcoded colors/dimensions, impossible to theme
5. **No Event System**: Direct function calls create tight coupling

## Goals

### Primary Goals

1. **Extract all inline CSS** to `static/css/base.css` with comprehensive CSS variable system
2. **Modularize main.js** into manager modules (`panelManager.js`, `settingsManager.js`, `sliderManager.js`, etc.)
3. **Implement Event Bus** for decoupled cross-component communication
4. **Establish Project Structure** per Winston's architecture (managers/, utils/, templates/)
5. **Zero Visual Changes** - refactor is invisible to users

### Success Criteria

- ✅ No inline styles remain in `index.html`
- ✅ All colors/dimensions defined as CSS variables in `:root`
- ✅ `main.js` < 200 lines (just initialization glue)
- ✅ Manager modules follow single-responsibility principle
- ✅ Event bus used for cross-module communication
- ✅ Application functions identically before/after refactor
- ✅ No visual regressions

## Technical Scope

### In Scope

- CSS extraction and variable system
- JavaScript modularization (managers pattern)
- Event bus implementation
- Directory restructure (`src/managers/`, `src/utils/`)
- Import/export refactoring (ES modules)

### Out of Scope

- Visual redesign (Epic 2 handles UI improvements)
- New features (handled by other epics)
- Web Components migration (future consideration)
- TypeScript conversion (not planned)
- Testing infrastructure (future epic)

## Architecture Reference

See `bmad/architecture/frontend-architecture.md` for:
- Proposed project structure
- Manager module patterns
- Event bus implementation
- CSS variable naming conventions
- Component standards

## Dependencies

**Blocks:**
- Epic 10: User Skin System (requires CSS variables)

**Depends On:**
- None (can start immediately)

**Related:**
- Epic 4: Settings System (settings manager will be created here)
- Epic 2: Enhanced Panel UI (benefits from cleaner architecture)

## User Stories

### Story 9.1: Extract Inline CSS to External File

**As a** developer,
**I want** all inline CSS moved to `static/css/base.css`,
**so that** styles are maintainable and can be overridden by skins

**Acceptance Criteria:**
1. Create `static/css/base.css` with all styles from `index.html`
2. Remove all `<style>` blocks from `index.html`
3. Link external stylesheet: `<link rel="stylesheet" href="/static/css/base.css">`
4. Application renders identically before/after extraction
5. No inline `style=""` attributes remain (except dynamic positioning from interact.js)

**Technical Notes:**
- Preserve existing CSS structure initially (clean selector names in separate story)
- Ensure Vite serves static files correctly
- Verify HMR works for CSS changes

---

### Story 9.2: Define Comprehensive CSS Variable System

**As a** developer,
**I want** all colors, dimensions, and design tokens defined as CSS variables,
**so that** the interface can be themed via variable overrides

**Acceptance Criteria:**
1. Define CSS variables in `:root` for all design tokens:
   - Colors: `--pale-white`, `--dark-green`, `--burnt-red`, `--darkness`
   - Dimensions: `--hole-size`, `--corner-ring-size`, `--radius-sm`, `--radius-md`
   - Typography: `--font-family`, `--font-size-base`, `--font-size-lg`
   - Spacing: `--spacing-sm`, `--spacing-md`, `--spacing-lg`
   - Z-index: `--z-panel`, `--z-modal`, `--z-splash`
2. Replace all hardcoded colors with `var(--variable-name)`
3. Replace all hardcoded dimensions with CSS variables
4. Document CSS variable system in `bmad/architecture/css-variables.md`
5. Application renders identically before/after variable replacement

**Technical Notes:**
- Follow naming conventions from `frontend-architecture.md` Section 10
- Variables should be semantic (e.g., `--color-primary` not `--green-500`)
- Ensure contrast ratios meet WCAG AA for accessibility

---

### Story 9.3: Create Event Bus Module

**As a** developer,
**I want** a centralized event bus for cross-component communication,
**so that** modules are decoupled and easier to test

**Acceptance Criteria:**
1. Create `src/utils/eventBus.js` with EventBus class
2. Implement methods: `on(event, callback)`, `emit(event, data)`, `off(event, callback)`
3. Export singleton instance: `export const eventBus = new EventBus()`
4. Add JSDoc documentation for all methods
5. No external dependencies (vanilla JavaScript implementation)

**Technical Notes:**
- Reference implementation in `frontend-architecture.md` Section 8
- Use Map for listener storage (better performance than objects)
- Support multiple listeners per event
- Namespace events with prefixes (e.g., `panel:created`, `skin:loaded`)

---

### Story 9.4: Create Panel Manager Module

**As a** developer,
**I want** panel lifecycle management extracted to a dedicated module,
**so that** panel logic is isolated and maintainable

**Acceptance Criteria:**
1. Create `src/managers/panelManager.js`
2. Move panel-related code from `main.js`:
   - `createPanel(id, code, options)`
   - `deletePanel(id)`
   - `updatePanelCode(id, code)`
   - Panel state management (panelState Map)
3. Export manager functions as ES module
4. Use event bus for cross-module communication:
   - `eventBus.emit('panel:created', panel)`
   - `eventBus.emit('panel:deleted', panelId)`
5. Import and use in `main.js`

**Technical Notes:**
- Panel state stored in module-private Map
- Follow manager pattern from `frontend-architecture.md` Section 8
- Maintain existing panel creation logic (no behavioral changes)

---

### Story 9.5: Create Slider Manager Module

**As a** developer,
**I want** slider rendering and management extracted to a dedicated module,
**so that** slider logic is isolated from panel management

**Acceptance Criteria:**
1. Create `src/managers/sliderManager.js`
2. Move slider-related code from `main.js`:
   - `renderSliders(panelId, widgets)`
   - `createSliderElement(widget)`
   - Slider event handlers
3. Link to Strudel's `sliderValues` ref
4. Use event bus: `eventBus.emit('slider:changed', { panelId, sliderId, value })`
5. Import and use in panel manager

**Technical Notes:**
- Preserve Strudel integration (slider transpilation via `@strudel/codemirror`)
- Reference `frontend-architecture.md` Section 7 for CodeMirror patterns
- Sliders remain reactive (updates trigger pattern re-evaluation)

---

### Story 9.6: Create Settings Manager Module

**As a** developer,
**I want** settings persistence logic extracted to a dedicated module,
**so that** settings can be managed independently

**Acceptance Criteria:**
1. Create `src/managers/settingsManager.js`
2. Implement functions:
   - `loadSettings()` - Reads from localStorage, returns default on error
   - `saveSettings(settings)` - Writes to localStorage
   - `getSettings()` - Returns current settings object
3. Define default settings structure:
   ```javascript
   {
     appearance: { colorScheme: 'dark', fontSize: 14 },
     skin: { enabled: true, currentSkin: 'default' },
     audio: { sampleLibrary: 'dirt-samples' }
   }
   ```
4. Use event bus: `eventBus.emit('settings:saved', settings)`
5. Graceful error handling (malformed JSON falls back to defaults)

**Technical Notes:**
- Storage key: `r0astr-settings`
- Deep merge saved settings with defaults (handle partial saves)
- Reference `frontend-architecture.md` Section 8 for implementation

---

### Story 9.7: Create WebSocket Manager Module

**As a** developer,
**I want** WebSocket remote control logic extracted to a dedicated module,
**so that** network communication is isolated

**Acceptance Criteria:**
1. Create `src/managers/websocketManager.js`
2. Move WebSocket code from `main.js`:
   - Connection management
   - Message handling
   - Broadcast functions
3. Define message types:
   - `PANEL_PLAY`, `PANEL_PAUSE`, `PANEL_UPDATE_CODE`, `STOP_ALL`, `STATE_SYNC`
4. Use event bus for incoming messages:
   - `eventBus.emit('panel:play', panelId)`
   - `eventBus.emit('stopAll')`
5. Listen for outgoing events:
   - `eventBus.on('panel:created', (panel) => broadcast('PANEL_CREATED', panel))`

**Technical Notes:**
- Reference `frontend-architecture.md` Section 9 for API message types
- Handle connection failures gracefully (auto-reconnect)
- Maintain existing WebSocket server compatibility

---

### Story 9.8: Refactor main.js as Initialization Glue

**As a** developer,
**I want** main.js to only handle initialization and wiring,
**so that** it's easy to understand the application entry point

**Acceptance Criteria:**
1. `main.js` reduced to < 200 lines (just imports and initialization)
2. Strudel initialization remains in `main.js` (async sample loading, repl setup)
3. Manager imports at top:
   ```javascript
   import { panelManager } from './managers/panelManager.js';
   import { settingsManager } from './managers/settingsManager.js';
   import { sliderManager } from './managers/sliderManager.js';
   import { websocketManager } from './managers/websocketManager.js';
   import { eventBus } from './utils/eventBus.js';
   ```
4. Initialization sequence:
   - Load settings
   - Initialize Strudel (samples, repl)
   - Setup event listeners
   - Initialize managers
   - Hide splash screen
5. No business logic in `main.js` (delegated to managers)

**Technical Notes:**
- Entry point clarity is critical for onboarding
- Keep Strudel-specific logic here (tightly coupled to Web Audio)
- Document initialization order (settings → audio → managers → UI)

---

### Story 9.9: Create Directory Structure

**As a** developer,
**I want** source files organized into logical directories,
**so that** the codebase is navigable and scalable

**Acceptance Criteria:**
1. Create directory structure:
   ```
   src/
   ├── main.js               (< 200 lines)
   ├── managers/
   │   ├── panelManager.js
   │   ├── settingsManager.js
   │   ├── sliderManager.js
   │   └── websocketManager.js
   └── utils/
       └── eventBus.js
   ```
2. Update import paths in all files
3. Verify Vite resolves imports correctly
4. Application runs without errors
5. Update `bmad/architecture/source-tree.md` to reflect new structure

**Technical Notes:**
- Use relative imports (`./managers/panelManager.js`)
- Vite handles ES modules natively (no config changes needed)
- Future: Add `templates/`, `security/` directories for skin system

---

### Story 9.10: Verification and Regression Testing

**As a** developer,
**I want** to verify the refactor introduces no regressions,
**so that** users experience zero downtime or bugs

**Acceptance Criteria:**
1. **Functional Testing:**
   - Create panel → plays pattern → sliders work → delete panel
   - WebSocket remote control functions (play, pause, update code)
   - Settings persistence (save → reload → verify restored)
   - Master panel sliders control all panels
2. **Visual Regression:**
   - Screenshot comparison before/after refactor (identical)
   - No layout shifts or color changes
   - Z-index/layering unchanged
3. **Performance Testing:**
   - Pattern evaluation latency unchanged (< 10ms)
   - Initial load time similar (± 100ms acceptable)
   - Memory usage stable
4. **Code Quality:**
   - No ESLint errors (if linter configured)
   - All imports resolve correctly
   - No console errors

**Technical Notes:**
- Manual testing acceptable (no automated tests yet)
- Use browser DevTools Performance tab for metrics
- Document any issues found and fixed

---

## Non-Goals

This epic explicitly does NOT include:

- ❌ Visual redesign or UI improvements
- ❌ New features (leave to other epics)
- ❌ Testing framework setup (future epic)
- ❌ TypeScript migration (not planned)
- ❌ Web Components (future consideration)
- ❌ Build optimization (Vite already optimal)

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking Strudel integration | Medium | High | Preserve exact transpiler/slider logic, test thoroughly |
| Import path issues | Low | Medium | Vite handles ES modules well, test after each change |
| Performance regression | Low | Medium | Benchmark before/after, modularization is generally faster |
| Merge conflicts with active development | High | Medium | Complete refactor in dedicated branch, merge quickly |

## Success Metrics

- ✅ Zero visual regressions (pixel-perfect comparison)
- ✅ `main.js` < 200 lines
- ✅ All inline CSS removed
- ✅ 50+ CSS variables defined
- ✅ 4+ manager modules created
- ✅ Event bus used for all cross-module communication
- ✅ Application functions identically before/after

## Future Enablement

This refactor enables:

- **Epic 10: User Skin System** - CSS variables allow skin overrides
- **Testing Infrastructure** - Modular code is testable
- **Performance Optimization** - Clear separation enables targeted optimization
- **Onboarding** - Clean architecture is easier for new developers to understand

---

**Status:** Draft
**Created:** 2025-12-09
**Last Updated:** 2025-12-09
**Next Review:** After story 9.1 completion
