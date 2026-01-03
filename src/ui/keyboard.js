/**
 * Keyboard Shortcuts Module
 *
 * Handles global keyboard shortcuts for r0astr:
 *
 * In Electron (simpler - Cmd only):
 * - Panel activation (Cmd+0-9)
 * - Create/delete panels (Cmd+N/W)
 * - Play/pause controls (Cmd+P/↑)
 * - Update/Stop all (Cmd+U/.)
 * - Snippet insertion (Cmd+=)
 *
 * In Browser (Cmd+Option to avoid conflicts):
 * - Panel activation (Cmd+Opt+0-9)
 * - Create/delete panels (Cmd+Opt+N/W)
 * - Play/pause controls (Cmd+Opt+P/↑)
 * - Update/Stop all (Cmd+Opt+U/.)
 * - Snippet insertion (Cmd+Opt+=)
 */

import { editorViews } from '../state.js';
import { isElectron } from '../utils/electronHelper.js';

/**
 * Find which panel currently has focus
 * @returns {string|null} Panel ID or null if no panel focused
 */
export function findFocusedPanel() {
  // Check if any editor view has focus
  for (const [panelId, view] of editorViews.entries()) {
    if (view.hasFocus) {
      return panelId;
    }
  }

  // Fallback: check which panel container is within the active element
  const activeElement = document.activeElement;

  if (activeElement) {
    const panelContainer = activeElement.closest('.panel-container');
    if (panelContainer) {
      return panelContainer.id;
    }
  }

  // Last resort: check if activeElement is a CodeMirror editor
  if (activeElement && activeElement.closest('.cm-editor')) {
    // Find which panel contains this editor
    for (const [panelId, view] of editorViews.entries()) {
      if (view.dom.contains(activeElement)) {
        return panelId;
      }
    }
  }

  // Final fallback: check for .focused class (set by setActivePanel in panelManager)
  const focusedPanel = document.querySelector('.level-panel.focused, .card.focused');
  if (focusedPanel) {
    const panelId = focusedPanel.dataset?.panelId || focusedPanel.id;
    return panelId;
  }

  console.warn('[Focus DEBUG] No focused panel found');
  return null;
}

/**
 * Animate a button press with visual feedback (legacy - single call)
 * @param {HTMLElement} button - Button element to animate
 * @param {number} duration - Duration in ms (default 150ms)
 */
export function animateButtonPress(button, duration = 150) {
  if (!button) return;

  button.classList.add('pressing');
  setTimeout(() => {
    button.classList.remove('pressing');
  }, duration);
}

/**
 * Start button press animation (add 'pressing' class)
 * @param {HTMLElement} button - Button element to animate
 */
export function animatePressStart(button) {
  if (!button) return;
  button.classList.add('pressing');
}

/**
 * End button press animation (remove 'pressing' class)
 * @param {HTMLElement} button - Button element to animate
 */
export function animatePressRelease(button) {
  if (!button) return;
  button.classList.remove('pressing');
}

/**
 * Initialize keyboard shortcuts
 * @param {Object} handlers - Callback handlers for various actions
 * @param {Function} handlers.activatePanelByIndex - Activate panel by index (0-9)
 * @param {Function} handlers.createNewPanelAndFocus - Create new panel
 * @param {Function} handlers.deleteFocusedPanel - Delete focused panel
 * @param {Function} handlers.togglePlaybackFocusedPanel - Toggle play/pause for focused panel
 * @param {Function} handlers.updateFocusedPanel - Update focused panel
 * @param {Function} handlers.openSnippetModal - Open snippet modal
 * @param {Function} handlers.getCardStates - Get card states object
 * @param {string} handlers.MASTER_PANEL_ID - Master panel ID constant
 */
