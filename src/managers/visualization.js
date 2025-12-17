/**
 * Visualization Manager
 * Handles metronome indicator and pattern highlighting animation
 */

import { cardStates, editorViews, strudelCore } from '../state.js';
import { getSettings } from './settingsManager.js';
import { highlightMiniLocations } from '@strudel/codemirror';
import { MASTER_PANEL_ID } from './panelManager.js';

/**
 * Initialize 16-step sequencer indicator
 * Shows cycle position as 16 illuminated boxes (1/16th note resolution)
 */
export function initializeMetronome() {
  const sequencer = document.getElementById('metronome');
  if (!sequencer) {
    console.warn('Step sequencer element not found');
    return;
  }

  const stepBoxes = sequencer.querySelectorAll('.step-box');
  if (stepBoxes.length !== 16) {
    console.warn('Expected 16 step boxes, found', stepBoxes.length);
    return;
  }

  let lastStep = -1;
  let isAnyPanelPlaying = false;
  let animationFrameId = null;

  // Check if any panel is playing
  function updatePlayingState() {
    isAnyPanelPlaying = Object.values(cardStates).some(state => state.playing);

    if (isAnyPanelPlaying) {
      sequencer.classList.add('active');
      if (!animationFrameId) {
        startSequencerLoop();
      }
    } else {
      sequencer.classList.remove('active');
      // Clear all active steps when stopped
      stepBoxes.forEach(box => box.classList.remove('active', 'beat'));
      lastStep = -1;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  }

  // Animation loop that updates step position
  function startSequencerLoop() {
    function loop() {
      if (!isAnyPanelPlaying) {
        animationFrameId = null;
        return;
      }

      const cyclePosition = strudelCore.scheduler.now();
      // Get fractional part of cycle (0.0 to 1.0)
      const fraction = cyclePosition - Math.floor(cyclePosition);
      // Convert to step (0-15)
      const currentStep = Math.floor(fraction * 16);

      if (currentStep !== lastStep) {
        // Update step boxes
        stepBoxes.forEach((box, index) => {
          if (index === currentStep) {
            box.classList.add('active');
            // Brief "beat" flash for emphasis
            box.classList.add('beat');
            setTimeout(() => box.classList.remove('beat'), 50);
          } else {
            box.classList.remove('active');
          }
        });

        // Highlight downbeats (steps 0, 4, 8, 12) more prominently
        if (currentStep % 4 === 0) {
          sequencer.classList.add('downbeat');
          setTimeout(() => sequencer.classList.remove('downbeat'), 80);
        }

        lastStep = currentStep;
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    loop();
  }

  // Update sequencer state when panels play/pause
  window.addEventListener('panel-state-changed', updatePlayingState);

  console.log('✓ Step sequencer initialized (16 steps per cycle)');
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
