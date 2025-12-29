/**
 * Panel Reorder Module
 * Handles drag-to-reorder functionality for panel tree
 * Uses HTML5 Drag and Drop API with pointer event fallback
 */

import { renumberPanels, MASTER_PANEL_ID } from '../managers/panelManager.js';
import { eventBus } from '../utils/eventBus.js';

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
 * Initialize drag handlers for a single panel drag handle
 * Call this when a new panel is created
 * @param {HTMLElement} panelElement - The .level-panel element
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

  // Remove all drag-over indicators
  document.querySelectorAll('.level-panel').forEach(p => {
    p.classList.remove('drag-over-above', 'drag-over-below', 'dragging');
  });

  document.querySelectorAll('.panel-drag-handle, .panel-number-badge').forEach(h => {
    h.classList.remove('dragging');
  });

  // Reset state
  draggedPanelId = null;
  draggedElement = null;
}
