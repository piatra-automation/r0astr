/**
 * Slider Manager
 * Handles slider rendering, value updates, and event emission
 * Supports both legacy grid layout and tree layout
 */

import { eventBus } from '../utils/eventBus.js';
import { sliderValues } from '@strudel/codemirror';

// Track slider metadata for each panel
const panelSliders = {};

/**
 * Check if the UI is using tree layout (vs legacy grid layout)
 * @returns {boolean} True if tree layout is active
 */
function isTreeLayout() {
  return document.querySelector('.panel-tree') !== null;
}

/**
 * Render sliders for a panel based on transpiler widget metadata
 * Supports both legacy grid layout and tree layout
 * @param {string} panelId - Panel identifier
 * @param {Array} widgets - Widget metadata from transpiler
 * @param {string} patternCode - Pattern code for label deduction
 * @returns {void}
 *
 * @example
 * renderSliders('panel-1', widgets, 'note("c2").lpf(slider(800, 100, 5000))');
 */
export function renderSliders(panelId, widgets, patternCode = '') {
  // Filter for slider widgets (guard against undefined widgets)
  const sliderWidgets = (widgets || []).filter(w => w.type === 'slider');
  const sliderMetadata = [];

  if (isTreeLayout()) {
    // Tree layout: render sliders as leaf nodes inside panel-children
    renderTreeSliders(panelId, sliderWidgets, patternCode, sliderMetadata);
  } else {
    // Legacy layout: render sliders in dedicated container
    renderLegacySliders(panelId, sliderWidgets, patternCode, sliderMetadata);
  }

  // Store slider metadata for this panel
  panelSliders[panelId] = sliderMetadata;

  // Emit event with slider metadata
  eventBus.emit('sliders:rendered', {
    panelId,
    sliders: sliderMetadata
  });
}

/**
 * Render sliders for tree layout as leaf nodes
 * @param {string} panelId - Panel identifier
 * @param {Array} sliderWidgets - Filtered slider widgets
 * @param {string} patternCode - Pattern code for label deduction
 * @param {Array} sliderMetadata - Array to populate with metadata
 */
function renderTreeSliders(panelId, sliderWidgets, patternCode, sliderMetadata) {
  // Find panel-controls-container (sibling of details, outside collapse)
  const panelElement = document.querySelector(`[data-panel-id="${panelId}"]`) ||
                       document.getElementById(panelId);
  if (!panelElement) {
    console.warn(`Panel element not found for ${panelId}`);
    return;
  }

  const controlsContainer = panelElement.querySelector('.panel-controls-container');
  if (!controlsContainer) {
    console.warn(`Panel controls container not found for ${panelId}`);
    return;
  }

  // Remove existing slider elements
  const existingSliders = controlsContainer.querySelectorAll('.leaf-slider');
  existingSliders.forEach(el => el.remove());

  // Render each slider
  sliderWidgets.forEach((widget, index) => {
    const { value, min = 0, max = 1, step, from } = widget;
    const sliderId = `slider_${from}`;

    const rawValue = sliderValues[sliderId] ?? value ?? 0;
    const currentValue = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue) || 0;

    const label = deduceSliderLabel(patternCode, index);

    sliderMetadata.push({
      sliderId,
      label,
      value: currentValue,
      min,
      max,
      step: step ?? (max - min) / 1000
    });

    // Create slider element (div, not li - not in a list)
    const sliderEl = document.createElement('div');
    sliderEl.className = 'leaf-slider';
    sliderEl.innerHTML = `
      <label>${label}</label>
      <input type="range"
        min="${min}"
        max="${max}"
        step="${step ?? (max - min) / 1000}"
        value="${currentValue}"
        data-slider-id="${sliderId}">
      <span class="slider-value" data-slider="${sliderId}">${currentValue.toFixed(2)}</span>
    `;

    const input = sliderEl.querySelector('input');
    input.addEventListener('input', (e) => {
      const newValue = parseFloat(e.target.value);
      updateSliderValue(panelId, sliderId, newValue);
    });

    controlsContainer.appendChild(sliderEl);
  });
}

/**
 * Render sliders for legacy grid layout
 * @param {string} panelId - Panel identifier
 * @param {Array} sliderWidgets - Filtered slider widgets
 * @param {string} patternCode - Pattern code for label deduction
 * @param {Array} sliderMetadata - Array to populate with metadata
 */
