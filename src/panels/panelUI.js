/**
 * Panel UI State Management
 *
 * Handles visual state updates for panels:
 * - Button state updates (activate, pause, playback)
 * - Visual indicators (playing, stale, paused states)
 * - Master controls visibility
 */

import { cardStates } from '../state.js';
import { getSettings } from '../managers/settingsManager.js';
import { MASTER_PANEL_ID } from '../managers/panelManager.js';

// Getter function for currentMasterSliders - set by main.js
// Uses getter pattern because main.js reassigns the array
let getMasterSliders = () => [];

/**
 * Set getter function for currentMasterSliders from main.js
 * Needed because currentMasterSliders is defined in main.js and gets reassigned
 * @param {Function} getter - Function that returns current master sliders array
 */
export function setMasterSlidersRef(getter) {
  getMasterSliders = getter;
}

/**
 * Update ACTIVATE button based on panel state
 * Story 6.2: Separate PAUSE and ACTIVATE Buttons
 * Story 7.3: Live Transpilation Validation (disable if invalid)
 * @param {string} panelId - Panel ID
 */
export async function updateActivateButton(panelId) {
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
export function updatePauseButton(panelId) {
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
export function updatePlaybackButton(panelId) {
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
export function updatePanelButtons(panelId) {
  // Legacy layout buttons
  updateActivateButton(panelId);
  updatePauseButton(panelId);
  // Tree layout contextual button
  updatePlaybackButton(panelId);
}

/**
 * Update master panel controls visibility
 * Master sliders should show when ANY panel is playing (not just master)
 * Tempo control should ALWAYS show if enabled in settings
 */
export function updateMasterControlsVisibility() {
  const masterPanel = document.querySelector(`[data-panel-id="${MASTER_PANEL_ID}"]`) ||
                      document.getElementById(MASTER_PANEL_ID);
  if (!masterPanel) return;

  const controlsContainer = masterPanel.querySelector('.panel-controls-container');
  if (!controlsContainer) return;

  const settings = getSettings();
  const details = masterPanel.querySelector('details');
  const isExpanded = details?.open;

  // Check if ANY panel is playing
  const anyPanelPlaying = Object.values(cardStates).some(state => state.playing);

  // Check if tempo control is enabled (should always show if enabled)
  const tempoEnabled = settings.advanced?.show_tempo_knob;

  // Check if master panel has sliders defined
  const hasMasterSliders = getMasterSliders().length > 0;

  // Master controls visible when:
  // 1. Any panel is playing (master sliders affect all panels)
  // 2. OR master panel is expanded
  // 3. OR showControlsWhenCollapsed is enabled
  // 4. OR tempo control is enabled (tempo should always be visible)
  const showControls = anyPanelPlaying || isExpanded || settings.showControlsWhenCollapsed || tempoEnabled;

  controlsContainer.style.display = showControls ? '' : 'none';

  // Log for debugging
  if (showControls && (hasMasterSliders || tempoEnabled)) {
    console.log(`[MasterControls] Visible: anyPlaying=${anyPanelPlaying}, expanded=${isExpanded}, sliders=${hasMasterSliders}, tempo=${tempoEnabled}`);
  }
}

/**
 * Update visual indicators for a panel
 * Handles both tree layout and legacy layout
 * @param {string} panelId - Panel ID
 */
export function updateVisualIndicators(panelId) {
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

  // Update master panel controls visibility (depends on any panel playing)
  updateMasterControlsVisibility();
}
