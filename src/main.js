import { repl, evalScope, ref } from '@strudel/core';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick, registerSynthSounds } from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import { sliderWithID, sliderValues as cmSliderValues, highlightExtension, updateMiniLocations, highlightMiniLocations } from '@strudel/codemirror';
import { createPanel, renderPanel, deletePanel, getPanel, updatePanelTitle, bringPanelToFront, updatePanel, loadPanelState, savePanelState, savePanelStateWithMasterCode, startAutoSaveTimer, getAllPanels, getPanelEditorContainer, getNextPanelNumber, renumberPanels, expandPanel, collapsePanel, togglePanel, isPanelExpanded, reRenderAllPanels, MASTER_PANEL_ID } from './managers/panelManager.js';
import { initializePanelReorder } from './ui/panelReorder.js';
import { loadSettings, getSettings, updateSetting } from './managers/settingsManager.js';
import { skinManager } from './managers/skinManager.js';
import { moveEditorToScreen, removeEditorFromScreen, removeAllEditorsExcept, isEditorInScreen } from './managers/screenManager.js';
import { initializeSettingsModal, openSettingsModal } from './ui/settingsModal.js';
import { applyAllAppearanceSettings, updatePanelOpacities } from './managers/themeManager.js';
import { openSnippetModal } from './ui/snippetModal.js';
import { saveLayoutToFile, loadLayoutFromFile } from './ui/fileIO.js';
import { loadSnippets } from './managers/snippetManager.js';
import './ui/snippetModal.css';
import * as prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';
import { connect as wsConnect, send as wsSend, isConnected as wsIsConnected, MESSAGE_TYPES, syncPanelState, sendFullState } from './managers/websocketManager.js';
import { eventBus } from './utils/eventBus.js';
import { renderSliders as smRenderSliders, renderCollapsedSliders as smRenderCollapsedSliders, updateSliderValue as smUpdateSliderValue, clearSliders as smClearSliders, getPanelSliders } from './managers/sliderManager.js';
import { prebake } from './managers/splash.js';
import { initializeMetronome, initializePatternHighlighting } from './managers/visualization.js';
import {
  cardStates,
  editorViews,
  fontSizeCompartments,
  panelMiniLocations,
  ctx,
  strudelCore,
  appState
} from './state.js';

// Panel modules (extracted from main.js)
import {
  updateActivateButton,
  updatePauseButton,
  updatePlaybackButton,
  updatePanelButtons,
  updateVisualIndicators,
  updateMasterControlsVisibility,
  setMasterSlidersRef
} from './panels/panelUI.js';

import {
  checkStaleness,
  isPanelStale,
  validateCode,
  displayError,
  clearErrorMessage,
  attachValidationListener
} from './panels/panelValidation.js';

import {
  createEditorView,
  handleEditorChange as _handleEditorChange,
  updateAllEditorFontSizes,
  setUpdateAllButtonRef
} from './panels/panelEditor.js';

/**
 * Wrapper for handleEditorChange that also schedules pattern pre-registration
 * This enables cross-panel pattern references without needing to play first
 */
function handleEditorChange(code, panelId) {
  _handleEditorChange(code, panelId);
  // Schedule pattern registration (debounced) - defined later in file
  if (typeof schedulePatternRegistration === 'function') {
    schedulePatternRegistration(panelId);
  }
}

// UI modules - utility functions only (initializeKeyboardShortcuts kept in main.js for complete logic)
import {
  findFocusedPanel,
  animateButtonPress,
  animatePressStart,
  animatePressRelease
} from './ui/keyboard.js';

// CodeMirror - only Compartment and EditorView needed for font size updates
import { EditorView } from '@codemirror/view';
import { Compartment } from '@codemirror/state';

// Version tracking
const APP_VERSION = '8.4.0-full-state-sync';
console.log(`%c🎵 r0astr ${APP_VERSION}`, 'font-weight: bold; font-size: 14px; color: #51cf66;');

// Use the official sliderValues from @strudel/codemirror
export const sliderValues = cmSliderValues;

// Make available globally for patterns
window.sliderValues = sliderValues;

// Use sliderWithID directly - no preservation needed
window.sliderWithID = sliderWithID;

window.ref = ref;

// Helper for doing math with slider refs
// Usage: setCpm(sliderDiv(slider(120, 60, 180), 4))
window.sliderDiv = (sliderRef, divisor) => {
  return ref(() => {
    const value = typeof sliderRef === 'function' ? sliderRef() : sliderRef;
    return value / divisor;
  });
};

// Helper function to create reactive slider reference (like sliderWithID)
const createSlider = (id, initialValue) => {
  sliderValues[id] = initialValue;
  return ref(() => sliderValues[id]);
};

// State is now imported from state.js:
// cardStates, editorViews, fontSizeCompartments, panelMiniLocations

/**
 * Check if the UI is using tree layout (vs legacy grid layout)
 * @returns {boolean} True if tree layout is active
 */
function isTreeLayout() {
  return document.querySelector('.panel-tree') !== null;
}

/**
 * Get the original code-editor container for a panel
 * @param {string} panelId - Panel ID
 * @returns {HTMLElement|null} - The .code-editor container
 */
function getEditorContainer(panelId) {
  const panelElement = document.getElementById(panelId);
  if (!panelElement) return null;
  return panelElement.querySelector('.code-editor');
}

/**
 * Sanitize panel title to valid JavaScript identifier
 * "My Bass" → "MY_BASS", "Lead 1!" → "LEAD_1"
 * @param {string} title - Panel title
 * @returns {string} Valid JS identifier (uppercase)
 */
function sanitizePanelTitle(title) {
  if (!title) return null;
  // Replace non-alphanumeric with underscore, uppercase, trim underscores
  let safe = title.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  // Ensure doesn't start with number
  if (/^[0-9]/.test(safe)) {
    safe = '_' + safe;
  }
  return safe || null;
}

/**
 * Get panels in DOM order (excludes master panel)
 * @returns {Array} Array of {panelId, panel, number} sorted by display order
 */
function getPanelsInOrder() {
  const panelTree = document.querySelector('.panel-tree');
  if (!panelTree) return [];

  const panelElements = Array.from(panelTree.querySelectorAll('.level-panel'));
  return panelElements
    .map(el => ({
      panelId: el.dataset.panelId,
      panel: getPanel(el.dataset.panelId),
      number: parseInt(el.dataset.panelNumber, 10) || 0
    }))
    .filter(p => p.panel && p.panelId !== MASTER_PANEL_ID)
    .sort((a, b) => a.number - b.number);
}

/**
 * Register a panel's pattern globally under its sanitized title
 * @param {string} panelId - Panel ID
 * @param {Pattern} pattern - Strudel pattern object
 */
function registerPanelPattern(panelId, pattern) {
  const panelData = getPanel(panelId);
  if (!panelData || !panelData.title) return null;

  const safeName = sanitizePanelTitle(panelData.title);
  if (!safeName) return null;

  window[safeName] = pattern;
  console.log(`✓ Pattern registered as: ${safeName}`);
  return safeName;
}

/**
 * Cascade re-evaluate playing panels that are below the given panel in hierarchy
 * This ensures panels referencing updated patterns get refreshed
 * @param {string} panelId - Panel ID that was just updated
 */
async function cascadeReEvaluate(panelId) {
  const panelData = getPanel(panelId);
  if (!panelData) return;

  const panelsInOrder = getPanelsInOrder();
  const thisIndex = panelsInOrder.findIndex(p => p.panelId === panelId);
  if (thisIndex === -1) return;

  // Find all playing panels below this one
  const dependentPanels = panelsInOrder
    .slice(thisIndex + 1)
    .filter(p => cardStates[p.panelId]?.playing);

  if (dependentPanels.length > 0) {
    console.log(`[Cascade] Re-evaluating ${dependentPanels.length} dependent panel(s)`);
    for (const dep of dependentPanels) {
      // Re-activate to pick up new pattern references
      await activatePanel(dep.panelId);
    }
  }
}

// Audio context initialized in state.js (ctx)
// Core state managed via state.js objects
initAudioOnFirstClick();

// Local aliases for frequently-used state (reduces code changes)
// These reference the state.js objects, so mutations are shared
const getEvaluate = () => strudelCore.evaluate;
const getScheduler = () => strudelCore.scheduler;
let masterCode = ''; // Restored from savedPanels, used in initializeCards()
let masterCodeEvaluating = false;
let currentMasterSliders = []; // Track current master sliders for remote sync

// Override autoSavePanelState to use CodeMirror (Story 7.6)
let saveTimeout;

/**
 * Debounced auto-save for keystrokes (3 second delay)
 * Use this for code changes that happen frequently
 */
function autoSavePanelState() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    savePanelStateNow();
  }, 3000); // 3 seconds debounce for keystrokes
}

/**
 * Immediate save for UI state changes (no debounce)
 * Use this for drag/resize, expand/collapse, rename, etc.
 */
function savePanelStateNow() {
  const masterView = editorViews.get(MASTER_PANEL_ID);
  const masterCode = masterView ? masterView.state.doc.toString() : '';
  savePanelStateWithMasterCode(masterCode, appState.masterPanelCompact);
}

// Story 8.3: Debounce timers for title broadcasts (panel ID -> timer ID)
const titleBroadcastTimers = {};

// Debounce timers for pattern pre-registration (panel ID -> timer ID)
const patternRegistrationTimers = {};

/**
 * Debounced pattern pre-registration on code change
 * Validates code and registers pattern for cross-panel references
 * @param {string} panelId - Panel ID
 */
async function schedulePatternRegistration(panelId) {
  // Skip master panel
  if (panelId === MASTER_PANEL_ID) return;

  // Clear existing timer
  if (patternRegistrationTimers[panelId]) {
    clearTimeout(patternRegistrationTimers[panelId]);
  }

  // Debounce: wait 1 second after last keystroke
  patternRegistrationTimers[panelId] = setTimeout(async () => {
    try {
      const result = await validateCode(panelId);
      if (result.valid && result.pattern) {
        registerPanelPattern(panelId, result.pattern);
      }
    } catch (error) {
      // Silently ignore validation errors during typing
    }
  }, 1000);
}

// Application settings (loaded from localStorage)
let appSettings = null;

// Load modules (matches official REPL pattern)
async function loadModules() {
  const scope = await evalScope(
    import('@strudel/core'),
    import('@strudel/mini'),
    import('@strudel/webaudio'),
    import('@strudel/tonal'),
    import('@strudel/soundfonts'),
    import('@strudel/codemirror'),
    import('@strudel/draw'),      // CRITICAL: Adds .orbit()/.o() and visualization methods
    import('@strudel/xen'),        // Xenharmonic/microtonal functions
    import('@strudel/osc'),        // OSC (Open Sound Control) support
    import('@strudel/serial'),     // Serial/MIDI hardware support
    import('@strudel/csound'),     // CSound integration
    // Expose slider functionality
    Promise.resolve({ sliderValues, sliderWithID, ref })
  );

  // CRITICAL: Register soundfonts AFTER evalScope to make them available in patterns
  // This must happen before any patterns are evaluated
  const { registerSoundfonts } = await import('@strudel/soundfonts');
  console.log('Registering soundfonts (gm_* instruments)...');
  await registerSoundfonts();
  console.log('✓ Soundfonts registered (use s("gm_piano"), s("gm_electric_piano"), etc.)');

  // Import visualization modules from Strudel
  const { Pattern } = await import('@strudel/core');

  // Import pianoroll visualization and cleanup function
  const { cleanupDraw } = await import('@strudel/draw');

  // Store cleanupDraw globally so it can be used in pausePanel
  window.cleanupDraw = cleanupDraw;

  // Keep minimal stubs for unsupported visualizations
  const visualStubs = [
    'theme', 'color', 'fontFamily',
    'viz', 'setVizValue', 'setVizNote', 'setVizHue'
  ];

  visualStubs.forEach(methodName => {
    if (!Pattern.prototype[methodName]) {
      Pattern.prototype[methodName] = function (...args) {
        // Silent no-op - returns pattern unchanged for chaining
        return this;
      };
    }
  });

  return scope;
}

// Toggle between code and compact mode
function toggleMasterMode() {
  appState.masterPanelCompact = !appState.masterPanelCompact;
  const panel = document.getElementById(MASTER_PANEL_ID);

  if (appState.masterPanelCompact) {
    panel.classList.add('compact');
  } else {
    panel.classList.remove('compact');
  }

  // Save state immediately (no debounce for UI state changes)
  savePanelStateNow();
}

