/**
 * Panel UI Coordinator
 * Handles panel UI coordination: CodeMirror editors, button rendering, event listeners
 *
 * This module is responsible for UI coordination ONLY - no business logic.
 * Business logic is delegated to managers (panelManager, sliderManager, etc.)
 */

// ===== IMPORTS =====
import { getPanel, updatePanelTitle, bringPanelToFront } from '../managers/panelManager.js';
import { getSettings } from '../managers/settingsManager.js';
import { eventBus } from '../utils/eventBus.js';

// CodeMirror 6 imports
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { highlightExtension } from '@strudel/codemirror';
import { theme } from '@strudel/codemirror/themes.mjs';

// ===== MODULE-PRIVATE STATE =====
const panelEditors = new Map(); // Store CodeMirror editor instances: { panelId: EditorView }
const fontSizeCompartments = new Map(); // Store font size compartments for dynamic updates

// ===== HELPER FUNCTIONS =====

/**
 * Get CodeMirror editor instance for a panel
 * @param {string} panelId - Panel identifier
 * @returns {EditorView|null} Editor instance or null
 */
export function getPanelEditor(panelId) {
  return panelEditors.get(panelId) || null;
}

/**
 * Destroy CodeMirror editor for a panel
 * @param {string} panelId - Panel identifier
 */
export function destroyPanelEditor(panelId) {
  const editor = panelEditors.get(panelId);
  if (editor) {
    editor.destroy();
    panelEditors.delete(panelId);
    fontSizeCompartments.delete(panelId);
    console.log(`[PanelCoordinator] Destroyed editor for ${panelId}`);
  }
}

// ===== EXPORTED FUNCTIONS =====

/**
 * Initialize panel UI (CodeMirror editor + event listeners)
 * Extracted from main.js createEditorView() function
 *
 * @param {string} panelId - Panel identifier
 * @param {Object} options - Editor options
 * @param {string} options.initialCode - Initial code content
 * @param {Function} options.onChange - Change handler callback
 * @returns {EditorView} CodeMirror editor instance
 *
 * @example
 * const editor = initializePanelUI('panel-1', {
 *   initialCode: 's("bd hh")',
 *   onChange: (code, panelId) => { ... }
 * });
 */
export function initializePanelUI(panelId, options = {}) {
  const { initialCode = '', onChange = null } = options;
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

  // Get panel container
  const panelElement = document.getElementById(panelId);
  if (!panelElement) {
    console.error(`[PanelCoordinator] Panel element not found: ${panelId}`);
    return null;
  }

  const container = panelElement.querySelector('.code-editor');
  if (!container) {
    console.error(`[PanelCoordinator] Code editor container not found in ${panelId}`);
    return null;
  }

  const view = new EditorView({
    state,
    parent: container,
  });

  // Store editor instance and font size compartment
  panelEditors.set(panelId, view);
  fontSizeCompartments.set(panelId, fontSizeCompartment);

  // Emit event
  eventBus.emit('panel:uiReady', { panelId, editorView: view });

  console.log(`[PanelCoordinator] Initialized UI for ${panelId}`);
  return view;
}

/**
 * Render panel controls (buttons)
 *
 * Note: Current implementation uses HTML-defined buttons with event delegation.
 * This function is a placeholder for future dynamic button rendering.
 *
 * @param {string} panelId - Panel identifier
 */
export function renderPanelControls(panelId) {
  // TODO: Extract button rendering from main.js if buttons are created dynamically
  // Currently, buttons are in HTML and use event delegation
  console.log(`[PanelCoordinator] Panel controls for ${panelId} (using HTML buttons with delegation)`);
}

/**
 * Attach panel event listeners (button clicks, title editing)
 * Extracted from main.js event delegation patterns
 *
 * Note: Uses event delegation at document level for dynamic panel support
 *
 * @param {string} panelId - Panel identifier
 */
export function attachPanelEventListeners(panelId) {
  // Event listeners are attached globally via setupGlobalEventListeners()
  // This function is called per-panel but listeners are document-level
  console.log(`[PanelCoordinator] Event listeners attached for ${panelId} (via global delegation)`);
}

/**
 * Setup global event listeners using event delegation
 * Extracted from main.js initializeCards() function
 *
 * This should be called ONCE during app initialization, not per-panel
 */
