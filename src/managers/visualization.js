/**
 * Visualization Manager
 * Handles metronome indicator and pattern highlighting animation
 */

import { cardStates, editorViews, strudelCore } from '../state.js';
import { getSettings } from './settingsManager.js';
import { highlightMiniLocations } from '@strudel/codemirror';
import { MASTER_PANEL_ID } from './panelManager.js';

/**
 * Initialize metronome beat indicator
 * Pulses on each cycle boundary when any panel is playing
 */
export function initializeMetronome() {
  const metronome = document.getElementById('metronome');
  if (!metronome) {
    console.warn('Metronome element not found');
    return;
  }

  let lastCycle = -1;
  let isAnyPanelPlaying = false;
  let animationFrameId = null;

  // Check if any panel is playing
  function updatePlayingState() {
    isAnyPanelPlaying = Object.values(cardStates).some(state => state.playing);

    if (isAnyPanelPlaying) {
      metronome.classList.add('active');
      if (!animationFrameId) {
        startMetronomeLoop();
      }
    } else {
      metronome.classList.remove('active');
      metronome.classList.remove('beat');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  }

  // Animation loop that checks for cycle changes
  function startMetronomeLoop() {
    function loop() {
      if (!isAnyPanelPlaying) {
        animationFrameId = null;
        return;
      }

      const currentCycle = Math.floor(strudelCore.scheduler.now());

      if (currentCycle !== lastCycle) {
        // New cycle - trigger beat pulse
        metronome.classList.add('beat');
        setTimeout(() => metronome.classList.remove('beat'), 100);
        lastCycle = currentCycle;
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    loop();
  }

  // Update metronome state when panels play/pause
  window.addEventListener('panel-state-changed', updatePlayingState);

  console.log('✓ Metronome indicator initialized');
}

/**
 * Initialize pattern highlighting animation loop
 * Updates CodeMirror decorations in sync with scheduler playback
 * Filters haps by panel ID to avoid cross-contamination
 */
export function initializePatternHighlighting() {
  let animationFrameId = null;
  let isHighlightingActive = false;
  let lastUpdateTime = 0;
  const UPDATE_INTERVAL_MS = 50; // 20fps throttle

  // Check if any panel is playing
  function isAnyPanelPlaying() {
    return Object.values(cardStates).some(state => state.playing);
  }

  // Start/stop highlighting based on settings and playing state
  function updateHighlightingState() {
    const settings = getSettings();
    const shouldHighlight = settings.pattern_highlighting && isAnyPanelPlaying();

    if (shouldHighlight && !isHighlightingActive) {
      isHighlightingActive = true;
      startHighlightingLoop();
    } else if (!shouldHighlight && isHighlightingActive) {
      isHighlightingActive = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  }

  // Animation loop
  function startHighlightingLoop() {
    function loop() {
      if (!isHighlightingActive) {
        animationFrameId = null;
        return;
      }

      const now = performance.now();

      // Throttle updates to reduce CPU load (20fps)
      if (now - lastUpdateTime < UPDATE_INTERVAL_MS) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      lastUpdateTime = now;
      const currentTime = strudelCore.scheduler.now();
      const begin = Math.floor(currentTime);
      const end = begin + 1;

      try {
        const allHaps = strudelCore.scheduler.pattern.queryArc(begin, end, {
          _cps: strudelCore.scheduler.cps
        });

        // Filter to only haps that are CURRENTLY playing (not future haps in the query arc)
        // queryArc returns all haps in the 1-cycle window, but we only want to highlight
        // the ones actively playing RIGHT NOW
        const activeHaps = allHaps.filter(hap => {
          if (!hap.whole) return false;
          // Check if currentTime falls within this hap's time span
          return currentTime >= hap.whole.begin && currentTime < hap.whole.end;
        });

        // Update each panel - CodeMirror will automatically filter haps
        // by matching context.locations against each editor's miniLocations
        for (const [panelId, view] of editorViews.entries()) {
          if (panelId === MASTER_PANEL_ID) continue; // Skip master

          const panelState = cardStates[panelId];
          if (!panelState || !panelState.playing || panelState.stale) {
            highlightMiniLocations(view, currentTime, []); // Clear if not playing/stale
            continue;
          }

          // Pass only ACTIVE haps (currently playing) to prevent all notes highlighting at once
          highlightMiniLocations(view, currentTime, activeHaps);
        }
      } catch (err) {
        console.warn('[Pattern Highlighting] Error:', err);
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    loop();
  }

  // Listen for panel state changes
  window.addEventListener('panel-state-changed', updateHighlightingState);

  // Listen for settings changes (when user toggles pattern_highlighting)
  window.addEventListener('settings-changed', updateHighlightingState);
}