// Evaluate master code and make globals available
async function evaluateMasterCode(reRenderSliders = true) {
  if (masterCodeEvaluating) {
    return; // Prevent recursion
  }

  const view = editorViews.get(MASTER_PANEL_ID);
  if (!view) {
    console.warn('[evaluateMasterCode] Master panel EditorView not found');
    return;
  }

  const code = view.state.doc.toString().trim();

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
    const sliderRegex = /(\w+)\s*=\s*slider\s*\(\s*([^,)]+)(?:\s*,\s*([^,)]+))?(?:\s*,\s*([^,)]+))?\s*\)/g;
    const widgets = [];
    const sliderVars = {};
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
      window[varName] = ref(() => sliderValues[sliderId]);
    });

    console.log('✓ Master controls updated - variables available globally:', Object.keys(sliderVars));

    // Evaluate master code as global setup (for register(), samples(), etc.)
    // Skip evaluation if code only contains slider declarations
    // Match: let/const/var VARNAME = slider(...) or plain VARNAME = slider(...)
    const hasNonSliderCode = cleanCode.replace(/(?:let|const|var)?\s*\w+\s*=\s*slider\s*\([^)]+\)/g, '').trim();

    if (hasNonSliderCode) {
      try {
        // Transform variable declarations to window assignments for global access
        // This allows master panel globals to be accessible in other panels
        // e.g., "let SCALE = 'e:minor'" becomes "window.SCALE = 'e:minor'"
        let globalCode = hasNonSliderCode;

        // Handle optional leading whitespace with capture groups
        globalCode = globalCode.replace(/^(\s*)(let|const|var)\s+(\w+)\s*=/gm, '$1window.$3 =');
        globalCode = globalCode.replace(/^(\s*)function\s+(\w+)\s*\(/gm, '$1window.$2 = function $2(');

        // Evaluate WITHOUT transpilation and WITHOUT .p() - just run the code globally
        // This allows register(), samples(), variable assignments, etc.
        // Append 'silence' to satisfy Strudel's pattern expectation (register() returns undefined)
        await strudelCore.evaluate(globalCode + '\nsilence', false, false);
        console.log('✓ Master panel code evaluated globally');
      } catch (error) {
        // Show error in console - could enhance to show in UI later
        console.error('[Master] Evaluation error:', error);
        // TODO: Display error in master panel UI
      }
    }
  } catch (error) {
    console.error('[Master] Error:', error);
  } finally {
    masterCodeEvaluating = false;
  }
}

// Render master sliders
function renderMasterSliders(widgets) {
  if (isTreeLayout()) {
    // Tree layout: render as leaf nodes
    renderMasterSlidersTree(widgets);
  } else {
    // Legacy layout: render in master-sliders container
    renderMasterSlidersLegacy(widgets);
  }

  // Broadcast slider metadata to remote clients
  broadcastSliders(widgets);

  // Render automatic tempo control if enabled
  renderTempoControl();

  // Update master controls visibility after rendering
  updateMasterControlsVisibility();
}

// Render master sliders for tree layout
function renderMasterSlidersTree(widgets) {
  const masterPanel = document.querySelector(`[data-panel-id="${MASTER_PANEL_ID}"]`) ||
                      document.getElementById(MASTER_PANEL_ID);
  if (!masterPanel) return;

  const controlsContainer = masterPanel.querySelector('.panel-controls-container');
  if (!controlsContainer) return;

  // Remove existing master slider leaves (keep viz leaf)
  const existingSliderLeaves = controlsContainer.querySelectorAll('.leaf-slider.master-slider');
  existingSliderLeaves.forEach(leaf => leaf.remove());

  widgets.forEach((widget) => {
    const { varName, value, min, max, sliderId } = widget;

    const leafSlider = document.createElement('div');
    leafSlider.className = 'leaf-slider master-slider';
    leafSlider.innerHTML = `
      <label>${varName}</label>
      <input type="range"
        min="${min}"
        max="${max}"
        step="${(max - min) / 1000}"
        value="${value}"
        data-slider-id="${sliderId}">
      <span class="slider-value" data-slider="${sliderId}">${value}</span>
    `;

    const input = leafSlider.querySelector('input');
    input.addEventListener('input', (e) => {
      const newValue = parseFloat(e.target.value);
      updateSliderValue(sliderId, newValue);
    });

    controlsContainer.appendChild(leafSlider);
  });

  // Ensure controls container is visible when sliders exist
  if (widgets.length > 0) {
    controlsContainer.style.display = '';
  }
}

// Render master sliders for legacy layout
function renderMasterSlidersLegacy(widgets) {
  const slidersContainer = document.getElementById('master-sliders');
  if (!slidersContainer) return;
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
      updateSliderValue(sliderId, newValue);
    });

    slidersContainer.appendChild(sliderControl);
  });
}

/**
 * Render automatic TEMPO control based on settings
 * Supports both legacy and tree layouts
 */
function renderTempoControl() {
  const settings = getSettings();

  if (!settings.advanced || !settings.advanced.show_tempo_knob) {
    // Remove tempo control if it exists but is disabled
    const existingTempo = document.getElementById('tempo-control');
    if (existingTempo) {
      existingTempo.remove();
    }
    return;
  }

  // Get current tempo value (default 30 CPM = 120 BPM)
  const currentCpm = window.TEMPO_CPM_VALUE || 30;
  const showCpm = settings.advanced.show_cpm;
  const displayValue = showCpm ? currentCpm : currentCpm * 4; // BPM = CPM * 4
  const displayUnit = showCpm ? 'CPM' : 'BPM';

  if (isTreeLayout()) {
    // Tree layout: render as leaf node
    renderTempoControlTree(currentCpm, displayValue, displayUnit, showCpm);
  } else {
    // Legacy layout: render in master-sliders container
    renderTempoControlLegacy(currentCpm, displayValue, displayUnit, showCpm);
  }

  // Initialize scheduler on first render
  if (scheduler && !window.TEMPO_INITIALIZED) {
    const cps = currentCpm / 60;
    strudelCore.scheduler.setCps(cps);
    window.TEMPO_INITIALIZED = true;
    console.log(`🎵 Auto Tempo initialized: ${currentCpm} CPM (${(currentCpm * 4).toFixed(0)} BPM)`);
  }
}

function renderTempoControlTree(currentCpm, displayValue, displayUnit, showCpm) {
  const masterPanel = document.querySelector(`[data-panel-id="${MASTER_PANEL_ID}"]`) ||
                      document.getElementById(MASTER_PANEL_ID);
  if (!masterPanel) return;

  const controlsContainer = masterPanel.querySelector('.panel-controls-container');
  if (!controlsContainer) return;

  // Check if tempo control already exists
  let tempoControl = document.getElementById('tempo-control');

  if (!tempoControl) {
    // Create tempo control as leaf slider
    tempoControl = document.createElement('div');
    tempoControl.id = 'tempo-control';
    tempoControl.className = 'leaf-slider tempo-control';
    // Insert at beginning so tempo is first
    controlsContainer.insertBefore(tempoControl, controlsContainer.firstChild);
  }

  tempoControl.innerHTML = `
    <label>TEMPO</label>
    <input type="range"
      id="tempo-slider"
      min="15"
      max="45"
      step="0.1"
      value="${currentCpm}">
    <span class="slider-value" id="tempo-value">${displayValue.toFixed(0)} ${displayUnit}</span>
  `;

  // Ensure controls container is visible for tempo (always shown when enabled)
  controlsContainer.style.display = '';

  attachTempoInputListener(tempoControl, showCpm, displayUnit);
}

function renderTempoControlLegacy(currentCpm, displayValue, displayUnit, showCpm) {
  const slidersContainer = document.getElementById('master-sliders');
  if (!slidersContainer) return;

  // Check if tempo control already exists
  let tempoControl = document.getElementById('tempo-control');

  if (!tempoControl) {
    // Create tempo control
    tempoControl = document.createElement('div');
    tempoControl.id = 'tempo-control';
    tempoControl.className = 'slider-control tempo-control';
    slidersContainer.appendChild(tempoControl);
  }

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

  attachTempoInputListener(tempoControl, showCpm, displayUnit);
}

function attachTempoInputListener(tempoControl, showCpm, displayUnit) {
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
    if (scheduler) {
      const cps = cpm / 60;
      strudelCore.scheduler.setCps(cps);
      console.log(`🎵 Tempo: ${cpm.toFixed(1)} CPM (${(cpm * 4).toFixed(0)} BPM, ${cps.toFixed(3)} CPS)`);
    }
  });
}

/**
 * Update slider value and apply effects
 * Used by both local UI and remote control
 */
function updateSliderValue(sliderId, newValue) {
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

  // Broadcast value change to remote clients
  broadcastSliderValue(sliderId, newValue);
}

/**
 * Broadcast slider metadata to remote clients
 */
function broadcastSliders(widgets) {
  if (!wsIsConnected()) return;

  const sliderData = widgets.map(w => ({
    sliderId: w.sliderId,
    varName: w.varName,
    value: w.value,
    min: w.min,
    max: w.max
  }));

  wsSend(MESSAGE_TYPES.MASTER_SLIDERS, { sliders: sliderData });
}

/**
 * Broadcast slider value change to remote clients
 */
function broadcastSliderValue(sliderId, value) {
  if (!wsIsConnected()) return;

  wsSend('master.sliderValue', { sliderId, value });
}

// Restore panels from saved state
function restorePanels() {
  const savedPanels = loadPanelState();
  if (!savedPanels || savedPanels.length === 0) {
    console.log('No saved panels to restore');
    return;
  }

  console.log(`Restoring ${savedPanels.length} panels from saved state`);

  savedPanels.forEach((panelState) => {
    if (panelState.id === MASTER_PANEL_ID) {
      // Store master panel code and compact state to be set when EditorView initializes
      masterCode = panelState.code || '';
      appState.masterPanelCompact = panelState.compact !== undefined ? panelState.compact : true;
      console.log(`Master panel will be restored: compact=${appState.masterPanelCompact}`);
    } else {
      // Use expandedPosition for initial position/size if available, otherwise use saved position/size
      const initialPosition = panelState.expandedPosition
        ? { x: panelState.expandedPosition.x, y: panelState.expandedPosition.y }
        : panelState.position;
      const initialSize = panelState.expandedPosition
        ? { w: panelState.expandedPosition.w, h: panelState.expandedPosition.h }
        : panelState.size;

      // Create regular panel with saved state
      const panelId = createPanel({
        id: panelState.id,
        number: panelState.number,
        title: panelState.title,
        code: panelState.code,
        position: initialPosition,
        size: initialSize,
        playing: false, // Always start paused (safety)
        stale: panelState.stale || false, // Restore staleness (Story 6.1)
        lastEvaluatedCode: panelState.lastEvaluatedCode || '', // Restore last evaluated code (Story 6.1)
        zIndex: panelState.zIndex,
        expandedPosition: panelState.expandedPosition || null,
        collapsedPosition: panelState.collapsedPosition || null
      });

      // Register panel in cardStates (restore staleness state)
      cardStates[panelId] = {
        playing: false,
        stale: panelState.stale || false,
        lastEvaluatedCode: panelState.lastEvaluatedCode || ''
      };

      // Render panel to DOM
      const panelElement = renderPanel(panelId);

      // Initialize CodeMirror for restored panel (Story 7.6)
      const container = getPanelEditorContainer(panelId);
      if (container) {
        const view = createEditorView(container, {
          initialCode: panelState.code || '',
          onChange: handleEditorChange,
          panelId,
        });
        editorViews.set(panelId, view);
        console.log(`[RESTORE] CodeMirror initialized for: ${panelId}`);
      }


      // Initialize visual state (Story 6.3)
      updateVisualIndicators(panelId);

      // Story 7.3: Run initial validation (disabled during restore for performance)
      // Validation will run on first PLAY attempt
      // setTimeout(async () => {
      //   const validation = await validateCode(panelId);
      //   await updateActivateButton(panelId);
      //   if (!validation.valid) {
      //     displayError(panelId, validation.error, validation.line);
      //   }
      // }, 0);

      console.log(`Restored panel: ${panelId} (expandedPosition: ${panelState.expandedPosition ? 'saved' : 'none'})`);
    }
  });

  console.log('✓ Panels restored successfully');

  // Find panel with highest z-index and mark it as focused
  const allPanels = getAllPanels();
  if (allPanels.length > 0) {
    const highestZPanel = allPanels.reduce((highest, current) => {
      return (current.zIndex > highest.zIndex) ? current : highest;
    });

    // Bring highest z-index panel to front (which marks it as focused)
    setTimeout(() => {
      bringPanelToFront(highestZPanel.id);
      console.log(`[RESTORE] Set initial focus to panel with highest z-index: ${highestZPanel.id}`);
    }, 50);
  }
}