export function setupGlobalEventListeners() {
  // PAUSE button clicks (event delegation)
  document.addEventListener('click', (e) => {
    const pauseBtn = e.target.closest('.pause-btn');
    if (pauseBtn && pauseBtn.dataset.card) {
      const panelId = pauseBtn.dataset.card;
      eventBus.emit('panel:buttonClicked', { panelId, button: 'pause' });
    }
  });

  // ACTIVATE button clicks (event delegation)
  document.addEventListener('click', (e) => {
    const activateBtn = e.target.closest('.activate-btn');
    if (activateBtn && activateBtn.dataset.card) {
      const panelId = activateBtn.dataset.card;
      eventBus.emit('panel:buttonClicked', { panelId, button: 'activate' });
    }
  });

  // DELETE button clicks (event delegation)
  document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn && deleteBtn.dataset.panel) {
      const panelId = deleteBtn.dataset.panel;
      eventBus.emit('panel:buttonClicked', { panelId, button: 'delete' });
    }
  });

  // Panel title single click: focus panel
  document.addEventListener('click', (e) => {
    const titleElement = e.target.closest('.panel-title');
    if (titleElement) {
      const panelId = titleElement.dataset.panelId;
      if (!panelId) return;

      const panel = document.getElementById(panelId);
      if (!panel) return;

      bringPanelToFront(panelId);
    }
  });

  // Panel title double-click: enable editing
  document.addEventListener('dblclick', (e) => {
    const titleElement = e.target.closest('.panel-title');
    if (titleElement) {
      // Enable contenteditable
      titleElement.contentEditable = 'true';
      titleElement.focus();

      // Select all text
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(titleElement);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });

  // Save title on blur
  document.addEventListener('blur', (e) => {
    const titleElement = e.target.closest('.panel-title');
    if (titleElement) {
      const panelId = titleElement.dataset.panelId;
      const newTitle = titleElement.textContent.trim();
      const panel = getPanel(panelId);

      // Disable contenteditable after editing
      titleElement.contentEditable = 'false';

      if (!panel) {
        console.warn(`Panel ${panelId} not found`);
        return;
      }

      if (newTitle) {
        // Save new title
        const success = updatePanelTitle(panelId, newTitle);
        if (success) {
          // Update displayed title (in case sanitization changed it)
          titleElement.textContent = panel.title;
          eventBus.emit('panel:titleChanged', { panelId, title: panel.title });
        }
      } else {
        // Restore old title if empty
        titleElement.textContent = panel.title;
      }
    }
  }, true); // Use capture phase for blur

  // Save title on Enter key
  document.addEventListener('keydown', (e) => {
    const titleElement = e.target.closest('.panel-title');
    if (titleElement && e.key === 'Enter') {
      e.preventDefault(); // Prevent line break
      titleElement.blur(); // Trigger save via blur event
    }
  });

  console.log('[PanelCoordinator] Global event listeners setup complete');
}

/**
 * Handle panel keyboard shortcuts
 *
 * @param {KeyboardEvent} event - Keyboard event
 * @param {string} panelId - Panel identifier
 */
export function handlePanelKeyboardShortcuts(event, panelId) {
  if (event.ctrlKey && event.key === 'Enter') {
    event.preventDefault();
    eventBus.emit('panel:keyboardShortcut', {
      panelId,
      shortcut: 'evaluate'
    });
  } else if (event.ctrlKey && event.key === 'k') {
    event.preventDefault();
    eventBus.emit('panel:keyboardShortcut', {
      panelId,
      shortcut: 'stop'
    });
  } else if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    eventBus.emit('panel:keyboardShortcut', {
      panelId,
      shortcut: 'save'
    });
  }
}

/**
 * Update panel UI based on state changes
 *
 * @param {string} panelId - Panel identifier
 * @param {Object} state - Panel state object
 * @param {boolean} state.playing - Whether panel is playing
 * @param {boolean} state.stale - Whether code has changed since last eval
 */
export function updatePanelUI(panelId, state) {
  const panelElement = document.getElementById(panelId);
  if (!panelElement) return;

  // Update playing indicator
  if (state.playing !== undefined) {
    const activateBtn = panelElement.querySelector('.activate-btn');
    const pauseBtn = panelElement.querySelector('.pause-btn');

    if (activateBtn && pauseBtn) {
      if (state.playing) {
        activateBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
      } else {
        activateBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
      }
    }
  }

  // Update staleness indicator
  if (state.stale !== undefined) {
    if (state.stale) {
      panelElement.classList.add('stale');
    } else {
      panelElement.classList.remove('stale');
    }
  }

  console.log(`[PanelCoordinator] Updated UI for ${panelId}`, state);
}

/**
 * Update font size for a specific panel's editor
 *
 * @param {string} panelId - Panel identifier
 * @param {number} fontSize - Font size in pixels
 */
export function updatePanelFontSize(panelId, fontSize) {
  const compartment = fontSizeCompartments.get(panelId);
  const view = panelEditors.get(panelId);

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
}

/**
 * Update font size for all panel editors
 *
 * @param {number} fontSize - Font size in pixels
 */
export function updateAllEditorFontSizes(fontSize) {
  panelEditors.forEach((view, panelId) => {
    updatePanelFontSize(panelId, fontSize);
  });
  console.log(`[PanelCoordinator] Updated font size to ${fontSize}px for all editors`);
}

// ===== EVENT BUS SETUP (at module load) =====

// Listen for state changes from managers
eventBus.on('panel:stateChanged', (data) => {
  updatePanelUI(data.panelId, data.state);
});

eventBus.on('panel:playingChanged', (data) => {
  updatePanelUI(data.panelId, { playing: data.playing });
});

eventBus.on('panel:deleted', (panelId) => {
  destroyPanelEditor(panelId);
});

eventBus.on('settings:saved', (settings) => {
  if (settings.fontSize) {
    updateAllEditorFontSizes(settings.fontSize);
  }
});

console.log('[PanelCoordinator] Module loaded');
