/**
 * Panel DOM Registry
 * Decouples panel part resolution from DOM tree position.
 * Instead of traversing up/down the DOM to find panel parts,
 * consumers look up parts by panelId + partName.
 *
 * Parts: root, header, editor, controls, viz, error, details
 */

// key: `${panelId}:${partName}` → HTMLElement
const registry = new Map();

/**
 * Register a panel part element
 * @param {string} panelId - Panel identifier
 * @param {string} part - Part name (root, header, editor, controls, viz, error, details)
 * @param {HTMLElement} element - DOM element
 */
export function registerPart(panelId, part, element) {
  if (!element) return;
  registry.set(`${panelId}:${part}`, element);
}

/**
 * Unregister all parts for a panel
 * @param {string} panelId - Panel identifier
 */
export function unregisterPanel(panelId) {
  const prefix = `${panelId}:`;
  for (const key of registry.keys()) {
    if (key.startsWith(prefix)) {
      registry.delete(key);
    }
  }
}

/**
 * Unregister all panels (used before full re-render)
 */
export function unregisterAll() {
  registry.clear();
}

/**
 * Get a registered panel part element
 * @param {string} panelId - Panel identifier
 * @param {string} part - Part name
 * @returns {HTMLElement|undefined}
 */
export function getPart(panelId, part) {
  return registry.get(`${panelId}:${part}`);
}

/**
 * Resolve panelId from any element inside a panel.
 * Fast path: walks up to nearest [data-panel-id].
 * Fallback: searches registry for a root element that contains the target.
 * @param {HTMLElement} element - Any DOM element
 * @returns {string|null} Panel ID or null
 */
export function resolvePanelId(element) {
  if (!element) return null;

  // Fast path: data attribute on ancestor
  const ancestor = element.closest('[data-panel-id]');
  if (ancestor) {
    return ancestor.dataset.panelId;
  }

  // Fallback: search registry roots
  for (const [key, el] of registry) {
    if (key.endsWith(':root') && el.contains(element)) {
      return key.slice(0, key.length - ':root'.length);
    }
  }

  return null;
}

/**
 * Get all registered panel IDs
 * @returns {string[]} Array of unique panel IDs
 */
export function getRegisteredPanelIds() {
  const ids = new Set();
  for (const key of registry.keys()) {
    ids.add(key.split(':')[0]);
  }
  return Array.from(ids);
}

/**
 * Register all standard parts for a panel element.
 * Queries the panel root for known child selectors and registers them.
 * @param {string} panelId - Panel identifier
 * @param {HTMLElement} panelElement - The root .level-panel element
 */
export function registerPanelParts(panelId, panelElement) {
  if (!panelElement) return;

  registerPart(panelId, 'root', panelElement);
  registerPart(panelId, 'header', panelElement.querySelector('summary, .panel-header'));
  registerPart(panelId, 'editor', document.getElementById(`editor-${panelId}`) || panelElement.querySelector('.code-editor'));
  registerPart(panelId, 'controls', panelElement.querySelector('.panel-controls-container'));
  registerPart(panelId, 'viz', document.getElementById(`viz-container-${panelId}`));
  registerPart(panelId, 'error', panelElement.querySelector(`.error-message[data-card="${panelId}"]`) || panelElement.querySelector('.error-message'));
  registerPart(panelId, 'details', panelElement.querySelector('details'));
}
