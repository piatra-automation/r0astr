/**
 * Panel Editor Module
 *
 * Handles CodeMirror editor creation and management:
 * - Editor view creation
 * - Font size configuration
 * - Editor change handling
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
 * Handle editor change event
 * Story 7.6: CodeMirror Integration
 * @param {string} code - New code content
 * @param {string} panelId - Panel ID
 */
export function handleEditorChange(code, panelId) {
  const startTime = performance.now();

  const panel = getPanel(panelId);
  if (panel) {
    const t1 = performance.now();
    updatePanel(panelId, { code: code });
    const t2 = performance.now();
    checkStaleness(panelId);
    const t3 = performance.now();
    updateVisualIndicators(panelId);
    const t4 = performance.now();
    if (updateAllButtonRef) {
      updateAllButtonRef();
    }
    const t5 = performance.now();

    const total = t5 - startTime;
    if (total > 5) {
      console.warn(`[PERF INPUT] Total: ${total.toFixed(1)}ms | updatePanel: ${(t2 - t1).toFixed(1)}ms | checkStaleness: ${(t3 - t2).toFixed(1)}ms | updateVisualIndicators: ${(t4 - t3).toFixed(1)}ms | updateAllButton: ${(t5 - t4).toFixed(1)}ms`);
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
