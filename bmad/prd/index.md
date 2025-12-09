# r0astr Product Requirements Document (PRD)

**Version:** v3
**Last Updated:** 2025-11-16
**Status:** Active Development

## Project Overview

r0astr is a multi-instrument live coding interface built on top of the Strudel pattern language. This PRD defines the roadmap from the current v0.2.0 state (fixed 4-panel layout) to a dynamic, customizable, remote-controllable live performance tool.

## Vision

Transform r0astr from a static 4-panel interface into a flexible, professional-grade live coding environment with:
- Dynamic panel creation/deletion
- Draggable, resizable modal panels
- Persistent user settings and workspace state
- Splash screen with sample loading feedback
- WebSocket remote control for MCP/AI integration
- Staleness detection for safe live editing
- Enhanced text editing with syntax highlighting and validation

## Current State (v0.2.0)

- ✅ 4 fixed instrument panels with synchronized audio clock
- ✅ Dynamic slider generation from pattern code
- ✅ Sample library pre-loading (dirt-samples)
- ✅ WebSocket remote control system for live performance
- ❌ Fixed panel count (cannot add/remove panels)
- ❌ No panel persistence
- ❌ No settings UI
- ❌ No staleness detection

## Epic Roadmap

### Epic 1: Dynamic Panel Management
**Priority:** High
**Stories:** 3
**Status:** Not Started

Enable users to add and delete panels dynamically with master panel protection.

- Story 1.1: Add New Panel Button
- Story 1.2: Delete Panel Functionality
- Story 1.3: Master Panel Protection

[→ Full Epic Details](epic-1-dynamic-panel-management.md)

---

### Epic 2: Enhanced Panel UI
**Priority:** High
**Stories:** 4
**Status:** Not Started
**Dependencies:** Epic 1

Transform panels into draggable, resizable modals with editable titles.

- Story 2.1: Editable Panel Titles
- Story 2.2: Resizable Panels
- Story 2.3: Draggable Modal Panels
- Story 2.4: Z-Index Management (Bring to Front)

[→ Full Epic Details](epic-2-enhanced-panel-ui.md)

---

### Epic 3: Splash/Hero Screen
**Priority:** Medium
**Stories:** 3
**Status:** Not Started

Branded splash screen with sample loading progress and minimum display time.

- Story 3.1: Splash Modal with Branding
- Story 3.2: Sample Loading Progress Bar
- Story 3.3: Minimum Splash Display Time

[→ Full Epic Details](epic-3-splash-hero-screen.md)

---

### Epic 4: Settings System
**Priority:** High
**Stories:** 6
**Status:** Not Started
**Dependencies:** Epic 1, Epic 2

Comprehensive settings with JSON storage, panel state persistence, and UI controls.

- Story 4.1: Settings JSON Structure and Storage
- Story 4.2: Panel State Persistence
- Story 4.3: Settings Panel UI
- Story 4.4: Behavior Settings Controls
- Story 4.5: Appearance Settings Controls
- Story 4.6: Integration Settings Controls

[→ Full Epic Details](epic-4-settings-system.md)

---

### Epic 5: Server Endpoints (WebSocket Remote Control)
**Priority:** Medium
**Stories:** 6
**Status:** Partially Complete (WebSocket v0.2.0)
**Dependencies:** Epic 1, Epic 6

HTTP/WebSocket endpoints for external control and MCP integration.

**Note:** Basic WebSocket remote control implemented in v0.2.0. This epic expands to full REST API.

- Story 5.1: Create Panel Endpoint
- Story 5.2: Delete Panel Endpoint
- Story 5.3: Update Panel Code Endpoint
- Story 5.4: Play/Pause Panel Endpoint
- Story 5.5: List Panels Endpoint
- Story 5.6: WebSocket State Sync

[→ Full Epic Details](epic-5-server-endpoints.md)

---

### Epic 6: Staleness Detection and Update Controls
**Priority:** High
**Stories:** 5
**Status:** Not Started
**Dependencies:** Epic 1

Track when panel code differs from running pattern with separate PAUSE/UPDATE controls.

- Story 6.1: Staleness Detection Logic
- Story 6.2: Separate PAUSE and ACTIVATE Buttons
- Story 6.3: Visual Staleness Indicators
- Story 6.4: Top-Level UPDATE ALL Button
- Story 6.5: Staleness Detection on Textarea Change

[→ Full Epic Details](epic-6-staleness-detection.md)

---

### Epic 7: Text Panel Improvements
**Priority:** Medium
**Stories:** 5
**Status:** Not Started
**Dependencies:** Epic 4, Epic 6

Quality-of-life improvements for code editing: line wrapping, default dimensions, live validation, auto-formatting, and syntax highlighting.

- Story 7.1: Line Wrapping Settings
- Story 7.2: Default Panel Dimensions
- Story 7.3: Live Transpilation Validation
- Story 7.4: Auto-Formatting on Play/Update
- Story 7.5: Syntax Highlighting

[→ Full Epic Details](epic-7-text-panel-improvements.md)

---

### Epic 8: Remote Control Synchronization
**Priority:** High
**Stories:** 5
**Status:** Not Started
**Dependencies:** Epic 1, Epic 2, Epic 5

Ensure remote.html WebSocket client stays synchronized with dynamic panel changes (creation, deletion, renaming).

⚠️ **CRITICAL**: Epic 1-2 implementation will break existing remote.html (v0.2.0) if Epic 8 is not implemented.

- Story 8.1: Remote UI Updates on Panel Creation
- Story 8.2: Remote UI Updates on Panel Deletion
- Story 8.3: Remote UI Updates on Panel Rename
- Story 8.4: Full Panel State Sync on Remote Connect
- Story 8.5: Remote Panel Order Synchronization

[→ Full Epic Details](epic-8-remote-control-synchronization.md)

---

## Success Metrics

- **Panel Flexibility**: Users can create/delete panels without code changes
- **UX Polish**: Splash screen displays on every first load with smooth transition
- **Persistence**: Panel state and settings survive page reload
- **Remote Control**: MCP services can control panels via API
- **Live Editing**: Users can safely edit code without disrupting audio
- **Editor Experience**: Syntax highlighting, validation, and formatting improve code quality

## Technical Constraints

- **Vanilla JavaScript**: No framework dependencies
- **Strudel Compatibility**: Must maintain OSC, MIDI, and sample library support
- **Browser Audio**: Web Audio API limitations (autoplay policies, latency)
- **Backward Compatibility**: Existing pattern code must continue working

## Out of Scope (Future Enhancements)

- WinAmp-style theme skins (deferred)
- Code snippet library system (deferred)
- Multi-monitor support
- Cloud settings sync
- Visual diff for stale panels
- Audio recording/export

## Document History

| Date       | Version | Changes                           | Author |
|------------|---------|-----------------------------------|--------|
| 2025-11-16 | v1      | Initial PRD with 6 epics          | Claude |
| 2025-11-16 | v2      | Added Epic 7: Text Panel Improvements | Bob (Scrum Master) |
| 2025-11-16 | v3      | Added Epic 8: Remote Control Synchronization | Claude |
