# Drag-to-Reorder Panels Implementation

## Status: Implemented - Needs Testing

## Context
CSS infrastructure exists in `static/css/components/panel-tree.css` (lines 152-185). JavaScript handlers have now been implemented in `src/ui/panelReorder.js`.

## Existing CSS Classes (already defined, JS now applies them)
- `.panel-number-badge.dragging` - visual feedback during drag
- `.level-panel.drag-over-above::before` - drop indicator above target
- `.level-panel.drag-over-below::after` - drop indicator below target
- `.level-panel.dragging` - opacity:0.5 on dragged panel

## Tasks

### 1. Add drag event handlers to panel number badges
- [x] Created `src/ui/panelReorder.js` module
- [x] Badge already has `draggable="true"` from renderPanel()
- [x] Using HTML5 Drag API (event delegation on panel-tree)
- [x] Add `dragging` class on dragstart, remove on dragend

### 2. Implement drop target detection
- [x] dragover handler on `.level-panel` elements
- [x] Calculate mouse Y position relative to panel center
- [x] Add `drag-over-above` or `drag-over-below` class based on position
- [x] Remove classes on dragleave

### 3. Handle drop and reorder
- [x] On drop, determine new position in panel list
- [x] DOM reorder via insertBefore/appendChild
- [x] Call existing `renumberPanels()` to update badges and state
- [x] Master panel (panel-0) protected from being dragged

### 4. Update panel state schema
- [x] Using existing `panel.number` field (already in schema)
- [x] `renumberPanels()` updates both DOM and panel state
- [x] Auto-save triggered by renumberPanels via existing mechanisms

### 5. Broadcast reorder events (for remote UI)
- [x] Emit `panel:reordered` event via eventBus
- [ ] WebSocket broadcast for remote clients (future - Story 8.5)

## Files Modified
- `src/ui/panelReorder.js` - NEW: dedicated reorder module
- `src/main.js` - Added import and initialization call

## Testing Checklist
- [ ] Drag badge starts drag operation
- [ ] Dragged panel gets opacity:0.5
- [ ] Drop indicators appear above/below targets
- [ ] Dropping reorders panels in DOM
- [ ] Panel numbers update after reorder
- [ ] Master panel cannot be dragged
- [ ] Cannot drop above master panel (position 0)
- [ ] Reorder persists after page reload
- [ ] eventBus emits panel:reordered event

## Related Documentation
- `bmad/stories/8.5.remote-panel-order-synchronization.md` - position schema, insertion logic
- `bmad/stories/2.3.draggable-modal-panels.md` - existing drag implementation (free positioning, not reorder)
- `static/css/components/panel-tree.css` - CSS already written

## Notes
- Current `src/ui/dragResize.js` handles free-form panel positioning (Story 2.3)
- This module handles reordering in the tree structure (different behavior)
- Uses HTML5 Drag and Drop API with event delegation
