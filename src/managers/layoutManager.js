/**
 * Layout Manager
 *
 * Manages page-level layout templates for the skin system.
 * When a skin defines a `layout` key in its manifest, parts of each panel
 * (header, editor, controls, viz) can be placed into separate page regions
 * instead of being nested inside a single monolithic <li>.
 *
 * Skins without a `layout` key use the classic monolithic render path (unchanged).
 */

import { skinManager } from './skinManager.js';

// Current layout configuration (null = monolithic / classic mode)
let currentLayout = null;

// Map of region name → DOM element
const regions = new Map();

/**
 * Check if layout mode is active
 * @returns {boolean} True if the current skin defines a layout
 */
export function isLayoutMode() {
  return currentLayout !== null;
}

/**
 * Get the current layout configuration
 * @returns {Object|null} Layout config or null
 */
export function getLayout() {
  return currentLayout;
}

/**
 * Get the region element for a given part name.
 * Returns null if layout mode is off or part has no assigned region.
 * @param {string} partName - Part name (header, editor, controls, viz)
 * @returns {HTMLElement|null}
 */
export function getRegionForPart(partName) {
  if (!currentLayout) return null;
  const mapping = currentLayout.panelParts?.[partName];
  if (!mapping) return null;
  return regions.get(mapping.region) || null;
}

/**
 * Get a named region element
 * @param {string} regionName - Region name from layout config
 * @returns {HTMLElement|null}
 */
export function getRegion(regionName) {
  return regions.get(regionName) || null;
}

/**
 * Apply a layout from a skin manifest.
 * Creates the page-level region DOM from the page template,
 * then stores references for part placement.
 *
 * @param {Object|null} layout - The `layout` key from skin.json, or null to clear
 * @param {string|null} pageTemplateHTML - Rendered page-layout template HTML, or null
 */
export function applyLayout(layout, pageTemplateHTML) {
  // Tear down previous layout
  teardownLayout();

  if (!layout || !pageTemplateHTML) {
    currentLayout = null;
    return;
  }

  currentLayout = layout;

  // Insert page layout HTML into the main content area
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('[LayoutManager] #main-content not found');
    currentLayout = null;
    return;
  }

  // Create a wrapper for the layout regions
  const layoutWrapper = document.createElement('div');
  layoutWrapper.id = 'layout-wrapper';
  layoutWrapper.className = 'layout-wrapper';
  layoutWrapper.innerHTML = pageTemplateHTML;

  // Hide the classic panel tree when layout mode is active
  const panelTree = document.getElementById('panel-tree');
  if (panelTree) {
    panelTree.style.display = 'none';
  }

  // Insert layout wrapper before (or after) the panel tree
  mainContent.appendChild(layoutWrapper);

  // Resolve region selectors to DOM elements
  regions.clear();
  if (layout.regions) {
    for (const [regionName, regionConfig] of Object.entries(layout.regions)) {
      const selector = regionConfig.selector;
      const el = layoutWrapper.querySelector(selector);
      if (el) {
        regions.set(regionName, el);
      } else {
        console.warn(`[LayoutManager] Region '${regionName}' selector '${selector}' not found in page template`);
      }
    }
  }

  console.log(`[LayoutManager] Layout applied with ${regions.size} regions:`, Array.from(regions.keys()));
}

/**
 * Tear down the current layout, restoring classic mode
 */
export function teardownLayout() {
  currentLayout = null;
  regions.clear();

  // Remove layout wrapper
  const layoutWrapper = document.getElementById('layout-wrapper');
  if (layoutWrapper) {
    layoutWrapper.remove();
  }

  // Show the classic panel tree again
  const panelTree = document.getElementById('panel-tree');
  if (panelTree) {
    panelTree.style.display = '';
  }
}

/**
 * Create a panel part container element for placement in a region.
 * The container wraps the rendered part HTML and carries data attributes
 * for identification.
 *
 * @param {string} panelId - Panel identifier
 * @param {string} partName - Part name (header, editor, controls, viz)
 * @param {string} html - Rendered part HTML
 * @returns {HTMLElement} Wrapper element
 */
export function createPartContainer(panelId, partName, html) {
  const container = document.createElement('div');
  container.className = `layout-part layout-part-${partName}`;
  container.dataset.panelId = panelId;
  container.dataset.partName = partName;
  container.innerHTML = html;
  return container;
}

/**
 * Place a rendered part into its designated region.
 * In layout mode, parts are appended to region containers.
 * Parts for the same panel are ordered by panel number.
 *
 * @param {string} panelId - Panel identifier
 * @param {string} partName - Part name
 * @param {HTMLElement} partElement - The part container element
 * @returns {boolean} True if placed successfully
 */
export function placePartInRegion(panelId, partName, partElement) {
  const region = getRegionForPart(partName);
  if (!region) return false;

  region.appendChild(partElement);
  return true;
}

/**
 * Remove all parts for a panel from all regions
 * @param {string} panelId - Panel identifier
 */
export function removePanelFromRegions(panelId) {
  for (const [, regionEl] of regions) {
    const parts = regionEl.querySelectorAll(`[data-panel-id="${panelId}"]`);
    parts.forEach(el => el.remove());
  }
}

/**
 * Remove all panel parts from all regions (used before full re-render)
 */
export function clearAllRegions() {
  for (const [, regionEl] of regions) {
    const parts = regionEl.querySelectorAll('.layout-part');
    parts.forEach(el => el.remove());
  }
}

/**
 * Toggle collapsed state for a panel in layout mode.
 * Since header and editor may be in different DOM subtrees,
 * we use a CSS class instead of native <details>.
 *
 * @param {string} panelId - Panel identifier
 * @param {boolean} collapsed - True to collapse, false to expand
 */
export function setLayoutCollapsed(panelId, collapsed) {
  if (!currentLayout) return;

  // Find all parts for this panel across all regions
  for (const [, regionEl] of regions) {
    const parts = regionEl.querySelectorAll(`[data-panel-id="${panelId}"]`);
    parts.forEach(part => {
      const partName = part.dataset.partName;
      // Header always visible; editor/controls/viz toggle
      if (partName !== 'header') {
        part.classList.toggle('layout-collapsed', collapsed);
      }
    });
  }
}

/**
 * Check if a panel is collapsed in layout mode
 * @param {string} panelId - Panel identifier
 * @returns {boolean} True if collapsed
 */
export function isLayoutCollapsed(panelId) {
  if (!currentLayout) return false;

  // Check the editor part — if it has collapsed class, panel is collapsed
  for (const [, regionEl] of regions) {
    const editorPart = regionEl.querySelector(`[data-panel-id="${panelId}"][data-part-name="editor"]`);
    if (editorPart) {
      return editorPart.classList.contains('layout-collapsed');
    }
  }
  return false;
}
