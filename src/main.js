/**
 * r0astr - Multi-instrument Live Coding Interface
 *
 * This is the main application entry point. It handles:
 * - Strudel initialization (Web Audio, samples, REPL)
 * - Application initialization sequence
 * - Event bus coordination between modules
 * - Thin event handlers for Strudel pattern evaluation
 *
 * Business logic delegated to:
 * - src/managers/ - Panel CRUD, settings, sliders, WebSocket
 * - src/ui/ - Panel UI, master panel, pattern validation
 * - src/utils/ - Event bus, helpers
 *
 * IMPORTANT: Strudel initialization stays in main.js because it's tightly
 * coupled to Web Audio (AudioContext, browser permissions, global state).
 */

// ===== STRUDEL IMPORTS =====
import { repl, evalScope, ref } from '@strudel/core';
import { transpiler } from '@strudel/transpiler';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick, registerSynthSounds } from '@strudel/webaudio';
import { sliderWithID, sliderValues as cmSliderValues, highlightMiniLocations } from '@strudel/codemirror';

// ===== MANAGER IMPORTS (Epic 9) =====
import {
  createPanel,
  renderPanel,
  deletePanel,
  getPanel,
  updatePanel,
  bringPanelToFront,
  loadPanelState,
  getAllPanels,
  getPanelEditorContainer,
  startAutoSaveTimer,
  MASTER_PANEL_ID
} from './managers/panelManager.js';
import { loadSettings, getSettings } from './managers/settingsManager.js';
import { moveEditorToScreen, removeEditorFromScreen, removeAllEditorsExcept, isEditorInScreen } from './managers/screenManager.js';
import { applyAllAppearanceSettings, updatePanelOpacities } from './managers/themeManager.js';
import { loadSnippets } from './managers/snippetManager.js';
import { PatternCapture } from './managers/patternCapture.js';

// ===== UI COORDINATOR IMPORTS (Epic 10) =====
import { initializeDragAndResize } from './ui/dragResize.js';
import { initializeSettingsModal, openSettingsModal } from './ui/settingsModal.js';
import { openSnippetModal } from './ui/snippetModal.js';
import './ui/snippetModal.css';
import * as panelCoordinator from './ui/panelCoordinator.js';
import * as masterPanelCoordinator from './ui/masterPanelCoordinator.js';
import * as patternValidator from './ui/patternValidator.js';

// ===== UTILS =====
import { eventBus } from './utils/eventBus.js';

// ===== PRETTIER (code formatting) =====
import * as prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';

// ===== CONSTANTS =====
const APP_VERSION = '8.4.0-full-state-sync';
console.log(`%c🎵 r0astr ${APP_VERSION}`, 'font-weight: bold; font-size: 14px; color: #51cf66;');

// ===== GLOBAL STATE (Strudel-specific only) =====

// Use official sliderValues from @strudel/codemirror
export const sliderValues = cmSliderValues;
window.sliderValues = sliderValues;
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

// Strudel evaluate and scheduler (set after initialization)
let evaluate, scheduler;
window.evaluate = null; // Exposed for patternValidator
window.scheduler = null; // Exposed for coordinators
let samplesReady = false;

// Pattern capture instance (initialized after scheduler ready)
let patternCapture = null;

// Application settings (loaded during initialization)
let appSettings = null;

// ===== STRUDEL INITIALIZATION =====

/**
 * Load Strudel modules dynamically
 * Uses evalScope to create shared scope across all panels
 */
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

  // CRITICAL: Register soundfonts AFTER evalScope
  const { registerSoundfonts } = await import('@strudel/soundfonts');
  console.log('Registering soundfonts (gm_* instruments)...');
  await registerSoundfonts();
  console.log('✓ Soundfonts registered');

  return scope;
}

// Splash screen removed for simpler initialization

/**
 * Prebake samples in parallel
 * Loads synths, piano, drums, etc. in background
 */
