/**
 * Panel Manager
 * Handles panel lifecycle: creation, deletion, and state management
 */

import { getSettings } from './settingsManager.js';
import { updatePanelOpacities } from './themeManager.js';

// Master panel identifier constant
export const MASTER_PANEL_ID = 'master-panel';

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
 * Renumber all panels based on DOM order and update badges
 * Called after panel deletion to maintain hotkey mapping (Cmd+Opt+1-9)
 */
export function renumberPanels() {
  // Get all panel elements in DOM order
  const container = document.querySelector('.container');
  if (!container) return;

  const panelElements = Array.from(container.querySelectorAll('.card:not(#master-panel)'));

  // Update panel numbers in order
  panelElements.forEach((element, index) => {
    const panelId = element.id;
    const panel = panels.get(panelId);
    if (panel) {
      const newNumber = index + 1; // 1-based numbering
      panel.number = newNumber;

      // Update badge in DOM
      const badge = element.querySelector('.panel-number-badge');
      if (badge) {
        badge.textContent = newNumber;
      }
    }
  });

  console.log(`Renumbered ${panelElements.length} panels`);
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
    const panelElement = document.getElementById(panelId);
    if (panelElement) {
      panelElement.remove();
      console.log(`Removed panel ${panelId} from DOM`);
    }

    // Renumber remaining panels to maintain hotkey mapping (Cmd+Opt+1-9)
    renumberPanels();
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
 * Render panel HTML and append to container
 * @param {string} panelId - Panel ID
 * @param {Object} options - Panel display options
 * @returns {HTMLElement} Created panel element
 */
export function renderPanel(panelId, options = {}) {
  const panel = getPanel(panelId);
  if (!panel) {
    throw new Error(`Panel ${panelId} not found`);
  }

  const panelElement = document.createElement('div');
  panelElement.className = 'card panel-collapsed'; // Always collapsed in new system
  panelElement.id = panelId;

  // NEW SYSTEM: All panels are always collapsed (fixed size/position)
  // CodeMirror editors move to screen instead
  const collapsedWidth = 450;
  const collapsedHeight = 56;
  const collapsedX = 20;
  const collapsedY = 20 + (panel.number - 1) * (56 + 4); // Stack with 4px gap

  panelElement.style.width = `${collapsedWidth}px`;
  panelElement.style.height = `${collapsedHeight}px`;
  panelElement.style.transform = `translate(${collapsedX}px, ${collapsedY}px)`;
  panelElement.style.zIndex = panel.zIndex;

  // Store position in dataset for interact.js
  panelElement.dataset.x = collapsedX;
  panelElement.dataset.y = collapsedY;

  // Conditionally render delete button (skip for master panel)
  const deleteButton = panelId === MASTER_PANEL_ID
    ? ''
    : `<button class="delete-btn" data-panel="${panelId}">×</button>`;

  panelElement.innerHTML = `
    <div class="card-header">
      <span class="panel-number-badge">${panel.number}</span>
      <h3 class="panel-title" data-panel-id="${panelId}" contenteditable="false" spellcheck="false">
        ${panel.title}
      </h3>
      <div class="panel-controls">
        <button class="control-btn action-play activate-btn" data-card="${panelId}">
          <div class="control-btn-inner">
            <span class="material-icons">play_arrow</span>
          </div>
        </button>
        <button class="control-btn action-stop pause-btn hidden" data-card="${panelId}" disabled>
          <div class="control-btn-inner">
            <span class="material-icons">pause</span>
          </div>
        </button>
      </div>
      <div class="collapsed-sliders-container" id="collapsed-sliders-${panelId}"></div>
      <div class="visualization-canvas-container" id="viz-container-${panelId}"></div>
      ${deleteButton}
    </div>
    <div class="code-editor-wrapper">
      <div class="code-editor" data-card="${panelId}"></div>
    </div>
    <div class="slider-container" id="sliders-${panelId}"></div>
    <div class="error-message" data-card="${panelId}" style="display: none;"></div>
  `;

  // Append to container
  const container = document.querySelector('.container');
  if (container) {
    container.appendChild(panelElement);
  }

  return panelElement;
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
 * @param {string} panelId - Panel ID to make active
 */
export function setActivePanel(panelId) {
  // Remove active and focused classes from previous panel
  if (activePanelId) {
    const prevElement = document.getElementById(activePanelId);
    if (prevElement) {
      prevElement.classList.remove('active', 'focused');
    }
  }

  // Add active and focused classes to new panel
  const newElement = document.getElementById(panelId);
  if (newElement) {
    newElement.classList.add('active', 'focused');
  }

  activePanelId = panelId;

  // Update panel opacities based on focus state
  updatePanelOpacities();
}

/**
 * Normalize z-indices to prevent overflow
 * Re-assigns z-index values based on current order
 */
export function normalizeZIndices() {
  // Get all panels (managed panels + master panel)
  const allPanelElements = Array.from(document.querySelectorAll('.card, #master-panel'));

  // Sort by current z-index
  allPanelElements.sort((a, b) => {
    const zIndexA = parseInt(a.style.zIndex) || 0;
    const zIndexB = parseInt(b.style.zIndex) || 0;
    return zIndexA - zIndexB;
  });

  // Reassign z-index values: 10, 20, 30...
  allPanelElements.forEach((element, index) => {
    const newZIndex = (index + 1) * 10;
    element.style.zIndex = newZIndex;

    // Update panel state if it's a managed panel
    const panel = panels.get(element.id);
    if (panel) {
      panel.zIndex = newZIndex;
    }
  });

  // Update max z-index tracker
  maxZIndex = allPanelElements.length * 10;

  console.log(`Z-indices normalized. New max: ${maxZIndex}`);
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
 * @param {string} panelId - Panel ID
 * @returns {HTMLElement|null} Editor container element
 */
export function getPanelEditorContainer(panelId) {
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
        title: 'Master Panel (Global Controls)',
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
