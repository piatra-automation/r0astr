# Epic 10: UI Module Extraction

## Overview

Extract UI coordination code from main.js into dedicated modules to unblock Story 9.8. This epic focuses on **modularizing UI logic** without changing behavior - extracting CodeMirror setup, panel rendering, event handling, and pattern validation from the monolithic main.js (~2000 lines of UI code).

**Type:** Technical Foundation (Non-user-facing)
**Priority:** High (Blocks Epic 9 completion - Story 9.8)
**Estimated Effort:** 4 stories
**Dependencies:** Requires Epic 9 Stories 9.4-9.7 (manager modules) ✅ Complete

## Business Value

- **Unblocks Epic 9**: Enables completion of Story 9.8 (Refactor main.js to < 200 lines)
- **Code Clarity**: UI coordination logic isolated to dedicated modules
- **Maintainability**: Easier to debug and extend UI behavior
- **Separation of Concerns**: Business logic (managers) separate from UI coordination
- **Testing**: Modular UI code enables future unit testing

## Current State Problems

**From Story 9.8 Dev Agent Record:**

1. **main.js contains ~2000 lines of UI coordination code:**
   - CodeMirror editor creation and management (~600 lines)
   - Master panel specific logic (~400 lines)
   - Pattern validation and error display (~300 lines)
   - DOM event listeners and keyboard shortcuts
   - Panel rendering and restoration logic
   - Drag/resize initialization

2. **Epic 9 successfully extracted business logic:**
   - ✅ Story 9.4: panelManager.js (panel CRUD)
   - ✅ Story 9.5: sliderManager.js (slider rendering)
   - ✅ Story 9.6: settingsManager.js (settings persistence)
   - ✅ Story 9.7: websocketManager.js (remote control)

3. **Story 9.8 blocked:**
   - Cannot reduce main.js to < 200 lines until UI code extracted
   - Epic 9 assumed UI code was already modularized
   - Reality: UI coordination never extracted from original monolith

## Goals

### Primary Goals

1. **Extract panel UI coordination** to `src/ui/panelCoordinator.js` (~600 lines)
2. **Extract master panel logic** to `src/ui/masterPanelCoordinator.js` (~400 lines)
3. **Extract pattern validation** to `src/ui/patternValidator.js` (~300 lines)
4. **Complete Story 9.8** refactoring main.js to < 200 lines

### Success Criteria

- ✅ All UI coordination code in dedicated modules
- ✅ CodeMirror editor management isolated to panelCoordinator
- ✅ Master panel uses regex parsing (NOT transpiler - see gotchas)
- ✅ Pattern validation separated from panel logic
- ✅ main.js reduced to < 200 lines (initialization glue only)
- ✅ Application functions identically before/after extraction
- ✅ No visual or behavioral changes

## Technical Scope

### In Scope

- Panel UI coordinator: CodeMirror setup, DOM events, panel rendering
- Master panel coordinator: Global sliders, TEMPO control, regex parsing
- Pattern validator: Syntax validation, error display, staleness detection
- Event bus integration: Cross-module communication
- Story 9.8 completion: Final main.js refactor

### Out of Scope

- Visual redesign (Epic 2 handles UI improvements)
- New features (handled by other epics)
- Testing infrastructure (future epic)
- Drag/resize implementation changes (keep existing interact.js logic)
- Business logic changes (managers already extracted in Epic 9)

## Architecture Reference

See `bmad/architecture/frontend-architecture.md` for:
- Proposed ui/ directory structure
- Component patterns and standards
- Event bus integration patterns

See `docs/architecture/strudel-integration-gotchas.md` for:
- **CRITICAL:** Master panel transpiler blocking issue
- Regex parsing pattern for master panel (NOT transpiler)
- TEMPO slider CPS conversion requirements
- Slider reactivity patterns

## Dependencies

**Blocks:**
- Epic 9 Story 9.8 (currently blocked)
- Future testing infrastructure (needs modular UI code)

**Depends On:**
- ✅ Epic 9 Stories 9.4-9.7 (manager modules complete)
- ✅ Story 9.3: Event Bus (eventBus.js created)

**Related:**
- Epic 2: Enhanced Panel UI (will use panel coordinator)
- Epic 6: Staleness Detection (uses pattern validator)

## User Stories

### Story 10.1: Create Panel UI Coordinator Module

**As a** developer,
**I want** panel UI coordination logic extracted to a dedicated module,
**so that** CodeMirror setup and panel rendering are isolated from main.js

