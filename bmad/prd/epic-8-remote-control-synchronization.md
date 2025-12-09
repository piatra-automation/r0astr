# Epic 8: Remote Control Synchronization

## Overview

Ensure the remote.html WebSocket client interface stays synchronized with dynamic panel changes (creation, deletion, renaming) introduced in Epics 1-2. The remote control interface must automatically update its UI to reflect the current panel state.

## Business Value

- **Remote Control Continuity**: v0.2.0 remote control remains functional after dynamic panel implementation
- **Live Performance**: Remote interface updates in real-time during panel changes
- **Multi-Device Workflow**: iPad/phone remote stays synchronized with main interface
- **User Experience**: No manual refresh needed on remote device

## User Stories

### Story 8.1: Remote UI Updates on Panel Creation

**As a** remote control user,
**I want** new panels to appear automatically on my remote device,
**so that** I can control newly created instruments without refreshing

**Acceptance Criteria:**
1. When main interface creates panel, remote.html receives `panel_created` event
2. Remote client dynamically adds panel controls to UI
3. New panel controls include: title, Play/Pause/Stop buttons
4. Panel appears in same order as main interface
5. No page refresh required on remote device

---

### Story 8.2: Remote UI Updates on Panel Deletion

**As a** remote control user,
**I want** deleted panels to disappear automatically from my remote device,
**so that** I don't see controls for non-existent instruments

**Acceptance Criteria:**
1. When main interface deletes panel, remote.html receives `panel_deleted` event
2. Remote client removes panel controls from UI
3. Deleted panel controls are removed smoothly (fade-out animation)
4. Remaining panels maintain correct order
5. No orphaned controls or broken buttons

---

### Story 8.3: Remote UI Updates on Panel Rename

**As a** remote control user,
**I want** panel title changes to appear automatically on my remote device,
**so that** I see the same instrument names as the main interface

**Acceptance Criteria:**
1. When main interface renames panel, remote.html receives `panel_renamed` event
2. Remote client updates panel title in UI immediately
3. Title update does not affect button states (Play/Pause)
4. Title updates are debounced if user types rapidly (500ms)
5. Master panel title changes also synchronized

---

### Story 8.4: Full Panel State Sync on Remote Connect

**As a** remote control user,
**I want** to see all current panels when I connect,
**so that** my remote matches the main interface state

**Acceptance Criteria:**
1. When remote client connects, server sends `full_state` message
2. `full_state` includes all panels: `[{ id, title, playing, stale }]`
3. Remote client rebuilds entire UI from full state
4. Handles connecting mid-session (panels already created/deleted)
5. Handles reconnection after temporary disconnect

---

### Story 8.5: Remote Panel Order Synchronization

**As a** remote control user,
**I want** panels to appear in the same order on my remote device,
**so that** I can easily find instruments by position

**Acceptance Criteria:**
1. Remote UI displays panels in same order as main interface
2. Panel order maintained during creation/deletion
3. If main interface supports drag-to-reorder (future), remote syncs order
4. Master panel always appears first in remote UI
5. Panel order updates use smooth CSS transitions

---

## Technical Notes

- Extends Epic 5 WebSocket implementation (v0.2.0)
- New WebSocket events:
  - `panel_created`: `{ id, title, position }`
  - `panel_deleted`: `{ id }`
  - `panel_renamed`: `{ id, newTitle }`
  - `full_state`: `{ panels: [...] }`
- Remote client uses dynamic DOM manipulation (create/remove elements)
- Panel controls template: `<div class="remote-panel" data-panel-id="${id}">...</div>`
- CSS transitions for smooth add/remove animations

## Dependencies

- **Epic 1**: Dynamic Panel Management (panel CRUD triggers events)
- **Epic 2**: Enhanced Panel UI (panel renaming)
- **Epic 5**: Server Endpoints (WebSocket state sync foundation)
- **v0.2.0**: Existing remote.html and WebSocket server

## Related Epics

- Epic 6: Staleness Detection (stale flag in panel state)
- Epic 7: Text Panel Improvements (no direct impact on remote)

## Out of Scope

- Remote code editing (remote is control-only, not editor)
- Remote panel creation/deletion (control from main interface only)
- Multi-remote synchronization (multiple remote clients)
- Remote settings configuration

## Breaking Change Alert

⚠️ **CRITICAL**: Epic 1-2 implementation will break existing remote.html (v0.2.0) if Epic 8 is not implemented.

**Current remote.html assumes:**
- Exactly 4 fixed panels (card-1 through card-4)
- Hardcoded panel IDs in HTML
- No dynamic panel lifecycle

**After Epic 1-2:**
- Variable number of panels
- Dynamic panel IDs (timestamp-based)
- Panels can be created/deleted/renamed

**Epic 8 must be implemented alongside or immediately after Epic 1-2** to maintain remote control functionality.

---

**Total Stories:** 5 (8.1 through 8.5)
**Priority:** High (blocks Epic 1-2 deployment to production)