/**
 * Restore layout from a loaded JSON file
 * Clears existing panels and creates new ones from loaded state
 * @param {Object} layout - Layout object from loadLayoutFromFile
 */
async function restoreLayoutFromFile(layout) {
  console.log(`[FileIO] Restoring layout: ${layout.name || 'unnamed'} (${layout.panels.length} panels)`);

  // 1. Stop all playing patterns first
  stopAll();

  // 2. Clear existing panels (except master)
  const existingPanels = getAllPanels();
  const panelIds = Array.from(existingPanels.keys());

  for (const panelId of panelIds) {
    if (panelId !== MASTER_PANEL_ID) {
      // Clean up editor view
      const view = editorViews.get(panelId);
      if (view) {
        view.destroy();
        editorViews.delete(panelId);
      }
      // Clean up highlighting data
      panelMiniLocations.delete(panelId);
      // Delete panel from manager (skip confirmation)
      deletePanel(panelId, null, cardStates, true);
    }
  }

  // 3. Restore panels from layout
  let masterPanelData = null;

  for (const panelState of layout.panels) {
    if (panelState.isMaster || panelState.id === MASTER_PANEL_ID) {
      // Store master panel data for later
      masterPanelData = panelState;
    } else {
      // Create regular panel
      const panelId = createPanel({
        id: panelState.id,
        number: panelState.number,
        title: panelState.title || `Instrument ${panelState.number || 1}`,
        code: panelState.code || '',
        playing: false
      });

      // Register in cardStates
      cardStates[panelId] = {
        playing: false,
        stale: false,
        lastEvaluatedCode: ''
      };

      // Render panel to DOM
      const panelElement = renderPanel(panelId);

      // Initialize CodeMirror
      const container = getPanelEditorContainer(panelId);
      if (container) {
        const view = createEditorView(container, {
          initialCode: panelState.code || '',
          onChange: handleEditorChange,
          panelId,
        });
        editorViews.set(panelId, view);
      }


      console.log(`[FileIO] Restored panel: ${panelId} (${panelState.title})`);
    }
  }

  // 4. Restore master panel code
  if (masterPanelData) {
    const masterView = editorViews.get(MASTER_PANEL_ID);
    if (masterView && masterPanelData.code) {
      masterView.dispatch({
        changes: { from: 0, to: masterView.state.doc.length, insert: masterPanelData.code }
      });
      // Update compact state
      if (masterPanelData.compact !== undefined) {
        appState.masterPanelCompact = masterPanelData.compact;
      }
      // Re-evaluate master code to register sliders
      evaluateMasterCode();
      console.log('[FileIO] Restored master panel code');
    }
  }

  // 5. Save restored state to localStorage
  savePanelStateNow();

  console.log('✓ Layout restored from file');
}

// Ensure add-panel-row is always at the end of panel-tree
function ensureAddPanelRowAtEnd() {
  const panelTree = document.querySelector('.panel-tree');
  const addPanelRow = document.getElementById('add-panel-row');
  if (panelTree && addPanelRow && addPanelRow.nextElementSibling) {
    // Move add-panel-row to end if it has siblings after it
    panelTree.appendChild(addPanelRow);
    console.log('[Layout] Moved add-panel-row to end of panel tree');
  }
}

