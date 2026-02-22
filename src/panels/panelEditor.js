/**
 * Panel Editor Module
 *
 * Handles CodeMirror editor creation and management:
 * - Editor view creation
 * - Font size configuration
 * - Editor change handling
 *
 * Story 7.6: Responsive syntax highlighting using CodeMirror 6
 * - Optimized for typing without lag
 * - Debounced non-critical operations
 * - requestAnimationFrame for visual updates
 */

// CodeMirror 6 imports
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { highlightExtension } from '@strudel/codemirror';
import { theme } from '@strudel/codemirror/themes.mjs';

import { editorViews, fontSizeCompartments } from '../state.js';
import { getSettings } from '../managers/settingsManager.js';
import { getPanel, updatePanel } from '../managers/panelManager.js';
import { checkStaleness } from './panelValidation.js';
import { updateVisualIndicators } from './panelUI.js';

// Reference to updateAllButton - set by main.js
let updateAllButtonRef = null;

// === DEBOUNCING FOR RESPONSIVE TYPING ===
// Debounce timers for each panel to prevent lag during typing
const debounceTimers = new Map();
// Pending updates batched per panel
const pendingUpdates = new Map();
// RAF handle for batched visual updates
let rafHandle = null;

/**
 * Set reference to updateAllButton from main.js
 * @param {Function} fn - updateAllButton function
 */
export function setUpdateAllButtonRef(fn) {
  updateAllButtonRef = fn;
}

/**
 * Create CodeMirror 6 editor view
 * Story 7.6: CodeMirror Integration
 * @param {HTMLElement} container - DOM element to attach editor to
 * @param {Object} options - Editor configuration
 * @param {string} options.initialCode - Initial code content
 * @param {Function} options.onChange - Callback when code changes (code, panelId)
 * @param {string} options.panelId - Panel ID for change tracking
 * @returns {EditorView} CodeMirror editor instance
 */
export function createEditorView(container, options = {}) {
  const { initialCode = '', onChange = null, panelId = null } = options;
  const settings = getSettings();

  // Create compartment for font size theme (allows dynamic reconfiguration)
  const fontSizeCompartment = new Compartment();

  const extensions = [
    // Minimal setup
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    bracketMatching(),
    closeBrackets(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...closeBracketsKeymap,
    ]),
    // Pattern highlighting extension
    highlightExtension,
    // Make scroller non-scrollable, wrapper handles it
    // Make background transparent to show container color
    fontSizeCompartment.of(EditorView.theme({
      ".cm-scroller": {
        overflow: "visible !important"
      },
      "&": {
        backgroundColor: "transparent !important",
        fontSize: `${settings.fontSize || 14}px`
      },
      ".cm-content": {
        backgroundColor: "transparent !important"
      },
      ".cm-gutters": {
        backgroundColor: "transparent !important",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)"
      },
      ".cm-activeLineGutter": {
        backgroundColor: "rgba(255, 255, 255, 0.05) !important"
      },
      ".cm-activeLine": {
        backgroundColor: "rgba(255, 255, 255, 0.03) !important"
      }
    })),
  ];

  // Story 7.6: Conditional syntax highlighting
  if (settings.syntax_highlight !== false) {
    extensions.push(
      syntaxHighlighting(defaultHighlightStyle),
      javascript(),
      theme(settings.editor_theme || 'atomone')
    );
  }

  // Conditional line wrapping
  if (settings.wrap_lines) {
    extensions.push(EditorView.lineWrapping);
  }

  // Update listener for onChange callback
  if (onChange) {
    extensions.push(EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const code = update.state.doc.toString();
        onChange(code, panelId);
      }
    }));
  }

  const state = EditorState.create({
    doc: initialCode,
    extensions,
  });

  const view = new EditorView({
    state,
    parent: container,
  });

  // Store font size compartment for dynamic updates
  if (panelId) {
    fontSizeCompartments.set(panelId, fontSizeCompartment);
  }

  return view;
}