**Acceptance Criteria:**
1. Create `src/ui/panelCoordinator.js` module
2. Export functions:
   - `initializePanelUI(panelId)` - Create CodeMirror editor, attach DOM events
   - `renderPanelControls(panelId)` - Render play/pause/delete buttons
   - `attachPanelEventListeners(panelId)` - Button clicks, keyboard shortcuts
   - `updatePanelUI(panelId, state)` - Visual state updates
   - `handlePanelKeyboardShortcuts(event, panelId)` - Ctrl+Enter, Ctrl+K, etc.
3. Use event bus for cross-module communication:
   - Emit: `panel:uiReady`, `panel:buttonClicked`, `panel:keyboardShortcut`
   - Listen: `panel:stateChanged`, `panel:playing`, `panel:paused`
4. Import and use: panelManager, sliderManager, eventBus
5. No business logic (delegate to managers)
6. Application functions identically before/after extraction

**Technical Notes:**
- Extract CodeMirror 6 editor setup from main.js (lines 1536-1631 of original)
- Each panel needs: EditorView, EditorState, font size compartment
- Panel buttons: ACTIVATE, PAUSE, DELETE, RENAME, EXPAND/COLLAPSE
- Keyboard shortcuts: Ctrl+Enter (evaluate), Ctrl+K (stop), Ctrl+S (save)
- Use EditorView from @codemirror

**Estimated Complexity:** Medium (600 lines to extract, well-defined scope)

---

### Story 10.2: Create Master Panel Coordinator Module

**As a** developer,
**I want** master panel-specific logic extracted to a dedicated module,
**so that** global slider and TEMPO handling are isolated from main.js

**Acceptance Criteria:**
1. Create `src/ui/masterPanelCoordinator.js` module
2. Export functions:
   - `initializeMasterPanel()` - Setup master panel UI
   - `evaluateMasterCode(code)` - Parse and evaluate master code (TEMPO, global sliders)
   - `renderMasterSliders(widgets)` - Render global slider controls
   - `renderTempoControl()` - Render TEMPO knob/slider
   - `toggleMasterMode()` - Switch between compact/expanded modes
   - `updateMasterSliderValue(sliderId, value)` - Handle master slider changes
3. **CRITICAL:** Use regex parsing for master panel code (NOT transpiler)
   - Reason: transpiler() HANGS in master panel context (see strudel-integration-gotchas.md)
   - Pattern: `/let\s+([A-Z_][A-Z0-9_]*)\s*=\s*slider\s*\(([^)]+)\)/g`
4. TEMPO slider special handling:
   - Convert CPM (cycles per minute) to CPS (cycles per second)
   - Use `scheduler.setCps()` NOT `setCpm()` (see gotchas)
   - Formula: `cps = cpm / 60`
5. Use event bus:
   - Emit: `master:evaluated`, `master:sliderChanged`, `master:tempoChanged`
   - Listen: `master:modeToggled`
6. Application functions identically before/after extraction

**Technical Notes:**
- Extract master panel logic from main.js (lines 399-665 of original)
- Global sliders create refs accessible in all panels
- Master panel code uses regex parsing (NOT transpiler - see CLAUDE.md gotchas)
- TEMPO slider requires scheduler.setCps() conversion

**Estimated Complexity:** Medium-High (regex parsing logic, TEMPO gotchas)

---

### Story 10.3: Create Pattern Validator Module

**As a** developer,
**I want** pattern validation logic extracted to a dedicated module,
**so that** syntax checking and error display are isolated from panel logic

**Acceptance Criteria:**
1. Create `src/ui/patternValidator.js` module
2. Export functions:
   - `validateCode(panelId, code)` - Validate pattern syntax using Strudel transpiler
   - `displayError(panelId, errorMessage, lineNumber)` - Show error UI
   - `clearErrorMessage(panelId)` - Remove error UI
   - `checkStaleness(panelId)` - Detect if code changed since last eval
   - `updateActivateButton(panelId)` - Enable/disable based on validation
   - `updatePauseButton(panelId)` - Update pause button state
3. Use Strudel transpiler for syntax validation:
   - Import `transpiler` from @strudel/transpiler
   - Catch transpilation errors to detect invalid syntax
   - Extract line numbers from error messages
4. Use event bus:
   - Emit: `pattern:valid`, `pattern:invalid`, `panel:stale`
   - Listen: `panel:codeChanged`, `panel:evaluated`
5. Update button states (enable/disable based on validity)
6. Application functions identically before/after extraction

**Technical Notes:**
- Extract validation logic from main.js (lines 1357-1455 of original)
- Uses Strudel transpiler to detect syntax errors
- Error display: inline error message with line number
- Staleness detection: compare current code with last evaluated code

