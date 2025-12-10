/**
 * Shared Application State
 * Central state store for r0astr - imported by all managers
 *
 * This module holds core state that multiple managers need access to.
 * State is initialized by main.js during app startup.
 */

import { getAudioContext } from '@strudel/webaudio';

// === PANEL STATE ===
// Tracks playing/stale status for each panel
// Key: panelId, Value: { playing: boolean, stale: boolean, lastEvaluatedCode: string }
export const cardStates = {};

// === EDITOR STATE ===
// CodeMirror 6 editor instances
// Key: panelId, Value: EditorView
export const editorViews = new Map();

// Font size compartments for dynamic updates
// Key: panelId, Value: Compartment
export const fontSizeCompartments = new Map();

// Mini notation locations for pattern highlighting
// Key: panelId, Value: [[start, end], ...]
export const panelMiniLocations = new Map();

// === AUDIO CONTEXT ===
// Shared Web Audio context
export const ctx = getAudioContext();

// === STRUDEL CORE ===
// Set by main.js after REPL initialization
// Using object to allow mutation from importing modules
export const strudelCore = {
  evaluate: null,
  scheduler: null
};

// === APP STATE FLAGS ===
export const appState = {
  samplesReady: false,
  masterPanelCompact: true
};

// === PATTERN CAPTURE ===
export const patternCaptureRef = {
  instance: null
};
