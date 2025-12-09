# Epic 2: Enhanced Panel UI

## Overview

Transform panels from fixed-position cards into flexible, draggable modal windows with resizable dimensions and editable titles. This creates a more professional, customizable interface reminiscent of modular DAW workflows.

## Business Value

- **Professional UX**: Modal windows provide familiar DAW-like experience
- **Customization**: Users can arrange panels to match their workflow
- **Screen Real Estate**: Resizing allows optimization for different screen sizes
- **Organization**: Custom titles help users identify panel purposes

## User Stories

### Story 2.1: Editable Panel Titles

**As a** live coder,
**I want** to edit panel titles by clicking on them,
**so that** I can give meaningful names to my instruments (e.g., "Bass", "Drums", "Lead")

**Acceptance Criteria:**
1. Panel title displays in header as editable text
2. Clicking title enters edit mode (contenteditable or input field)
3. Pressing Enter or clicking away saves new title
4. Title persists in panel state (not lost on page reload if persistence enabled)
5. Default title is "Instrument N" where N is creation order

---

### Story 2.2: Resizable Panels

**As a** live coder,
**I want** to resize panels by dragging their edges,
**so that** I can allocate more space to complex patterns and less to simple ones

**Acceptance Criteria:**
1. Panel edges have visible resize handles (borders are draggable)
2. Dragging edge/corner resizes panel width and/or height
3. Panel maintains minimum size (e.g., 300x200px) to prevent unusability
4. Textarea inside panel grows/shrinks with panel size
5. Slider controls remain visible and functional during resize
6. Panel size is saved in panel state

---

### Story 2.3: Draggable Modal Panels

**As a** live coder,
**I want** to drag panels by their headers to reposition them,
**so that** I can organize my workspace layout

**Acceptance Criteria:**
1. Panels use `position: absolute` or similar for free positioning
2. Dragging panel header moves panel to new position
3. Panels can be moved anywhere within viewport (or defined container)
4. Dragging a panel brings it to front (z-index management)
5. Panel position is saved in panel state
6. Panels do not drift outside visible area (boundary constraints)

---

### Story 2.4: Z-Index Management (Bring to Front)

**As a** live coder,
**I want** clicking any panel to bring it to the front,
**so that** I can focus on the panel I'm working with

**Acceptance Criteria:**
1. Clicking anywhere on a panel brings it to front (highest z-index)
2. Previously focused panel moves back in z-order
3. Visual indication of active/focused panel (border highlight, shadow, etc.)
4. Z-order is maintained when switching between panels
5. Master panel can also be brought to front (not always on top)

---

## Technical Notes

- Consider using library: [interact.js](https://interactjs.io/) for drag/resize
- Alternative: Custom implementation with mouse events
- Panel state schema needs: `{ id, title, position: { x, y }, size: { w, h }, zIndex }`
- CSS refactor: Remove grid/flexbox layout, use absolute positioning
- Viewport boundaries: Prevent panels from moving completely offscreen

## Dependencies

- Epic 1: Dynamic Panel Management (panel CRUD operations)

## Related Epics

- Epic 4: Settings System (save panel positions/sizes)
- Epic 6: Staleness Detection (focus management affects active panel)

## Out of Scope

- Snap-to-grid functionality (future enhancement)
- Panel minimize/maximize buttons (future enhancement)
- Multi-monitor support (complex, deferred)
