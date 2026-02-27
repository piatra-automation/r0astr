/**
 * Panel Reorder Module
 * Handles drag-to-reorder functionality for panel tree
 * Uses HTML5 Drag and Drop API with pointer event fallback
 */

import { renumberPanels, MASTER_PANEL_ID } from '../managers/panelManager.js';
import { eventBus } from '../utils/eventBus.js';
import { resolvePanelId } from '../managers/panelDOMRegistry.js';
import { isLayoutMode, getRegionForPart } from '../managers/layoutManager.js';

// Track drag state
let draggedPanelId = null;
let draggedElement = null;

/**
 * Initialize drag-to-reorder for all panel badges
 * Call this after panel tree is rendered
 */
export function initializePanelReorder() {
  const panelTree = document.querySelector('.panel-tree');
  if (!panelTree) {
    console.warn('[Reorder] Panel tree not found');
    return;
  }

  // Use event delegation on the panel tree
  panelTree.addEventListener('dragstart', handleDragStart);
  panelTree.addEventListener('dragend', handleDragEnd);
  panelTree.addEventListener('dragover', handleDragOver);
  panelTree.addEventListener('dragleave', handleDragLeave);
  panelTree.addEventListener('drop', handleDrop);

  console.log('[Reorder] Panel reorder initialized');
}

/**
 * Initialize drag-to-reorder for layout mode header region.
 * Call after layout is applied and panels rendered.
 */
export function initializeLayoutReorder() {
  const headerRegion = getRegionForPart('header');
  if (!headerRegion) {
    console.warn('[Reorder] No header region found for layout reorder');
    return;
  }

  // Remove previous listeners if re-initializing
  headerRegion.removeEventListener('dragstart', handleLayoutDragStart);
  headerRegion.removeEventListener('dragend', handleDragEnd);
  headerRegion.removeEventListener('dragover', handleLayoutDragOver);
  headerRegion.removeEventListener('dragleave', handleLayoutDragLeave);
  headerRegion.removeEventListener('drop', handleLayoutDrop);

  headerRegion.addEventListener('dragstart', handleLayoutDragStart);
  headerRegion.addEventListener('dragend', handleDragEnd);
  headerRegion.addEventListener('dragover', handleLayoutDragOver);
  headerRegion.addEventListener('dragleave', handleLayoutDragLeave);
  headerRegion.addEventListener('drop', handleLayoutDrop);

  console.log('[Reorder] Layout reorder initialized on header region');
}

/**
 * Initialize drag handlers for a single panel drag handle
 * Call this when a new panel is created
 * @param {HTMLElement} panelElement - The .level-panel element or layout part header
 */
export function initializePanelBadgeDrag(panelElement) {
  // Try new drag handle first, fall back to badge for other skins
  const handle = panelElement.querySelector('.panel-drag-handle') ||
                 panelElement.querySelector('.panel-number-badge');
  if (!handle) return;

  // Ensure draggable is set
  handle.draggable = true;
}

/**
 * Handle drag start on drag handle (or badge for other skins)
 */
function handleDragStart(e) {
  // Support both drag handle and badge
  const handle = e.target.closest('.panel-drag-handle') ||
                 e.target.closest('.panel-number-badge');
  if (!handle) return;

  const panelElement = handle.closest('.level-panel');
  if (!panelElement) return;

  const panelId = panelElement.dataset.panelId;

  // Don't allow dragging master panel
  if (panelId === MASTER_PANEL_ID) {
    e.preventDefault();
    return;
  }

  draggedPanelId = panelId;
  draggedElement = panelElement;

  // Add dragging class for visual feedback
  panelElement.classList.add('dragging');
  handle.classList.add('dragging');

  // Set drag data
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', panelId);

  // Use handle as drag image
  e.dataTransfer.setDragImage(handle, handle.offsetWidth / 2, handle.offsetHeight / 2);

  console.log('[Reorder] Drag start:', panelId);
}

/**
 * Handle drag end
 */
function handleDragEnd(e) {
  // Clean up all drag states
  cleanupDragStates();

  console.log('[Reorder] Drag end');
}

/**
 * Handle drag over a potential drop target
 */
