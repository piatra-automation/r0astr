import { repl, evalScope, ref } from '@strudel/core';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick, registerSynthSounds } from '@strudel/webaudio';
import { transpiler } from '@strudel/transpiler';
import { sliderWithID, sliderValues as cmSliderValues, highlightExtension, updateMiniLocations, highlightMiniLocations } from '@strudel/codemirror';
import { createPanel, renderPanel, deletePanel, getPanel, updatePanelTitle, bringPanelToFront, updatePanel, loadPanelState, savePanelState, savePanelStateWithMasterCode, startAutoSaveTimer, getAllPanels, getPanelEditorContainer, getNextPanelNumber, renumberPanels, animatePanelPosition, expandPanel, collapsePanel, togglePanel, isPanelExpanded, MASTER_PANEL_ID } from './managers/panelManager.js';
import { initializeDragAndResize } from './ui/dragResize.js';
import { loadSettings, getSettings, updateSetting } from './managers/settingsManager.js';
import { moveEditorToScreen, removeEditorFromScreen, removeAllEditorsExcept, isEditorInScreen } from './managers/screenManager.js';
import { initializeSettingsModal, openSettingsModal } from './ui/settingsModal.js';
import { applyAllAppearanceSettings, updatePanelOpacities } from './managers/themeManager.js';
import { openSnippetModal } from './ui/snippetModal.js';
import { loadSnippets } from './managers/snippetManager.js';
import './ui/snippetModal.css';
import * as prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';
import { PatternCapture } from './managers/patternCapture.js';
import { connect as wsConnect, send as wsSend, isConnected as wsIsConnected, MESSAGE_TYPES, syncPanelState, sendFullState } from './managers/websocketManager.js';
import { eventBus } from './utils/eventBus.js';
import { renderSliders as smRenderSliders, renderCollapsedSliders as smRenderCollapsedSliders, updateSliderValue as smUpdateSliderValue, clearSliders as smClearSliders, getPanelSliders } from './managers/sliderManager.js';
import { initializeWithSplash, dismissSplash, updateSplashProgress, prebake, skipSplash } from './managers/splash.js';
import { initializeMetronome, initializePatternHighlighting } from './managers/visualization.js';
import {
  cardStates,
  editorViews,
  fontSizeCompartments,
  panelMiniLocations,
  ctx,
  strudelCore,
  appState,
  patternCaptureRef
} from './state.js';

// CodeMirror 6 imports
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { theme } from '@strudel/codemirror/themes.mjs';

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
function evaluateMasterCode(reRenderSliders = true) {
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
}

