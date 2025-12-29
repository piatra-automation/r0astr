/**
 * Panel Manager
 * Handles panel lifecycle: creation, deletion, and state management
 */

import { getSettings } from './settingsManager.js';
import { updatePanelOpacities } from './themeManager.js';
import { eventBus } from '../utils/eventBus.js';
import { skinManager } from './skinManager.js';

// Master panel identifier constant (now panel-0 in tree structure)
export const MASTER_PANEL_ID = 'panel-0';

// Global panel state
const panels = new Map();
let maxZIndex = 10; // Global max z-index tracker
let activePanelId = null; // Currently active/focused panel

/**
 * Generate unique panel ID
 * @returns {string} Unique panel ID (e.g., 'panel-1701234567890')
 */
export function generatePanelId() {
  return `panel-${Date.now()}`;
}

/**
 * Get next panel number for title generation
 * Returns the next available number based on current panel count
 * @returns {number} Next instrument number
 */
export function getNextPanelNumber() {
  // Count existing panels (excluding master panel if present in Map)
  const currentPanelCount = panels.size;
  return currentPanelCount + 1; // Next sequential number
}

/**
 * Create a new panel with given options
 * @param {Object} options - Panel configuration
 * @param {string} [options.id] - Panel ID (auto-generated if not provided)
 * @param {string} [options.title] - Panel title
 * @param {string} [options.code] - Initial pattern code
 * @param {boolean} [options.playing] - Initial playing state
 * @param {Object} [options.position] - Panel position {x, y}
 * @param {Object} [options.size] - Panel size {w, h}
 * @param {number} [options.zIndex] - Z-index for layering
 * @returns {string} Panel ID
 */
export function createPanel(options = {}) {
  const panelId = options.id || generatePanelId();
  const panelNumber = getNextPanelNumber();

  // Story 7.2: Get default dimensions from settings
  const settings = getSettings();
  const defaultSize = { w: settings.default_w, h: settings.default_h };

  // Assign z-index: use provided value or increment maxZIndex
  let zIndex;
  if (options.zIndex !== undefined) {
    zIndex = options.zIndex;
    if (zIndex > maxZIndex) {
      maxZIndex = zIndex;
    }
  } else {
    maxZIndex += 10;
    zIndex = maxZIndex;
  }

  // NEW SYSTEM: All panels are always collapsed (fixed position/size)
  // Simplified panel state (removed expanded/collapsed positions)
  const panel = {
    id: panelId,
    number: options.number || panelNumber, // Panel number for hotkey mapping (Cmd+Opt+1-9)
    title: options.title || `Instrument ${panelNumber}`,
    code: options.code || '',
    playing: options.playing || false,
    stale: options.stale || false, // Story 6.1: Staleness detection
    lastEvaluatedCode: options.lastEvaluatedCode || '', // Story 6.1: Last evaluated code
    position: options.position || { x: 20, y: 20 + (panelNumber - 1) * 60 }, // Fixed collapsed position
    size: { w: 450, h: 56 }, // Fixed collapsed size
    zIndex: zIndex,
    // Legacy fields (kept for backward compatibility with saved state)
    expandedPosition: options.expandedPosition || null,
    collapsedPosition: options.collapsedPosition || null,
    isCollapsed: true // Always collapsed in new system
  };

  panels.set(panelId, panel);

  // Emit panel created event
  eventBus.emit('panel:created', {
    id: panelId,
    title: panel.title,
    code: panel.code,
    options
  });

  // Auto-save panel state (debounced)
  autoSavePanelState();

  return panelId;
}

/**
 * Get panel state by ID
 * @param {string} panelId - Panel ID
 * @returns {Object|undefined} Panel state object
 */
export function getPanel(panelId) {
  return panels.get(panelId);
}

/**
 * Get all panels
 * @returns {Map} All panels
 */
export function getAllPanels() {
  return panels;
}

/**
 * Check if panel is currently playing
 * @param {string} panelId - Panel ID
 * @returns {boolean} True if playing, false otherwise
 */