function handleDragOver(e) {
  if (!draggedPanelId) return;

  const targetPanel = e.target.closest('.level-panel');
  if (!targetPanel || targetPanel === draggedElement) {
    return;
  }

  const targetPanelId = targetPanel.dataset.panelId;

  // Don't allow dropping onto master panel position
  if (targetPanelId === MASTER_PANEL_ID) {
    return;
  }

  // Allow drop
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  // Calculate if we're above or below center of target
  const rect = targetPanel.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const isAbove = e.clientY < midY;

  // Remove existing indicators from all panels
  document.querySelectorAll('.level-panel').forEach(p => {
    p.classList.remove('drag-over-above', 'drag-over-below');
  });

  // Add appropriate indicator
  if (isAbove) {
    targetPanel.classList.add('drag-over-above');
  } else {
    targetPanel.classList.add('drag-over-below');
  }
}

/**
 * Handle drag leave
 */
function handleDragLeave(e) {
  const targetPanel = e.target.closest('.level-panel');
  if (targetPanel) {
    // Only remove if we're actually leaving the panel (not entering a child)
    const relatedTarget = e.relatedTarget;
    if (!targetPanel.contains(relatedTarget)) {
      targetPanel.classList.remove('drag-over-above', 'drag-over-below');
    }
  }
}

/**
 * Handle drop
 */
function handleDrop(e) {
  e.preventDefault();

  if (!draggedPanelId || !draggedElement) {
    cleanupDragStates();
    return;
  }

  const targetPanel = e.target.closest('.level-panel');
  if (!targetPanel || targetPanel === draggedElement) {
    cleanupDragStates();
    return;
  }

  const targetPanelId = targetPanel.dataset.panelId;

  // Don't allow dropping onto master panel position
  if (targetPanelId === MASTER_PANEL_ID) {
    cleanupDragStates();
    return;
  }

  // Calculate drop position
  const rect = targetPanel.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const insertBefore = e.clientY < midY;

  // Get parent container
  const panelTree = document.querySelector('.panel-tree');
  if (!panelTree) {
    cleanupDragStates();
    return;
  }

  // Move the element in DOM (always keep add-panel-row at end)
  const addPanelRow = document.getElementById('add-panel-row');
  if (insertBefore) {
    panelTree.insertBefore(draggedElement, targetPanel);
  } else {
    // Insert after target, but before add-panel-row
    const nextSibling = targetPanel.nextElementSibling;
    if (nextSibling && nextSibling !== addPanelRow) {
      panelTree.insertBefore(draggedElement, nextSibling);
    } else if (addPanelRow) {
      panelTree.insertBefore(draggedElement, addPanelRow);
    } else {
      panelTree.appendChild(draggedElement);
    }
  }

  console.log('[Reorder] Dropped', draggedPanelId, insertBefore ? 'before' : 'after', targetPanelId);

  // Renumber all panels based on new DOM order
  renumberPanels();

  // Emit reorder event
  eventBus.emit('panel:reordered', {
    panelId: draggedPanelId,
    newPosition: parseInt(draggedElement.dataset.panelNumber)
  });

  // Clean up
  cleanupDragStates();
}

// ─── Layout mode drag handlers ───

/**
 * Handle drag start in layout mode (on header parts)
 */
function handleLayoutDragStart(e) {
  const handle = e.target.closest('.panel-drag-handle') ||
                 e.target.closest('.panel-number-badge');
  if (!handle) return;

  const headerPart = handle.closest('.layout-part-header');
  if (!headerPart) return;

  const panelId = headerPart.dataset.panelId;
  if (panelId === MASTER_PANEL_ID) {
    e.preventDefault();
    return;
  }

  draggedPanelId = panelId;
  draggedElement = headerPart;

  headerPart.classList.add('dragging');
  handle.classList.add('dragging');

  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', panelId);
  e.dataTransfer.setDragImage(handle, handle.offsetWidth / 2, handle.offsetHeight / 2);

  console.log('[Reorder:Layout] Drag start:', panelId);
}

/**
 * Handle drag over in layout mode
 */