// Initialize card UI
function initializeCards() {
  // Check if we should restore panels from saved state
  if (appSettings && appSettings.behavior.restoreSession) {
    console.log('Restoring panels from saved state (restoreSession: true)');
    restorePanels();
  } else {
    console.log('Panel restoration disabled (restoreSession: false or no settings)');
  }

  // Ensure add-panel-row is at end (fixes any corrupted DOM order)
  ensureAddPanelRowAtEnd();

  // Initialize CodeMirror for existing panel containers
  // Note: This handles both restored panels and any panels already in HTML
  document.querySelectorAll('.code-editor[data-card]').forEach((container) => {
    const panelId = container.getAttribute('data-card');

    // Skip master panel (initialized separately below)
    if (panelId === MASTER_PANEL_ID) return;

    // Skip if already initialized
    if (editorViews.has(panelId)) return;

    // Get initial code from panel manager state
    const panel = getPanel(panelId);
    const initialCode = panel ? panel.code : '';

    // Create editor view
    const view = createEditorView(container, {
      initialCode,
      onChange: handleEditorChange,
      panelId,
    });

    editorViews.set(panelId, view);
    console.log(`[Init] CodeMirror initialized for panel: ${panelId}`);

    // Register panel in cardStates
    if (!cardStates[panelId]) {
      cardStates[panelId] = {
        playing: false,
        stale: false,
        lastEvaluatedCode: ''
      };
    }

    // Initialize visual state (Story 6.3)
    updateVisualIndicators(panelId);
  });

  // Attach stop-all button listener
  const stopAllBtn = document.getElementById('stop-all');
  if (stopAllBtn) {
    stopAllBtn.addEventListener('click', stopAll);
  }

  // Attach UPDATE ALL button listener (Story 6.4)
  const updateAllBtn = document.getElementById('update-all-btn');
  if (updateAllBtn) {
    updateAllBtn.addEventListener('click', async () => {
      if (updateAllBtn.disabled) return;
      await updateAllPanels();
    });
    // Initialize button state
    updateAllButton();
  }

  // Attach CONFIG button listener (opens settings modal)
  const configBtn = document.getElementById('config-btn');
  if (configBtn) {
    configBtn.addEventListener('click', () => {
      openSettingsModal();
    });
  }

  // Attach SAVE button listener (save layout to file)
  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveLayoutToFile(editorViews, appState);
    });
  }

  // Attach LOAD button listener (load layout from file)
  const loadBtn = document.getElementById('load-btn');
  if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
      const layout = await loadLayoutFromFile();
      if (layout) {
        await restoreLayoutFromFile(layout);
      }
    });
  }

  // Hide REMOTE button in lite mode (no WebSocket server available)
  if (import.meta.env.LITE_MODE) {
    const remoteBtn = document.getElementById('remote-btn');
    if (remoteBtn) {
      remoteBtn.style.display = 'none';
    }
  }

  // Attach master panel listeners (legacy button - may not exist in tree layout)
  const masterModeBtn = document.getElementById('master-mode');
  if (masterModeBtn) {
    masterModeBtn.addEventListener('click', toggleMasterMode);
  }

  // Initialize master panel CodeMirror
  // Tree layout uses editor-panel-0, legacy uses master-code
  const masterCodeContainer = document.getElementById('editor-panel-0') ||
                              document.getElementById('master-code');
  let masterCodeTimer;
  if (masterCodeContainer) {
    console.log('[Init] Initializing master panel CodeMirror');

    // Use restored code if available, otherwise use default
    const defaultMasterCode = `// Global Controls - Define global variables and sliders
// These are accessible in all instrument panels

// Add sliders here:
// let SLIDER_LPF = slider(800, 100, 5000);
// let SLIDER_GAIN = slider(0.8, 0, 1);
//
// Then use in any panel: note('c2').lpf(SLIDER_LPF).gain(SLIDER_GAIN)
//
// Note: TEMPO control is available in Settings > Advanced`;

    const initialCode = masterCode || defaultMasterCode; // Use restored or default

    const masterView = createEditorView(masterCodeContainer, {
      initialCode,
      onChange: (code) => {
        // Debounce master code evaluation (expensive regex parsing)
        clearTimeout(masterCodeTimer);
        masterCodeTimer = setTimeout(() => {
          evaluateMasterCode();
        }, 800); // 800ms debounce for master panel

        // Auto-save master panel code (debounced separately)
        autoSavePanelState();
      },
      panelId: MASTER_PANEL_ID,
    });

    editorViews.set(MASTER_PANEL_ID, masterView);
    console.log('[Init] Master panel CodeMirror initialized with', masterCode ? 'restored' : 'default', 'code');

    // Apply restored compact state to DOM (tree layout uses details open/closed)
    const panel = document.querySelector(`[data-panel-id="${MASTER_PANEL_ID}"]`) ||
                  document.getElementById(MASTER_PANEL_ID);
    if (panel) {
      // For tree layout, expanded state is controlled by details element
      const details = panel.querySelector('details');
      if (details) {
        // In tree layout, "compact" means collapsed
        if (appState.masterPanelCompact) {
          details.removeAttribute('open');
        } else {
          details.setAttribute('open', '');
        }
      } else {
        // Legacy layout
        if (appState.masterPanelCompact) {
          panel.classList.add('compact');
        } else {
          panel.classList.remove('compact');
        }
      }
      console.log(`[Init] Master panel compact state restored: ${appState.masterPanelCompact}`);
    }
  } else {
    console.warn('[Init] Master code container not found!');
  }

  // Note: Panel code change handling is now done via CodeMirror updateListener
  // See handleEditorChange() function and createEditorView() configuration

  // Attach [+] button listener for adding new panels
  const addPanelBtn = document.getElementById('add-panel-btn');
  if (addPanelBtn) {
    addPanelBtn.addEventListener('click', () => {
      // Create new panel with default settings and staggered position
      const panelCount = Object.keys(cardStates).length;
      const offsetX = (panelCount % 3) * 50; // Stagger horizontally
      const offsetY = Math.floor(panelCount / 3) * 50; // Stagger vertically

      const panelId = createPanel({
        code: '', // Start with empty pattern
        position: { x: 20 + offsetX, y: 100 + offsetY }
      });

      // Register panel in cardStates
      cardStates[panelId] = {
        playing: false,
        stale: false,
        lastEvaluatedCode: ''
      };

      // Render panel to DOM
      const panelElement = renderPanel(panelId);

      // Initialize CodeMirror for new panel (Story 7.6)
      const container = getPanelEditorContainer(panelId);
      if (container) {
        const view = createEditorView(container, {
          initialCode: '',
          onChange: handleEditorChange,
          panelId,
        });
        editorViews.set(panelId, view);
        console.log(`[NEW PANEL] CodeMirror initialized for: ${panelId}`);

        // Focus editor immediately after creation (same as hotkey behavior)
        setTimeout(() => {
          bringPanelToFront(panelId);

          // Expand details in tree layout
          if (panelElement) {
            const details = panelElement.querySelector('details');
            if (details) {
              details.open = true;
            }
          }

          setTimeout(() => {
            view.focus();
            console.log(`[+Button] New panel ${panelId} focused and ready for input`);
          }, 10);
        }, 10);
      }


      // Initialize visual state (Story 6.3)
      updateVisualIndicators(panelId);

      console.log(`Created new panel: ${panelId}`);

      // Story 8.1: Broadcast panel_created event to remote clients
      const panel = getPanel(panelId);
      if (panel && wsIsConnected()) {
        wsSend(MESSAGE_TYPES.PANEL_CREATED, {
          id: panelId,
          title: panel.title,
          position: panelCount + 1, // Position in list (1-indexed)
          timestamp: Date.now()
        });
        console.log(`[WebSocket] Broadcasted panel_created: ${panelId}`);
      }
    });
  }

  // Story 6.2: Use event delegation for PAUSE/STOP button clicks (supports dynamic panels)
  // Supports both legacy (.pause-btn) and tree layout (.btn-stop)
  document.addEventListener('click', (e) => {
    const pauseBtn = e.target.closest('.pause-btn, .btn-stop');
    if (pauseBtn) {
      // Try legacy data-card, then find from tree parent
      let panelId = pauseBtn.dataset.card;
      if (!panelId) {
        const levelPanel = pauseBtn.closest('.level-panel');
        panelId = levelPanel?.dataset?.panelId || levelPanel?.id;
      }
      if (panelId) {
        pausePanel(panelId);
      }
    }
  });

  // Story 6.2: Use event delegation for ACTIVATE/PLAY button clicks (supports dynamic panels)
  // Supports both legacy (.activate-btn) and tree layout (.btn-play)
  document.addEventListener('click', (e) => {
    const activateBtn = e.target.closest('.activate-btn, .btn-play');
    if (activateBtn) {
      // Try legacy data-card, then find from tree parent
      let panelId = activateBtn.dataset.card;
      if (!panelId) {
        const levelPanel = activateBtn.closest('.level-panel');
        panelId = levelPanel?.dataset?.panelId || levelPanel?.id;
      }
      if (panelId) {
        activatePanel(panelId);
      }
    }
  });

  // Tree layout: Contextual playback button (.btn-playback) - toggles play/pause/update
  document.addEventListener('click', (e) => {
    const playbackBtn = e.target.closest('.btn-playback');
    if (playbackBtn) {
      let panelId = playbackBtn.dataset.card;
      if (!panelId) {
        const levelPanel = playbackBtn.closest('.level-panel');
        panelId = levelPanel?.dataset?.panelId || levelPanel?.id;
      }
      if (panelId) {
        const panel = cardStates[panelId];
        if (panel) {
          if (panel.playing && !panel.stale) {
            // Playing and in sync -> Pause
            pausePanel(panelId);
          } else {
            // Paused or stale -> Play/Update
            activatePanel(panelId);
          }
        }
      }
    }
  });

  // Tree layout: Use event delegation for DELETE button clicks
  document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete, .delete-btn');
    if (deleteBtn) {
      // Try legacy data-card/data-panel, then find from tree parent
      let panelId = deleteBtn.dataset.panel || deleteBtn.dataset.card;
      if (!panelId) {
        const levelPanel = deleteBtn.closest('.level-panel');
        panelId = levelPanel?.dataset?.panelId || levelPanel?.id;
      }
      if (panelId && panelId !== MASTER_PANEL_ID) {
        deletePanel(panelId, null, cardStates);
      }
    }
  });

  // Tree layout: Handle details toggle for accordion mode and controls visibility
  // Listen for toggle events on details elements (use capture since toggle doesn't bubble)
  document.addEventListener('toggle', (e) => {
    // Only handle details elements
    if (e.target.tagName !== 'DETAILS') return;

    const details = e.target;
    const levelPanel = details.closest('.level-panel');
    if (!levelPanel) return;

    const panelId = levelPanel.dataset?.panelId || levelPanel.id;
    const settings = getSettings();
    const panel = cardStates[panelId];

    // Update controls container visibility when panel is toggled
    const controlsContainer = levelPanel.querySelector('.panel-controls-container');
    if (controlsContainer) {
      const showControls = panel?.playing || details.open || settings.showControlsWhenCollapsed;
      controlsContainer.style.display = showControls ? '' : 'none';
    }

    // When panel is opened, bring it to front and focus the editor
    if (details.open) {
      bringPanelToFront(panelId);

      // Focus the editor after a short delay to ensure DOM is ready
      setTimeout(() => {
        const view = editorViews.get(panelId);
        if (view) {
          view.focus();
          console.log(`[Toggle] Panel ${panelId} expanded and editor focused`);
        }
      }, 10);
    }

    // Accordion mode: collapse other panels when one is opened
    if (details.open && settings.collapseOnBlur) {
      const allPanels = document.querySelectorAll('.level-panel');
      let collapsedCount = 0;
      allPanels.forEach(otherPanel => {
        const otherPanelId = otherPanel.dataset?.panelId || otherPanel.id;
        if (otherPanelId !== panelId) {
          const otherDetails = otherPanel.querySelector('details');
          if (otherDetails && otherDetails.open) {
            otherDetails.open = false;
            collapsedCount++;
          }
        }
      });

      if (collapsedCount > 0) {
        console.log(`[Accordion] Collapsed ${collapsedCount} panels, keeping ${panelId} open`);
      }
    }
  }, true); // Use capture since toggle event doesn't bubble

  // Single click on panel title: focus panel (expand if collapsed)
  document.addEventListener('click', (e) => {
    const titleElement = e.target.closest('.panel-title');
    if (titleElement) {
      // Try legacy data-panel-id, then find from tree parent
      let panelId = titleElement.dataset.panelId;
      if (!panelId) {
        const levelPanel = titleElement.closest('.level-panel');
        panelId = levelPanel?.dataset?.panelId || levelPanel?.id;
      }
      if (!panelId) return;

      // Single click always just brings to focus (doesn't enable editing)
      bringPanelToFront(panelId);
    }
  });

  // Double-click on panel title: enable editing (select all text)
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

  // Save title on blur (clicking away)
  document.addEventListener('blur', (e) => {
    const titleElement = e.target.closest('.panel-title');
    if (titleElement) {
      // Try legacy data-panel-id, then find from tree parent
      let panelId = titleElement.dataset.panelId;
      if (!panelId) {
        const levelPanel = titleElement.closest('.level-panel');
        panelId = levelPanel?.dataset?.panelId || levelPanel?.id;
      }
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

          // Story 8.3: Debounced WebSocket broadcast for title changes
          if (titleBroadcastTimers[panelId]) {
            clearTimeout(titleBroadcastTimers[panelId]);
          }

          titleBroadcastTimers[panelId] = setTimeout(() => {
            if (wsIsConnected()) {
              wsSend(MESSAGE_TYPES.PANEL_RENAMED, {
                id: panelId,
                newTitle: panel.title,
                timestamp: Date.now()
              });
              console.log(`[WebSocket] Broadcasted panel_renamed: ${panelId}`);
            }
            delete titleBroadcastTimers[panelId];
          }, 500); // 500ms debounce
        }
      } else {
        // Revert to previous title if empty
        titleElement.textContent = panel.title;
      }
    }
  }, true); // Use capture phase for blur events

  // Save title on Enter key press
  document.addEventListener('keydown', (e) => {
    const titleElement = e.target.closest('.panel-title');
    if (titleElement && e.key === 'Enter') {
      e.preventDefault(); // Prevent line break
      titleElement.blur(); // Trigger save via blur event
    }
  });

  // Use event delegation for Delete button clicks (supports dynamic panels)
  document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn && deleteBtn.dataset.panel) {
      const panelId = deleteBtn.dataset.panel;

      // Get panel info for logging
      const panel = getPanel(panelId);
      if (!panel) {
        console.warn(`Panel ${panelId} not found`);
        return;
      }

      console.log(`Attempting to delete panel '${panel.title}' (${panelId})`);

      // Check if confirmation is needed
      const settings = getSettings();
      const needsConfirmation = !settings.yolo && settings.behavior?.confirmationDialogs !== false;

      let confirmed = true;
      if (needsConfirmation) {
        // Import and show non-blocking confirmation modal (audio continues)
        const { showConfirmModal } = await import('./ui/confirmModal.js');
        confirmed = await showConfirmModal(
          'Are you sure you want to delete this panel?',
          { confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
        );

        if (!confirmed) {
          console.log('Panel deletion cancelled by user');
          return;
        }
      }

      // User confirmed (or YOLO mode) - now stop audio and delete
      if (cardStates[panelId] && cardStates[panelId].playing) {
        try {
          // Use tracked pattern ID (handles .d1, .p1, etc.)
          const patternId = cardStates[panelId].patternId || panelId;
          strudelCore.evaluate(`silence.p('${patternId}')`, false, false);
          cardStates[panelId].playing = false;
          console.log(`Stopped audio for panel ${panelId} (pattern ID: ${patternId})`);
        } catch (error) {
          console.error(`Failed to silence panel ${panelId}:`, error);
        }
      }

      // Update button state before DOM removal
      const activateBtn = document.querySelector(`#${panelId} .activate-btn`);
      const pauseBtn = document.querySelector(`#${panelId} .pause-btn`);
      if (activateBtn && pauseBtn) {
        activateBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
      }

      // Clean up highlighting data before panel deletion
      panelMiniLocations.delete(panelId);

      // Delete panel (skip confirmation since we already handled it)
      const deleted = deletePanel(panelId, null, cardStates, true);

      // Story 8.2: Broadcast panel_deleted event to remote clients
      if (deleted && wsIsConnected()) {
        wsSend(MESSAGE_TYPES.PANEL_DELETED, {
          panel: panelId,
          timestamp: Date.now()
        });
        console.log(`[WebSocket] Broadcasted panel_deleted: ${panelId}`);
      }
    }
  });

  // Track drag state to prevent focus loss on text selection drag
  let isDragging = false;
  let dragStartTime = 0;

  document.addEventListener('mousedown', () => {
    isDragging = false;
    dragStartTime = Date.now();
  });

  document.addEventListener('mousemove', (e) => {
    // Only consider it a drag if mouse button is pressed
    if (e.buttons > 0 && Date.now() - dragStartTime > 100) {
      isDragging = true;
    }
  });

  document.addEventListener('mouseup', () => {
    // Reset drag state after a short delay
    setTimeout(() => {
      isDragging = false;
    }, 50);
  });

  // Bring-to-front on panel click (Story 2.4)
  // Also expand collapsed panels when clicked
  document.addEventListener('click', (e) => {
    // Ignore clicks that were actually drag releases
    if (isDragging) {
      console.log('[Click] Ignoring click - was a drag operation');
      return;
    }

    // Support both tree layout (.level-panel) and legacy (.card, #master-panel)
    const panel = e.target.closest('.level-panel, .card, #master-panel');
    if (panel) {
      // Get panelId from data attribute (tree) or id (legacy)
      const panelId = panel.dataset?.panelId || panel.id;

      // Check if click was on interactive elements (both tree and legacy classes)
      const clickedInteractive = e.target.closest(
        '.pause-btn, .activate-btn, .delete-btn, .control-btn, ' +
        '.btn-play, .btn-stop, .btn-delete, .panel-actions button, ' +
        'input[type="range"], summary'
      );

      if (clickedInteractive) {
        // For collapsed panels, allow button interaction without expanding
        if (panel.classList.contains('panel-collapsed')) {
          // Don't expand, don't bring to front - just let button work
          return;
        }
        // For expanded panels, ignore for bring-to-front but don't expand
        return;
      }

      // NEW SYSTEM: Toggle editor in/out of screen
      const editorView = editorViews.get(panelId);
      const settings = getSettings();

      if (editorView) {
        const alreadyInScreen = isEditorInScreen(panelId);

        if (alreadyInScreen) {
          // Remove from screen (toggle off)
          removeEditorFromScreen(panelId, getEditorContainer(panelId));
          console.log(`[Click] Removed panel ${panelId} from screen`);
        } else {
          // Add to screen (toggle on)
          if (settings.collapseOnBlur) {
            // Remove other editors first, then show this one
            removeAllEditorsExcept(panelId, editorViews, getEditorContainer).then(() => {
              moveEditorToScreen(panelId, editorView, settings.default_w);
            });
          } else {
            // Just add to screen (stacks with others)
            moveEditorToScreen(panelId, editorView, settings.default_w);
          }
          console.log(`[Click] Added panel ${panelId} to screen`);
        }
      }

      bringPanelToFront(panelId);
    } else {
      // Click on empty space (not on any panel) - bring master panel to focus
      if (e.target === document.body || e.target.classList.contains('container')) {
        bringPanelToFront(MASTER_PANEL_ID);
        console.log('[Click] Empty space clicked - bringing master panel to focus');
      }
    }
  });
}

// NOTE: The following functions are now imported from extracted modules:
// - checkStaleness, isPanelStale, validateCode, displayError, clearErrorMessage, attachValidationListener
//   from ./panels/panelValidation.js
// - handleEditorChange, createEditorView, updateAllEditorFontSizes, setUpdateAllButtonRef
//   from ./panels/panelEditor.js
// - updateActivateButton, updatePauseButton, updatePlaybackButton, updatePanelButtons,
//   updateVisualIndicators, updateMasterControlsVisibility, setMasterSlidersRef
//   from ./panels/panelUI.js

// =====================
// Code Formatting (kept in main.js - not performance critical)
// =====================

/**
 * Custom formatter that preserves quotes (Prettier replacement)
 * Strudel-safe formatting: only handles spacing/indentation, never touches quotes
 * @param {string} code - Code to format
 * @returns {string} Formatted code
 */
function formatCodeCustom(code) {
  // Split into lines for processing
  let lines = code.split('\n');
  let formatted = [];
  let indentLevel = 0;
  const indentSize = 2;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      formatted.push('');
      continue;
    }

    // Decrease indent for closing brackets/braces/parens
    if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Apply indentation
    const indent = ' '.repeat(indentLevel * indentSize);
    formatted.push(indent + line);

    // Increase indent after opening brackets/braces/parens
    // Count opening and closing to handle inline structures like {a: 1}
    const opens = (line.match(/[{[(]/g) || []).length;
    const closes = (line.match(/[}\])]/g) || []).length;
    indentLevel = Math.max(0, indentLevel + opens - closes);
  }

  return formatted.join('\n');
}

/**
 * Format code using custom quote-preserving formatter
 * Story 7.4: Auto-Formatting on Play/Update
 * @param {string} code - Code to format
 * @returns {Promise<string>} Formatted code or original code if formatting fails
 */