export function isPanelPlaying(panelId) {
  const panel = panels.get(panelId);
  return panel?.playing || false;
}

/**
 * Set panel playing state
 * @param {string} panelId - Panel ID
 * @param {boolean} playing - Playing state
 * @returns {boolean} Success status
 */
export function setPanelPlaying(panelId, playing) {
  const panel = panels.get(panelId);
  if (!panel) {
    console.warn(`Panel ${panelId} not found`);
    return false;
  }

  const previousState = panel.playing;
  panel.playing = playing;

  // Emit event only if state actually changed
  if (previousState !== playing) {
    eventBus.emit('panel:playingChanged', {
      panelId,
      playing
    });
  }

  return true;
}

/**
 * Renumber all panels based on DOM order and update badges
 * Called after panel deletion to maintain hotkey mapping (Cmd+Opt+1-9)
 * Tree structure: panel-0 is master, panels 1+ are instruments
 */
export function renumberPanels() {
  // Get all panel elements in DOM order (tree structure)
  const panelTree = document.querySelector('.panel-tree');
  if (!panelTree) return;

  const panelElements = Array.from(panelTree.querySelectorAll('.level-panel'));

  // Update panel numbers in order (0-based for tree)
  panelElements.forEach((element, index) => {
    const panelId = element.dataset.panelId;
    const panel = panels.get(panelId);

    // Update data attribute
    element.dataset.panelNumber = index;

    // Update badge in DOM
    const badge = element.querySelector('.panel-number-badge');
    if (badge) {
      badge.textContent = index;
    }

    // Update panel state
    if (panel) {
      panel.number = index;
    }
  });

  console.log(`Renumbered ${panelElements.length} panels in tree`);
}

/**
 * Update panel state
 * @param {string} panelId - Panel ID
 * @param {Object} updates - Properties to update
 * @returns {boolean} Success status
 */
export function updatePanel(panelId, updates) {
  const panel = panels.get(panelId);
  if (!panel) return false;

  Object.assign(panel, updates);

  // Save immediately (no debounce for position/size changes from drag/resize)
  savePanelStateNow();

  return true;
}

/**
 * Update panel title
 * Sanitizes input to prevent XSS
 * @param {string} panelId - Panel ID
 * @param {string} newTitle - New title text
 * @returns {boolean} Success status
 */
export function updatePanelTitle(panelId, newTitle) {
  const panel = panels.get(panelId);
  if (!panel) return false;

  // Sanitize title: remove HTML tags, limit length
  const sanitizedTitle = newTitle
    .replace(/<[^>]*>/g, '')
    .substring(0, 50)
    .trim();

  if (!sanitizedTitle) {
    console.warn('Empty title rejected');
    return false;
  }

  panel.title = sanitizedTitle;

  // Update DOM element
  const titleElement = document.querySelector(`.panel-title[data-panel-id="${panelId}"]`);
  if (titleElement) {
    titleElement.textContent = sanitizedTitle;
  }

  console.log(`Updated panel ${panelId} title to: ${sanitizedTitle}`);

  // Save immediately (no debounce for title changes)
  savePanelStateNow();

  return true;
}

/**
 * Update panel code
 * Updates the code in panel state and optionally in textarea/CodeMirror
 * @param {string} panelId - Panel ID
 * @param {string} code - New pattern code
 * @returns {boolean} Success status
 */
export function updatePanelCode(panelId, code) {
  const panel = panels.get(panelId);
  if (!panel) {
    console.warn(`Panel ${panelId} not found`);
    return false;
  }

  // Update panel state
  panel.code = code;

  // Emit code updated event
  eventBus.emit('panel:codeUpdated', {
    panelId,
    code
  });

  // Auto-save panel state (debounced)
  autoSavePanelState();

  console.log(`Updated code for panel ${panelId}`);
  return true;
}

