# Epic 1: Dynamic Panel Management

## Overview

Enable users to dynamically add and delete instrument panels beyond the fixed 4-panel layout. This provides flexibility for live performance workflows where the number of instruments varies.

## Business Value

- **Flexibility**: Users can create exactly the number of panels they need
- **Performance Workflow**: Support varied setups from minimal 1-panel to complex multi-panel arrangements
- **User Control**: Empowers users to customize their workspace

## User Stories

### Story 1.1: Add New Panel Button

**As a** live coder,
**I want** a top-level [+] button to create new panels,
**so that** I can expand my instrument setup during performance preparation

**Acceptance Criteria:**
1. Top-level [+] button is visible and clearly labeled
2. Clicking [+] creates a new panel with default empty pattern
3. New panel appears with unique ID and default title (e.g., "Instrument 5")
4. New panel has full functionality (play/pause, sliders, code editing)
5. Panel count can exceed 4 (no arbitrary limits)

---

### Story 1.2: Delete Panel Functionality

**As a** live coder,
**I want** to delete panels I no longer need,
**so that** I can simplify my workspace and remove unused instruments

**Acceptance Criteria:**
1. Each panel (except master panel) has a visible [X] delete button in header
2. Master panel does NOT have a delete button (protected)
3. Clicking [X] either:
   - Immediately deletes panel if `settings.yolo === true`
   - Shows confirmation dialog if `settings.yolo === false`
4. Deleted panel is removed from DOM
5. Deleted panel's audio pattern is stopped
6. Panel IDs remain stable for remaining panels (no re-indexing)

---

### Story 1.3: Master Panel Protection

**As a** system designer,
**I want** the master panel to be non-deletable,
**so that** global controls and settings always remain accessible

**Acceptance Criteria:**
1. Master panel is identified with special CSS class or ID
2. Master panel header does not render [X] delete button
3. Master panel cannot be programmatically deleted via any API
4. Master panel can still be moved/resized like other panels
5. Documentation clearly identifies master panel purpose

---

## Technical Notes

- Current implementation has 4 hardcoded cards in `index.html:172-204`
- Refactor needed: Dynamic panel creation instead of static HTML
- Panel state management required: track panel IDs, playing states, positions
- Master panel special handling needed in panel manager

## Dependencies

- None (foundational epic)

## Related Epics

- Epic 2: Enhanced Panel UI (editable titles, drag/resize)
- Epic 4: Settings System (settings.yolo parameter)
- Epic 6: Staleness Detection (panel state tracking)

## Out of Scope

- Panel persistence (covered in Epic 4)
- Resizable/draggable panels (covered in Epic 2)
- Server-side panel management (covered in Epic 5)