// Render master sliders for tree layout
function renderMasterSlidersTree(widgets) {
  const masterPanel = document.querySelector(`[data-panel-id="${MASTER_PANEL_ID}"]`) ||
                      document.getElementById(MASTER_PANEL_ID);
  if (!masterPanel) return;

  const panelChildren = masterPanel.querySelector('.panel-children');
  if (!panelChildren) return;

  // Remove existing master slider leaves (keep editor leaf)
  const existingSliderLeaves = panelChildren.querySelectorAll('.leaf-slider.master-slider');
  existingSliderLeaves.forEach(leaf => leaf.remove());

  widgets.forEach((widget) => {
    const { varName, value, min, max, sliderId } = widget;

    const leafSlider = document.createElement('li');
    leafSlider.className = 'leaf-node leaf-slider master-slider';
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

    panelChildren.appendChild(leafSlider);
  });
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

  const panelChildren = masterPanel.querySelector('.panel-children');
  if (!panelChildren) return;

  // Check if tempo control already exists
  let tempoControl = document.getElementById('tempo-control');

  if (!tempoControl) {
    // Create tempo control as leaf node
    tempoControl = document.createElement('li');
    tempoControl.id = 'tempo-control';
    tempoControl.className = 'leaf-node leaf-slider tempo-control';
    panelChildren.appendChild(tempoControl);
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

      // Initialize drag and resize functionality (legacy layout only)
      if (!isTreeLayout()) {
        initializeDragAndResize(panelElement);
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

// Initialize card UI
function initializeCards() {
  // Check if we should restore panels from saved state
  if (appSettings && appSettings.behavior.restoreSession) {
    console.log('Restoring panels from saved state (restoreSession: true)');
    restorePanels();
  } else {
    console.log('Panel restoration disabled (restoreSession: false or no settings)');
  }

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
    const defaultMasterCode = `// Master Controls - Define global variables and sliders
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
          setTimeout(() => {
            view.focus();
            console.log(`[+Button] New panel ${panelId} focused and ready for input`);
          }, 10);
        }, 10);
      }

      // Initialize drag and resize functionality (legacy layout only)
      if (!isTreeLayout()) {
        initializeDragAndResize(panelElement);
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
          strudelCore.evaluate(`silence.p('${panelId}')`, false, false);
          cardStates[panelId].playing = false;
          console.log(`Stopped audio for panel ${panelId}`);
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

/**
 * Check if panel is stale (code differs from running pattern)
 * Story 6.1: Staleness Detection Logic
 * @param {string} panelId - Panel ID to check
 * @returns {boolean} True if panel is stale
 */
function checkStaleness(panelId) {
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
  if (isStale) {
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
function isPanelStale(panelId) {
  return cardStates[panelId]?.stale ?? false;
}

/**
 * Update ACTIVATE button based on panel state
 * Story 6.2: Separate PAUSE and ACTIVATE Buttons
 * Story 7.3: Live Transpilation Validation (disable if invalid)
 * @param {string} panelId - Panel ID
 */
async function updateActivateButton(panelId) {
  const panel = cardStates[panelId];
  // Support both legacy (.activate-btn) and tree (.btn-play) layouts
  const button = document.querySelector(`#${panelId} .activate-btn`) ||
    document.querySelector(`.activate-btn[data-card="${panelId}"]`) ||
    document.querySelector(`[data-panel-id="${panelId}"] .btn-play`) ||
    document.querySelector(`#${panelId} .btn-play`);

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
 * @param {string} panelId - Panel ID
 */
function updatePauseButton(panelId) {
  const panel = cardStates[panelId];
  // Support both legacy (.pause-btn) and tree (.btn-stop) layouts
  const button = document.querySelector(`#${panelId} .pause-btn`) ||
    document.querySelector(`.pause-btn[data-card="${panelId}"]`) ||
    document.querySelector(`[data-panel-id="${panelId}"] .btn-stop`) ||
    document.querySelector(`#${panelId} .btn-stop`);

  if (!panel || !button) return;

  // PAUSE/STOP button only visible/enabled when playing
  button.disabled = !panel.playing;
  button.classList.toggle('hidden', !panel.playing);
}

/**
 * Update contextual PLAYBACK button (tree layout)
 * Shows play/stop/refresh icon based on panel state
 * @param {string} panelId - Panel ID
 */
function updatePlaybackButton(panelId) {
  const panel = cardStates[panelId];
  const button = document.querySelector(`[data-panel-id="${panelId}"] .btn-playback`) ||
    document.querySelector(`#${panelId} .btn-playback`);

  if (!panel || !button) return;

  const icon = button.querySelector('.material-icons');
  if (!icon) return;

  // Remove all state classes
  button.classList.remove('playing', 'stale', 'paused');

  if (panel.playing && !panel.stale) {
    // Playing and in sync -> Show pause icon
    icon.textContent = 'pause';
    button.title = 'Pause';
    button.classList.add('playing');
  } else if (panel.stale) {
    // Stale (playing with edits) -> Show refresh/update icon
    icon.textContent = 'refresh';
    button.title = 'Update';
    button.classList.add('stale');
  } else {
    // Paused -> Show play icon
    icon.textContent = 'play_arrow';
    button.title = 'Play';
    button.classList.add('paused');
  }
}

/**
 * Update all playback buttons for a panel
 * Supports legacy (separate play/pause) and tree (contextual) layouts
 * @param {string} panelId - Panel ID
 */
function updatePanelButtons(panelId) {
  // Legacy layout buttons
  updateActivateButton(panelId);
  updatePauseButton(panelId);
  // Tree layout contextual button
  updatePlaybackButton(panelId);
}

/**
 * Story 7.3: Validation timers (debounced)
 * Separate timers for button state (500ms) and error display (1000ms)
 */
const validationTimers = {};

/**
 * Story 7.3: Validate code by transpiling AND evaluating (dry run)
 * Catches both syntax errors and runtime errors (undefined variables/functions)
 * @param {string} panelId - Panel ID
 * @returns {Promise<Object>} { valid: boolean, error?: string, line?: number }
 */
async function validateCode(panelId) {
  // Guard: evaluate not initialized yet (during early startup)
  if (!evaluate) {
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
function displayError(panelId, errorMessage, lineNumber) {
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
function clearErrorMessage(panelId) {
  const errorContainer = document.querySelector(`.error-message[data-card="${panelId}"]`);
  if (!errorContainer) return;

  errorContainer.textContent = '';
  errorContainer.style.display = 'none';
}

/**
 * Story 7.3: Attach validation listener to panel textarea
 * Debounced: 500ms for button state, 1000ms for error display
 * @param {string} panelId - Panel ID
 */
function attachValidationListener(panelId) {
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
      await updateActivateButton(panelId); // Re-use existing button update logic with validation
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

/**
 * Handle editor change event
 * Story 7.6: CodeMirror Integration
 * @param {string} code - New code content
 * @param {string} panelId - Panel ID
 */
function handleEditorChange(code, panelId) {
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
    updateAllButton();
    const t5 = performance.now();

    const total = t5 - startTime;
    if (total > 5) {
      console.warn(`[PERF INPUT] Total: ${total.toFixed(1)}ms | updatePanel: ${(t2 - t1).toFixed(1)}ms | checkStaleness: ${(t3 - t2).toFixed(1)}ms | updateVisualIndicators: ${(t4 - t3).toFixed(1)}ms | updateAllButton: ${(t5 - t4).toFixed(1)}ms`);
    }
  }
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
function createEditorView(container, options = {}) {
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
 * Update all visual indicators for a panel
 * Story 6.3: Visual Staleness Indicators
 * @param {string} panelId - Panel ID
 */
function updateVisualIndicators(panelId) {
  const panel = cardStates[panelId];
  // Support both legacy (#panelId) and tree ([data-panel-id]) layouts
  const panelElement = document.getElementById(panelId) ||
    document.querySelector(`[data-panel-id="${panelId}"]`);

  if (!panel || !panelElement) return;

  // Check if this is a tree layout (.level-panel) or legacy layout
  const isTreeLayout = panelElement.classList.contains('level-panel');

  if (isTreeLayout) {
    // Tree layout uses simpler class names: playing, stale, error
    panelElement.classList.remove('playing', 'stale', 'error');

    // Add playing class if panel is playing (stale panels are still playing)
    if (panel.playing) {
      panelElement.classList.add('playing');
    }
    // Add stale class on top if code changed
    if (panel.stale) {
      panelElement.classList.add('stale');
    }
    // No explicit 'paused' class needed in tree layout (default state)

    // Manage controls container visibility based on settings
    const settings = getSettings();
    const controlsContainer = panelElement.querySelector('.panel-controls-container');
    const details = panelElement.querySelector('details');

    if (controlsContainer) {
      // Controls visible when:
      // 1. Panel is playing (always show controls for playing panels)
      // 2. OR details is open (expanded panel shows everything)
      // 3. OR showControlsWhenCollapsed is true (keep controls visible even when collapsed)
      const isExpanded = details?.open;
      const showControls = panel.playing || isExpanded || settings.showControlsWhenCollapsed;
      controlsContainer.style.display = showControls ? '' : 'none';
    }

  } else {
    // Legacy layout uses panel- prefixed classes
    panelElement.classList.remove('panel-paused', 'panel-playing', 'panel-stale');

    if (panel.stale) {
      panelElement.classList.add('panel-stale');
    } else if (panel.playing) {
      panelElement.classList.add('panel-playing');
    } else {
      panelElement.classList.add('panel-paused');
    }
  }

  // Update button styling (from Story 6.2)
  updatePanelButtons(panelId);
}

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

  // Stop audio by replacing with silence
  try {
    strudelCore.evaluate(`silence.p('${panelId}')`, true, false);
    console.log(`Panel ${panelId}: Paused`);
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
    window.cleanupDraw(false, panelId); // false = don't clear (we'll do it manually)
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

    // Check if code uses labeled statements ($:)
    const hasLabeledStatements = output.includes(".p('$')");

    // Fix labeled statements: replace .p('$') with .p('panelId')
    // This ensures $: patterns register to the same panel ID
    if (hasLabeledStatements) {
      output = output.replace(/\.p\(['"]?\$['"]?\)/g, `.p('${panelId}')`);
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
      // console.log('[VIZ DEBUG] Original pattern code:', output);

      // Pre-process pattern code to detect visualizations BEFORE canvas setup
      let patternCode = output;

      // Replace .punchcard() with .pianoroll() (they render identically)
      patternCode = patternCode.replace(/\.punchcard\(/g, '.pianoroll(');
      // console.log('[VIZ DEBUG] After punchcard replacement:', patternCode);

      // Detect all visualization methods in order of appearance
      const vizMethodRegex = /\.(pianoroll|scope|tscope|fscope|spectrum)\(/g;
      const vizMethodMatches = [...patternCode.matchAll(vizMethodRegex)];
      const detectedVizMethods = vizMethodMatches.map(m => m[1]);
      const hasVisualization = detectedVizMethods.length > 0;

      // console.log('[VIZ DEBUG] Detected visualization methods:', detectedVizMethods);

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

      if (hasLabeledStatements) {
        evalResult = await strudelCore.evaluate(output, true, false);
      } else {
        // Inject panel canvas contexts into visualization calls in user code

        if (hasVisualization && window.visualizationContexts[panelId]) {
          const contexts = window.visualizationContexts[panelId];
          // console.log('[VIZ DEBUG] Injecting contexts into pattern code');

          // Replace ALL visualization methods in order of appearance
          let contextIndex = 0;

          // Sanitize panel ID for use in variable names (replace dashes with underscores)
          const safePanelId = panelId.replace(/-/g, '_');

          // Make all contexts available as globals
          contexts.forEach((ctx, i) => {
            window[`__viz_${safePanelId}_${i}`] = ctx;
          });

          // Create a combined regex that matches any viz method
          const allVizMethodsRegex = /\.(pianoroll|scope|tscope|fscope|spectrum)\((\s*\{[^}]*\})?\s*\)/g;

          patternCode = patternCode.replace(allVizMethodsRegex, (match, method, existingOptions) => {
            // Use the context at the current index
            const ctxIdx = contextIndex;
            contextIndex++;

            // console.log(`[VIZ DEBUG] Replacing .${method}() with context index ${ctxIdx}`);

            if (existingOptions) {
              // Remove outer braces and whitespace
              const opts = existingOptions.trim().slice(1, -1);
              return `.tag('${panelId}-${ctxIdx}').${method}({ ctx: __viz_${safePanelId}_${ctxIdx}, id: '${panelId}-${ctxIdx}', ${opts} })`;
            } else {
              return `.tag('${panelId}-${ctxIdx}').${method}({ ctx: __viz_${safePanelId}_${ctxIdx}, id: '${panelId}-${ctxIdx}' })`;
            }
          });

          // console.log('[VIZ DEBUG] Pattern code after ctx injection:', patternCode);
          // console.log(`[VIZ DEBUG] Replaced ${contextIndex} total visualization calls`);
        }

        // Evaluate pattern
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

  // Clear all patterns by setting to silence FIRST
  // This removes them from memory before stopping scheduler
  Object.keys(cardStates).forEach((cardId) => {
    try {
      strudelCore.evaluate(`silence.p('${cardId}')`, false, false);
    } catch (e) {
      console.warn(`Failed to silence ${cardId}:`, e);
    }
    cardStates[cardId].playing = false;
    cardStates[cardId].stale = false; // Clear staleness when stopping (Story 6.1)
    updatePanel(cardId, { stale: false }); // Sync to panelManager for persistence

    // Story 6.3: Update visual indicators (includes buttons)
    updateVisualIndicators(cardId);
  });

  // Stop scheduler AFTER clearing patterns
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

    // Initialize drag/resize (legacy layout only)
    if (!isTreeLayout()) {
      initializeDragAndResize(panelElement);
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
        strudelCore.evaluate(`silence.p('${panelId}')`, false, false);
        cardStates[panelId].playing = false;
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

  // Check splash setting
  if (appSettings?.showSplash) {
    // Show splash screen with progress during loading
    const samplesLoadingWithSplash = initializeWithSplash(snippetUrl);
    await Promise.all([modulesLoading, samplesLoadingWithSplash]);
  } else {
    // Skip splash - show UI immediately, load samples async
    skipSplash();
    // Fire off sample loading in background (don't await)
    prebake(snippetUrl).catch(err => console.warn('Background sample loading error:', err));
    // Only await modules (required for REPL)
    await modulesLoading;
  }

  // Create single repl instance shared by all cards
  const replInstance = repl({
    defaultOutput: webaudioOutput,
    getTime: () => ctx.currentTime,
    transpiler,
  });

  strudelCore.evaluate = replInstance.evaluate;
  strudelCore.scheduler = replInstance.scheduler;

  // Initialize pattern capture with scheduler
  patternCaptureRef.instance = new PatternCapture(strudelCore.scheduler);
  console.log('✓ Pattern capture initialized');

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

  // Story 7.3: Run validation on all restored panels now that evaluate is available
  document.querySelectorAll('.code-input').forEach(async (textarea) => {
    const panelId = textarea.closest('.card')?.id;
    if (panelId && panelId !== MASTER_PANEL_ID) {
      const validation = await validateCode(panelId);
      await updateActivateButton(panelId);
      if (!validation.valid) {
        displayError(panelId, validation.error, validation.line);
      }
    }
  });

  // Initialize WebSocket for remote control
  initializeWebSocket();

  // Evaluate default master panel code (TEMPO slider)
  evaluateMasterCode();
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

  // Initialize drag and resize functionality (legacy layout only)
  if (!isTreeLayout()) {
    initializeDragAndResize(panelElement);
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

/**
 * Find which panel currently has focus
 * @returns {string|null} Panel ID or null if no panel focused
 */
function findFocusedPanel() {
  // Check if any editor view has focus
  for (const [panelId, view] of editorViews.entries()) {
    if (view.hasFocus) {
      // console.log('[Focus DEBUG] Found focused panel via view.hasFocus:', panelId);
      return panelId;
    }
  }

  // Fallback: check which panel container is within the active element
  const activeElement = document.activeElement;
  // console.log('[Focus DEBUG] Active element:', activeElement, 'className:', activeElement?.className);

  if (activeElement) {
    const panelContainer = activeElement.closest('.panel-container');
    if (panelContainer) {
      // console.log('[Focus DEBUG] Found panel container:', panelContainer.id);
      return panelContainer.id;
    }
  }

  // Last resort: check if activeElement is a CodeMirror editor
  if (activeElement && activeElement.closest('.cm-editor')) {
    // Find which panel contains this editor
    for (const [panelId, view] of editorViews.entries()) {
      if (view.dom.contains(activeElement)) {
        // console.log('[Focus DEBUG] Found panel via editor DOM:', panelId);
        return panelId;
      }
    }
  }

  // Final fallback: check for .focused class (set by setActivePanel in panelManager)
  // This handles case where panel is expanded but CodeMirror doesn't have focus
  const focusedPanel = document.querySelector('.card.focused');
  if (focusedPanel) {
    // console.log('[Focus DEBUG] Found focused panel via .focused class:', focusedPanel.id);
    return focusedPanel.id;
  }

  console.warn('[Focus DEBUG] No focused panel found');
  return null;
}

/**
 * Animate a button press with visual feedback (legacy - single call)
 * @param {HTMLElement} button - Button element to animate
 * @param {number} duration - Duration in ms (default 150ms)
 */
function animateButtonPress(button, duration = 150) {
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
function animatePressStart(button) {
  if (!button) return;
  button.classList.add('pressing');
}

/**
 * End button press animation (remove 'pressing' class)
 * @param {HTMLElement} button - Button element to animate
 */
function animatePressRelease(button) {
  if (!button) return;
  button.classList.remove('pressing');
}

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
                strudelCore.evaluate(`silence.p('${focusedPanelW}')`, false, false);
                cardStates[focusedPanelW].playing = false;
                console.log(`[Keyboard] Stopped audio for panel ${focusedPanelW}`);
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
// Load settings first (before any other initialization)
appSettings = loadSettings();
console.log('✓ Settings loaded');

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

/**
 * Pattern Capture Keyboard Handlers
 * Cmd+Option+R - Toggle capture mode
 * a,s,d,f,q,w,e,r,j,k,l,;,u,i,o,p - Drum triggers (when capturing)
 */
function initializePatternCaptureKeys() {
  document.addEventListener('keydown', (e) => {
    // Cmd+Option+R (Mac) or Ctrl+Alt+R (Windows/Linux) - Toggle capture mode
    const modifier = (e.metaKey || e.ctrlKey) && e.altKey;

    if (modifier && e.code === 'KeyR') {
      e.preventDefault();

      if (!patternCaptureRef.instance) {
        console.warn('[PatternCapture] Not initialized yet');
        return;
      }

      if (!patternCaptureRef.instance.captureMode) {
        // Start capturing
        const started = patternCaptureRef.instance.startCapture();
        if (started) {
          // Defocus CodeMirror so keystrokes aren't typed
          const focusedPanel = findFocusedPanel();
          if (focusedPanel) {
            const editorView = editorViews.get(focusedPanel);
            if (editorView) {
              editorView.contentDOM.blur();
              console.log(`[PatternCapture] Defocused editor in ${focusedPanel}`);
            }
          }
          showCaptureIndicator(true);
        }
      } else {
        // Stop capturing and insert pattern
        const pattern = patternCaptureRef.instance.stopCapture();
        showCaptureIndicator(false);

        if (pattern) {
          // Insert into focused panel
          const focusedPanel = findFocusedPanel();
          if (focusedPanel && focusedPanel !== MASTER_PANEL_ID) {
            const editorView = editorViews.get(focusedPanel);
            if (editorView) {
              mergePatternIntoEditor(editorView, pattern);
              console.log(`[PatternCapture] Merged into ${focusedPanel}`);
            }
          } else {
            console.log(`[PatternCapture] Generated pattern: ${pattern}`);
            console.log('  Copy to clipboard or focus a panel to insert automatically');
          }
        }
      }
      return;
    }

    // Skip key capture checks if typing in editor or input fields
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.closest('.cm-content') || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    // Capture key presses when in capture mode
    if (patternCaptureRef.instance && patternCaptureRef.instance.captureMode) {
      if (patternCaptureRef.instance.isMappedKey(e.key)) {
        e.preventDefault();
        patternCaptureRef.instance.captureKeyDown(e.key, performance.now());

        // Visual feedback
        flashCaptureKey(e.key);
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    // Skip if typing in editor or input fields
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.closest('.cm-content') || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    // ALWAYS call captureKeyUp to clear keysPressed Set (even when not capturing)
    if (patternCaptureRef.instance && patternCaptureRef.instance.isMappedKey(e.key)) {
      patternCaptureRef.instance.captureKeyUp(e.key, performance.now());
    }
  });

  console.log('✓ Pattern capture keyboard handlers initialized');
  console.log('  - Cmd+Option+R (Mac) or Ctrl+Alt+R (Windows): Toggle capture mode');
  console.log('  - Bottom row (asdfghjk): c3 d3 e3 f3 g3 a3 b3 c4');
  console.log('  - Top row (qwertyui): c4 d4 e4 f4 g4 a4 b4 c5');
  console.log('  - Bass row (zxcv): c2 d2 e2 f2');
}

/**
 * Show/hide capture indicator
 * @param {boolean} show - Whether to show indicator
 */
function showCaptureIndicator(show) {
  let indicator = document.getElementById('capture-indicator');

  if (show && !indicator) {
    // Create indicator
    indicator = document.createElement('div');
    indicator.id = 'capture-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f03e3e;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: pulse 1s infinite;
    `;
    indicator.textContent = '● RECORDING';
    document.body.appendChild(indicator);

    // Add pulse animation
    if (!document.getElementById('capture-indicator-style')) {
      const style = document.createElement('style');
      style.id = 'capture-indicator-style';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `;
      document.head.appendChild(style);
    }
  } else if (!show && indicator) {
    indicator.remove();
  }
}

/**
 * Flash visual feedback for captured key
 * @param {string} key - Key that was pressed
 */
function flashCaptureKey(key) {
  // Create temporary flash element
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    background: #51cf66;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 14px;
    z-index: 10001;
    pointer-events: none;
  `;

  const note = patternCaptureRef.instance.keyMap[key];
  flash.textContent = `${key.toUpperCase()} → ${note}`;
  document.body.appendChild(flash);

  // Remove after animation
  setTimeout(() => flash.remove(), 300);
}

/**
 * Merge captured pattern into existing code
 * Intelligently adds to existing stack() or creates new one
 * @param {EditorView} editorView - CodeMirror editor instance
 * @param {string} newPattern - Pattern to merge (may include stack())
 */
function mergePatternIntoEditor(editorView, newPattern) {
  const currentCode = editorView.state.doc.toString();

  // Check if current code has a stack
  const stackMatch = currentCode.match(/stack\s*\(/);

  if (stackMatch) {
    // Existing stack found - insert right after "stack("
    const insertPos = stackMatch.index + stackMatch[0].length;

    // Insert new pattern as complete line(s) at top of stack with trailing comma
    const insertion = `\n  ${newPattern},`;

    editorView.dispatch({
      changes: { from: insertPos, insert: insertion }
    });
  } else {
    // No existing stack - insert new pattern at end
    const endPos = currentCode.length;
    const insertion = `\n\n${newPattern}`;

    editorView.dispatch({
      changes: { from: endPos, insert: insertion }
    });
  }
}

/**
 * Extract note() lines from a pattern (handles both single and stack)
 * @param {string} pattern - Pattern string
 * @returns {Array<string>} Array of note lines
 */
function extractNoteLines(pattern) {
  const lines = [];

  // Check if pattern is a stack
  const stackMatch = pattern.match(/stack\s*\(\s*([\s\S]*?)\s*\)/);

  if (stackMatch) {
    // Extract each note line from stack
    const content = stackMatch[1];
    // Match note("...") or note('...') with proper quote handling, optionally followed by .slow(N)
    const noteMatches = content.match(/note\(["'][^"']*["']\)(?:\.slow\(\d+\))?/g);
    if (noteMatches) {
      lines.push(...noteMatches);
    }
  } else {
    // Single note line
    const noteMatch = pattern.match(/note\(["'][^"']*["']\)(?:\.slow\(\d+\))?/);
    if (noteMatch) {
      lines.push(noteMatch[0]);
    }
  }

  return lines;
}

/**
 * Get current pattern preview during capture
 * Can be called while capturing to see generated pattern so far
 */
window.getCapturePreview = function () {
  if (!patternCaptureRef.instance || !patternCaptureRef.instance.captureMode) {
    console.log('[PatternCapture] Not currently capturing');
    return null;
  }

  const pattern = patternCaptureRef.instance.generatePattern();
  console.log('[PatternCapture] Preview:\n' + pattern);
  return pattern;
};

/**
 * Initialize pattern capture UI controls
 * Wire up RECORD button and cycle length selector
 */
function initializeCaptureUI() {
  const recordBtn = document.getElementById('record-btn');
  const cycleLengthSelect = document.getElementById('cycle-length');
  const durationModeCheckbox = document.getElementById('duration-mode');

  if (!recordBtn || !cycleLengthSelect || !durationModeCheckbox) {
    console.warn('[PatternCapture] UI elements not found');
    return;
  }

  // Wire up cycle length selector
  cycleLengthSelect.addEventListener('change', (e) => {
    const cycleLength = parseInt(e.target.value);
    if (patternCaptureRef.instance) {
      patternCaptureRef.instance.updateConfig({ chunkSize: cycleLength });
      console.log(`[PatternCapture] Cycle length set to ${cycleLength}`);
    }
  });

  // Wire up duration mode checkbox
  durationModeCheckbox.addEventListener('change', (e) => {
    if (patternCaptureRef.instance) {
      patternCaptureRef.instance.updateConfig({ durationMode: e.target.checked });
    }
  });

  // Wire up RECORD button
  recordBtn.addEventListener('click', () => {
    if (!patternCaptureRef.instance) {
      console.warn('[PatternCapture] Not initialized yet');
      return;
    }

    if (!patternCaptureRef.instance.captureMode) {
      // Start recording
      const started = patternCaptureRef.instance.startCapture();
      if (started) {
        // Defocus editor
        const focusedPanel = findFocusedPanel();
        if (focusedPanel) {
          const editorView = editorViews.get(focusedPanel);
          if (editorView) {
            editorView.contentDOM.blur();
          }
        }

        // Update UI - add recording class (CSS swaps colors)
        recordBtn.classList.add('recording');
        showCaptureIndicator(true);
      }
    } else {
      // Stop recording
      const pattern = patternCaptureRef.instance.stopCapture();

      // Update UI - remove recording class
      recordBtn.classList.remove('recording');
      showCaptureIndicator(false);

      if (pattern) {
        const focusedPanel = findFocusedPanel();
        if (focusedPanel && focusedPanel !== MASTER_PANEL_ID) {
          const editorView = editorViews.get(focusedPanel);
          if (editorView) {
            mergePatternIntoEditor(editorView, pattern);
            console.log(`[PatternCapture] Merged into ${focusedPanel}`);
          }
        } else {
          console.log(`[PatternCapture] Generated pattern: ${pattern}`);
        }
      }
    }
  });

  console.log('✓ Pattern capture UI initialized');
}

/**
 * Update font size for all editor views
 */
function updateAllEditorFontSizes() {
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

// Listen for settings changes to update tempo control and font sizes
window.addEventListener('settings-changed', () => {
  renderTempoControl();
  updateAllEditorFontSizes();
});

initializePatternCaptureKeys();
initializeCaptureUI();
initializeStrudel();
