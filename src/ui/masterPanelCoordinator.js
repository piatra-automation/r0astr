/**
 * Master Panel Coordinator
 * Handles master panel-specific logic: global sliders, TEMPO control, compact mode
 *
 * ⚠️ CRITICAL WARNING: This module uses REGEX parsing for slider detection.
 * DO NOT use transpiler() - it will HANG the browser in master panel context.
 *
 * Why: The transpiler is designed for REPL context and has internal dependencies
 * that cause it to block when called standalone in event handlers.
 *
 * See: docs/architecture/strudel-integration-gotchas.md#critical-transpiler-blocking-issue
 *
 * Regex Pattern: /(\w+)\s*=\s*slider\s*\(\s*([^,)]+)(?:\s*,\s*([^,)]+))?(?:\s*,\s*([^,)]+))?\s*\)/g
 *
 * Example master panel code:
 *   let SLIDER_LPF = slider(800, 100, 5000);
 *   let TEMPO = slider(30, 15, 45);
 */

// ===== IMPORTS =====
import { ref } from '@strudel/core';
import { renderSliders as renderSlidersUI } from '../managers/sliderManager.js';
import { getSettings } from '../managers/settingsManager.js';
import { savePanelStateNow, MASTER_PANEL_ID } from '../managers/panelManager.js';
import { eventBus } from '../utils/eventBus.js';

// ===== MODULE-PRIVATE STATE =====
let masterCodeEvaluating = false;
let masterPanelCompact = true; // Start in compact mode
let currentMasterSliders = []; // Track current master sliders for remote sync

// Import sliderValues from window (set by main.js)
const getSliderValues = () => window.sliderValues || {};

// ===== EXPORTED FUNCTIONS =====

/**
 * Toggle master panel between compact and expanded modes
 * Extracted from main.js lines 399-411
 *
 * @example
 * toggleMasterMode(); // Switches between compact and expanded
 */
export function toggleMasterMode() {
  masterPanelCompact = !masterPanelCompact;
  const panel = document.getElementById(MASTER_PANEL_ID);

  if (!panel) {
    console.warn('[MasterPanel] Master panel element not found');
    return;
  }

  if (masterPanelCompact) {
    panel.classList.add('compact');
  } else {
    panel.classList.remove('compact');
  }

  // Save state immediately (no debounce for UI state changes)
  savePanelStateNow();

  // Emit event
  eventBus.emit('master:modeToggled', { compact: masterPanelCompact });
  console.log(`[MasterPanel] Mode toggled: ${masterPanelCompact ? 'compact' : 'expanded'}`);
}

/**
 * Evaluate master panel code using REGEX parsing (NOT transpiler)
 * Extracted from main.js lines 414-493
 *
 * ⚠️ CRITICAL: Uses regex parsing because transpiler() HANGS in this context
 *
 * @param {Object} editorView - CodeMirror EditorView instance
 * @param {boolean} reRenderSliders - Whether to re-render slider UI
 *
 * @example
 * // Master panel code:
 * // let SLIDER_LPF = slider(800, 100, 5000);
 * // let TEMPO = slider(30, 15, 45);
 * evaluateMasterCode(editorView, true);
 */
export function evaluateMasterCode(editorView, reRenderSliders = true) {
  if (masterCodeEvaluating) {
    return; // Prevent recursion
  }

  if (!editorView) {
    console.warn('[evaluateMasterCode] EditorView not provided');
    return;
  }

  const code = editorView.state.doc.toString().trim();

  if (!code) {
    return;
  }

  try {
    masterCodeEvaluating = true;

    // Strip all JavaScript comments (single-line, inline, and multi-line)
    // This ensures master panel accepts same syntax as regular Strudel code
    let cleanCode = code;

    // Remove multi-line comments /* ... */
    cleanCode = cleanCode.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single-line and inline comments //
    cleanCode = cleanCode.replace(/\/\/.*$/gm, '');

    // Parse slider calls from code to extract widget metadata
    // ⚠️ REGEX PARSING ONLY - DO NOT use transpiler()
    const sliderRegex = /(\w+)\s*=\s*slider\s*\(\s*([^,)]+)(?:\s*,\s*([^,)]+))?(?:\s*,\s*([^,)]+))?\s*\)/g;
    const widgets = [];
    const sliderVars = {};
    const sliderValues = getSliderValues();
    let match;

    while ((match = sliderRegex.exec(cleanCode)) !== null) {
      const varName = match[1];
      const value = parseFloat(match[2]);
      const min = match[3] ? parseFloat(match[3]) : 0;
      const max = match[4] ? parseFloat(match[4]) : 1;
      const sliderId = `master_${varName.toLowerCase()}`;

      // Store slider metadata
      sliderVars[varName] = sliderId;

      widgets.push({
        type: 'slider',
        varName,
        value,
        min,
        max,
        sliderId
      });

      // Initialize slider value
      sliderValues[sliderId] = value;
    }

    // Store sliders globally for remote sync
    currentMasterSliders = widgets;

    // Render sliders in UI
    if (reRenderSliders) {
      renderMasterSliders(widgets);
    }

    // Create global variables that reference the slider values
    widgets.forEach(({ varName, sliderId }) => {
      // Create a ref that reads from sliderValues
      // This makes sliders reactive - patterns read current value every cycle
      window[varName] = ref(() => sliderValues[sliderId]);
    });

    console.log('✓ Master controls updated - variables available globally:', Object.keys(sliderVars));

    // Emit event
    eventBus.emit('master:evaluated', { widgets, code });

  } catch (error) {
    console.error('[Master] Error:', error);
  } finally {
    masterCodeEvaluating = false;
  }
}