function handleLayoutDragOver(e) {
  if (!draggedPanelId) return;

  const targetPart = e.target.closest('.layout-part-header');
  if (!targetPart || targetPart === draggedElement) return;

  const targetPanelId = targetPart.dataset.panelId;
  if (targetPanelId === MASTER_PANEL_ID) return;

  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const rect = targetPart.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const isAbove = e.clientY < midY;

  // Clear previous indicators
  document.querySelectorAll('.layout-part-header').forEach(p => {
    p.classList.remove('drag-over-above', 'drag-over-below');
  });

  targetPart.classList.add(isAbove ? 'drag-over-above' : 'drag-over-below');
}

/**
 * Handle drag leave in layout mode
 */
function handleLayoutDragLeave(e) {
  const targetPart = e.target.closest('.layout-part-header');
  if (targetPart) {
    const relatedTarget = e.relatedTarget;
    if (!targetPart.contains(relatedTarget)) {
      targetPart.classList.remove('drag-over-above', 'drag-over-below');
    }
  }
}

/**
 * Handle drop in layout mode.
 * Reorders header parts within the header region, then reorders
 * corresponding editor/controls parts in their regions to match.
 */
function handleLayoutDrop(e) {
  e.preventDefault();

  if (!draggedPanelId || !draggedElement) {
    cleanupDragStates();
    return;
  }

  const targetPart = e.target.closest('.layout-part-header');
  if (!targetPart || targetPart === draggedElement) {
    cleanupDragStates();
    return;
  }

  const targetPanelId = targetPart.dataset.panelId;
  if (targetPanelId === MASTER_PANEL_ID) {
    cleanupDragStates();
    return;
  }

  // Calculate drop position
  const rect = targetPart.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const insertBefore = e.clientY < midY;

  // Reorder header in its region
  const headerRegion = targetPart.parentElement;
  if (insertBefore) {
    headerRegion.insertBefore(draggedElement, targetPart);
  } else {
    const nextSibling = targetPart.nextElementSibling;
    if (nextSibling) {
      headerRegion.insertBefore(draggedElement, nextSibling);
    } else {
      headerRegion.appendChild(draggedElement);
    }
  }

  // Now reorder other part regions to match the header order
  reorderPartRegionsToMatchHeaders(headerRegion);

  console.log('[Reorder:Layout] Dropped', draggedPanelId, insertBefore ? 'before' : 'after', targetPanelId);

  // Renumber panels
  renumberPanels();

  eventBus.emit('panel:reordered', {
    panelId: draggedPanelId,
    newPosition: 0 // will be set by renumber
  });

  cleanupDragStates();
}

/**
 * After reordering headers, reorder editor/controls parts to match.
 * Reads the panelId order from header region, then for each other region
 * sorts its parts to match that order.
 */
function reorderPartRegionsToMatchHeaders(headerRegion) {
  // Get panel order from header region
  const headerParts = Array.from(headerRegion.querySelectorAll('.layout-part-header'));
  const panelOrder = headerParts.map(h => h.dataset.panelId);

  // For each other region, reorder its parts
  const editorRegion = getRegionForPart('editor');
  const controlsRegion = getRegionForPart('controls');

  [editorRegion, controlsRegion].forEach(region => {
    if (!region || region === headerRegion) return;

    const parts = Array.from(region.querySelectorAll('.layout-part'));
    // Sort by panelOrder index
    parts.sort((a, b) => {
      const idxA = panelOrder.indexOf(a.dataset.panelId);
      const idxB = panelOrder.indexOf(b.dataset.panelId);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    // Re-append in sorted order
    parts.forEach(p => region.appendChild(p));
  });
}

/**
 * Clean up all drag-related states and classes
 */
function cleanupDragStates() {
  // Remove dragging class from dragged element
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
    const handle = draggedElement.querySelector('.panel-drag-handle') ||
                   draggedElement.querySelector('.panel-number-badge');
    if (handle) {
      handle.classList.remove('dragging');
    }
  }

  // Remove all drag-over indicators (classic + layout mode)
  document.querySelectorAll('.level-panel, .layout-part-header').forEach(p => {
    p.classList.remove('drag-over-above', 'drag-over-below', 'dragging');
  });

  document.querySelectorAll('.panel-drag-handle, .panel-number-badge').forEach(h => {
    h.classList.remove('dragging');
  });

  // Reset state
  draggedPanelId = null;
  draggedElement = null;
}