/**
 * Delete panel by ID
 * Removes from state and DOM
 * NOTE: Audio must be stopped BEFORE calling this (using silence pattern)
 * @param {string} panelId - Panel ID
 * @param {Object} scheduler - DEPRECATED - not used (audio handled by caller)
 * @param {Object} cardStates - Global cardStates object (optional)
 * @returns {boolean} Success status
 */
export function deletePanel(panelId, scheduler = null, cardStates = null, skipConfirmation = false) {
  // Protect master panel
  if (panelId === MASTER_PANEL_ID) {
    console.warn('Cannot delete master panel - it contains global controls');
    return false;
  }

  // Story 4.4: Check YOLO mode and confirmation dialogs settings
  // Skip confirmation in server environment or when explicitly requested (e.g., API deletions)
  if (!skipConfirmation && typeof window !== 'undefined' && typeof confirm !== 'undefined') {
    const settings = getSettings();
    if (!settings.yolo && settings.behavior?.confirmationDialogs !== false) {
      const confirmed = confirm('Are you sure you want to delete this panel?');
      if (!confirmed) {
        console.log('Panel deletion cancelled by user');
        return false;
      }
    }
  }

  // Remove from cardStates if provided
  if (cardStates && cardStates[panelId]) {
    delete cardStates[panelId];
  }

  // Remove from panel manager state
  const removed = panels.delete(panelId);

  // Remove DOM element (only in browser environment)
  if (typeof document !== 'undefined') {
    // Try tree structure first (.level-panel), then legacy (.card)
    const panelElement = document.querySelector(`[data-panel-id="${panelId}"]`) ||
                         document.getElementById(panelId);
    if (panelElement) {
      panelElement.remove();
      console.log(`Removed panel ${panelId} from DOM`);
    }

    // Renumber remaining panels to maintain hotkey mapping (Cmd+Opt+1-9)
    renumberPanels();
  }

  // Emit panel deleted event
  if (removed) {
    eventBus.emit('panel:deleted', panelId);
  }

  // Auto-save panel state (debounced, only in browser)
  if (removed && typeof window !== 'undefined') {
    autoSavePanelState();
  }

  return removed;
}

/**
 * Initialize panel manager with existing panels (for backward compatibility)
 * @param {Array} existingPanels - Array of existing panel configurations
 */
export function initializePanels(existingPanels = []) {
  existingPanels.forEach(panelConfig => {
    panels.set(panelConfig.id, panelConfig);
  });
}

/**
 * Render panel HTML as tree node and append to panel-tree
 * Uses native <details>/<summary> for expand/collapse
 * @param {string} panelId - Panel ID
 * @param {Object} options - Panel display options
 * @returns {HTMLElement} Created panel element (the <li>)
 */
export function renderPanel(panelId, options = {}) {
  const panel = getPanel(panelId);
  if (!panel) {
    throw new Error(`Panel ${panelId} not found`);
  }

  // Create tree node (li.level-panel)
  const panelElement = document.createElement('li');
  panelElement.className = 'level-panel';
  panelElement.id = panelId;
  panelElement.dataset.panelId = panelId;
  panelElement.dataset.panelNumber = panel.number;

  // Hide delete button for master panel (panel-0)
  const deleteButtonStyle = panelId === MASTER_PANEL_ID ? 'display: none;' : '';

  // Render panel using skin template
  const panelHTML = skinManager.render('panel', {
    panelId,
    panelNumber: panel.number,
    title: panel.title,
    expanded: options.expanded ? ' open' : '',
    deleteButtonStyle
  });

  panelElement.innerHTML = panelHTML;

  // Insert into panel-tree (before add-panel-row to keep it at end)
  const panelTree = document.querySelector('.panel-tree');
  const addPanelRow = document.getElementById('add-panel-row');
  if (panelTree) {
    if (addPanelRow) {
      panelTree.insertBefore(panelElement, addPanelRow);
    } else {
      panelTree.appendChild(panelElement);
    }
  }

  return panelElement;
}