/**
 * Render master sliders in UI
 * Extracted from main.js lines 496-533
 *
 * @param {Array} widgets - Widget metadata from regex parsing
 *
 * @example
 * renderMasterSliders([
 *   { varName: 'SLIDER_LPF', value: 800, min: 100, max: 5000, sliderId: 'master_slider_lpf' }
 * ]);
 */
export function renderMasterSliders(widgets) {
  const slidersContainer = document.getElementById('master-sliders');
  if (!slidersContainer) {
    console.warn('[MasterPanel] Master sliders container not found');
    return;
  }

  slidersContainer.innerHTML = '';

  widgets.forEach((widget) => {
    const { varName, value, min, max, sliderId } = widget;

    const sliderControl = document.createElement('div');
    sliderControl.className = 'slider-control';

    sliderControl.innerHTML = `
      <label>
        <span>${varName}</span>
        <span class="slider-value" data-slider="${sliderId}">${value}</span>
      </label>
      <input type="range"
        min="${min}"
        max="${max}"
        step="${(max - min) / 1000}"
        value="${value}"
        data-slider-id="${sliderId}">
    `;

    const input = sliderControl.querySelector('input');
    input.addEventListener('input', (e) => {
      const newValue = parseFloat(e.target.value);
      updateMasterSliderValue(sliderId, newValue);
    });

    slidersContainer.appendChild(sliderControl);
  });

  // Emit event for remote sync
  eventBus.emit('master:slidersRendered', { widgets });

  // Render automatic tempo control if enabled
  renderTempoControl();
}

/**
 * Render automatic TEMPO control based on settings
 * Extracted from main.js lines 538-608
 *
 * TEMPO conversion:
 * - User sets CPM (Cycles Per Minute) in slider
 * - Convert to CPS (Cycles Per Second) for Strudel scheduler
 * - Formula: CPS = CPM / 60
 * - Display: BPM = CPM × 4 (for musicians)
 *
 * @example
 * // TEMPO slider set to 30 CPM
 * // → scheduler.setCps(0.5)  // 30 / 60 = 0.5 CPS
 * // → Display: 120 BPM       // 30 × 4 = 120 BPM
 */
