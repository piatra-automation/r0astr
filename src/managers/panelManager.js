/**
 * Panel Manager
 * Handles panel lifecycle: creation, deletion, and state management
 */

import { getSettings } from './settingsManager.js';
import { updatePanelOpacities } from './themeManager.js';
import { eventBus } from '../utils/eventBus.js';
import { skinManager } from './skinManager.js';
import { registerPanelParts, registerPart, unregisterPanel as unregisterPanelDOM, unregisterAll as unregisterAllDOM, getPart } from './panelDOMRegistry.js';
import { isLayoutMode, getRegionForPart, createPartContainer, placePartInRegion, removePanelFromRegions, clearAllRegions, setLayoutCollapsed, isLayoutCollapsed } from './layoutManager.js';

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
  if (isLayoutMode()) {
    renumberPanelsLayout();
  } else {
    renumberPanelsClassic();
  }
}

function renumberPanelsClassic() {
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
  savePanelStateNow();
}

function renumberPanelsLayout() {
  // In layout mode, derive order from the header region DOM order
  const headerRegion = getRegionForPart('header');
  if (!headerRegion) return;

  const headerParts = Array.from(headerRegion.querySelectorAll('.layout-part-header'));

  headerParts.forEach((part, index) => {
    const panelId = part.dataset.panelId;
    const panel = panels.get(panelId);

    // Update badge in header part
    const badge = part.querySelector('.panel-number-badge');
    if (badge) {
      badge.textContent = index;
    }

    // Update panel state
    if (panel) {
      panel.number = index;
    }

    // Also update badges and display-number in other regions
    document.querySelectorAll(`[data-panel-id="${panelId}"]`).forEach(el => {
      el.dataset.displayNumber = index;
      const b = el.querySelector('.panel-number-badge');
      if (b) b.textContent = index;
    });
  });

  console.log(`Renumbered ${headerParts.length} panels in layout mode`);
  savePanelStateNow();
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

  // Sanitize title: extract text content (strips all HTML), limit length
  const tempEl = document.createElement('span');
  tempEl.textContent = newTitle;
  const sanitizedTitle = tempEl.textContent
    .substring(0, 50)
    .trim();

  if (!sanitizedTitle) {
    console.warn('Empty title rejected');
    return false;
  }

  panel.title = sanitizedTitle;

  // Update DOM element
  const header = getPart(panelId, 'header');
  const titleElement = (header && header.querySelector('.panel-title')) ||
                       document.querySelector(`.panel-title[data-panel-id="${panelId}"]`);
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
 * Duplicate an existing panel with all its content and state
 * Creates a new panel as a copy of the source panel
 * @param {string} sourcePanelId - ID of the panel to duplicate
 * @param {Object} options - Override options for the new panel
 * @returns {string|null} New panel ID or null if source not found
 */
export function duplicatePanel(sourcePanelId, options = {}) {
  // Get source panel
  const sourcePanel = panels.get(sourcePanelId);
  if (!sourcePanel) {
    console.warn(`Cannot duplicate: Panel ${sourcePanelId} not found`);
    return null;
  }

  // Generate new unique ID
  const newPanelId = generatePanelId();
  const newPanelNumber = getNextPanelNumber();

  // Create title for duplicated panel
  let newTitle = options.title;
  if (!newTitle) {
    // Add " Copy" suffix, handling existing "Copy" suffixes
    const baseTitle = sourcePanel.title.replace(/ Copy( \d+)?$/, '');
    // Check for existing copies to increment number
    let copyNumber = 1;
    const existingTitles = Array.from(panels.values()).map(p => p.title);
    while (existingTitles.includes(copyNumber === 1 ? `${baseTitle} Copy` : `${baseTitle} Copy ${copyNumber}`)) {
      copyNumber++;
    }
    newTitle = copyNumber === 1 ? `${baseTitle} Copy` : `${baseTitle} Copy ${copyNumber}`;
  }

  // Increment max z-index for new panel
  maxZIndex += 10;

  // Deep clone panel state (except id, number, playing state, zIndex)
  const newPanel = {
    id: newPanelId,
    number: newPanelNumber,
    title: newTitle,
    code: sourcePanel.code, // Copy the code with all slider values
    playing: false, // Start paused for safety
    stale: false,
    lastEvaluatedCode: '', // Reset - not yet evaluated
    position: { ...sourcePanel.position }, // Copy position (legacy)
    size: { ...sourcePanel.size }, // Copy size
    zIndex: maxZIndex,
    expandedPosition: sourcePanel.expandedPosition ? { ...sourcePanel.expandedPosition } : null,
    collapsedPosition: null, // Will be calculated when rendered
    isCollapsed: true
  };

  // Store in panels Map
  panels.set(newPanelId, newPanel);

  // Emit panel duplicated event
  eventBus.emit('panel:duplicated', {
    sourceId: sourcePanelId,
    newId: newPanelId,
    title: newPanel.title,
    code: newPanel.code
  });

  // Also emit panel created for compatibility
  eventBus.emit('panel:created', {
    id: newPanelId,
    title: newPanel.title,
    code: newPanel.code,
    options: { duplicatedFrom: sourcePanelId }
  });

  // Auto-save panel state
  autoSavePanelState();

  console.log(`Duplicated panel ${sourcePanelId} -> ${newPanelId} as "${newTitle}"`);
  return newPanelId;
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

  // Check YOLO mode - skip confirmation when enabled
  // Also skip in server environment or when explicitly requested (e.g., API deletions)
  if (!skipConfirmation && typeof window !== 'undefined' && typeof confirm !== 'undefined') {
    const settings = getSettings();
    if (!settings.yolo) {
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
    // Unregister panel parts from DOM registry
    unregisterPanelDOM(panelId);

    // Layout mode: remove parts from all regions
    if (isLayoutMode()) {
      removePanelFromRegions(panelId);
    }

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

  // Layout mode: render parts into separate regions
  if (isLayoutMode()) {
    return renderPanelLayout(panelId, panel, options);
  }

  // Classic mode: render monolithic panel
  return renderPanelClassic(panelId, panel, options);
}

/**
 * Classic (monolithic) panel render — existing behavior
 */
function renderPanelClassic(panelId, panel, options) {
  // Create tree node (li.level-panel)
  const panelElement = document.createElement('li');
  panelElement.className = 'level-panel';
  panelElement.id = panelId;
  panelElement.dataset.panelId = panelId;
  panelElement.dataset.panelNumber = panel.number;

  // Hide delete and duplicate buttons for master panel (panel-0)
  const deleteButtonStyle = panelId === MASTER_PANEL_ID ? 'display: none;' : '';
  const duplicateButtonStyle = panelId === MASTER_PANEL_ID ? 'display: none;' : '';

  // Render panel using skin template
  const panelHTML = skinManager.render('panel', {
    panelId,
    panelNumber: panel.number,
    title: panel.title,
    expanded: options.expanded ? ' open' : '',
    deleteButtonStyle,
    duplicateButtonStyle
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

  // Register panel parts in DOM registry
  registerPanelParts(panelId, panelElement);

  return panelElement;
}

/**
 * Layout mode panel render — parts placed into separate page regions.
 * Creates a virtual root element (not inserted into panel-tree)
 * and renders each part template into its designated region.
 */
function renderPanelLayout(panelId, panel, options) {
  const deleteButtonStyle = panelId === MASTER_PANEL_ID ? 'display: none;' : '';
  const duplicateButtonStyle = panelId === MASTER_PANEL_ID ? 'display: none;' : '';

  const templateData = {
    panelId,
    panelNumber: panel.number,
    title: panel.title,
    expanded: options.expanded ? ' open' : '',
    deleteButtonStyle,
    duplicateButtonStyle
  };

  // Create a virtual root for registry (not in the panel-tree DOM)
  const panelElement = document.createElement('div');
  panelElement.className = 'level-panel layout-panel-root';
  panelElement.id = panelId;
  panelElement.dataset.panelId = panelId;
  panelElement.dataset.panelNumber = panel.number;
  panelElement.style.display = 'none'; // Virtual — not visible itself

  // Insert virtual root into body for registry containment checks
  document.body.appendChild(panelElement);

  // Register root
  registerPart(panelId, 'root', panelElement);

  // Render each part template and place into regions
  const partNames = ['header', 'editor', 'controls'];

  for (const partName of partNames) {
    const templateKey = `panel-${partName}`;
    const html = skinManager.hasTemplate(templateKey)
      ? skinManager.render(templateKey, templateData)
      : skinManager.getFallbackTemplate(templateKey, templateData);

    const partContainer = createPartContainer(panelId, partName, html);

    // Place into region — fall back to appending to virtual root if no region
    if (!placePartInRegion(panelId, partName, partContainer, panel.number)) {
      panelElement.appendChild(partContainer);
    }

    // Register the actual content element (first child or the container itself)
    const partRoot = resolvePartElement(partContainer, partName);
    if (partRoot) {
      registerPart(panelId, partName, partRoot);
    }
  }

  // Register specific sub-parts that consumers look up directly
  const editorEl = document.getElementById(`editor-${panelId}`);
  if (editorEl) registerPart(panelId, 'editor', editorEl);

  const vizEl = document.getElementById(`viz-container-${panelId}`);
  if (vizEl) registerPart(panelId, 'viz', vizEl);

  const errorEl = document.querySelector(`.error-message[data-card="${panelId}"]`);
  if (errorEl) registerPart(panelId, 'error', errorEl);

  const controlsEl = document.querySelector(`.layout-part-controls[data-panel-id="${panelId}"] .panel-controls-container`);
  if (controlsEl) registerPart(panelId, 'controls', controlsEl);

  console.log(`[PanelManager] Layout-mode panel rendered: ${panelId}`);
  return panelElement;
}

/**
 * Resolve the meaningful element within a part container
 */
function resolvePartElement(partContainer, partName) {
  switch (partName) {
    case 'header':
      return partContainer.querySelector('summary') || partContainer;
    case 'editor':
      return partContainer.querySelector('.panel-editor-container') || partContainer;
    case 'controls':
      return partContainer.querySelector('.panel-controls-container') || partContainer;
    default:
      return partContainer;
  }
}

/**
 * Re-render all existing panels with new skin (hot-reload)
 * Preserves internal panel state, only updates DOM with new templates
 * @param {Function} createEditorView - Function to create CodeMirror editor
 * @param {Map} editorViews - Map to store editor views
 * @param {Function} renderSliders - Function to render sliders (optional)
 * @param {Function} getPanelSliders - Function to get panel slider data (optional)
 * @param {Function} onChange - Callback for instrument panel editor changes (optional)
 * @param {Function} onMasterChange - Callback for master panel editor changes (optional)
 */
export async function reRenderAllPanels(createEditorView, editorViews, renderSliders = null, getPanelSliders = null, onChange = null, onMasterChange = null) {
  console.log(`[PanelManager] Re-rendering ${panels.size} panels with new skin...`);

  // Unregister all panel parts from DOM registry before rebuild
  unregisterAllDOM();

  // Clear layout regions if in layout mode
  if (isLayoutMode()) {
    clearAllRegions();
  }

  // Clear DOM except master panel (keep internal state)
  const panelTree = document.querySelector('.panel-tree');
  if (panelTree) {
    const existingPanels = panelTree.querySelectorAll('.level-panel:not([data-panel-id="panel-0"])');
    existingPanels.forEach(panel => panel.remove());
  }

  // Also remove any virtual layout-panel-root elements
  document.querySelectorAll('.layout-panel-root').forEach(el => el.remove());

  // Get master panel code before destroying editor views
  const masterView = editorViews.get(MASTER_PANEL_ID);
  const masterCode = masterView?.state.doc.toString() || '';

  // Destroy existing editor views to prevent DOM leaks
  for (const [, view] of editorViews) {
    view.destroy();
  }
  editorViews.clear();

  // Clear master panel editor container DOM (master panel element persists across re-renders)
  const masterContainer = getPanelEditorContainer(MASTER_PANEL_ID);
  if (masterContainer) {
    masterContainer.innerHTML = '';
  }

  // Render all panel DOM elements first, then create editors in a second pass.
  // This lets the browser lay out all elements before CodeMirror measures them.
  const renderedPanelIds = [];

  for (const [panelId, panelData] of panels) {
    try {
      console.log(`[PanelManager] Rendering ${panelId} (number: ${panelData.number}, title: "${panelData.title}")`);
      renderPanel(panelId, { expanded: true });
      renderedPanelIds.push(panelId);
      console.log(`[PanelManager] ✓ Panel ${panelId} DOM created`);
    } catch (error) {
      console.error(`[PanelManager] ✗ Failed to render ${panelId}:`, error);
    }
  }

  // Let the browser lay out all newly inserted DOM before creating editors
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // Second pass: create CodeMirror editors and sliders
  for (const panelId of renderedPanelIds) {
    try {
      const panelData = panels.get(panelId);
      const editorContainer = getPanelEditorContainer(panelId);
      if (editorContainer) {
        const view = createEditorView(editorContainer, {
          initialCode: panelData.code || '',
          onChange: panelId === MASTER_PANEL_ID ? onMasterChange : onChange,
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
      console.error(`[PanelManager] ✗ Failed to create editor for ${panelId}:`, error);
    }
  }

  // Re-create master panel editor (static HTML panel, not in panels Map)
  await new Promise(resolve => requestAnimationFrame(resolve));
  const masterContainerFresh = getPanelEditorContainer(MASTER_PANEL_ID);
  if (masterContainerFresh) {
    console.log('[PanelManager] Recreating master panel editor');
    try {
      const masterEditorView = createEditorView(masterContainerFresh, {
        initialCode: masterCode,
        onChange: onMasterChange,
        panelId: MASTER_PANEL_ID
      });
      editorViews.set(MASTER_PANEL_ID, masterEditorView);
      console.log('[PanelManager] ✓ Master panel editor recreated');
    } catch (error) {
      console.error('[PanelManager] ✗ Failed to create master editor:', error);
    }
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
    const prevElement = getPart(activePanelId, 'root') ||
                        document.querySelector(`[data-panel-id="${activePanelId}"]`) ||
                        document.getElementById(activePanelId);
    if (prevElement) {
      prevElement.classList.remove('active', 'focused');
    }
    // In layout mode, also remove from visible layout parts
    if (isLayoutMode()) {
      document.querySelectorAll(`.layout-part[data-panel-id="${activePanelId}"]`).forEach(el => {
        el.classList.remove('focused');
      });
    }
  }

  activePanelId = panelId;

  // Add active and focused classes to new panel
  const newElement = getPart(panelId, 'root') ||
                     document.querySelector(`[data-panel-id="${panelId}"]`) ||
                     document.getElementById(panelId);
  if (newElement) {
    newElement.classList.add('active', 'focused');
  }

  // In layout mode, only highlight layout parts if panel is expanded
  if (isLayoutMode()) {
    updateLayoutFocusHighlight(panelId);
  }

  // Update panel opacities based on focus state
  updatePanelOpacities();
}

/**
 * Update focus highlight on layout parts for a panel.
 * Highlight only applies when the panel is both active and expanded.
 * @param {string} panelId - Panel ID (or null to just refresh current active)
 */
export function updateLayoutFocusHighlight(panelId) {
  const targetId = panelId || activePanelId;
  if (!targetId) return;

  const expanded = isPanelExpanded(targetId);
  const isActive = targetId === activePanelId;

  document.querySelectorAll(`.layout-part[data-panel-id="${targetId}"]`).forEach(el => {
    el.classList.toggle('focused', isActive && expanded);
  });
}

/**
 * Expand a panel in tree view
 * @param {string} panelId - Panel ID to expand
 */
export function expandPanel(panelId) {
  if (isLayoutMode()) {
    setLayoutCollapsed(panelId, false);
  } else {
    const details = getPart(panelId, 'details');
    if (!details) return;
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
  if (isLayoutMode()) {
    setLayoutCollapsed(panelId, true);
  } else {
    const details = getPart(panelId, 'details');
    if (!details) return;
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
  if (isLayoutMode()) {
    const collapsed = isLayoutCollapsed(panelId);
    setLayoutCollapsed(panelId, !collapsed);
    const panel = panels.get(panelId);
    if (panel) panel.expanded = collapsed; // was collapsed, now expanded
    return collapsed;
  }

  const details = getPart(panelId, 'details');
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
  if (isLayoutMode()) {
    return !isLayoutCollapsed(panelId);
  }
  const details = getPart(panelId, 'details');
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

    // Sort panels by number for consistent ordering in saved state
    panelArray.sort((a, b) => (a.number || 0) - (b.number || 0));

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
  // Try DOM registry first
  const registered = getPart(panelId, 'editor');
  if (registered) return registered;

  // Fallback: Try tree structure (id="editor-{panelId}")
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
