/**
 * Screen Manager
 * Handles displaying CodeMirror editors in the shared screen area
 */

// Track which editors are currently in the screen
const screenEditors = new Map(); // panelId → wrapper element

/**
 * Get the screen container element
 * @returns {HTMLElement|null}
 */
function getScreenElement() {
  return document.querySelector('.screen');
}

/**
 * Make screen visible
 */
function showScreen() {
  const screen = getScreenElement();
  if (screen) {
    screen.classList.add('visible');
  }
}

/**
 * Hide screen if no editors are displayed
 */
function hideScreenIfEmpty() {
  if (screenEditors.size === 0) {
    const screen = getScreenElement();
    if (screen) {
      screen.classList.remove('visible');
    }
  }
}

/**
 * Move a CodeMirror editor to the screen with slide-down animation
 * @param {string} panelId - Panel ID
 * @param {Object} editorView - CodeMirror EditorView instance
 * @param {number} width - Editor width in pixels (from settings)
 * @returns {Promise<void>} Resolves when animation completes
 */
export async function moveEditorToScreen(panelId, editorView, width = 600) {
  const screen = getScreenElement();
  if (!screen || !editorView) return;

  // If editor is already in screen, just bring it to top
  if (screenEditors.has(panelId)) {
    const wrapper = screenEditors.get(panelId);
    wrapper.style.order = Date.now(); // Use order for stacking (latest = bottom)
    return;
  }

  // Create wrapper for the editor
  const wrapper = document.createElement('div');
  wrapper.className = 'screen-editor-wrapper';
  wrapper.dataset.panelId = panelId;
  wrapper.style.order = Date.now(); // Newest editors appear at bottom

  // Set width from settings
  wrapper.style.width = `${width}px`;

  // Append editor DOM to wrapper
  wrapper.appendChild(editorView.dom);

  // Add to screen
  screen.appendChild(wrapper);
  screenEditors.set(panelId, wrapper);

  // Show screen
  showScreen();

  // Trigger slide-down animation
  return new Promise((resolve) => {
    wrapper.classList.add('slide-down');

    // Wait for animation to complete
    setTimeout(() => {
      wrapper.classList.remove('slide-down');
      resolve();
    }, 300); // Match animation duration in CSS
  });
}

/**
 * Remove a CodeMirror editor from the screen with slide-up animation
 * @param {string} panelId - Panel ID
 * @param {HTMLElement} originalContainer - Original container to restore editor to
 * @returns {Promise<void>} Resolves when animation completes
 */
export async function removeEditorFromScreen(panelId, originalContainer = null) {
  const wrapper = screenEditors.get(panelId);
  if (!wrapper) return;

  // Trigger slide-up animation
  return new Promise((resolve) => {
    wrapper.classList.add('slide-up');

    // Wait for animation to complete
    setTimeout(() => {
      // Get the editor DOM element
      const editorDom = wrapper.querySelector('.cm-editor');

      // If original container provided, restore editor to it
      if (originalContainer && editorDom) {
        originalContainer.appendChild(editorDom);
      }

      // Remove wrapper from screen
      wrapper.remove();
      screenEditors.delete(panelId);

      // Hide screen if empty
      hideScreenIfEmpty();

      resolve();
    }, 300); // Match animation duration in CSS
  });
}

/**
 * Remove all editors from screen except the specified one
 * Used when collapse-on-blur is enabled
 * @param {string} keepPanelId - Panel ID to keep in screen
 * @param {Map} editorViews - Map of panel IDs to EditorView instances
 * @param {Function} getOriginalContainer - Function to get original container for a panel ID
 * @returns {Promise<void>}
 */
export async function removeAllEditorsExcept(keepPanelId, editorViews, getOriginalContainer) {
  const promises = [];

  for (const [panelId, wrapper] of screenEditors.entries()) {
    if (panelId !== keepPanelId) {
      const originalContainer = getOriginalContainer(panelId);
      promises.push(removeEditorFromScreen(panelId, originalContainer));
    }
  }

  await Promise.all(promises);
}

/**
 * Check if a panel's editor is currently in the screen
 * @param {string} panelId - Panel ID
 * @returns {boolean}
 */
export function isEditorInScreen(panelId) {
  return screenEditors.has(panelId);
}

/**
 * Get count of editors currently in screen
 * @returns {number}
 */
export function getScreenEditorCount() {
  return screenEditors.size;
}

/**
 * Remove all editors from screen (used when closing all panels, etc.)
 * @param {Function} getOriginalContainer - Function to get original container for a panel ID
 * @returns {Promise<void>}
 */
export async function clearScreen(getOriginalContainer) {
  const promises = [];

  for (const [panelId, wrapper] of screenEditors.entries()) {
    const originalContainer = getOriginalContainer(panelId);
    promises.push(removeEditorFromScreen(panelId, originalContainer));
  }

  await Promise.all(promises);
}