/**
 * Re-render all existing panels with new skin (hot-reload)
 * Preserves internal panel state, only updates DOM with new templates
 * @param {Function} createEditorView - Function to create CodeMirror editor
 * @param {Map} editorViews - Map to store editor views
 * @param {Function} renderSliders - Function to render sliders (optional)
 * @param {Function} getPanelSliders - Function to get panel slider data (optional)
 */
export async function reRenderAllPanels(createEditorView, editorViews, renderSliders = null, getPanelSliders = null) {
  console.log(`[PanelManager] Re-rendering ${panels.size} panels with new skin...`);

  // Clear DOM except master panel (keep internal state)
  const panelTree = document.querySelector('.panel-tree');
  const existingPanels = panelTree.querySelectorAll('.level-panel:not([data-panel-id="panel-0"])');
  existingPanels.forEach(panel => panel.remove());

  // Get master panel code before clearing editor views
  const masterView = editorViews.get(MASTER_PANEL_ID);
  const masterCode = masterView?.state.doc.toString() || '';

  // Clear editor views (will be recreated)
  editorViews.clear();

  // Re-render each panel (including master)
  for (const [panelId, panelData] of panels) {
    try {
      console.log(`[PanelManager] Rendering ${panelId} (number: ${panelData.number}, title: "${panelData.title}")`);

      // Render panel DOM with new template
      const panelElement = renderPanel(panelId);
      console.log(`[PanelManager] ✓ Panel ${panelId} DOM created`);

      // Wait for DOM to settle before looking up editor container
      await new Promise(resolve => setTimeout(resolve, 0));

      // Recreate CodeMirror editor with existing code
      const editorContainer = getPanelEditorContainer(panelId);
      if (editorContainer) {
        console.log(`[PanelManager] Creating editor for ${panelId}`, editorContainer);
        const view = createEditorView(editorContainer, {
          initialCode: panelData.code || '',
          panelId: panelId
        });
        editorViews.set(panelId, view);
        console.log(`[PanelManager] ✓ Editor created for ${panelId}`);
      } else {
        console.error(`[PanelManager] ✗ Editor container not found for ${panelId}`);
      }

      // Re-render sliders if available (skip master panel - it has special handling)
      if (renderSliders && getPanelSliders && panelId !== MASTER_PANEL_ID) {
        const sliderData = getPanelSliders(panelId);
        if (sliderData && sliderData.length > 0) {
          renderSliders(panelId, sliderData, panelData.code || '');
          console.log(`[PanelManager] ✓ Sliders rendered for ${panelId}`);
        }
      }
    } catch (error) {
      console.error(`[PanelManager] ✗ Failed to render ${panelId}:`, error);
      // Continue with next panel instead of stopping
    }
  }

  // Re-create master panel editor (static HTML panel, not in panels Map)
  await new Promise(resolve => setTimeout(resolve, 0));
  const masterContainer = getPanelEditorContainer(MASTER_PANEL_ID);
  if (masterContainer) {
    console.log('[PanelManager] Recreating master panel editor');
    const masterEditorView = createEditorView(masterContainer, {
      initialCode: masterCode,
      panelId: MASTER_PANEL_ID
    });
    editorViews.set(MASTER_PANEL_ID, masterEditorView);
    console.log('[PanelManager] ✓ Master panel editor recreated');
  } else {
    console.error('[PanelManager] ✗ Master panel container not found');
  }

  console.log('[PanelManager] ✓ Panels re-rendered');
}

/**
 * Bring panel to front (highest z-index)
 * @param {string} panelId - Panel ID
 * @returns {boolean} Success status
 */
export function bringPanelToFront(panelId) {
  const panel = panels.get(panelId);
  if (!panel && panelId !== MASTER_PANEL_ID) return false;

  // Increment max z-index
  maxZIndex += 1;

  // Update panel state (if it's a managed panel)
  if (panel) {
    panel.zIndex = maxZIndex;
  }

  // Update DOM
  const panelElement = document.getElementById(panelId);
  if (panelElement) {
    panelElement.style.zIndex = maxZIndex;
  }

  // Update active state (visual indication)
  setActivePanel(panelId);

  // Normalize if z-index exceeds threshold
  if (maxZIndex > 1000) {
    normalizeZIndices();
  }

  return true;
}