**Estimated Complexity:** Low-Medium (well-defined validation logic)

---

### Story 10.4: Complete Story 9.8 - Refactor main.js

**As a** developer,
**I want** main.js to only handle initialization and wiring,
**so that** it's easy to understand the application entry point

**Prerequisites:** Stories 10.1, 10.2, 10.3 complete

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
4. UI coordinator imports:
   ```javascript
   import { panelCoordinator } from './ui/panelCoordinator.js';
   import { masterPanelCoordinator } from './ui/masterPanelCoordinator.js';
   import { patternValidator } from './ui/patternValidator.js';
   ```
5. Initialization sequence:
   - Load settings
   - Initialize Strudel (samples, repl)
   - Setup event listeners
   - Initialize managers
   - Initialize UI coordinators
   - Hide splash screen
6. No business logic or UI coordination in `main.js` (delegated to modules)
7. Application functions identically before/after refactor

**Expected Outcome:**
- main.js: ~180 lines (down from 4087)
- Breakdown:
  - Imports: 25 lines
  - Strudel init: 80 lines (loadModules, prebake, REPL)
  - Event listeners: 30 lines
  - Event handlers: 40 lines (thin wrappers)
  - Comments: 5 lines

**Technical Notes:**
- Import UI coordinators created in Stories 10.1-10.3
- Create `initializeApp()` calling coordinator init functions
- Create `setupEventListeners()` connecting eventBus to Strudel
- Keep Strudel init (tightly coupled to Web Audio, must stay in main.js)
- Remove all code now in coordinators

**Estimated Complexity:** Low (final assembly, most work done in 10.1-10.3)

---

## Dependencies & Sequencing

### Epic 10 Dependency Chain

```
Story 10.1 (Panel UI Coordinator)   ─┐
Story 10.2 (Master Panel Coord)     ─┼──> Story 10.4 (Complete 9.8)
Story 10.3 (Pattern Validator)      ─┘
```

**Stories 10.1, 10.2, 10.3 can be developed in parallel**
**Story 10.4 requires ALL three complete**

## Non-Goals

This epic explicitly does NOT include:

- ❌ Visual redesign or UI improvements
- ❌ New features (leave to other epics)
- ❌ Testing framework setup (future epic)
- ❌ Refactoring existing UI logic (just extract, don't change)
- ❌ Performance optimization (focus on extraction)
- ❌ Changing manager modules (Epic 9 already complete)

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking Strudel integration | Medium | High | Follow strudel-integration-gotchas.md patterns exactly |
| CodeMirror editor issues | Medium | High | Extract exact existing logic, no refactoring |
| Master panel transpiler hang | High | Critical | Use regex parsing (documented pattern), NOT transpiler |
| Circular dependencies | Low | Medium | Use event bus for cross-module communication |
| Import path issues | Low | Medium | Test after each module creation |

## Success Metrics

- ✅ Zero visual or behavioral regressions
- ✅ `main.js` < 200 lines
- ✅ 3 UI coordinator modules created
- ✅ Event bus used for all cross-module communication
- ✅ Application functions identically before/after
- ✅ Story 9.8 acceptance criteria met
- ✅ Epic 9 completed

## Future Enablement

This extraction enables:

- **Epic 9 Completion:** Story 9.8 can finally be marked Done
- **Testing Infrastructure:** Modular UI code is testable
- **Enhanced Panel UI (Epic 2):** Can modify panel coordinator without touching main.js
- **Code Maintainability:** Clear separation of concerns for future development

## Technical Guidance for Dev Agents

### For Stories 10.1-10.3:
- **Extract, don't refactor:** Move functions from main.js as-is, no logic changes
- **Maintain existing behavior:** Application must function identically
- **Use event bus:** Cross-module communication via eventBus (no direct imports)
- **Add JSDoc:** Document all exported functions
- **Import managers:** Use existing panelManager, sliderManager, etc. (don't reimplement)
- **Follow gotchas:** Read strudel-integration-gotchas.md BEFORE implementing

### For Story 10.4:
- **Import coordinators:** Use modules created in 10.1-10.3
- **Create initializeApp():** Call coordinator init functions in sequence
- **Create setupEventListeners():** Connect eventBus to Strudel
- **Keep Strudel init:** loadModules(), prebake(), REPL setup (tightly coupled to Web Audio)
- **Remove extracted code:** All UI coordination now in coordinators
- **Verify line count:** Target < 200 lines (excluding blank lines/comments)

---

**Status:** Draft
**Created:** 2025-12-09
**Last Updated:** 2025-12-09
**Next Review:** After story 10.1 completion