async function formatCode(code) {
  try {
    // Use custom formatter that preserves quotes
    // Strudel uses quotes semantically:
    //   - Single quotes 'bd hh' = mini notation (pattern strings)
    //   - Double quotes "c2 e3" = note strings
    //
    // Custom formatter only handles indentation/spacing, never touches quotes
    const formatted = formatCodeCustom(code);
    return formatted;
  } catch (error) {
    // Graceful degradation: return original code if formatting fails
    console.warn('Code formatting failed, using original code:', error);
    return code;
  }
}

/**
 * Pause panel (stop audio without losing code)
 * Story 6.2: Separate PAUSE and ACTIVATE Buttons
 * @param {string} panelId - Panel ID
 */
function pausePanel(panelId) {
  const panel = cardStates[panelId];
  if (!panel || !panel.playing) return;

  // Use tracked pattern ID (handles .d1, .p1, etc.)
  const patternId = panel.patternId || panelId;

  // Stop audio by replacing with silence
  try {
    strudelCore.evaluate(`silence.p('${patternId}')`, true, false);
    console.log(`Panel ${panelId}: Paused (pattern ID: ${patternId})`);
  } catch (error) {
    console.error(`Panel ${panelId}: Pause error`, error);
  }

  // Update state
  panel.playing = false;
  panel.stale = false; // Clear staleness (no running pattern)
  updatePanel(panelId, { stale: false }); // Sync to panelManager

  // Clear miniLocations and highlighting when paused
  panelMiniLocations.delete(panelId);
  const view = editorViews.get(panelId);
  if (view) {
    updateMiniLocations(view, []); // Clear decorations
  }

  // Clear panel sliders when paused
  const slidersContainer = document.getElementById(`sliders-${panelId}`);
  if (slidersContainer) {
    slidersContainer.innerHTML = '';
  }

  // Stop visualization animation and clear canvas
  console.log('[VIZ PAUSE] Stopping visualization for', panelId);
  if (window.cleanupDraw) {
    console.log('[VIZ PAUSE] Calling cleanupDraw with id:', panelId);
    // Stop animations for both in-panel and full-page visualizations
    window.cleanupDraw(false, panelId); // Matches panelId-0, panelId-1, panelId-fullpage-0, etc.

    // Check if any other panels have active full-page visualizations
    const otherPlayingPanels = Object.entries(cardStates)
      .filter(([id, state]) => id !== panelId && state.playing)
      .length;

    // If no other panels are playing, clear the full-page canvas
    if (otherPlayingPanels === 0) {
      console.log('[VIZ PAUSE] No other panels playing, clearing full-page canvas');
      window.cleanupDraw(true); // Clear screen, no id filter
    }
  } else {
    console.warn('[VIZ PAUSE] cleanupDraw not available');
  }

  // Clear visualization canvases
  const container = document.getElementById(`viz-container-${panelId}`);
  console.log('[VIZ PAUSE] Container element:', container);
  if (container) {
    // Clear all canvas elements in the container
    const canvases = container.querySelectorAll('.visualization-canvas');
    console.log(`[VIZ PAUSE] Clearing ${canvases.length} canvases`);
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Hide and clear the container
    container.style.display = 'none';
    container.innerHTML = '';
  }

  // Clean up global context references
  console.log('[VIZ PAUSE] Deleting context references');
  delete window.visualizationContexts[panelId];

  // Clear slider VALUES from sliderValues object
  const panelSlidersData = getPanelSliders(panelId);
  if (panelSlidersData) {
    panelSlidersData.forEach(({ sliderId }) => {
      delete sliderValues[sliderId];
    });
  }

  // Clear slider data for this panel using sliderManager
  smClearSliders(panelId);

  // Broadcast empty sliders to remote
  broadcastPanelSliders(panelId, []);

  // Update UI (Story 6.3: includes visual indicators)
  updateVisualIndicators(panelId);

  // Notify metronome of state change
  window.dispatchEvent(new CustomEvent('panel-state-changed'));

  // Update UPDATE ALL button state (Story 6.4)
  updateAllButton();

  // Broadcast state change to remote clients
  broadcastState();
}

/**
 * Activate panel (evaluate code and start audio)
 * Story 6.2: Separate PAUSE and ACTIVATE Buttons
 * @param {string} panelId - Panel ID
 */