export function renderTempoControl() {
  const settings = getSettings();
  const slidersContainer = document.getElementById('master-sliders');

  if (!slidersContainer || !settings.advanced || !settings.advanced.show_tempo_knob) {
    // Remove tempo control if it exists but is disabled
    const existingTempo = document.getElementById('tempo-control');
    if (existingTempo) {
      existingTempo.remove();
    }
    return;
  }

  // Check if tempo control already exists
  let tempoControl = document.getElementById('tempo-control');

  if (!tempoControl) {
    // Create tempo control
    tempoControl = document.createElement('div');
    tempoControl.id = 'tempo-control';
    tempoControl.className = 'slider-control tempo-control';
    slidersContainer.appendChild(tempoControl);
  }

  // Get current tempo value (default 30 CPM = 120 BPM)
  const currentCpm = window.TEMPO_CPM_VALUE || 30;
  const showCpm = settings.advanced.show_cpm;
  const displayValue = showCpm ? currentCpm : currentCpm * 4; // BPM = CPM * 4
  const displayUnit = showCpm ? 'CPM' : 'BPM';

  tempoControl.innerHTML = `
    <label>
      <span>TEMPO</span>
      <span class="slider-value" id="tempo-value">${displayValue.toFixed(0)} ${displayUnit}</span>
    </label>
    <input type="range"
      id="tempo-slider"
      min="15"
      max="45"
      step="0.1"
      value="${currentCpm}">
  `;

  const input = tempoControl.querySelector('#tempo-slider');
  input.addEventListener('input', (e) => {
    const cpm = parseFloat(e.target.value);
    window.TEMPO_CPM_VALUE = cpm;

    // Update display
    const valueDisplay = document.getElementById('tempo-value');
    if (valueDisplay) {
      const displayVal = showCpm ? cpm : cpm * 4;
      valueDisplay.textContent = `${displayVal.toFixed(0)} ${displayUnit}`;
    }

    // Update scheduler CPS (CPM / 60 = CPS)
    // ⚠️ CRITICAL: Use scheduler.setCps() NOT setCpm() (setCpm doesn't exist)
    if (window.scheduler) {
      const cps = cpm / 60;
      window.scheduler.setCps(cps);
      console.log(`🎵 Tempo: ${cpm.toFixed(1)} CPM (${(cpm * 4).toFixed(0)} BPM, ${cps.toFixed(3)} CPS)`);

      // Emit event
      eventBus.emit('master:tempoChanged', {
        cpm: cpm,
        bpm: cpm * 4,
        cps: cps
      });
    }
  });

  // Initialize scheduler on first render
  if (window.scheduler && !window.TEMPO_INITIALIZED) {
    const cps = currentCpm / 60;
    window.scheduler.setCps(cps);
    window.TEMPO_INITIALIZED = true;
    console.log(`🎵 Auto Tempo initialized: ${currentCpm} CPM (${(currentCpm * 4).toFixed(0)} BPM)`);
  }
}

/**
 * Update master slider value and apply effects
 * Extracted from main.js lines 614-631
 * Used by both local UI and remote control
 *
 * @param {string} sliderId - Slider identifier (e.g., 'master_slider_lpf')
 * @param {number} newValue - New slider value
 *
 * @example
 * updateMasterSliderValue('master_slider_lpf', 1200);
 */
export function updateMasterSliderValue(sliderId, newValue) {
  const sliderValues = getSliderValues();
  sliderValues[sliderId] = newValue;

  // Update local UI slider display
  const valueDisplay = document.querySelector(`.slider-value[data-slider="${sliderId}"]`);
  if (valueDisplay) {
    valueDisplay.textContent = newValue.toFixed(2);
  }

  // Update local UI slider input
  const sliderInput = document.querySelector(`input[data-slider-id="${sliderId}"]`);
  if (sliderInput) {
    sliderInput.value = newValue;
  }

  // Emit event for remote sync
  eventBus.emit('master:sliderChanged', { sliderId, value: newValue });

  console.log(`[MasterPanel] Slider ${sliderId} updated to ${newValue}`);
}

/**
 * Initialize master panel
 * Sets up event listeners and initial evaluation
 *
 * @param {Object} editorView - CodeMirror EditorView instance for master panel
 *
 * @example
 * const masterEditor = getPanelEditor(MASTER_PANEL_ID);
 * initializeMasterPanel(masterEditor);
 */
export function initializeMasterPanel(editorView) {
  if (!editorView) {
    console.warn('[MasterPanel] EditorView not provided for initialization');
    return;
  }

  // Evaluate initial code
  evaluateMasterCode(editorView, true);

  // Emit initialized event
  eventBus.emit('master:initialized', { compact: masterPanelCompact });

  console.log('[MasterPanel] Initialized');
}

/**
 * Get current master sliders metadata
 *
 * @returns {Array} Current master sliders
 */
export function getCurrentMasterSliders() {
  return currentMasterSliders;
}

/**
 * Check if master panel is in compact mode
 *
 * @returns {boolean} True if compact mode
 */
export function isMasterPanelCompact() {
  return masterPanelCompact;
}

/**
 * Set master panel compact mode
 *
 * @param {boolean} compact - Compact mode flag
 */
export function setMasterPanelCompact(compact) {
  masterPanelCompact = compact;
}

// ===== EVENT BUS SETUP (at module load) =====

// Listen for mode toggle events
eventBus.on('master:modeToggled', (data) => {
  console.log(`[MasterPanel] Mode toggled via event: ${data.compact ? 'compact' : 'expanded'}`);
});

console.log('[MasterPanelCoordinator] Module loaded');