/**
 * Save current panel position/size as expanded state
 * @param {string} panelId - Panel ID
 */
export function saveExpandedPosition(panelId) {
  const panel = panels.get(panelId);
  const panelElement = document.getElementById(panelId);

  if (!panel || !panelElement) return;

  const x = parseFloat(panelElement.dataset.x) || panel.position.x;
  const y = parseFloat(panelElement.dataset.y) || panel.position.y;
  const w = parseFloat(panelElement.style.width) || panel.size.w;
  const h = parseFloat(panelElement.style.height) || panel.size.h;

  panel.expandedPosition = { x, y, w, h };
  savePanelStateNow();

  console.log(`[Position] Saved expanded position for ${panelId}:`, panel.expandedPosition);
}

/**
 * Save current panel position/size as collapsed state
 * @param {string} panelId - Panel ID
 */
export function saveCollapsedPosition(panelId) {
  const panel = panels.get(panelId);
  const panelElement = document.getElementById(panelId);

  if (!panel || !panelElement) return;

  const x = parseFloat(panelElement.dataset.x) || panel.position.x;
  const y = parseFloat(panelElement.dataset.y) || panel.position.y;
  const w = parseFloat(panelElement.style.width) || panel.size.w;
  const h = parseFloat(panelElement.style.height) || panel.size.h;

  panel.collapsedPosition = { x, y, w, h };
  savePanelStateNow();

  console.log(`[Position] Saved collapsed position for ${panelId}:`, panel.collapsedPosition);
}

/**
 * Animate panel to collapsed or expanded position
 * @param {string} panelId - Panel ID
 * @param {boolean} collapse - True to collapse, false to expand
 */
export function animatePanelPosition(panelId, collapse) {
  const panel = panels.get(panelId);
  const panelElement = document.getElementById(panelId);

  if (!panel || !panelElement) return;

  if (collapse) {
    // COLLAPSING: Save current position/size as expanded (only if currently expanded)
    if (!panel.isCollapsed) {
      const x = parseFloat(panelElement.dataset.x) || panel.position.x;
      const y = parseFloat(panelElement.dataset.y) || panel.position.y;
      const w = parseFloat(panelElement.style.width) || panel.size.w;
      const h = parseFloat(panelElement.style.height) || panel.size.h;
      panel.expandedPosition = { x, y, w, h };
      console.log(`[Position] Saved expanded position:`, panel.expandedPosition);
    }

    // Use saved collapsed size if available, otherwise use defaults
    const collapsedHeight = panel.collapsedPosition?.h || 56; // Default: 56px matching hero button style
    const collapsedWidth = panel.collapsedPosition?.w || 450; // Default: 450px

    // Calculate collapsed position algorithmically based on panel number
    // Stack vertically on LHS with tight gap between panels
    const panelNumber = panel.number;
    const collapsedX = panel.collapsedPosition?.x || 20; // Default: 20px left margin
    const collapsedY = panel.collapsedPosition?.y || (20 + (panelNumber - 1) * (56 + 4)); // Default: stack with 4px gap

    // Apply collapsed class to hide content
    panelElement.classList.add('panel-collapsed');

    // Animate to collapsed position and size
    panelElement.dataset.x = collapsedX;
    panelElement.dataset.y = collapsedY;
    panelElement.style.transform = `translate(${collapsedX}px, ${collapsedY}px)`;
    panelElement.style.width = `${collapsedWidth}px`;
    panelElement.style.height = `${collapsedHeight}px`;

    // Update panel state
    panel.position = { x: collapsedX, y: collapsedY };
    panel.size = { w: collapsedWidth, h: collapsedHeight };
    panel.isCollapsed = true;

    // Save collapsed position for future collapses
    panel.collapsedPosition = { x: collapsedX, y: collapsedY, w: collapsedWidth, h: collapsedHeight };

    console.log(`[Position] Collapsed panel ${panelNumber} to slot at (${collapsedX}, ${collapsedY}) size: ${collapsedWidth}x${collapsedHeight}`);

  } else {
    // EXPANDING: Restore to saved expanded position
    if (!panel.expandedPosition) {
      // No saved position - use current position/size and save it
      const x = parseFloat(panelElement.dataset.x) || panel.position.x;
      const y = parseFloat(panelElement.dataset.y) || panel.position.y;
      const w = parseFloat(panelElement.style.width) || panel.size.w;
      const h = parseFloat(panelElement.style.height) || panel.size.h;
      panel.expandedPosition = { x, y, w, h };
      console.log(`[Position] No saved expanded position, using current: (${x}, ${y}) ${w}x${h}`);
    }

    // Remove collapsed class to show content
    panelElement.classList.remove('panel-collapsed');

    // Animate to expanded position and size
    panelElement.dataset.x = panel.expandedPosition.x;
    panelElement.dataset.y = panel.expandedPosition.y;
    panelElement.style.transform = `translate(${panel.expandedPosition.x}px, ${panel.expandedPosition.y}px)`;
    panelElement.style.width = `${panel.expandedPosition.w}px`;
    panelElement.style.height = `${panel.expandedPosition.h}px`;

    // Update panel state
    panel.position = { x: panel.expandedPosition.x, y: panel.expandedPosition.y };
    panel.size = { w: panel.expandedPosition.w, h: panel.expandedPosition.h };
    panel.isCollapsed = false;

    console.log(`[Position] Expanded ${panelId} to saved position (${panel.expandedPosition.x}, ${panel.expandedPosition.y})`);
  }

  savePanelStateNow();
}

