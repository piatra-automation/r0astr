/**
 * File I/O for Save/Load Layout
 * Exports and imports panel layouts as JSON files
 *
 * JSON Schema:
 * {
 *   "version": "1.0",
 *   "name": "My Session",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "panels": [
 *     {
 *       "id": "panel-0",
 *       "title": "Master Panel",
 *       "code": "let TEMPO = slider(120, 60, 180);",
 *       "isMaster": true,
 *       "compact": true
 *     },
 *     {
 *       "id": "panel-1234567890",
 *       "title": "Bass",
 *       "code": "note(\"c2\").s(\"sawtooth\")",
 *       "number": 1
 *     }
 *   ]
 * }
 */

import { getAllPanels, MASTER_PANEL_ID } from '../managers/panelManager.js';

const CURRENT_VERSION = '1.0';

/**
 * Generate layout JSON from current state
 * @param {Map} editorViews - Map of panel ID to CodeMirror EditorView
 * @param {Object} appState - Application state containing masterPanelCompact
 * @returns {Object} Layout object ready for serialization
 */
export function generateLayoutJSON(editorViews, appState = {}) {
  const panels = getAllPanels();
  const panelArray = [];

  // Process all panels
  panels.forEach((panel) => {
    // Get current code from editor if available
    const view = editorViews.get(panel.id);
    const currentCode = view ? view.state.doc.toString() : panel.code;

    panelArray.push({
      id: panel.id,
      title: panel.title,
      code: currentCode,
      number: panel.number
    });
  });

  // Add master panel if it has an editor
  const masterView = editorViews.get(MASTER_PANEL_ID);
  if (masterView) {
    panelArray.push({
      id: MASTER_PANEL_ID,
      title: 'Master Panel (Global Controls)',
      code: masterView.state.doc.toString(),
      isMaster: true,
      compact: appState.masterPanelCompact !== undefined ? appState.masterPanelCompact : true
    });
  }

  return {
    version: CURRENT_VERSION,
    name: generateDefaultName(),
    timestamp: new Date().toISOString(),
    panels: panelArray
  };
}

/**
 * Generate default session name based on date/time
 * @returns {string} Default name like "r0astr-2024-01-15-1030"
 */
function generateDefaultName() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().slice(0, 5).replace(':', '');
  return `r0astr-${date}-${time}`;
}

/**
 * Save current layout to a JSON file (download)
 * @param {Map} editorViews - Map of panel ID to CodeMirror EditorView
 * @param {Object} appState - Application state
 */
export function saveLayoutToFile(editorViews, appState = {}) {
  try {
    const layout = generateLayoutJSON(editorViews, appState);
    const json = JSON.stringify(layout, null, 2);

    // Create blob and download link
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${layout.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`[FileIO] Layout saved: ${layout.name}.json (${layout.panels.length} panels)`);
    return true;
  } catch (error) {
    console.error('[FileIO] Failed to save layout:', error);
    alert('Failed to save layout. Check console for details.');
    return false;
  }
}

/**
 * Load layout from a JSON file
 * @param {Function} onLoad - Callback with parsed layout object
 * @returns {Promise<Object|null>} Layout object or null if cancelled/failed
 */
export function loadLayoutFromFile(onLoad) {
  return new Promise((resolve) => {
    // Create hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const text = await file.text();
        const layout = JSON.parse(text);

        // Validate layout structure
        const validation = validateLayout(layout);
        if (!validation.valid) {
          alert(`Invalid layout file: ${validation.error}`);
          resolve(null);
          return;
        }

        console.log(`[FileIO] Layout loaded: ${file.name} (${layout.panels.length} panels, v${layout.version})`);

        if (onLoad) {
          onLoad(layout);
        }
        resolve(layout);
      } catch (error) {
        console.error('[FileIO] Failed to parse layout file:', error);
        alert('Failed to load layout. File may be corrupted or not a valid r0astr layout.');
        resolve(null);
      }
    };

    // Handle cancel
    input.oncancel = () => resolve(null);

    // Trigger file picker
    input.click();
  });
}

/**
 * Validate layout object structure
 * @param {Object} layout - Layout object to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
function validateLayout(layout) {
  if (!layout || typeof layout !== 'object') {
    return { valid: false, error: 'Not a valid JSON object' };
  }

  if (!layout.panels || !Array.isArray(layout.panels)) {
    return { valid: false, error: 'Missing or invalid panels array' };
  }

  if (layout.panels.length === 0) {
    return { valid: false, error: 'Layout contains no panels' };
  }

  // Validate each panel has minimum required fields
  for (let i = 0; i < layout.panels.length; i++) {
    const panel = layout.panels[i];
    if (!panel.id || typeof panel.id !== 'string') {
      return { valid: false, error: `Panel ${i} missing valid id` };
    }
    if (panel.code === undefined) {
      return { valid: false, error: `Panel ${i} missing code field` };
    }
  }

  // Version check (for future compatibility)
  if (layout.version && layout.version !== CURRENT_VERSION) {
    console.warn(`[FileIO] Layout version ${layout.version} differs from current ${CURRENT_VERSION}`);
  }

  return { valid: true };
}