function renderLegacySliders(panelId, sliderWidgets, patternCode, sliderMetadata) {
  const slidersContainer = document.getElementById(`sliders-${panelId}`);

  if (!slidersContainer) {
    console.warn(`Slider container not found for ${panelId}`);
    return;
  }

  // Clear existing sliders
  slidersContainer.innerHTML = '';

  sliderWidgets.forEach((widget, index) => {
    const { value, min = 0, max = 1, step, from } = widget;
    const sliderId = `slider_${from}`;

    const rawValue = sliderValues[sliderId] ?? value ?? 0;
    const currentValue = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue) || 0;

    const label = deduceSliderLabel(patternCode, index);

    sliderMetadata.push({
      sliderId,
      label,
      value: currentValue,
      min,
      max,
      step: step ?? (max - min) / 1000
    });

    const sliderControl = document.createElement('div');
    sliderControl.className = 'slider-control';

    sliderControl.innerHTML = `
      <label>
        <span>${label}</span>
        <span class="slider-value" data-slider="${sliderId}">${currentValue}</span>
      </label>
      <input type="range"
        min="${min}"
        max="${max}"
        step="${step ?? (max - min) / 1000}"
        value="${currentValue}"
        data-slider-id="${sliderId}">
    `;

    const input = sliderControl.querySelector('input');
    input.addEventListener('input', (e) => {
      const newValue = parseFloat(e.target.value);
      updateSliderValue(panelId, sliderId, newValue);
    });

    slidersContainer.appendChild(sliderControl);
  });

  // Also render sliders in collapsed panel header (legacy layout only)
  renderCollapsedSliders(panelId, sliderWidgets);
}

/**
 * Render sliders in collapsed panel header (unlabelled)
 * @param {string} panelId - Panel identifier
 * @param {Array} sliderWidgets - Slider widget metadata
 * @returns {void}
 */
export function renderCollapsedSliders(panelId, sliderWidgets) {
  const collapsedSlidersContainer = document.getElementById(`collapsed-sliders-${panelId}`);

  if (!collapsedSlidersContainer) {
    return; // Panel not rendered yet
  }

  // Clear existing collapsed sliders
  collapsedSlidersContainer.innerHTML = '';

  // Render each slider without labels
  sliderWidgets.forEach((widget, index) => {
    const { value, min = 0, max = 1, step, from } = widget;
    const sliderId = `slider_${from}`;

    const rawValue = sliderValues[sliderId] ?? value ?? 0;
    const currentValue = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue) || 0;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step ?? (max - min) / 1000;
    input.value = currentValue;
    input.dataset.sliderId = sliderId;
    input.title = `Slider ${index + 1}: ${currentValue}`;

    input.addEventListener('input', (e) => {
      const newValue = parseFloat(e.target.value);
      updateSliderValue(panelId, sliderId, newValue);
      // Update tooltip
      e.target.title = `Slider ${index + 1}: ${newValue}`;
    });

    collapsedSlidersContainer.appendChild(input);
  });

  // Update collapsed panel width to accommodate sliders
  const panelElement = document.getElementById(panelId);
  if (panelElement && panelElement.classList.contains('panel-collapsed')) {
    const numSliders = sliderWidgets.length;
    const baseWidth = 450;
    const sliderWidth = 80;
    const sliderGap = 8;
    const extraWidth = numSliders > 0 ? (numSliders * sliderWidth) + ((numSliders - 1) * sliderGap) + 16 : 0;
    const newWidth = baseWidth + extraWidth;
    panelElement.style.width = `${newWidth}px`;
  }
}

/**
 * Update slider value in sliderValues object and UI
 * @param {string} panelId - Panel identifier
 * @param {string} sliderId - Slider identifier
 * @param {number} newValue - New slider value
 * @returns {void}
 *
 * @example
 * updateSliderValue('panel-1', 'slider_0', 850);
 */
