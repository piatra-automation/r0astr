/**
 * Pattern Validator Module
 * Handles pattern syntax validation, error display, and staleness detection
 *
 * This module validates Strudel pattern code using the transpiler and evaluate function.
 * It manages error display, staleness detection, and button state updates.
 *
 * Extracted from main.js (Story 10.3):
 * - validateCode() - Lines 1357-1422
 * - displayError() - Lines 1430-1437
 * - clearErrorMessage() - Lines 1443-1449
 * - checkStaleness() - Lines 1238-1264
 * - updateActivateButton() - Lines 1282-1316
 * - updatePauseButton() - Lines 1323-1332
 */

// ===== IMPORTS =====
import { transpiler } from '@strudel/transpiler';
import { getPanelEditor } from './panelCoordinator.js';
import { getPanel, updatePanel } from '../managers/panelManager.js';
import { eventBus } from '../utils/eventBus.js';

// ===== MODULE-PRIVATE STATE =====
// Panel states are managed by panelManager, accessed via getPanel()
// Editor views are managed by panelCoordinator, accessed via getPanelEditor()

// Access Strudel evaluate function from window (set by main.js during initialization)
const getEvaluate = () => window.evaluate || null;
const getScheduler = () => window.scheduler || null;

// ===== EXPORTED FUNCTIONS =====

/**
 * Story 7.3: Validate code by transpiling AND evaluating (dry run)
 * Catches both syntax errors and runtime errors (undefined variables/functions)
 * Extracted from main.js lines 1357-1422
 *
 * @param {string} panelId - Panel ID
 * @returns {Promise<Object>} { valid: boolean, error?: string, line?: number }
 *
 * @example
 * const result = await validateCode('panel-1');
 * if (result.valid) {
 *   console.log('Pattern is valid');
 * } else {
 *   displayError('panel-1', result.error, result.line);
 * }
 */
export async function validateCode(panelId) {
  const evaluate = getEvaluate();

  // Guard: evaluate not initialized yet (during early startup)
  if (!evaluate) {
    return { valid: true }; // Assume valid until Strudel is ready
  }

  const view = getPanelEditor(panelId);

  if (!view) {
    return { valid: false, error: 'EditorView not found' };
  }

  const code = view.state.doc.toString().trim();

  // Empty code is valid (no pattern to play)
  if (!code) {
    return { valid: true };
  }

  try {
    // Step 1: Transpile (catches syntax errors)
    const { output } = transpiler(code, { addReturn: false });

    // Step 2: Evaluate WITHOUT .p() (dry run - catches ReferenceErrors/TypeErrors)
    // Suppress console errors during validation (prevents error spam in console)
    const originalConsoleError = console.error;
    console.error = () => { }; // Temporarily silence console.error

    try {
      // This executes the code and returns a Pattern, but doesn't start playback
      // Catches: undefined variables, undefined functions, some type errors
      await evaluate(output, false, false);
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }

    return { valid: true };
  } catch (error) {
    // Extract error details and clean up message
    let errorMessage = error.message || 'Unknown error';

    // Clean up common TypeError patterns for better readability
    if (errorMessage.includes('Cannot read properties of undefined')) {
      // "Cannot read properties of undefined (reading 'delay')" -> "Property 'delay' is undefined"
      const match = errorMessage.match(/reading '([^']+)'/);
      if (match) {
        errorMessage = `Property '${match[1]}' is undefined`;
      }
    } else if (errorMessage.includes('is not a function')) {
      // "arrange(...).note(...).s.delay is not a function" -> "Method '.delay()' is not a function"
      const match = errorMessage.match(/\.(\w+)\s+is not a function/);
      if (match) {
        errorMessage = `Method '.${match[1]}()' is not a function`;
      }
    }

    const lineNumber = error.line || error.lineNumber || 'unknown';

    return {
      valid: false,
      error: errorMessage,
      line: lineNumber
    };
  }
}

/**
 * Story 7.3: Display error message in panel
 * Extracted from main.js lines 1430-1437
 *
 * @param {string} panelId - Panel ID
 * @param {string} errorMessage - Error message
 * @param {number|string} lineNumber - Line number
 *
 * @example
 * displayError('panel-1', 'Unexpected token', 5);
 */
export function displayError(panelId, errorMessage, lineNumber) {
  const errorContainer = document.querySelector(`.error-message[data-card="${panelId}"]`);
  if (!errorContainer) return;

  const formattedError = `Error: ${errorMessage} (line ${lineNumber})`;
  errorContainer.textContent = formattedError;
  errorContainer.style.display = 'block';

  // Emit event
  eventBus.emit('pattern:invalid', { panelId, error: errorMessage, line: lineNumber });
}

/**
 * Story 7.3: Clear error message in panel
 * Extracted from main.js lines 1443-1449
 *
 * @param {string} panelId - Panel ID
 *
 * @example
 * clearErrorMessage('panel-1');
 */
export function clearErrorMessage(panelId) {
  const errorContainer = document.querySelector(`.error-message[data-card="${panelId}"]`);
  if (!errorContainer) return;

  errorContainer.textContent = '';
  errorContainer.style.display = 'none';

  // Emit event
  eventBus.emit('pattern:valid', { panelId });
}