async function prebake() {
  const baseCDN = 'https://strudel.b-cdn.net';
  const snippetUrl = appSettings?.snippetLocation || '';

  const loadingTasks = [
    Promise.resolve(registerSynthSounds()).catch((e) => console.warn('Failed to load synths:', e)),
    import('@strudel/webaudio').then(({ registerZZFXSounds }) => registerZZFXSounds()).catch((e) => console.warn('Failed to load ZZFX:', e)),
    import('@strudel/webaudio').then(({ samples }) => samples(`${baseCDN}/piano.json`, `${baseCDN}/piano/`, { prebake: true })).catch((e) => console.warn('Failed to load piano:', e)),
    import('@strudel/webaudio').then(({ samples }) => samples(`${baseCDN}/vcsl.json`, `${baseCDN}/vcsl/`, { prebake: true })).catch((e) => console.warn('Failed to load vcsl:', e)),
    import('@strudel/webaudio').then(({ samples }) => samples(`${baseCDN}/tidal-drum-machines.json`, `${baseCDN}/tidal-drum-machines/`, { prebake: true })).catch((e) => console.warn('Failed to load drums:', e)),
    import('@strudel/webaudio').then(({ samples }) => samples(`${baseCDN}/uzu-drum-kit.json`, `${baseCDN}/uzu-drum-kit/`, { prebake: true })).catch((e) => console.warn('Failed to load uzu:', e)),
    import('@strudel/webaudio').then(({ samples }) => samples(`${baseCDN}/mridangam.json`, `${baseCDN}/mridangam/`, { prebake: true })).catch((e) => console.warn('Failed to load mridangam:', e)),
    import('@strudel/webaudio').then(({ samples }) => samples('github:tidalcycles/Dirt-Samples', undefined, { prebake: true })).catch((e) => console.warn('Failed to load Dirt:', e)),
    loadSnippets(snippetUrl).catch((e) => console.warn('Failed to load snippets:', e))
  ];

  await Promise.all(loadingTasks);
  console.log('✓ Samples loaded');
}

/**
 * Initialize pattern highlighting loop
 * Shows which notes are currently playing
 */