export function updateSliderValue(panelId, sliderId, newValue) {
  // Update Strudel reactive ref
  sliderValues[sliderId] = newValue;

  // Update local UI - value display
  const valueDisplay = document.querySelector(`.slider-value[data-slider="${sliderId}"]`);
  if (valueDisplay) {
    valueDisplay.textContent = newValue.toFixed(2);
  }

  // Update local UI - slider input
  const sliderInput = document.querySelector(`input[data-slider-id="${sliderId}"]`);
  if (sliderInput) {
    sliderInput.value = newValue;
  }

  console.log(`Slider ${sliderId} updated: ${newValue}`);

  // Emit event for cross-module communication
  eventBus.emit('slider:changed', {
    panelId,
    sliderId,
    value: newValue
  });
}

/**
 * Clear all sliders from a panel
 * @param {string} panelId - Panel identifier
 * @returns {void}
 */
export function clearSliders(panelId) {
  if (isTreeLayout()) {
    // Tree layout: remove slider leaf nodes
    const panelElement = document.querySelector(`[data-panel-id="${panelId}"]`) ||
                         document.getElementById(panelId);
    if (panelElement) {
      const sliderLeaves = panelElement.querySelectorAll('.leaf-slider');
      sliderLeaves.forEach(leaf => leaf.remove());
    }
  } else {
    // Legacy layout: clear containers
    const slidersContainer = document.getElementById(`sliders-${panelId}`);
    if (slidersContainer) {
      slidersContainer.innerHTML = '';
    }

    const collapsedSlidersContainer = document.getElementById(`collapsed-sliders-${panelId}`);
    if (collapsedSlidersContainer) {
      collapsedSlidersContainer.innerHTML = '';
    }
  }

  // Remove panel slider metadata
  delete panelSliders[panelId];

  // Emit event
  eventBus.emit('sliders:cleared', { panelId });
}

/**
 * Get slider value from sliderValues object
 * @param {string} sliderId - Slider identifier
 * @returns {number|undefined} Slider value
 */
export function getSliderValue(sliderId) {
  return sliderValues[sliderId];
}

/**
 * Set slider value programmatically
 * @param {string} sliderId - Slider identifier
 * @param {number} value - New value
 * @returns {void}
 */
export function setSliderValue(sliderId, value) {
  sliderValues[sliderId] = value;

  // Update UI slider if exists
  const sliderInput = document.querySelector(`input[data-slider-id="${sliderId}"]`);
  if (sliderInput) {
    sliderInput.value = value;
  }

  // Update value display if exists
  const valueDisplay = document.querySelector(`.slider-value[data-slider="${sliderId}"]`);
  if (valueDisplay) {
    valueDisplay.textContent = value.toFixed(2);
  }
}

/**
 * Get slider metadata for a panel
 * @param {string} panelId - Panel identifier
 * @returns {Array|undefined} Slider metadata array
 */
export function getPanelSliders(panelId) {
  return panelSliders[panelId];
}

/**
 * Deduce slider label from pattern code
 * Priority:
 * 1. Comment on the same line as slider() call
 * 2. Function name: .lpf(slider(...)) -> "Lpf"
 * 3. Default: "Slider N"
 * @param {string} patternCode - Pattern code string
 * @param {number} sliderIndex - Index of slider in pattern
 * @returns {string} Deduced label or fallback
 */
function deduceSliderLabel(patternCode, sliderIndex) {
  if (!patternCode) {
    return `Slider ${sliderIndex + 1}`;
  }

  // Split pattern into lines to search for comments
  const lines = patternCode.split('\n');

  // Find all slider() calls with function names
  const sliderRegex = /\.(\w+)\s*\(\s*slider\s*\([^)]+\)\s*\)/g;
  const matches = [...patternCode.matchAll(sliderRegex)];

  if (matches[sliderIndex]) {
    const [fullMatch, functionName] = matches[sliderIndex];

    // Find which line this match is on
    let currentPos = 0;
    let matchLine = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineEnd = currentPos + line.length;

      if (matches[sliderIndex].index >= currentPos && matches[sliderIndex].index < lineEnd) {
        matchLine = line;
        break;
      }

      currentPos = lineEnd + 1; // +1 for newline character
    }

    // Priority 1: Look for comment on the same line
    if (matchLine) {
      const commentMatch = matchLine.match(/\/\/\s*(.+?)$/);
      if (commentMatch && commentMatch[1].trim()) {
        return commentMatch[1].trim();
      }
    }

    // Priority 2: Function name (capitalize first letter)
    return functionName.charAt(0).toUpperCase() + functionName.slice(1);
  }

  return `Slider ${sliderIndex + 1}`;
}