export function initializeKeyboardShortcuts(handlers) {
  const {
    activatePanelByIndex,
    createNewPanelAndFocus,
    deleteFocusedPanel,
    togglePlaybackFocusedPanel,
    updateFocusedPanel,
    openSnippetModal,
    getCardStates,
    MASTER_PANEL_ID
  } = handlers;

  // Track which key was pressed with modifiers for keyup handling
  let pressedKey = null;
  let pressedButton = null;

  console.log('[Keyboard] Registering keydown listener...');

  // Handle keydown for button press animation
  document.addEventListener('keydown', (e) => {
    // In Electron: Cmd only (simpler shortcuts, no browser conflicts)
    // In Browser: Cmd+Option (to avoid browser reserved shortcuts)
    const modifier = isElectron
      ? (e.metaKey || e.ctrlKey) && !e.altKey
      : (e.metaKey || e.ctrlKey) && e.altKey;

    if (!modifier) {
      return;
    }

    // Ignore key repeats (when key is held down)
    if (e.repeat) {
      console.log('[Keyboard] Ignoring key repeat for:', e.code);
      return;
    }

    // Track the pressed key for cleanup
    pressedKey = e.code;

    console.log('[Keyboard] Key pressed:', e.code, 'with modifiers');

    // Animate button press, then trigger action after brief delay
    switch (e.code) {
      case 'KeyU':
        e.preventDefault();
        pressedButton = document.getElementById('update-all-btn');
        if (pressedButton && !pressedButton.disabled) {
          animatePressStart(pressedButton);
          setTimeout(() => {
            animatePressRelease(pressedButton);
            pressedButton.click();
            console.log('[Keyboard] Update All triggered');
            pressedKey = null;
            pressedButton = null;
          }, 150);
        }
        break;

      case 'Period':
        e.preventDefault();
        pressedButton = document.getElementById('stop-all');
        if (pressedButton) {
          animatePressStart(pressedButton);
          setTimeout(() => {
            animatePressRelease(pressedButton);
            pressedButton.click();
            console.log('[Keyboard] Stop All triggered');
            pressedKey = null;
            pressedButton = null;
          }, 150);
        }
        break;

      case 'KeyP':
        e.preventDefault();
        togglePlaybackFocusedPanel();
        break;

      case 'ArrowUp':
        e.preventDefault();
        updateFocusedPanel();
        break;

      // Panel activation by number
      case 'Digit0':
        e.preventDefault();
        activatePanelByIndex(0);
        break;
      case 'Digit1':
        e.preventDefault();
        activatePanelByIndex(1);
        break;
      case 'Digit2':
        e.preventDefault();
        activatePanelByIndex(2);
        break;
      case 'Digit3':
        e.preventDefault();
        activatePanelByIndex(3);
        break;
      case 'Digit4':
        e.preventDefault();
        activatePanelByIndex(4);
        break;
      case 'Digit5':
        e.preventDefault();
        activatePanelByIndex(5);
        break;
      case 'Digit6':
        e.preventDefault();
        activatePanelByIndex(6);
        break;
      case 'Digit7':
        e.preventDefault();
        activatePanelByIndex(7);
        break;
      case 'Digit8':
        e.preventDefault();
        activatePanelByIndex(8);
        break;
      case 'Digit9':
        e.preventDefault();
        activatePanelByIndex(9);
        break;

      case 'KeyN':
        e.preventDefault();
        createNewPanelAndFocus();
        console.log('[Keyboard] Created new panel');
        break;

      case 'KeyW':
        e.preventDefault();
        deleteFocusedPanel();
        break;

      case 'KeyE':
        e.preventDefault();
        const focusedPanelE = findFocusedPanel();
        if (focusedPanelE && focusedPanelE !== MASTER_PANEL_ID) {
          const titleElement = document.querySelector(`#${focusedPanelE} .panel-title`);
          if (titleElement) {
            titleElement.contentEditable = 'true';
            titleElement.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(titleElement);
            selection.removeAllRanges();
            selection.addRange(range);
            console.log('[Keyboard] Entered title edit mode for panel:', focusedPanelE);
          }
        } else if (focusedPanelE === MASTER_PANEL_ID) {
          console.warn('[Keyboard] Cannot edit master panel title');
        } else {
          console.warn('[Keyboard] No panel focused - cannot edit title');
        }
        break;

      case 'Equal':
        e.preventDefault();
        const focusedPanelEqual = findFocusedPanel();
        if (focusedPanelEqual) {
          const view = editorViews.get(focusedPanelEqual);
          if (view) {
            openSnippetModal(focusedPanelEqual, view);
            console.log('[Keyboard] Snippet modal opened for panel:', focusedPanelEqual);
          }
        } else {
          console.warn('[Keyboard] No panel focused - cannot open snippet modal');
        }
        break;
    }
  });

  const mod = isElectron ? 'Cmd' : 'Cmd+Opt';
  console.log(`✓ Keyboard shortcuts initialized (${isElectron ? 'Electron' : 'Browser'} mode):`);
  console.log(`  ${mod}+0-9: Activate panel (0=master, 1-9=panels)`);
  console.log(`  ${mod}+N: Create new panel`);
  console.log(`  ${mod}+W: Delete focused panel`);
  console.log(`  ${mod}+P: Toggle Play/Pause focused panel`);
  console.log(`  ${mod}+↑: Update focused panel`);
  console.log(`  ${mod}+=: Insert snippet`);
  console.log(`  ${mod}+U: Update All`);
  console.log(`  ${mod}+.: Stop All`);
}