/**
 * Check if panel is stale (code differs from running pattern)
 * Story 6.1: Staleness Detection Logic
 * Extracted from main.js lines 1238-1264
 *
 * @param {string} panelId - Panel ID to check
 * @returns {boolean} True if panel is stale
 *
 * @example
 * const isStale = checkStaleness('panel-1');
 * if (isStale) {
 *   console.log('Panel code has changed since last evaluation');
 * }
 */
export function checkStaleness(panelId) {
  const panel = getPanel(panelId);
  if (!panel) return false;

  const view = getPanelEditor(panelId);
  if (!view) return false;

  // Staleness only applies to playing panels
  if (!panel.playing) {
    if (panel.stale) {
      updatePanel(panelId, { stale: false }); // Sync to panelManager for persistence
    }
    return false;
  }

  // Compare current code to last-evaluated code
  const currentCode = view.state.doc.toString();
  const isStale = currentCode !== panel.lastEvaluatedCode;

  if (panel.stale !== isStale) {
    updatePanel(panelId, { stale: isStale }); // Sync to panelManager for persistence
  }

  // Clear highlighting when panel becomes stale
  if (isStale) {
    const scheduler = getScheduler();
    if (scheduler && window.highlightMiniLocations) {
      window.highlightMiniLocations(view, scheduler.now(), []); // Clear highlights
    }
  }

  // Emit event
  if (isStale) {
    eventBus.emit('panel:stale', { panelId });
  }

  return isStale;
}

/**
 * Helper to check if panel is stale
 * Story 6.1: Staleness Detection Logic
 * Extracted from main.js lines 1272-1274
 *
 * @param {string} panelId - Panel ID to check
 * @returns {boolean} True if panel is stale
 */
export function isPanelStale(panelId) {
  const panel = getPanel(panelId);
  return panel?.stale ?? false;
}

/**
 * Update ACTIVATE button based on panel state
 * Extracted from main.js lines 1282-1316
 *
 * @param {string} panelId - Panel ID
 *
 * @example
 * updateActivateButton('panel-1');
 */
export async function updateActivateButton(panelId) {
  const panel = getPanel(panelId);
  const button = document.querySelector(`#${panelId} .activate-btn`) ||
    document.querySelector(`.activate-btn[data-card="${panelId}"]`);

  if (!panel || !button) return;

  // DISABLED: Validation causes eval spam during typing
  // Buttons always enabled now - validation only at PLAY time
  const validation = { valid: true };

  // Determine button state
  if (panel.playing && !panel.stale) {
    // Playing and in sync → Hide activate button (pause button will be shown)
    button.classList.add('hidden');
    button.disabled = true;
    button.classList.remove('update');
  } else if (panel.stale) {
    // Stale (playing with edits) → Show UPDATE button
    button.classList.remove('hidden');
    // Story 7.3: Enable only if code is valid
    button.disabled = !validation.valid;
    button.classList.add('update');
    // Story 7.3: Add disabled class for styling
    button.classList.toggle('disabled', !validation.valid);
  } else {
    // Paused → Show PLAY button
    button.classList.remove('hidden');
    // Story 7.3: Enable only if code is valid
    button.disabled = !validation.valid;
    button.classList.remove('update');
    // Story 7.3: Add disabled class for styling
    button.classList.toggle('disabled', !validation.valid);
  }
}

/**
 * Update PAUSE button based on panel state
 * Story 6.2: Separate PAUSE and ACTIVATE Buttons
 * Extracted from main.js lines 1323-1332
 *
 * @param {string} panelId - Panel ID
 *
 * @example
 * updatePauseButton('panel-1');
 */
export function updatePauseButton(panelId) {
  const panel = getPanel(panelId);
  const button = document.querySelector(`#${panelId} .pause-btn`) ||
    document.querySelector(`.pause-btn[data-card="${panelId}"]`);

  if (!panel || !button) return;

  // PAUSE button only visible/enabled when playing
  button.disabled = !panel.playing;
  button.classList.toggle('hidden', !panel.playing);
}

/**
 * Update all button states for a panel
 * Convenience function that updates both ACTIVATE and PAUSE buttons
 *
 * @param {string} panelId - Panel ID
 */
export function updateAllButtonStates(panelId) {
  updateActivateButton(panelId);
  updatePauseButton(panelId);
}

// ===== EVENT BUS SETUP (at module load) =====

// Listen for panel code changes to trigger staleness checks
eventBus.on('panel:codeChanged', ({ panelId, code }) => {
  checkStaleness(panelId);
  updateAllButtonStates(panelId);
});

// Listen for panel evaluation to clear staleness
eventBus.on('panel:evaluated', ({ panelId, code }) => {
  updatePanel(panelId, { stale: false, lastEvaluatedCode: code });
  updateAllButtonStates(panelId);
});

// Listen for panel playing state changes
eventBus.on('panel:playingChanged', ({ panelId }) => {
  checkStaleness(panelId);
  updateAllButtonStates(panelId);
});

console.log('[PatternValidator] Module loaded');