/**
 * Set active panel with visual indication
 * Works with both tree structure and legacy
 * @param {string} panelId - Panel ID to make active
 */
export function setActivePanel(panelId) {
  // Remove active and focused classes from previous panel
  if (activePanelId) {
    const prevElement = document.querySelector(`[data-panel-id="${activePanelId}"]`) ||
                        document.getElementById(activePanelId);
    if (prevElement) {
      prevElement.classList.remove('active', 'focused');
    }
  }

  // Add active and focused classes to new panel
  const newElement = document.querySelector(`[data-panel-id="${panelId}"]`) ||
                     document.getElementById(panelId);
  if (newElement) {
    newElement.classList.add('active', 'focused');
  }

  activePanelId = panelId;

  // Update panel opacities based on focus state
  updatePanelOpacities();
}

/**
 * Expand a panel in tree view
 * @param {string} panelId - Panel ID to expand
 */
export function expandPanel(panelId) {
  const panelElement = document.querySelector(`[data-panel-id="${panelId}"]`);
  if (!panelElement) return;

  const details = panelElement.querySelector('details');
  if (details) {
    details.open = true;
  }

  // Update panel state
  const panel = panels.get(panelId);
  if (panel) {
    panel.expanded = true;
  }
}

/**
 * Collapse a panel in tree view
 * @param {string} panelId - Panel ID to collapse
 */
export function collapsePanel(panelId) {
  const panelElement = document.querySelector(`[data-panel-id="${panelId}"]`);
  if (!panelElement) return;

  const details = panelElement.querySelector('details');
  if (details) {
    details.open = false;
  }

  // Update panel state
  const panel = panels.get(panelId);
  if (panel) {
    panel.expanded = false;
  }
}

/**
 * Toggle panel expand/collapse state
 * @param {string} panelId - Panel ID to toggle
 * @returns {boolean} New expanded state
 */
export function togglePanel(panelId) {
  const panelElement = document.querySelector(`[data-panel-id="${panelId}"]`);
  if (!panelElement) return false;

  const details = panelElement.querySelector('details');
  if (!details) return false;

  details.open = !details.open;

  // Update panel state
  const panel = panels.get(panelId);
  if (panel) {
    panel.expanded = details.open;
  }

  return details.open;
}

