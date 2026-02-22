# Epic 4: Settings System

## Overview

Implement a comprehensive user settings system with JSON-based storage, cookie persistence, and UI controls for customization. Settings should track panel arrangements, behavior preferences, and theme/snippet configurations.

## Business Value

- **Persistence**: Users don't lose their workspace on reload
- **Customization**: Tailor application behavior to individual preferences
- **Professional UX**: Expected feature in modern web applications
- **Workflow Efficiency**: Restore previous session state automatically

## User Stories

### Story 4.1: Settings JSON Structure and Storage

**As a** developer,
**I want** settings stored as a JSON object in localStorage,
**so that** user preferences persist across sessions

**Acceptance Criteria:**
1. Settings stored in `localStorage` under key `r0astr_settings`
2. JSON structure includes: `{ yolo, colorScheme, behavior, snippetLocation, remoteWSLayout, skinPack }`
3. Settings loaded on application initialization
4. Settings saved whenever changed (automatic persistence)
5. Malformed JSON gracefully falls back to default settings

---

### Story 4.2: Panel State Persistence

**As a** live coder,
**I want** my panel arrangements and code to be saved,
**so that** I can resume my session after closing the browser

**Acceptance Criteria:**
1. Panel state persisted to localStorage: `{ panels: [{ id, title, code, position, size, playing, zIndex }] }`
2. Panel state restored on page load (recreates panels from saved state)
3. Panel code restored to textareas
4. Panel positions/sizes restored (if using draggable/resizable from Epic 2)
5. Playing state NOT restored (all panels start paused for safety)
6. Master panel state always included

---

### Story 4.3: Settings Panel UI

**As a** user,
**I want** a settings panel where I can configure application behavior,
**so that** I can customize the application to my preferences

**Acceptance Criteria:**
1. Settings panel accessible via gear icon or menu button
2. Settings displayed as modal overlay (similar to splash screen)
3. Settings grouped into sections: Appearance, Behavior, Integrations
4. Changes saved immediately or on "Save" button click
5. Settings panel can be dismissed without saving (revert changes)

---

### Story 4.4: Behavior Settings Controls

**As a** user,
**I want** to configure application behavior settings,
**so that** I can control features like deletion confirmation

**Acceptance Criteria:**
1. **YOLO Mode**: Toggle for `settings.yolo` (skip deletion confirmations)
2. **Auto-save Interval**: Dropdown for panel state save frequency (manual, 30s, 1min, 5min)
3. **Restore Session**: Toggle to enable/disable panel state restoration on load
4. **Confirmation Dialogs**: Toggle for various confirmation prompts
5. All behavior settings persist to localStorage

---

### Story 4.5: Appearance Settings Controls

**As a** user,
**I want** to configure visual appearance settings,
**so that** I can customize the UI to my taste

**Acceptance Criteria:**
1. **Color Scheme**: Dropdown for theme selection (Dark, Light, custom themes from Epic 2 future)
2. **Font Size**: Slider for code editor font size (10-24px)
3. **Panel Opacity**: Slider for panel background opacity (50-100%)
4. **Animation Speed**: Toggle for UI animations (normal, fast, disabled)
5. All appearance settings applied immediately (live preview)

---

### Story 4.6: Integration Settings Controls

**As a** user,
**I want** to configure integrations like snippet libraries and remote control,
**so that** I can extend the application with external resources

**Acceptance Criteria:**
1. **Snippet Location**: Text input for JSON file URL or local path
2. **Remote WebSocket Layout**: Dropdown for remote control panel layout preference (side panel, modal, hidden)
3. **Skin Pack Path**: Text input for WinAmp-style skin folder path
4. Settings validated before saving (URL format, path existence if possible)
5. Integration settings trigger relevant subsystem reload (e.g., reload snippets when URL changes)

---

## Technical Notes

- Use `localStorage` API: `localStorage.setItem('r0astr_settings', JSON.stringify(settings))`
- Load settings on init: `JSON.parse(localStorage.getItem('r0astr_settings') || '{}')`
- Cookie-based persistence could be added for cross-device sync (future enhancement)
- Settings schema versioning needed for future compatibility
- Consider settings migration strategy if schema changes

## Dependencies

- Epic 1: Dynamic Panel Management (panel state includes panel IDs)
- Epic 2: Enhanced Panel UI (panel state includes position/size)

## Related Epics

- Epic 2: Enhanced Panel UI (skin pack setting)
- Epic 5: Server Endpoints (remote WS layout setting)

## Out of Scope

- Cloud-based settings sync (future enhancement)
- User accounts and authentication (out of scope)
- Export/import settings JSON file (future enhancement)
