# Epic 6: Staleness Detection and Update Controls

## Overview

Implement staleness detection to track when panel code differs from the currently playing pattern. This enables users to edit code without accidentally overwriting their live audio, and provides clear visual feedback about panel states.

## Business Value

- **Safety**: Users can edit code without disrupting live performance
- **Clarity**: Visual feedback shows which panels are "out of sync"
- **Workflow**: Separate PAUSE and UPDATE actions for better control
- **Batch Updates**: Update all stale panels simultaneously

## User Stories

### Story 6.1: Staleness Detection Logic

**As a** developer,
**I want** to detect when panel code differs from running pattern,
**so that** the UI can indicate staleness to the user

**Acceptance Criteria:**
1. Panel becomes "stale" when textarea content changes AND panel is playing
2. Panel becomes "not stale" when UPDATE button clicked (syncs code to audio)
3. Paused panels cannot become stale (no running pattern to differ from)
4. Panel state includes `stale: boolean` flag
5. Staleness persists in panel state (survives page reload if persistence enabled)

---

### Story 6.2: Separate PAUSE and ACTIVATE Buttons

**As a** live coder,
**I want** separate PAUSE and ACTIVATE buttons,
**so that** I can pause audio without losing the ability to update code

**Acceptance Criteria:**
1. Panel header displays TWO buttons: PAUSE and ACTIVATE (replaces single Play/Pause toggle)
2. PAUSE button always enabled when panel is playing
3. ACTIVATE button:
   - Displays "PLAY" when panel is paused and code unchanged
   - Displays "UPDATE" when panel is stale (code edited while playing)
   - Grayed out when panel is playing and not stale (code in sync)
4. Clicking PAUSE stops audio, sets playing=false, keeps code
5. Clicking ACTIVATE/UPDATE evaluates code and starts audio, clears stale flag

---

### Story 6.3: Visual Staleness Indicators

**As a** live coder,
**I want** clear visual feedback when a panel is stale,
**so that** I know which panels need updating

**Acceptance Criteria:**
1. Stale panels have visual indicator: border color change (e.g., orange/yellow)
2. UPDATE button highlighted or pulsing when stale
3. Panel title or header shows stale icon (e.g., ⚠️ or "modified" badge)
4. Non-stale playing panels use normal visual style (e.g., green border)
5. Paused panels use neutral style (e.g., gray border)

---

### Story 6.4: Top-Level UPDATE ALL Button

**As a** live coder,
**I want** a global "UPDATE ALL" button,
**so that** I can sync all stale panels to audio simultaneously

**Acceptance Criteria:**
1. Top-level button labeled "UPDATE ALL" visible in main UI
2. Button disabled/grayed when no stale panels exist
3. Button enabled when at least one panel is stale
4. Clicking button:
   - Evaluates code for ALL stale panels
   - Updates audio for all stale panels
   - Clears stale flag for all panels
5. Visual feedback during batch update (e.g., brief flash per panel)

---

### Story 6.5: Staleness Detection on Textarea Change

**As a** developer,
**I want** staleness to be set immediately when user edits textarea,
**so that** the UI updates in real-time

**Acceptance Criteria:**
1. `input` event listener on panel textarea
2. Event handler compares current textarea value to last-evaluated code
3. If different AND panel playing, set stale=true
4. If identical, set stale=false
5. UI updates immediately (no debounce delay)

---

## Technical Notes

- Store last-evaluated code separately from textarea content: `panel.lastEvaluatedCode`
- Staleness check: `panel.stale = panel.playing && (textarea.value !== panel.lastEvaluatedCode)`
- UPDATE button logic: `if (stale) { evaluate(textarea.value); panel.lastEvaluatedCode = textarea.value; stale = false; }`
- PAUSE button logic: `scheduler.stop(panelId); panel.playing = false;` (does NOT clear stale flag)
- UPDATE ALL implementation: `stalePanels.forEach(panel => panel.clickUpdate())`

## Dependencies

- Epic 1: Dynamic Panel Management (panel state tracking)

## Related Epics

- Epic 2: Enhanced Panel UI (button layout in header)
- Epic 5: Server Endpoints (API returns stale flag)

## Out of Scope

- Auto-update on code change (user controls when to sync)
- Undo/redo for code changes (future enhancement)
- Visual diff of code vs. running pattern (complex, future consideration)