function initializePatternHighlighting() {
  const settings = getSettings();
  if (!settings.pattern_highlighting) {
    console.log('[Pattern Highlighting] Disabled in settings');
    return;
  }

  console.log('[Pattern Highlighting] Enabled');
  let animationFrameId = null;

  const updateHighlightingState = () => {
    const currentSettings = getSettings();
    if (currentSettings.pattern_highlighting && !animationFrameId) {
      animationFrameId = requestAnimationFrame(loop);
    } else if (!currentSettings.pattern_highlighting && animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  function loop() {
    try {
      const currentTime = scheduler.now();

      // Guard: Check if scheduler has a pattern
      if (!scheduler.pattern) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      const begin = Math.floor(currentTime);
      const end = begin + 1;

      // Query scheduler for haps in current cycle
      const allHaps = scheduler.pattern.queryArc(begin, end, {
        _cps: scheduler.cps
      });

      // Filter to only haps currently playing
      const activeHaps = allHaps.filter(hap => {
        if (!hap.whole) return false;
        return currentTime >= hap.whole.begin && currentTime < hap.whole.end;
      });

      for (const [panelId, view] of panelCoordinator.getAllPanelEditors().entries()) {
        if (panelId === MASTER_PANEL_ID) continue;
        const panel = getPanel(panelId);
        if (!panel || !panel.playing || panel.stale) {
          highlightMiniLocations(view, currentTime, []);
          continue;
        }
        highlightMiniLocations(view, currentTime, activeHaps);
      }
    } catch (err) {
      console.warn('[Pattern Highlighting] Error:', err);
    }

    animationFrameId = requestAnimationFrame(loop);
  }

  loop();
  window.addEventListener('panel-state-changed', updateHighlightingState);
  window.addEventListener('settings-changed', updateHighlightingState);
}

/**
 * Initialize Strudel REPL and modules
 *
 * CRITICAL: This stays in main.js because it's tightly coupled to:
 * - AudioContext (browser global)
 * - initAudioOnFirstClick() (browser permission)
 * - registerSynths/samples (global state)
 * - Shared REPL instance (singleton)
 */
async function initializeStrudel() {
  console.log('r0astr initializing...');

  // Initialize audio context
  const ctx = getAudioContext();
  initAudioOnFirstClick();

  // Disable ACTIVATE buttons during loading
  document.querySelectorAll('.activate-btn').forEach(btn => {
    btn.disabled = true;
  });

  // Load modules and samples in parallel
  await Promise.all([loadModules(), prebake()]);

  // Create single REPL instance shared by all panels
  const replInstance = repl({
    defaultOutput: webaudioOutput,
    getTime: () => ctx.currentTime,
    transpiler,
  });

  evaluate = replInstance.evaluate;
  scheduler = replInstance.scheduler;
  window.evaluate = evaluate; // Expose for patternValidator
  window.scheduler = scheduler; // Expose for coordinators

  // Initialize pattern capture
  patternCapture = new PatternCapture(scheduler);
  console.log('✓ Pattern capture initialized');

  // Initialize pattern capture UI controls (RECORD button, etc.)
  initializeCaptureUI();

  // Initialize pattern highlighting
  initializePatternHighlighting();

  // Make setCpm globally available for master panel
  window.setCpm = (cpm) => {
    const value = typeof cpm === 'function' ? cpm() : cpm;
    const cps = value / 60; // Convert CPM to CPS
    scheduler.setCps(cps);
  };

  // Expose highlightMiniLocations for patternValidator
  window.highlightMiniLocations = highlightMiniLocations;

  samplesReady = true;
  console.log('✓ r0astr ready');
}

/**
 * Restore panels from saved state
 */
function restorePanels() {
  const savedPanels = loadPanelState();
  if (!savedPanels || savedPanels.length === 0) {
    console.log('No saved panels to restore');
    return;
  }

  console.log(`Restoring ${savedPanels.length} panel(s)`);

  savedPanels.forEach(panelState => {
    const panelId = panelState.id;

    if (panelId === MASTER_PANEL_ID) {
      // Master panel already exists in HTML, just restore code
      const masterEditor = panelCoordinator.getPanelEditor(MASTER_PANEL_ID);
      if (masterEditor && panelState.code) {
        const transaction = masterEditor.state.update({
          changes: { from: 0, to: masterEditor.state.doc.length, insert: panelState.code }
        });
        masterEditor.dispatch(transaction);
        masterPanelCoordinator.evaluateMasterCode(masterEditor, true);
      }
    } else {
      // Create regular panel
      createPanel({
        id: panelId,
        title: panelState.title || `Instrument ${panelId.split('-')[1]}`,
        code: panelState.code || '',
        position: panelState.position || 0,
        size: panelState.size || { width: 400, height: 300 },
        playing: false, // Always start paused
        stale: panelState.stale || false,
        lastEvaluatedCode: panelState.lastEvaluatedCode || '',
        zIndex: panelState.zIndex
      });

      renderPanel(panelId);

      // Initialize panel UI (CodeMirror editor, event listeners)
      const editorView = panelCoordinator.initializePanelUI(panelId, {
        initialCode: panelState.code || '',
        onChange: (code) => {
          updatePanel(panelId, { code });
          eventBus.emit('panel:codeChanged', { panelId, code });
        }
      });

      // Initialize drag and resize (needs DOM element, not panelId)
      const panelElement = document.getElementById(panelId);
      if (panelElement) {
        initializeDragAndResize(panelElement);
      }
    }
  });
}

/**
 * Initialize application UI and panels
 */
function initializeCards() {
  // Initialize master panel UI
  const masterEditor = panelCoordinator.initializePanelUI(MASTER_PANEL_ID, {
    initialCode: '',
    onChange: (code) => {
      masterPanelCoordinator.evaluateMasterCode(panelCoordinator.getPanelEditor(MASTER_PANEL_ID), true);
    }
  });

  masterPanelCoordinator.initializeMasterPanel(masterEditor);

  // Restore panels if enabled in settings
  if (appSettings && appSettings.behavior.restoreSession) {
    console.log('Restoring panels from saved state');
    restorePanels();
  } else {
    console.log('Not restoring panels (restoreSession: false)');
  }

  // Attach STOP ALL button listener
  const stopAllBtn = document.getElementById('stop-all');
  if (stopAllBtn) {
    stopAllBtn.addEventListener('click', () => {
      eventBus.emit('stopAll:trigger');
    });
  }

  // Attach UPDATE ALL button listener
  const updateAllBtn = document.getElementById('update-all-btn');
  if (updateAllBtn) {
    updateAllBtn.addEventListener('click', () => {
      eventBus.emit('updateAll:trigger');
    });
  }

  // Attach CONFIG button listener
  const configBtn = document.getElementById('config-btn');
  if (configBtn) {
    configBtn.addEventListener('click', () => {
      openSettingsModal();
    });
  }

  // Attach master panel toggle button listener
  const masterModeBtn = document.getElementById('master-mode');
  if (masterModeBtn) {
    masterModeBtn.addEventListener('click', () => {
      masterPanelCoordinator.toggleMasterMode();
    });
  }

  // Attach ADD PANEL button listener
  const addPanelBtn = document.getElementById('add-panel-btn');
  if (addPanelBtn) {
    addPanelBtn.addEventListener('click', () => {
      // Create new panel with staggered position
      const panelCount = getAllPanels().size;
      const offsetX = (panelCount % 3) * 50;
      const offsetY = Math.floor(panelCount / 3) * 50;

      const panelId = createPanel({
        code: '',
        position: { x: 20 + offsetX, y: 100 + offsetY }
      });

      renderPanel(panelId);

      // Initialize panel UI
      const editorView = panelCoordinator.initializePanelUI(panelId, {
        initialCode: '',
        onChange: (code) => {
          updatePanel(panelId, { code });
          eventBus.emit('panel:codeChanged', { panelId, code });
        }
      });

      // Initialize drag and resize
      const panelElement = document.getElementById(panelId);
      if (panelElement) {
        initializeDragAndResize(panelElement);
      }

      // Focus editor
      setTimeout(() => {
        bringPanelToFront(panelId);
        setTimeout(() => {
          editorView.focus();
          console.log(`[+Button] New panel ${panelId} focused and ready`);
        }, 10);
      }, 10);

      console.log(`Created new panel: ${panelId}`);
    });
  }

  // Setup global panel event listeners (event delegation)
  panelCoordinator.setupGlobalEventListeners();
}

/**
 * Find which panel currently has focus
 * @returns {string|null} Panel ID or null
 */
function findFocusedPanel() {
  const allEditors = panelCoordinator.getAllPanelEditors();
  for (const [panelId, view] of allEditors.entries()) {
    if (view.hasFocus) {
      return panelId;
    }
  }

  // Fallback: check active element
  const activeElement = document.activeElement;
  if (activeElement) {
    const panelContainer = activeElement.closest('.panel-container');
    if (panelContainer) {
      return panelContainer.id;
    }
  }

  return null;
}

/**
 * Initialize keyboard shortcuts
 */
function initializeKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Check for Cmd+Option (Mac) or Ctrl+Alt (Windows/Linux)
    const modifier = (e.metaKey || e.ctrlKey) && e.altKey;

    if (!modifier) {
      return;
    }

    // Ignore key repeats
    if (e.repeat) {
      return;
    }

    switch (e.code) {
      case 'KeyU':
        e.preventDefault();
        eventBus.emit('updateAll:trigger');
        break;

      case 'Period':
        e.preventDefault();
        eventBus.emit('stopAll:trigger');
        break;

      case 'KeyP':
        e.preventDefault();
        const focusedPanelP = findFocusedPanel();
        if (focusedPanelP) {
          const panel = getPanel(focusedPanelP);
          if (panel) {
            const button = panel.playing ? 'pause' : 'activate';
            eventBus.emit('panel:buttonClicked', { panelId: focusedPanelP, button });
          }
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        const focusedPanelUp = findFocusedPanel();
        if (focusedPanelUp) {
          eventBus.emit('panel:buttonClicked', { panelId: focusedPanelUp, button: 'activate' });
        }
        break;

      case 'Digit0':
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
      case 'Digit9':
        e.preventDefault();
        const index = parseInt(e.code.replace('Digit', ''));
        activatePanelByIndex(index);
        break;

      case 'KeyN':
        e.preventDefault();
        document.getElementById('add-panel-btn')?.click();
        break;

      case 'KeyW':
        e.preventDefault();
        (async () => {
          const focusedPanelW = findFocusedPanel();
          if (focusedPanelW && focusedPanelW !== MASTER_PANEL_ID) {
            const settings = getSettings();
            const needsConfirmation = !settings.yolo && settings.behavior?.confirmationDialogs !== false;

            let confirmed = true;
            if (needsConfirmation) {
              const { showConfirmModal } = await import('./ui/confirmModal.js');
              confirmed = await showConfirmModal(
                'Are you sure you want to delete this panel?',
                { confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
              );
            }

            if (confirmed) {
              eventBus.emit('panel:buttonClicked', { panelId: focusedPanelW, button: 'delete' });
            }
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
          }
        }
        break;

      case 'Equal':
        e.preventDefault();
        const focusedPanelEqual = findFocusedPanel();
        if (focusedPanelEqual) {
          const view = panelCoordinator.getPanelEditor(focusedPanelEqual);
          if (view) {
            openSnippetModal(focusedPanelEqual, view);
          }
        }
        break;
    }
  });

  console.log('✓ Keyboard shortcuts initialized');
}

/**
 * Activate panel by index (0=master, 1-9=panels)
 */
function activatePanelByIndex(index) {
  if (index === 0) {
    // Focus master panel
    const masterView = panelCoordinator.getPanelEditor(MASTER_PANEL_ID);
    if (masterView) {
      masterView.focus();
      bringPanelToFront(MASTER_PANEL_ID);
    }
  } else {
    // Get regular panels sorted by position
    const allPanels = Array.from(getAllPanels().values())
      .filter(p => p.id !== MASTER_PANEL_ID)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const targetPanel = allPanels[index - 1];
    if (targetPanel) {
      const view = panelCoordinator.getPanelEditor(targetPanel.id);
      if (view) {
        view.focus();
        bringPanelToFront(targetPanel.id);
      }
    }
  }
}

/**
 * Get list of stale panels (using panelManager API)
 */
function getStalePanels() {
  return Array.from(getAllPanels().values())
    .filter(panel => panel.stale === true)
    .map(panel => panel.id);
}

/**
 * Update UPDATE ALL button state (enable/disable based on stale panels)
 */
let updateAllButtonTimer;
function updateAllButton() {
  clearTimeout(updateAllButtonTimer);
  updateAllButtonTimer = setTimeout(() => {
    const button = document.getElementById('update-all-btn');
    if (!button) return;

    const stalePanels = getStalePanels();
    const count = stalePanels.length;

    button.disabled = count === 0;
    button.classList.remove('updating');

    const badge = button.querySelector('.count-badge');
    if (badge) {
      badge.textContent = count > 0 ? count : '';
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }, 500);
}

/**
 * Pattern capture keyboard handlers (Cmd+Opt+R)
 * Store focused panel when capture starts, use it when capture stops
 */
let captureTargetPanel = null;

function initializePatternCaptureKeys() {
  document.addEventListener('keydown', (e) => {
    const modifier = (e.metaKey || e.ctrlKey) && e.altKey;

    if (modifier && e.code === 'KeyR') {
      e.preventDefault();

      if (!patternCapture) {
        console.warn('[PatternCapture] Not initialized yet');
        return;
      }

      if (!patternCapture.captureMode) {
        const started = patternCapture.startCapture();
        if (started) {
          // Store which panel was focused when starting capture
          captureTargetPanel = findFocusedPanel();
          if (captureTargetPanel) {
            const editorView = panelCoordinator.getPanelEditor(captureTargetPanel);
            if (editorView) {
              editorView.contentDOM.blur();
              console.log(`[PatternCapture] Started capture for panel: ${captureTargetPanel}`);
            }
          }
          showCaptureIndicator(true);
        }
      } else {
        const pattern = patternCapture.stopCapture();
        showCaptureIndicator(false);

        if (pattern) {
          // Use stored panel instead of finding focused panel (which was blurred)
          if (captureTargetPanel && captureTargetPanel !== MASTER_PANEL_ID) {
            const editorView = panelCoordinator.getPanelEditor(captureTargetPanel);
            if (editorView) {
              mergePatternIntoEditor(editorView, pattern);
              console.log(`[PatternCapture] Merged into ${captureTargetPanel}`);
              // Refocus editor after inserting pattern
              editorView.focus();
            }
          } else {
            console.log(`[PatternCapture] Generated pattern: ${pattern}`);
            console.log('  No valid target panel - focus a panel before starting capture');
          }
          captureTargetPanel = null;
        }
      }
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement && (activeElement.closest('.cm-content') || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    if (patternCapture && patternCapture.captureMode) {
      if (patternCapture.isMappedKey(e.key)) {
        e.preventDefault();
        patternCapture.captureKeyDown(e.key, performance.now());
        flashCaptureKey(e.key);
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.closest('.cm-content') || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    if (patternCapture && patternCapture.isMappedKey(e.key)) {
      patternCapture.captureKeyUp(e.key, performance.now());
    }
  });

  console.log('✓ Pattern capture keyboard handlers initialized');
}

/**
 * Show/hide capture indicator
 */
function showCaptureIndicator(show) {
  let indicator = document.getElementById('capture-indicator');

  if (show && !indicator) {
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
 */
function flashCaptureKey(key) {
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

  const note = patternCapture.keyMap[key];
  flash.textContent = `${key.toUpperCase()} → ${note}`;
  document.body.appendChild(flash);

  setTimeout(() => flash.remove(), 300);
}

/**
 * Merge captured pattern into existing code
 */
function mergePatternIntoEditor(editorView, newPattern) {
  const currentCode = editorView.state.doc.toString();
  const stackMatch = currentCode.match(/stack\s*\(/);

  if (stackMatch) {
    const insertPos = stackMatch.index + stackMatch[0].length;
    const insertion = `\n  ${newPattern},`;
    editorView.dispatch({
      changes: { from: insertPos, insert: insertion }
    });
  } else {
    const endPos = currentCode.length;
    const insertion = `\n\n${newPattern}`;
    editorView.dispatch({
      changes: { from: endPos, insert: insertion }
    });
  }
}

/**
 * Initialize pattern capture UI controls (RECORD button, cycle length, duration mode)
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
    if (patternCapture) {
      patternCapture.updateConfig({ chunkSize: cycleLength });
      console.log(`[PatternCapture] Cycle length set to ${cycleLength}`);
    }
  });

  // Wire up duration mode checkbox
  durationModeCheckbox.addEventListener('change', (e) => {
    if (patternCapture) {
      patternCapture.updateConfig({ durationMode: e.target.checked });
    }
  });

  // Wire up RECORD button
  recordBtn.addEventListener('click', () => {
    if (!patternCapture) {
      console.warn('[PatternCapture] Not initialized yet');
      return;
    }

    if (!patternCapture.captureMode) {
      // Start recording
      const started = patternCapture.startCapture();
      if (started) {
        // Store which panel was focused when starting capture
        captureTargetPanel = findFocusedPanel();
        if (captureTargetPanel) {
          const editorView = panelCoordinator.getPanelEditor(captureTargetPanel);
          if (editorView) {
            editorView.contentDOM.blur();
            console.log(`[PatternCapture] Started capture for panel: ${captureTargetPanel}`);
          }
        }

        // Update UI - add recording class (CSS swaps colors)
        recordBtn.classList.add('recording');
        showCaptureIndicator(true);
      }
    } else {
      // Stop recording
      const pattern = patternCapture.stopCapture();

      // Update UI - remove recording class
      recordBtn.classList.remove('recording');
      showCaptureIndicator(false);

      if (pattern) {
        // Use stored panel
        if (captureTargetPanel && captureTargetPanel !== MASTER_PANEL_ID) {
          const editorView = panelCoordinator.getPanelEditor(captureTargetPanel);
          if (editorView) {
            mergePatternIntoEditor(editorView, pattern);
            console.log(`[PatternCapture] Merged into ${captureTargetPanel}`);
            editorView.focus();
          }
        } else {
          console.log(`[PatternCapture] Generated pattern: ${pattern}`);
          console.log('  No valid target panel - focus a panel before starting capture');
        }
        captureTargetPanel = null;
      }
    }
  });

  console.log('✓ Pattern capture UI initialized');
}

// ===== EVENT HANDLERS =====

// Handle panel activation (play/update pattern)
eventBus.on('panel:buttonClicked', async ({ panelId, button }) => {
  if (button === 'activate') {
    const panel = getPanel(panelId);
    if (!panel) return;

    const editorView = panelCoordinator.getPanelEditor(panelId);
    if (!editorView) return;

    const code = editorView.state.doc.toString().trim();

    if (!code) {
      console.log(`Panel ${panelId}: No code to evaluate`);
      return;
    }

    // Validate code
    const validation = await patternValidator.validateCode(panelId);
    if (!validation.valid) {
      patternValidator.displayError(panelId, validation.error, validation.line);
      return;
    }

    // Transpile code WITH .p() included, then evaluate
    try {
      const codeWithP = `${code}.p('${panelId}')`;
      const { output } = transpiler(codeWithP, { addReturn: false });
      await evaluate(output, true, false);

      // Update state
      updatePanel(panelId, { playing: true, stale: false, lastEvaluatedCode: code });
      patternValidator.clearErrorMessage(panelId);
      eventBus.emit('panel:evaluated', { panelId, code });
      eventBus.emit('panel:playingChanged', { panelId, playing: true });

    } catch (error) {
      console.error(`Panel ${panelId}: Evaluation error`, error);
      patternValidator.displayError(panelId, error.message, error.line || 'unknown');
    }

  } else if (button === 'pause') {
    scheduler.stop(panelId);
    // Keep stale flag when pausing - don't clear it
    updatePanel(panelId, { playing: false });
    eventBus.emit('panel:playingChanged', { panelId, playing: false });

  } else if (button === 'delete') {
    scheduler.stop(panelId);
    deletePanel(panelId);
  }
});

// Handle stop all
eventBus.on('stopAll:trigger', () => {
  scheduler.stop(); // Stop all patterns
  const allPanels = Array.from(getAllPanels().values());
  allPanels.forEach(panel => {
    // Keep stale flags when stopping - don't clear them
    updatePanel(panel.id, { playing: false });
  });
});

// Handle update all stale panels
eventBus.on('updateAll:trigger', async () => {
  const allPanels = Array.from(getAllPanels().values());
  const stalePanels = allPanels.filter(p => p.stale && !p.playing);

  console.log(`[UpdateAll] All panels:`, allPanels.map(p => ({ id: p.id, stale: p.stale, playing: p.playing })));
  console.log(`[UpdateAll] Stale panels:`, stalePanels.map(p => p.id));

  if (stalePanels.length === 0) {
    console.log('No stale panels to update');
    return;
  }

  console.log(`Updating ${stalePanels.length} stale panel(s)`);

  // Update each stale panel by triggering activate
  for (const panel of stalePanels) {
    eventBus.emit('panel:buttonClicked', { panelId: panel.id, button: 'activate' });
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between panels
  }
});

// Update UPDATE ALL button when panel code changes (might affect staleness)
eventBus.on('panel:codeChanged', () => {
  updateAllButton();
});

// Update UPDATE ALL button when panel staleness changes
eventBus.on('panel:stale', () => {
  updateAllButton();
});

// Update UPDATE ALL button when panels are activated/paused
eventBus.on('panel:playingChanged', () => {
  updateAllButton();
});

// ===== INITIALIZATION SEQUENCE =====

// Load settings first (synchronous)
appSettings = loadSettings();

// Start auto-save timer
startAutoSaveTimer(appSettings.behavior?.autoSaveInterval || 'manual');

// Apply appearance settings IMMEDIATELY (colors, fonts, etc.)
applyAllAppearanceSettings(appSettings);

// Apply panel opacities after panels render (delayed for DOM ready)
setTimeout(() => {
  updatePanelOpacities();
}, 100);

// Initialize UI
initializeCards();
initializeSettingsModal();
initializeKeyboardShortcuts();
initializePatternCaptureKeys();

// Set initial UPDATE ALL button state (disabled, no stale panels on load)
setTimeout(() => {
  updateAllButton();
}, 200);

// Initialize Strudel (async - samples, REPL)
initializeStrudel();