async function activatePanel(panelId) {
  // Check if Strudel is initialized
  if (!strudelCore.evaluate || !strudelCore.scheduler) {
    alert('Strudel is still initializing. Please wait a moment and try again.');
    return;
  }

  const panel = cardStates[panelId];
  const view = editorViews.get(panelId);

  if (!panel || !view) return;

  // Get pattern code from EditorView
  let patternCode = view.state.doc.toString().trim();

  if (!patternCode) {
    console.warn(`Panel ${panelId}: No pattern code to evaluate`);
    return;
  }

  // Warn if samples aren't ready (for patterns using s() function)
  if (!appState.samplesReady && patternCode.includes('s(')) {
    console.warn('Samples may still be loading - you might hear errors until they finish downloading');
  }

  // Start/resume audio context (required for browser autoplay policies)
  ctx.resume();

  try {
    // Check if pattern highlighting should be enabled
    const currentSettings = getSettings();
    const shouldHighlight = panelId !== MASTER_PANEL_ID && currentSettings.pattern_highlighting;

    // Transpile to extract widget metadata (addReturn: false to get expression not statement)
    let { output, widgets, miniLocations } = transpiler(patternCode, {
      addReturn: false,
      emitMiniLocations: shouldHighlight  // Only emit if highlighting enabled
    });

    // Store miniLocations and update editor decorations for pattern highlighting
    if (shouldHighlight) {
      panelMiniLocations.set(panelId, miniLocations || []);
      updateMiniLocations(view, miniLocations || []);
    }

    // Story 7.4: Auto-format code if enabled (skip master panel)
    // Format AFTER transpilation so user can see the formatted result
    if (panelId !== MASTER_PANEL_ID && currentSettings.auto_format) {
      const formattedCode = await formatCode(patternCode);
      // Update EditorView with formatted code for visual feedback
      const codeChanged = formattedCode !== patternCode;
      if (codeChanged) {
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: formattedCode
          }
        });
        console.log(`[AUTO-FORMAT] Code changed:\nBefore: ${patternCode}\nAfter: ${formattedCode}`);
      } else {
        console.log(`[AUTO-FORMAT] No changes needed - code already formatted`);
      }
    }

    // Remove trailing semicolon if present (escodegen adds them)
    output = output.trim().replace(/;$/, '');

    // Check if code uses labeled statements ($:) or named patterns (.d1, .p1, etc.)
    const hasLabeledStatements = output.includes(".p('$')");
    const hasNamedPattern = /\.(p|d|q)\(|\.(?:p|d|q)\d+\s*$/.test(output);

    // Extract pattern ID if user is manually registering
    let userPatternId = null;
    if (hasNamedPattern) {
      // Match: .p('id'), .p("id"), .p(id), .d1, .p2, etc.
      const idMatch = output.match(/\.(p|d|q)\((['"']?)([^'")]+)\2\)|\.([pdq])(\d+)/);
      if (idMatch) {
        userPatternId = idMatch[3] || idMatch[5]; // Quoted ID or numeric shortcut
      }
    }

    // Fix labeled statements: replace .p('$') with .p('panelId')
    // This ensures $: patterns register to the same panel ID
    if (hasLabeledStatements) {
      output = output.replace(/\.p\(['"]?\$['"]?\)/g, `.p('${panelId}')`);
      userPatternId = panelId; // Track that we've mapped $ to panelId
    }

    // Store which pattern ID this panel is using (for pause button)
    if (userPatternId) {
      cardStates[panelId].patternId = userPatternId;
      console.log(`[PATTERN ID] Panel ${panelId} using pattern ID: ${userPatternId}`);
    } else {
      cardStates[panelId].patternId = panelId; // Default to panel ID
    }

    // Render sliders from widget metadata (uses sliderManager)
    smRenderSliders(panelId, widgets, patternCode);

    // console.log(`Transpiled code for ${panelId}:`, output);

    // Evaluate transpiled code with unique ID using .p() method
    // Only append .p(panelId) if code doesn't use labeled statements
    // (labeled statements already have .p() calls)
    // Story 7.3: Intercept console.error to detect Strudel evaluation errors
    let evaluationError = null;
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Capture first error during evaluation
      if (!evaluationError && args[0]) {
        // Handle Error objects and strings
        if (args[0] instanceof Error) {
          evaluationError = args[0].message;
        } else if (typeof args[0] === 'string') {
          evaluationError = args.join(' ');
        } else {
          evaluationError = String(args[0]);
        }
      }
      originalConsoleError(...args); // Still log to console
    };

    let evalResult;
    try {
      // console.log('[VIZ DEBUG] ========== START ACTIVATION FOR', panelId, '==========');
      // console.log('[VIZ DEBUG] Transpiled code:', output);

      // Pre-process pattern code to detect visualizations BEFORE canvas setup
      let patternCode = output;

      // Replace punchcard variants with pianoroll equivalents
      patternCode = patternCode.replace(/\.punchcard\(/g, '.pianoroll(');
      patternCode = patternCode.replace(/\._punchcard\(/g, '._pianoroll(');

      // Detect UNDERSCORE-prefixed viz methods for IN-PANEL rendering
      // Non-underscore methods (.pianoroll, .scope) use Strudel's full-page behavior
      const vizMethodRegex = /\._(pianoroll|scope|tscope|fscope|spectrum)\(/g;
      const vizMethodMatches = [...patternCode.matchAll(vizMethodRegex)];
      const detectedVizMethods = vizMethodMatches.map(m => m[1]);
      const hasVisualization = detectedVizMethods.length > 0;

      // console.log('[VIZ DEBUG] Detected underscore viz methods:', detectedVizMethods, 'hasVisualization:', hasVisualization);

      // Get container element
      const container = document.getElementById(`viz-container-${panelId}`);
      // console.log('[VIZ DEBUG] Container element found:', container);

      if (hasVisualization && container) {
        // Show the container
        container.style.display = 'flex';

        // Tree layout: also show the parent leaf-viz element
        const leafViz = container.closest('.leaf-viz');
        if (leafViz) {
          leafViz.style.display = '';
        }

        // Clear existing canvases
        container.innerHTML = '';

        // Create canvas element for each visualization method
        const contexts = [];

        detectedVizMethods.forEach((method, index) => {
          const canvas = document.createElement('canvas');
          canvas.id = `viz-${panelId}-${index}`;
          canvas.className = 'visualization-canvas';
          container.appendChild(canvas);

          // Force reflow to ensure canvas is in DOM
          void canvas.offsetHeight;

          // Get dimensions from container layout
          const rect = canvas.getBoundingClientRect();
          const width = rect.width > 0 ? rect.width : 200; // Fallback to 200 if layout not ready
          const height = rect.height > 0 ? rect.height : 50; // Fallback to 50 if layout not ready

          // Set canvas internal dimensions
          canvas.width = width;
          canvas.height = height;

          // Get context and store
          const ctx = canvas.getContext('2d');
          contexts.push(ctx);

          // console.log(`[VIZ DEBUG] Created canvas ${index} for ${method}:`, canvas.id, `(${canvas.width}x${canvas.height})`);
        });

        // Store contexts array
        window.visualizationContexts[panelId] = contexts;
        // console.log(`[VIZ DEBUG] Stored ${contexts.length} contexts for ${panelId}`);
      } else if (!hasVisualization && container) {
        // Hide container if no visualizations
        container.style.display = 'none';
        container.innerHTML = '';

        // Tree layout: also hide the parent leaf-viz element
        const leafViz = container.closest('.leaf-viz');
        if (leafViz) {
          leafViz.style.display = 'none';
        }
      }

      if (hasLabeledStatements || hasNamedPattern) {
        // User already registered pattern - evaluate without auto-appending .p(panelId)
        evalResult = await strudelCore.evaluate(output, true, false);
      } else {
        // Inject panel canvas contexts into visualization calls in user code

        if (hasVisualization && window.visualizationContexts[panelId]) {
          const contexts = window.visualizationContexts[panelId];
          // console.log('[VIZ DEBUG] Injecting contexts into pattern code, contexts:', contexts);

          // Replace ALL visualization methods in order of appearance
          let contextIndex = 0;

          // Sanitize panel ID for use in variable names (replace dashes with underscores)
          const safePanelId = panelId.replace(/-/g, '_');

          // Make all contexts available as globals
          contexts.forEach((ctx, i) => {
            window[`__viz_${safePanelId}_${i}`] = ctx;
            // console.log(`[VIZ DEBUG] Set global __viz_${safePanelId}_${i}:`, ctx, 'canvas:', ctx?.canvas?.width, 'x', ctx?.canvas?.height);
          });

          // Create a combined regex that matches UNDERSCORE-prefixed viz methods only
          // These get panel canvas injection; non-underscore methods use full-page rendering
          // The transpiler converts ._pianoroll() to ._pianoroll('_widget__pianoroll_0') so we must handle:
          //   - Empty args: ._pianoroll()
          //   - String arg: ._pianoroll('...')
          //   - Object arg: ._pianoroll({ ... })
          const allVizMethodsRegex = /\._(pianoroll|scope|tscope|fscope|spectrum)\(('[^']*'|"[^"]*"|\s*\{[^}]*\})?\s*\)/g;

          patternCode = patternCode.replace(allVizMethodsRegex, (match, method, existingArg) => {
            // Use the context at the current index
            const ctxIdx = contextIndex;
            contextIndex++;

            // console.log(`[VIZ DEBUG] Replacing ._${method}() with context index ${ctxIdx}, match:`, match);

            // Check if existingArg is an object (starts with {) or string (starts with ' or ")
            if (existingArg && existingArg.trim().startsWith('{')) {
              // Object options - merge our ctx and id
              const opts = existingArg.trim().slice(1, -1);
              return `.tag('${panelId}-${ctxIdx}').${method}({ ctx: __viz_${safePanelId}_${ctxIdx}, id: '${panelId}-${ctxIdx}', ${opts} })`;
            } else {
              // No args or string widget ID (ignore the widget ID, we use our own id)
              return `.tag('${panelId}-${ctxIdx}').${method}({ ctx: __viz_${safePanelId}_${ctxIdx}, id: '${panelId}-${ctxIdx}' })`;
            }
          });

          // console.log('[VIZ DEBUG] Pattern code after ctx injection:', patternCode);
          // console.log(`[VIZ DEBUG] Replaced ${contextIndex} total visualization calls`);
        }

        // Inject panel-based tags AND IDs into NON-underscore viz methods (full-page rendering)
        // .tag() is required because pianoroll/scope filter haps to only show those with matching tag
        // The id ensures cleanupDraw(panelId) can find and stop the animation frames
        const fullPageVizRegex = /\.(pianoroll|scope|tscope|fscope|spectrum)\((\s*\{[^}]*\})?\s*\)/g;
        let fullPageIndex = 0;
        patternCode = patternCode.replace(fullPageVizRegex, (match, method, existingOptions) => {
          // Skip if this was already processed (has ctx: or tag: injected)
          if (existingOptions && (existingOptions.includes('ctx:') || existingOptions.includes('tag('))) {
            return match; // Leave unchanged
          }
          const idx = fullPageIndex++;
          const tagId = `${panelId}-fullpage-${idx}`;
          if (existingOptions) {
            // Merge id into existing options
            const opts = existingOptions.trim().slice(1, -1);
            return `.tag('${tagId}').${method}({ id: '${tagId}', ${opts} })`;
          } else {
            return `.tag('${tagId}').${method}({ id: '${tagId}' })`;
          }
        });

        // Evaluate pattern
        // console.log('[VIZ DEBUG] Final pattern code:', patternCode);
        // console.log('[VIZ DEBUG] About to evaluate:', `${patternCode}.p('${panelId}')`);
        evalResult = await strudelCore.evaluate(`${patternCode}.p('${panelId}')`, true, false);
        // console.log('[VIZ DEBUG] Evaluation complete');

        // Clean up temp globals
        if (hasVisualization && window.visualizationContexts[panelId]) {
          const safePanelId = panelId.replace(/-/g, '_');
          window.visualizationContexts[panelId].forEach((_, i) => {
            delete window[`__viz_${safePanelId}_${i}`];
          });
        }
      }

      // Story 7.3: Wait a moment for any async errors to be logged
      await new Promise(resolve => setTimeout(resolve, 50));
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }

    // Story 7.3: Check if evaluation failed
    // Strudel logs errors via console.error but doesn't throw/reject
    if (evaluationError || (evalResult && evalResult.error)) {
      let errorMessage = evaluationError ||
        (evalResult && evalResult.error && evalResult.error.message) ||
        'Pattern evaluation failed';

      // Clean up error message for better readability
      if (errorMessage.includes('is not a function')) {
        const match = errorMessage.match(/\.(\w+)\s+is not a function/);
        if (match) {
          errorMessage = `Method '.${match[1]}()' is not a function`;
        }
      } else if (errorMessage.includes('Cannot read properties of undefined')) {
        const match = errorMessage.match(/reading '([^']+)'/);
        if (match) {
          errorMessage = `Property '${match[1]}' is undefined`;
        }
      } else if (errorMessage.toLowerCase().includes('piano') || errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('unknown sound')) {
        // Helpful hint for common piano/soundfont issues
        errorMessage = `${errorMessage}\n\n💡 Tip: For piano sounds, use:\n  • s('piano') or sound('piano') for General MIDI piano\n  • s('gm_acoustic_grand_piano') for specific GM instrument\n  • note("c3 e3 g3").s('piano') for melody`;
      }

      // Display error in validation UI
      displayError(panelId, errorMessage, 'unknown');

      // Clean up: stop any partial pattern that might have been registered
      try {
        strudelCore.scheduler.stop(panelId);
      } catch (stopError) {
        // Ignore errors if pattern wasn't registered
      }

      // Keep panel in paused state
      panel.playing = false;
      panel.stale = false;
      updateVisualIndicators(panelId);

      console.error(`Panel ${panelId}: Playback error - ${errorMessage}`);
      return; // Exit early, don't mark as playing
    }

    // Update state
    panel.playing = true;
    panel.stale = false;
    panel.lastEvaluatedCode = patternCode;
    updatePanel(panelId, { stale: false, lastEvaluatedCode: patternCode }); // Sync to panelManager

    // Register pattern globally under panel's sanitized title
    // e.g., panel titled "Bass" → window.BASS = pattern
    if (evalResult && panelId !== MASTER_PANEL_ID) {
      registerPanelPattern(panelId, evalResult);
      // Cascade re-evaluate any playing panels below this one
      await cascadeReEvaluate(panelId);
    }

    // Story 7.3: Clear any previous error messages on successful playback
    clearErrorMessage(panelId);

    // Update UI (Story 6.3: includes visual indicators)
    updateVisualIndicators(panelId);

    // Notify metronome of state change
    window.dispatchEvent(new CustomEvent('panel-state-changed'));

    // Bring panel to front (Story 8.5: z-index on play)
    // UNLESS panel is collapsed - then keep it collapsed and unfocused
    const panelElement = document.getElementById(panelId);
    if (panelElement && !panelElement.classList.contains('panel-collapsed')) {
      bringPanelToFront(panelId);
    }

    // Update UPDATE ALL button state (Story 6.4)
    updateAllButton();

    // console.log(`Panel ${panelId}: ${panel.stale ? 'Updated' : 'Activated'}`);

    // Broadcast state change to remote clients
    broadcastState();
  } catch (error) {
    console.error(`Panel ${panelId}: Pattern evaluation error`, error);
    // Story 7.3: Show error in validation UI instead of alert
    displayError(panelId, error.message || 'Unknown error', 'unknown');
  }
}

/**
 * Story 6.4: Get array of stale panel IDs
 * @returns {string[]} Array of panel IDs with stale=true
 */
function getStalePanels() {
  return Object.entries(cardStates)
    .filter(([id, state]) => state.stale === true)
    .map(([id]) => id);
}

/**
 * Story 6.4: Update UPDATE ALL button enabled/disabled state
 * Shows count of stale panels in button text
 * Debounced to prevent excessive calls during typing
 */
let updateAllButtonTimer;
function updateAllButton() {
  // Debounce to reduce frequency during fast typing
  clearTimeout(updateAllButtonTimer);
  updateAllButtonTimer = setTimeout(() => {
    const button = document.getElementById('update-all-btn');
    if (!button) return;

    const stalePanels = getStalePanels();
    const count = stalePanels.length;

    // Enable/disable based on stale panel count
    button.disabled = count === 0;
    button.classList.remove('updating');

    // Update count badge if present
    const badge = button.querySelector('.count-badge');
    if (badge) {
      badge.textContent = count > 0 ? count : '';
      badge.style.display = count > 0 ? 'flex' : 'none';
    }

    // Broadcast state to remote clients (includes stale state)
    broadcastState();
  }, 500); // Update button state 500ms after last keystroke
}

/**
 * Story 6.4: Update all stale panels sequentially with visual feedback
 * Calls activatePanel() for each stale panel with 50ms delay between updates
 */
async function updateAllPanels() {
  const stalePanels = getStalePanels();

  if (stalePanels.length === 0) {
    console.log('No stale panels to update');
    return;
  }

  console.log(`Updating ${stalePanels.length} stale panel(s):`, stalePanels);

  // Disable button during batch update
  const button = document.getElementById('update-all-btn');
  if (button) {
    button.disabled = true;
    button.classList.add('updating');
  }

  // Update each panel with visual feedback
  for (const panelId of stalePanels) {
    // Add flash effect
    const panelElement = document.getElementById(panelId);
    if (panelElement) {
      panelElement.classList.add('panel-updating');
    }

    // Activate panel (evaluate code and start audio)
    await activatePanel(panelId);

    // Remove flash effect after brief delay
    setTimeout(() => {
      if (panelElement) {
        panelElement.classList.remove('panel-updating');
      }
    }, 300);

    // Small delay between panels (prevent audio glitches)
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Re-enable button after batch completes
  updateAllButton();

  console.log('Batch update complete');
}

// Stop all patterns and reset all cards to paused state
function stopAll() {
  if (!scheduler) {
    console.warn('Scheduler not initialized');
    return;
  }

  // Pause each panel individually to ensure proper cleanup
  // (clears sliders, visualizations, highlighting, etc.)
  Object.keys(cardStates).forEach((cardId) => {
    if (cardStates[cardId].playing) {
      pausePanel(cardId);
    }
  });

  // Stop scheduler after all panels are paused
  strudelCore.scheduler.stop();

  console.log('⏹ All patterns stopped');

  // Broadcast state to remote clients
  broadcastState();
}

// Initialize WebSocket connection for remote control
// Uses websocketManager for connection, wires eventBus listeners for incoming events
function initializeWebSocket() {
  // Wire up eventBus listeners for incoming WebSocket events
  wireWebSocketEventListeners();

  // Connect using websocketManager (handles reconnect automatically)
  wsConnect();
}

// Wire up all eventBus listeners for WebSocket events from websocketManager
function wireWebSocketEventListeners() {
  // Connection event - sync panels when connected
  eventBus.on('websocket:connected', () => {
    // Sync all panels to server
    const allPanels = getAllPanels();
    const panelsArray = Array.from(allPanels.values()).map(panel => ({
      id: panel.id,
      title: panel.title,
      code: panel.code,
      position: panel.position,
      size: panel.size,
      playing: panel.playing || false,
      zIndex: panel.zIndex
    }));
    syncPanelState(panelsArray);
    console.log(`[WebSocket] Synced ${panelsArray.length} panels to server`);
  });

  // Server requests full state
  eventBus.on('websocket:requestState', () => {
    console.log('[WebSocket] Server requested full_state');
    const allPanels = getAllPanels();
    const fullStatePanels = Array.from(allPanels.values()).map(panel => ({
      id: panel.id,
      title: panel.title,
      playing: cardStates[panel.id]?.playing || false,
      stale: cardStates[panel.id]?.stale || false,
      position: panel.position || 0
    }));
    sendFullState({ panels: fullStatePanels, timestamp: Date.now() });

    // Also send current master sliders
    if (currentMasterSliders.length > 0) {
      broadcastSliders(currentMasterSliders);
      console.log(`[WebSocket] Sent master sliders: ${currentMasterSliders.length} sliders`);
    }
  });

  // Panel toggle (remote control)
  eventBus.on('panel:toggle', (panel) => {
    if (panel && cardStates[panel]) {
      if (cardStates[panel].playing) {
        pausePanel(panel);
      } else {
        activatePanel(panel);
      }
    }
  });

  // Panel play (remote control)
  eventBus.on('panel:remotePlay', (panel) => {
    if (panel && cardStates[panel] && !cardStates[panel].playing) {
      activatePanel(panel);
    }
  });

  // Panel pause (remote control)
  eventBus.on('panel:remotePause', (panel) => {
    if (panel && cardStates[panel] && cardStates[panel].playing) {
      pausePanel(panel);
    }
  });

  // Global stop all
  eventBus.on('global:stopAll', () => {
    stopAll();
  });

  // Global update all
  eventBus.on('global:updateAll', () => {
    updateAllPanels();
  });

  // Master slider remote change
  eventBus.on('slider:masterRemoteChange', ({ sliderId, value }) => {
    updateSliderValue(sliderId, value);
  });

  // Panel slider remote change
  eventBus.on('slider:panelRemoteChange', ({ panelId, sliderId, value }) => {
    smUpdateSliderValue(panelId, sliderId, value);
  });

  // API: Panel created
  eventBus.on('panel:apiCreated', async ({ panelId, title, code, position, size }) => {
    console.log(`[WebSocket] Panel created via API: ${panelId}`);

    // Check if panel already exists
    if (document.getElementById(panelId)) {
      console.log(`[WebSocket] Panel ${panelId} already exists, skipping`);
      return;
    }

    // Create panel
    const newPanelId = createPanel({
      id: panelId,
      title: title,
      code: code || '',
      position: position || { x: 0, y: 0 },
      size: size || { w: 600, h: 200 }
    });

    // Render panel
    const panelElement = renderPanel(newPanelId);

    // Initialize state
    cardStates[newPanelId] = { playing: false, stale: false, lastEvaluatedCode: '' };

    // Initialize CodeMirror editor (critical for API-created panels)
    const container = getPanelEditorContainer(newPanelId);
    if (container) {
      const view = createEditorView(container, {
        initialCode: code || '',
        onChange: handleEditorChange,
        panelId: newPanelId,
      });
      editorViews.set(newPanelId, view);
      console.log(`[WebSocket] CodeMirror initialized for API panel: ${newPanelId}`);
    }

    updateVisualIndicators(newPanelId);
    attachValidationListener(newPanelId);

    // Validate
    setTimeout(async () => {
      const validation = await validateCode(newPanelId);
      await updateActivateButton(newPanelId);
      if (!validation.valid) {
        displayError(newPanelId, validation.error, validation.line);
      }
    }, 0);

    console.log(`[WebSocket] Panel ${newPanelId} rendered in UI`);
  });

  // API: Panel deleted
  eventBus.on('panel:apiDeleted', ({ panelId }) => {
    console.log(`[WebSocket] Panel deleted via API: ${panelId}`);

    // Stop audio if playing
    if (cardStates[panelId]?.playing) {
      try {
        // Use tracked pattern ID (handles .d1, .p1, etc.)
        const patternId = cardStates[panelId].patternId || panelId;
        strudelCore.evaluate(`silence.p('${patternId}')`, false, false);
        cardStates[panelId].playing = false;
        console.log(`[API] Stopped audio for panel ${panelId} (pattern ID: ${patternId})`);
      } catch (error) {
        console.error(`Failed to silence panel ${panelId}:`, error);
      }
    }

    // Clean up
    panelMiniLocations.delete(panelId);
    deletePanel(panelId, null, cardStates, true);
    console.log(`[WebSocket] Panel ${panelId} deleted from UI`);
  });

  // API: Panel updated
  eventBus.on('panel:apiUpdated', async ({ panelId, code, autoPlay }) => {
    console.log(`[WebSocket] Panel code updated via API: ${panelId}, autoPlay: ${autoPlay}`);

    // Find editor view
    const view = editorViews.get(panelId);
    if (!view) {
      console.error(`[WebSocket] Panel ${panelId} editor not found`);
      return;
    }

    // Update editor
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: code }
    });

    // Update state
    updatePanel(panelId, { code: code });

    // Validate
    setTimeout(async () => {
      const validation = await validateCode(panelId);
      await updateActivateButton(panelId);
      if (!validation.valid) {
        displayError(panelId, validation.error, validation.line);
      } else {
        clearErrorMessage(panelId);
      }
    }, 0);

    // Auto-play if requested
    if (autoPlay) {
      activatePanel(panelId);
    }
  });

  // API: Playback changed
  eventBus.on('panel:apiPlaybackChanged', ({ panelId, playing }) => {
    console.log(`[WebSocket] Playback changed via API: ${panelId}, playing: ${playing}`);

    if (!cardStates[panelId]) {
      console.error(`[WebSocket] Panel ${panelId} not found`);
      return;
    }

    const currentlyPlaying = cardStates[panelId].playing;
    if (currentlyPlaying === playing) return; // Already in desired state

    if (playing) {
      activatePanel(panelId);
    } else {
      pausePanel(panelId);
    }
  });

  // Legacy: Panel update
  eventBus.on('panel:legacyUpdate', ({ panel, code }) => {
    const cardId = `card-${panel}`;
    const textarea = document.querySelector(`.code-input[data-card="${cardId}"]`);
    if (textarea) {
      textarea.value = code;
      console.log(`[WebSocket] Updated ${cardId} code`);
    }
  });

  console.log('[WebSocket] Event listeners wired');
}

// Broadcast current state to remote clients
function broadcastState() {
  if (!wsIsConnected()) {
    return;
  }

  // Story 8.4: Use actual panel IDs (not legacy panel numbers)
  const panels = Object.keys(cardStates).map(panelId => {
    return {
      panel: panelId,  // Use full panel ID (e.g., panel-1763389957952)
      playing: cardStates[panelId].playing,
      stale: cardStates[panelId].stale || false
    };
  });

  wsSend(MESSAGE_TYPES.STATE_UPDATE, { panels });
}

// initializeMetronome and initializePatternHighlighting moved to visualization.js

// Async initialization to ensure modules load before evaluation (matches official REPL)
async function initializeStrudel() {
  console.log('r0astr initializing...');
  console.log('Loading modules and samples (this may take a few seconds)...');

  // Disable ACTIVATE buttons during loading (Story 6.2)
  document.querySelectorAll('.activate-btn').forEach(btn => {
    btn.disabled = true;
  });

  // Load modules and samples
  const modulesLoading = loadModules();
  const snippetUrl = appSettings?.snippetLocation || '';

  // Load samples in background (non-blocking)
  prebake(snippetUrl).catch(err => console.warn('Background sample loading error:', err));

  // Only await modules (required for REPL)
  await modulesLoading;

  // Create single repl instance shared by all cards
  const replInstance = repl({
    defaultOutput: webaudioOutput,
    getTime: () => ctx.currentTime,
    transpiler,
  });

  strudelCore.evaluate = replInstance.evaluate;
  strudelCore.scheduler = replInstance.scheduler;

  // Expose scheduler globally for master panel functions (e.g., scheduler.now())
  window.scheduler = strudelCore.scheduler;

  // Initialize metronome indicator
  initializeMetronome();

  // Initialize pattern highlighting loop
  initializePatternHighlighting();

  // Store canvas contexts globally for visualization
  window.visualizationContexts = {};

  // Make setCpm globally available for master panel
  // Handle refs returned by sliderWithID
  // Note: Strudel uses CPS (cycles per second), we expose CPM for convenience
  window.setCpm = (cpm) => {
    // If cpm is a ref (function), call it to get the value
    const value = typeof cpm === 'function' ? cpm() : cpm;
    // Convert CPM to CPS: CPM / 60 = CPS
    const cps = value / 60;
    strudelCore.scheduler.setCps(cps);
  };

  appState.samplesReady = true;

  console.log('✓ r0astr ready');
  console.log('  - Piano samples (s("piano"))');
  console.log('  - String samples (s("violin"), s("cello"), etc.)');
  console.log('  - Drum machines (RolandTR909, RolandTR808, uzu, mridangam)');
  console.log('  - Dirt samples (bd, sd, hh, etc.)');
  console.log('  - Soundfonts (s("gm_piano"), s("gm_electric_piano"), etc.)');
  console.log('  - ZZFX sounds (chiptune synths)');
  console.log('  - Synths (sawtooth, square, triangle)');

  // Re-enable ACTIVATE buttons (Story 6.2)
  document.querySelectorAll('.activate-btn').forEach(btn => {
    btn.disabled = false;
  });

  // Evaluate MASTER panel first (defines globals like SCALE, functions, etc.)
  await evaluateMasterCode();

  // Pre-register patterns for cross-panel references IN ORDER (top to bottom)
  // This ensures panels can reference patterns from panels above them
  const panelsInOrder = getPanelsInOrder();
  for (const { panelId } of panelsInOrder) {
    if (panelId && editorViews.has(panelId)) {
      try {
        const validation = await validateCode(panelId);
        await updateActivateButton(panelId);
        if (!validation.valid) {
          displayError(panelId, validation.error, validation.line);
        } else if (validation.pattern) {
          // Pre-register pattern for cross-panel orchestration
          registerPanelPattern(panelId, validation.pattern);
        }
      } catch (error) {
        console.warn(`[Startup] Failed to validate panel ${panelId}:`, error);
      }
    }
  }

  // Initialize WebSocket for remote control
  initializeWebSocket();
}

/**
 * Broadcast panel slider metadata to remote clients
 */
function broadcastPanelSliders(panelId, sliders) {
  if (!wsIsConnected()) {
    return;
  }

  wsSend(MESSAGE_TYPES.PANEL_SLIDERS, { panelId, sliders });
}

/**
 * Broadcast panel slider value change to remote clients
 */
function broadcastPanelSliderValue(panelId, sliderId, value) {
  if (!wsIsConnected()) return;

  wsSend('panel.sliderValue', { panelId, sliderId, value });
}

/**
 * DEPRECATED: toggleCard() function removed in Story 6.2
 *
 * The single Play/Pause toggle button has been replaced with separate
 * PAUSE and ACTIVATE buttons. Use the following functions instead:
 *
 * - pausePanel(panelId) - Stop audio (replaces pause action)
 * - activatePanel(panelId) - Start/update audio (replaces play action)
 * - updatePanelButtons(panelId) - Update button states
 *
 * See Story 6.2: Separate PAUSE and ACTIVATE Buttons for details.
 */

/**
 * Create new panel and focus its editor immediately
 * Used by Cmd+Option++ keyboard shortcut
 */
function createNewPanelAndFocus() {
  // Create new panel using panelManager
  const panelId = createPanel({
    title: `Instrument ${getNextPanelNumber()}`,
    code: '',
    playing: false,
    stale: false,
    lastEvaluatedCode: ''
  });

  // Initialize cardStates for this panel
  cardStates[panelId] = {
    playing: false,
    stale: false,
    lastEvaluatedCode: ''
  };

  // Render panel to DOM
  const panelElement = renderPanel(panelId);

  // Initialize CodeMirror for new panel
  const container = getPanelEditorContainer(panelId);
  if (container) {
    const view = createEditorView(container, {
      initialCode: '',
      onChange: handleEditorChange,
      panelId,
    });
    editorViews.set(panelId, view);
    console.log(`[NEW PANEL] CodeMirror initialized for: ${panelId}`);

    // Focus editor immediately after creation
    setTimeout(() => {
      bringPanelToFront(panelId);

      // Expand details in tree layout
      if (panelElement) {
        const details = panelElement.querySelector('details');
        if (details) {
          details.open = true;
        }
      }

      setTimeout(() => {
        view.focus();
        console.log(`[Keyboard] New panel ${panelId} focused and ready for input`);
      }, 10);
    }, 10);
  }


  // Initialize visual state
  updateVisualIndicators(panelId);

  console.log(`[Keyboard] Created new panel: ${panelId}`);

  // Broadcast panel_created event to remote clients
  const panel = getPanel(panelId);
  if (panel && wsIsConnected()) {
    wsSend(MESSAGE_TYPES.PANEL_CREATED, {
      id: panelId,
      title: panel.title,
      position: getAllPanels().size, // Position in list
      timestamp: Date.now()
    });
    console.log(`[WebSocket] Broadcasted panel_created: ${panelId}`);
  }
}

/**
 * Activate panel by index (0 = master, 1-9 = panels in order)
 * Brings panel to front and focuses its editor
 * If panel is already focused, toggles focus off (blur)
 * @param {number} index - Panel index (0 for master, 1+ for regular panels)
 */
function activatePanelByIndex(index) {
  // Close snippet modal if open (changing focus)
  import('./ui/snippetModal.js').then(({ closeSnippetModal }) => {
    closeSnippetModal();
  });

  // Get all panels in order (master + regular panels sorted by panel number)
  const allPanels = getAllPanels();
  const panelArray = Array.from(allPanels.values()).sort((a, b) => a.number - b.number);

  // Index 0 = master panel
  if (index === 0) {
    const masterPanel = document.getElementById(MASTER_PANEL_ID);
    const masterView = editorViews.get(MASTER_PANEL_ID);

    if (masterPanel && masterView) {
      const currentlyFocused = findFocusedPanel();

      if (isTreeLayout()) {
        // Tree layout: use details expand/collapse
        const isExpanded = isPanelExpanded(MASTER_PANEL_ID);

        if (currentlyFocused === MASTER_PANEL_ID && isExpanded) {
          // Already focused and expanded - collapse
          collapsePanel(MASTER_PANEL_ID);
          console.log('[Keyboard] Collapsed master panel');
          return;
        }

        // Expand and focus
        bringPanelToFront(MASTER_PANEL_ID);
        if (!isExpanded) {
          expandPanel(MASTER_PANEL_ID);
        }
        setTimeout(() => masterView.focus(), 10);
      } else {
        // Legacy layout: use compact class
        const isCompact = masterPanel.classList.contains('compact');

        if (currentlyFocused === MASTER_PANEL_ID && !isCompact) {
          toggleMasterMode();
          console.log('[Keyboard] Toggled master panel to compact (kept focus)');
          return;
        }

        bringPanelToFront(MASTER_PANEL_ID);
        if (isCompact) {
          toggleMasterMode();
        }
        setTimeout(() => masterView.focus(), 10);
      }
    }
    return;
  }

  // Index 1-9 = regular panels
  const panelIndex = index - 1;
  if (panelIndex >= 0 && panelIndex < panelArray.length) {
    const panel = panelArray[panelIndex];
    const panelElement = document.getElementById(panel.id);
    const view = editorViews.get(panel.id);

    if (panel && panelElement && view) {
      const currentlyFocused = findFocusedPanel();
      const settings = getSettings();

      if (isTreeLayout()) {
        // Tree layout: use details expand/collapse
        const isExpanded = isPanelExpanded(panel.id);

        if (currentlyFocused === panel.id && isExpanded) {
          // Already focused and expanded - collapse
          collapsePanel(panel.id);
          view.contentDOM.blur();
          console.log(`[Keyboard] Collapsed panel ${index}:`, panel.id);
          return;
        }

        // Expand and focus
        bringPanelToFront(panel.id);

        if (settings.collapseOnBlur) {
          // Accordion mode: collapse other panels first
          panelArray.forEach(p => {
            if (p.id !== panel.id && isPanelExpanded(p.id)) {
              collapsePanel(p.id);
            }
          });
          // Also collapse master if expanded
          if (isPanelExpanded(MASTER_PANEL_ID)) {
            collapsePanel(MASTER_PANEL_ID);
          }
        }

        if (!isExpanded) {
          expandPanel(panel.id);
        }
        setTimeout(() => view.focus(), 10);
        console.log(`[Keyboard] Activated panel ${index}:`, panel.id, panel.title);
      } else {
        // Legacy layout: use screen system
        const isInScreen = isEditorInScreen(panel.id);

        if (currentlyFocused === panel.id && isInScreen) {
          view.contentDOM.blur();
          removeEditorFromScreen(panel.id, getEditorContainer(panel.id));
          console.log(`[Keyboard] Toggled off panel ${index} (removed from screen):`, panel.id);
          return;
        }

        bringPanelToFront(panel.id);

        if (settings.collapseOnBlur) {
          removeAllEditorsExcept(panel.id, editorViews, getEditorContainer).then(() => {
            moveEditorToScreen(panel.id, view, settings.default_w).then(() => {
              view.focus();
            });
          });
        } else {
          moveEditorToScreen(panel.id, view, settings.default_w).then(() => {
            view.focus();
          });
        }

        console.log(`[Keyboard] Activated panel ${index}:`, panel.id, panel.title);
      }
    }
  } else {
    console.log(`[Keyboard] Panel ${index} does not exist (only ${panelArray.length} panels)`);
  }
}

// NOTE: findFocusedPanel, animateButtonPress, animatePressStart, animatePressRelease
// are now imported from ./ui/keyboard.js

/**
 * Global keyboard shortcuts
 * Cmd+Option+U - Update All stale panels
 * Cmd+Option+. - Stop All panels
 * Cmd+Option+N - Insert snippet
 */
function initializeKeyboardShortcuts() {
  // Track which key was pressed with modifiers for keyup handling
  let pressedKey = null;
  let pressedButton = null;

  console.log('[Keyboard] Registering keydown listener...');

  // Handle keydown for button press animation
  document.addEventListener('keydown', (e) => {
    // Check for Cmd+Option (Mac) or Ctrl+Alt (Windows/Linux)
    const modifier = (e.metaKey || e.ctrlKey) && e.altKey;

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
    // (Keyup doesn't fire for action keys when modifiers are held)
    switch (e.code) {
      case 'KeyU':
        e.preventDefault();
        pressedButton = document.getElementById('update-all-btn');
        if (pressedButton && !pressedButton.disabled) {
          animatePressStart(pressedButton);
          // Trigger action after brief visual feedback
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
        const focusedPanelP = findFocusedPanel();
        if (focusedPanelP) {
          const panel = cardStates[focusedPanelP];
          if (panel) {
            // Try contextual button first (.btn-playback), then legacy buttons
            pressedButton = document.querySelector(`[data-panel-id="${focusedPanelP}"] .btn-playback`) ||
                            document.querySelector(`#${focusedPanelP} .btn-playback`);

            if (!pressedButton) {
              // Fallback to legacy buttons
              if (panel.playing) {
                pressedButton = document.querySelector(`#${focusedPanelP} .pause-btn`) ||
                                document.querySelector(`#${focusedPanelP} .btn-stop`) ||
                                document.querySelector(`[data-panel-id="${focusedPanelP}"] .btn-stop`);
              } else {
                pressedButton = document.querySelector(`#${focusedPanelP} .activate-btn`) ||
                                document.querySelector(`#${focusedPanelP} .btn-play`) ||
                                document.querySelector(`[data-panel-id="${focusedPanelP}"] .btn-play`);
              }
            }

            if (pressedButton) {
              animatePressStart(pressedButton);
              const btnToClick = pressedButton; // Capture in closure
              setTimeout(() => {
                animatePressRelease(btnToClick);
                btnToClick.click();
                console.log('[Keyboard] Toggled playback for panel:', focusedPanelP);
                pressedKey = null;
                pressedButton = null;
              }, 150);
            }
          }
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        const focusedPanelUp = findFocusedPanel();
        if (focusedPanelUp) {
          // Try contextual button first, then legacy
          pressedButton = document.querySelector(`[data-panel-id="${focusedPanelUp}"] .btn-playback`) ||
                          document.querySelector(`#${focusedPanelUp} .btn-playback`) ||
                          document.querySelector(`#${focusedPanelUp} .activate-btn`) ||
                          document.querySelector(`#${focusedPanelUp} .btn-play`) ||
                          document.querySelector(`[data-panel-id="${focusedPanelUp}"] .btn-play`);
          if (pressedButton && !pressedButton.disabled) {
            animatePressStart(pressedButton);
            const btnToClick = pressedButton; // Capture in closure
            setTimeout(() => {
              animatePressRelease(btnToClick);
              btnToClick.click();
              console.log('[Keyboard] Updated panel:', focusedPanelUp);
              pressedKey = null;
              pressedButton = null;
            }, 150);
          }
        }
        break;

      // Keys without visual buttons - trigger immediately
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
        (async () => {
          const focusedPanelW = findFocusedPanel();
          if (focusedPanelW && focusedPanelW !== MASTER_PANEL_ID) {
            const panelInfo = getPanel(focusedPanelW);
            if (!panelInfo) {
              console.warn(`[Keyboard] Panel ${focusedPanelW} not found`);
              return;
            }
            console.log(`[Keyboard] Attempting to delete panel '${panelInfo.title}' (${focusedPanelW})`);
            const settings = getSettings();
            const needsConfirmation = !settings.yolo && settings.behavior?.confirmationDialogs !== false;
            let confirmed = true;
            if (needsConfirmation) {
              const { showConfirmModal } = await import('./ui/confirmModal.js');
              confirmed = await showConfirmModal(
                'Are you sure you want to delete this panel?',
                { confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
              );
              if (!confirmed) {
                console.log('[Keyboard] Panel deletion cancelled by user');
                return;
              }
            }
            if (cardStates[focusedPanelW] && cardStates[focusedPanelW].playing) {
              try {
                // Use tracked pattern ID (handles .d1, .p1, etc.)
                const patternId = cardStates[focusedPanelW].patternId || focusedPanelW;
                strudelCore.evaluate(`silence.p('${patternId}')`, false, false);
                cardStates[focusedPanelW].playing = false;
                console.log(`[Keyboard] Stopped audio for panel ${focusedPanelW} (pattern ID: ${patternId})`);
              } catch (error) {
                console.error(`[Keyboard] Failed to silence panel ${focusedPanelW}:`, error);
              }
            }
            // Clean up highlighting data before panel deletion
            panelMiniLocations.delete(focusedPanelW);
            const deleted = deletePanel(focusedPanelW, null, cardStates, true);
            if (deleted && wsIsConnected()) {
              wsSend(MESSAGE_TYPES.PANEL_DELETED, {
                panel: focusedPanelW,
                timestamp: Date.now()
              });
              console.log(`[Keyboard] Broadcasted panel_deleted: ${focusedPanelW}`);
            }
          } else if (focusedPanelW === MASTER_PANEL_ID) {
            console.warn('[Keyboard] Cannot delete master panel');
          } else {
            console.warn('[Keyboard] No panel focused - cannot delete');
          }
        })();
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

  console.log('✓ Keyboard shortcuts initialized (keydown with simulated press/release):');
  console.log('  Cmd+Opt+0-9: Activate panel (0=master, 1-9=panels)');
  console.log('  Cmd+Opt+N: Create new panel');
  console.log('  Cmd+Opt+W: Delete focused panel');
  console.log('  Cmd+Opt+P: Toggle Play/Pause focused panel');
  console.log('  Cmd+Opt+↑: Update focused panel');
  console.log('  Cmd+Opt+=: Insert snippet');
  console.log('  Cmd+Opt+U: Update All');
  console.log('  Cmd+Opt+.: Stop All');
}

// Initialize when DOM is ready
async function init() {
  // Detect Electron environment and add class to body
  const isElectron = navigator.userAgent.toLowerCase().includes('electron');
  if (isElectron) {
    document.body.classList.add('electron-app');
    console.log('✓ Electron environment detected');
  }

  // Load settings first (before any other initialization)
  appSettings = loadSettings();
  console.log('✓ Settings loaded');

  // Load skin (before rendering any UI)
  const skinName = appSettings.skin || 'default';
  try {
    await skinManager.loadSkin(skinName);
  } catch (error) {
    console.warn(`Failed to load skin '${skinName}', falling back to default`);
    try {
      await skinManager.loadSkin('default');
    } catch (fallbackError) {
      console.error('Failed to load default skin:', fallbackError);
      alert('Critical error: Could not load UI skin. Please refresh the page.');
    }
  }

  // Wire up module dependencies (dependency injection)
  setMasterSlidersRef(() => currentMasterSliders);
  setUpdateAllButtonRef(updateAllButton);
  console.log('✓ Module dependencies wired');

  continueInitialization();
}

// Continue with rest of initialization
function continueInitialization() {

// Story 4.4: Initialize auto-save timer with current settings
startAutoSaveTimer(appSettings.behavior?.autoSaveInterval || 'manual');

// Story 4.5: Apply appearance settings on startup
applyAllAppearanceSettings(appSettings);

// Initialize panel opacities after settings loaded
// Use setTimeout to ensure panels are in DOM
setTimeout(() => {
  updatePanelOpacities();
  console.log('[STARTUP] Initial panel opacities applied');
}, 100);

initializeCards();
initializeSettingsModal();
initializeKeyboardShortcuts();

// Initialize drag-to-reorder for panel tree
if (document.querySelector('.panel-tree')) {
  initializePanelReorder();
}

// NOTE: updateAllEditorFontSizes is now imported from ./panels/panelEditor.js

  // Listen for settings changes to update tempo control and font sizes
  window.addEventListener('settings-changed', () => {
    renderTempoControl();
    updateAllEditorFontSizes();
    updateMasterControlsVisibility();
  });

  // Listen for skin changes to hot-reload UI
  window.addEventListener('skin-changed', async (event) => {
    console.log('[SkinHotReload] Re-rendering panels with new skin...');

    // Re-render all panels with new templates (preserves internal state, including master)
    await reRenderAllPanels(createEditorView, editorViews, smRenderSliders, getPanelSliders);

    console.log('✓ All panels re-rendered with new skin');
  });

  initializeStrudel();
}

// Start initialization
init();