/**
 * Check if panel is expanded
 * @param {string} panelId - Panel ID
 * @returns {boolean} True if expanded
 */
export function isPanelExpanded(panelId) {
  const panelElement = document.querySelector(`[data-panel-id="${panelId}"]`);
  if (!panelElement) return false;

  const details = panelElement.querySelector('details');
  return details?.open || false;
}

/**
 * Get active panel ID
 * @returns {string|null} Active panel ID
 */
export function getActivePanel() {
  return activePanelId;
}

/**
 * Normalize z-indices to prevent overflow
 * Re-assigns z-index values based on current order
 * Note: In tree layout, z-index is less important since panels don't overlap
 */
export function normalizeZIndices() {
  // Get all panels - try tree structure first, then legacy
  let allPanelElements = Array.from(document.querySelectorAll('.level-panel'));

  // Fall back to legacy structure if tree not found
  if (allPanelElements.length === 0) {
    allPanelElements = Array.from(document.querySelectorAll('.card, #master-panel'));
  }

  // In tree layout, z-index is not really needed
  // Just update the maxZIndex tracker
  maxZIndex = allPanelElements.length * 10;

  console.log(`Z-indices normalized. Panel count: ${allPanelElements.length}`);
}

/**
 * Save panel state to localStorage
 * Saves all panels including master panel
 * @returns {boolean} Success status
 */
export function savePanelState() {
  // Skip if not in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const panelArray = [];

    // Save regular panels
    panels.forEach((panel) => {
      panelArray.push({
        id: panel.id,
        number: panel.number, // Panel number for hotkey mapping
        title: panel.title,
        code: panel.code,
        position: panel.position,
        size: panel.size,
        playing: false, // Never save playing state (safety)
        stale: panel.stale || false, // Story 6.1: Save staleness state
        lastEvaluatedCode: panel.lastEvaluatedCode || '', // Story 6.1: Save last evaluated code
        zIndex: panel.zIndex,
        expandedPosition: panel.expandedPosition || null, // Saved expanded state
        collapsedPosition: panel.collapsedPosition || null, // Saved collapsed state (for legacy)
        isCollapsed: panel.isCollapsed || false // Current collapse state
      });
    });

    // Preserve existing master panel entry from localStorage
    // Master panel is managed by savePanelStateWithMasterCode() in main.js
    // We need to preserve it when saving regular panel updates (drag/resize/etc)
    try {
      const existingJson = localStorage.getItem('r0astr_panel_state');
      if (existingJson) {
        const existingState = JSON.parse(existingJson);
        const masterPanel = existingState.panels?.find(p => p.id === MASTER_PANEL_ID);
        if (masterPanel) {
          panelArray.push(masterPanel);
        }
      }
    } catch (e) {
      console.warn('Failed to preserve master panel state:', e);
    }

    const state = { panels: panelArray };
    const json = JSON.stringify(state, null, 2);
    localStorage.setItem('r0astr_panel_state', json);
    console.log(`Panel state saved: ${panelArray.length} panels`);
    return true;
  } catch (error) {
    console.error('Failed to save panel state:', error);
    if (error.name === 'QuotaExceededError') {
      if (typeof alert !== 'undefined') {
        alert('Cannot save panel state: storage quota exceeded. Clear browser data or use fewer panels.');
      }
    } else {
      if (typeof alert !== 'undefined') {
        alert('Settings could not be saved. Check browser console for details.');
      }
    }
    return false;
  }
}

/**
 * Load panel state from localStorage
 * @returns {Array|null} Array of panel state objects or null if not found/invalid
 */
