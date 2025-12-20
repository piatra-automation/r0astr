/**
 * Panel Validation Module
 *
 * Handles code validation and staleness detection:
 * - Transpilation validation
 * - Staleness checking
 * - Error display
 */

import { transpiler } from '@strudel/transpiler';
import { highlightMiniLocations } from '@strudel/codemirror';
import { cardStates, editorViews, strudelCore } from '../state.js';
import { updatePanel } from '../managers/panelManager.js';

/**
 * Story 7.3: Validation timers (debounced)
 * Separate timers for button state (500ms) and error display (1000ms)
 */
const validationTimers = {};

/**
 * Check if panel is stale (code differs from running pattern)
 * Story 6.1: Staleness Detection Logic
 * @param {string} panelId - Panel ID to check
 * @returns {boolean} True if panel is stale
 */
export function checkStaleness(panelId) {
  const panel = cardStates[panelId];
  if (!panel) return false;

  const view = editorViews.get(panelId);
  if (!view) return false;

  // Staleness only applies to playing panels
  if (!panel.playing) {
    panel.stale = false;
    updatePanel(panelId, { stale: false }); // Sync to panelManager for persistence
    return false;
  }

  // Compare current code to last-evaluated code
  const currentCode = view.state.doc.toString();
  const isStale = currentCode !== panel.lastEvaluatedCode;
  panel.stale = isStale;
  updatePanel(panelId, { stale: isStale }); // Sync to panelManager for persistence

  // Clear highlighting when panel becomes stale
  if (isStale && strudelCore.scheduler) {
    highlightMiniLocations(view, strudelCore.scheduler.now(), []); // Clear highlights
  }

  return isStale;
}

/**
 * Helper to check if panel is stale
 * Story 6.1: Staleness Detection Logic
 * @param {string} panelId - Panel ID to check
 * @returns {boolean} True if panel is stale
 */
export function isPanelStale(panelId) {
  return cardStates[panelId]?.stale ?? false;
}

/**
 * Story 7.3: Validate code by transpiling AND evaluating (dry run)
 * Catches both syntax errors and runtime errors (undefined variables/functions)
 * @param {string} panelId - Panel ID
 * @returns {Promise<Object>} { valid: boolean, error?: string, line?: number }
 */
export async function validateCode(panelId) {
  // Guard: evaluate not initialized yet (during early startup)
  if (!strudelCore.evaluate) {
    return { valid: true }; // Assume valid until Strudel is ready
  }

  const view = editorViews.get(panelId);

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
      await strudelCore.evaluate(output, false, false);
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
 * @param {string} panelId - Panel ID
 * @param {string} errorMessage - Error message
 * @param {number|string} lineNumber - Line number
 */
export function displayError(panelId, errorMessage, lineNumber) {
  const errorContainer = document.querySelector(`.error-message[data-card="${panelId}"]`);
  if (!errorContainer) return;

  const formattedError = `Error: ${errorMessage} (line ${lineNumber})`;
  errorContainer.textContent = formattedError;
  errorContainer.style.display = 'block';
}

/**
 * Story 7.3: Clear error message in panel
 * @param {string} panelId - Panel ID
 */
export function clearErrorMessage(panelId) {
  const errorContainer = document.querySelector(`.error-message[data-card="${panelId}"]`);
  if (!errorContainer) return;

  errorContainer.textContent = '';
  errorContainer.style.display = 'none';
}

/**
 * Story 7.3: Attach validation listener to panel textarea
 * Debounced: 500ms for button state, 1000ms for error display
 * NOTE: Currently disabled - validation runs on PLAY button click instead
 * @param {string} panelId - Panel ID
 * @param {Function} updateActivateButton - Function to update button state
 */
export function attachValidationListener(panelId, updateActivateButton) {
  // DISABLED: Live validation causes eval spam and typing lag
  // Validation still runs on PLAY button click via updateActivateButton
  return;

  // Skip master panel (transpiler causes hang, uses regex parsing instead)
  if (panelId === 'master-panel') return;

  const textarea = document.querySelector(`#${panelId} .code-input`) ||
    document.querySelector(`.code-input[data-card="${panelId}"]`);

  if (!textarea) return;

  textarea.addEventListener('input', () => {
    // Clear existing timers
    if (validationTimers[panelId]) {
      clearTimeout(validationTimers[panelId].button);
      clearTimeout(validationTimers[panelId].error);
    }

    // Initialize timer object if needed
    if (!validationTimers[panelId]) {
      validationTimers[panelId] = {};
    }

    // Validate for button state after 2000ms (reduced from 500ms to prevent eval spam)
    validationTimers[panelId].button = setTimeout(async () => {
      await updateActivateButton(panelId);
    }, 2000);

    // Display error message after 3000ms (longer delay to avoid incomplete code validation)
    validationTimers[panelId].error = setTimeout(async () => {
      const result = await validateCode(panelId);
      if (result.valid) {
        clearErrorMessage(panelId);
      } else {
        displayError(panelId, result.error, result.line);
      }
    }, 3000);
  });
}