/**
 * Handle editor change event - OPTIMIZED for responsive typing
 * Story 7.6: Responsive syntax highlighting using CodeMirror 6
 *
 * Performance strategy:
 * 1. Immediate: Store code in panel state (minimal overhead)
 * 2. Debounced (100ms): Check staleness and update UI indicators
 * 3. RAF batched: Visual updates to prevent layout thrashing
 *
 * @param {string} code - New code content
 * @param {string} panelId - Panel ID
 */
export function handleEditorChange(code, panelId) {
  const panel = getPanel(panelId);
  if (!panel) return;

  // IMMEDIATE: Update panel code state (fast, in-memory only)
  // This ensures code is always saved even during rapid typing
  panel.code = code;

  // Store pending update for this panel
  pendingUpdates.set(panelId, code);

  // Clear existing debounce timer for this panel
  const existingTimer = debounceTimers.get(panelId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // DEBOUNCED: Schedule staleness check and visual updates
  // 100ms delay allows rapid typing without triggering expensive operations
  const timer = setTimeout(() => {
    processPendingUpdate(panelId);
  }, 100);

  debounceTimers.set(panelId, timer);
}

/**
 * Process pending update for a panel
 * Called after debounce delay to batch operations
 * @param {string} panelId - Panel ID
 */
function processPendingUpdate(panelId) {
  const code = pendingUpdates.get(panelId);
  if (code === undefined) return;

  // Clear pending update
  pendingUpdates.delete(panelId);
  debounceTimers.delete(panelId);

  const panel = getPanel(panelId);
  if (!panel) return;

  // Update panel state with persistence (debounced - won't save immediately)
  updatePanel(panelId, { code: code });

  // Check staleness (compares current code to last evaluated)
  checkStaleness(panelId);

  // Schedule visual updates on next animation frame
  // This batches multiple panels' updates together and avoids layout thrashing
  scheduleVisualUpdate(panelId);
}

/**
 * Schedule visual update using requestAnimationFrame
 * Batches visual updates across multiple panels for efficiency
 * @param {string} panelId - Panel ID to update
 */
const panelsToUpdate = new Set();

function scheduleVisualUpdate(panelId) {
  panelsToUpdate.add(panelId);

  // Only schedule one RAF callback
  if (rafHandle) return;

  rafHandle = requestAnimationFrame(() => {
    rafHandle = null;

    // Process all pending visual updates
    for (const id of panelsToUpdate) {
      updateVisualIndicators(id);
    }
    panelsToUpdate.clear();

    // Update global "Update All" button if needed
    if (updateAllButtonRef) {
      updateAllButtonRef();
    }
  });
}

/**
 * Flush pending updates immediately
 * Use when you need updates to apply before an action (e.g., play button)
 * @param {string} panelId - Optional panel ID to flush, or all if not specified
 */
export function flushPendingUpdates(panelId = null) {
  if (panelId) {
    // Flush specific panel
    const existingTimer = debounceTimers.get(panelId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      processPendingUpdate(panelId);
    }
  } else {
    // Flush all pending updates
    for (const [id, timer] of debounceTimers) {
      clearTimeout(timer);
      processPendingUpdate(id);
    }
  }
}

/**
 * Update font size for all editor views
 */
export function updateAllEditorFontSizes() {
  const settings = getSettings();
  const fontSize = settings.fontSize || 14;

  console.log(`[Settings] Updating font size to ${fontSize}px for all editors`);

  // Update all editor views
  editorViews.forEach((view, panelId) => {
    const compartment = fontSizeCompartments.get(panelId);
    if (compartment && view) {
      view.dispatch({
        effects: compartment.reconfigure(EditorView.theme({
          ".cm-scroller": {
            overflow: "visible !important"
          },
          "&": {
            backgroundColor: "transparent !important",
            fontSize: `${fontSize}px`
          },
          ".cm-content": {
            backgroundColor: "transparent !important"
          },
          ".cm-gutters": {
            backgroundColor: "transparent !important",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)"
          },
          ".cm-activeLineGutter": {
            backgroundColor: "rgba(255, 255, 255, 0.05) !important"
          },
          ".cm-activeLine": {
            backgroundColor: "rgba(255, 255, 255, 0.03) !important"
          }
        }))
      });
    }
  });
}