export function loadPanelState() {
  // Skip if not in browser environment
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const json = localStorage.getItem('r0astr_panel_state');
    if (!json) {
      console.log('No saved panel state found');
      return null;
    }

    const state = JSON.parse(json);
    if (!state.panels || !Array.isArray(state.panels)) {
      console.warn('Invalid panel state structure');
      return null;
    }

    console.log(`Loaded panel state: ${state.panels.length} panels`);
    return state.panels;
  } catch (error) {
    console.error('Failed to load panel state:', error);
    return null;
  }
}

/**
 * Debounced auto-save for panel state (keystrokes)
 * Prevents excessive localStorage writes during code editing
 */
let saveTimeout;
export function autoSavePanelState() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    savePanelState();
  }, 3000); // Save 3 seconds after last change (reduced frequency for performance)
}

/**
 * Immediate save for UI state changes (no debounce)
 * Use for drag/resize, rename, expand/collapse, etc.
 */
export function savePanelStateNow() {
  savePanelState();
}

/**
 * Story 4.4: Auto-save timer for periodic saves
 * Manages interval-based auto-save of panel state
 */
let autoSaveTimer;
export function startAutoSaveTimer(interval) {
  // Clear existing timer
  clearInterval(autoSaveTimer);

  // If manual mode, don't start timer (save only on changes)
  if (interval === 'manual') {
    console.log('Auto-save: Manual mode (save on panel change)');
    return;
  }

  // Map interval to milliseconds
  const intervals = {
    '30s': 30000,
    '1min': 60000,
    '5min': 300000
  };

  const ms = intervals[interval];
  if (!ms) {
    console.error('Invalid auto-save interval:', interval);
    return;
  }

  // Start timer
  autoSaveTimer = setInterval(() => {
    savePanelState();
    console.log('Auto-save: Panel state saved');
  }, ms);

  console.log(`Auto-save: Enabled (every ${interval})`);
}

/**
 * Story 7.6: Get editor container for CodeMirror initialization
 * Supports both tree structure (editor-{panelId}) and legacy (data-card)
 * @param {string} panelId - Panel ID
 * @returns {HTMLElement|null} Editor container element
 */
export function getPanelEditorContainer(panelId) {
  // Try tree structure first (id="editor-{panelId}")
  const treeEditor = document.getElementById(`editor-${panelId}`);
  if (treeEditor) return treeEditor;

  // Fall back to legacy selector
  return document.querySelector(`.code-editor[data-card="${panelId}"]`);
}

/**
 * Story 7.6: Save panel state including master panel code
 * @param {string} masterCode - Master panel code from EditorView
 * @param {boolean} masterCompact - Master panel compact state
 * @returns {boolean} Success status
 */
export function savePanelStateWithMasterCode(masterCode, masterCompact = true) {
  // Skip if not in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const panelArray = [];

    // Save regular panels
    panels.forEach((panel) => {
      panelArray.push({
        id: panel.id,
        title: panel.title,
        code: panel.code,
        position: panel.position,
        size: panel.size,
        playing: false, // Never save playing state (safety)
        stale: panel.stale || false,
        lastEvaluatedCode: panel.lastEvaluatedCode || '',
        zIndex: panel.zIndex
      });
    });

    // Include master panel with code from parameter
    if (masterCode !== undefined) {
      panelArray.push({
        id: MASTER_PANEL_ID,
        title: 'Global Panel',
        code: masterCode,
        compact: masterCompact, // Save compact/expanded state
        position: null,
        size: null,
        playing: false,
        zIndex: 999
      });
    }

    const state = { panels: panelArray };
    const json = JSON.stringify(state, null, 2);
    localStorage.setItem('r0astr_panel_state', json);
    console.log(`Panel state saved: ${panelArray.length} panels`);
    return true;
  } catch (error) {
    console.error('Failed to save panel state:', error);
    if (error.name === 'QuotaExceededError') {
      if (typeof alert !== 'undefined') {
        alert('Cannot save panel state: storage quota exceeded. Clear browser data or use fewer panels.');
      }
    } else {
      if (typeof alert !== 'undefined') {
        alert('Settings could not be saved. Check browser console for details.');
      }
    }
    return false;
  }
}
