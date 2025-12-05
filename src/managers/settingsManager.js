/**
 * Settings Manager - Handles localStorage persistence and settings CRUD
 *
 * @module settingsManager
 */

const STORAGE_KEY = 'r0astr_settings';

/**
 * Default settings schema
 * @type {Object}
 */
export const DEFAULT_SETTINGS = {
  version: 1,                     // Schema version for migration
  yolo: false,                    // Skip deletion confirmations
  colorScheme: 'dark',            // Theme selection: 'dark', 'light'
  fontSize: 14,                   // Code editor font size (10-24px) - Story 4.5
  panelOpacity: 95,               // DEPRECATED: Use activePanelOpacity instead
  activePanelOpacity: 95,         // Active (focused) panel background opacity (50-100%)
  backgroundPanelOpacity: 60,     // Background (unfocused) panels cumulative opacity (20-100%)
  collapseOnBlur: false,          // Collapse unfocused panels to mini-view (header only)
  animationSpeed: 'normal',       // UI animation speed: 'slow', 'normal', 'fast', 'disabled' - Story 4.5
  wrap_lines: false,              // Line wrapping in code panels (true = wrap, false = scroll) - Story 7.1
  auto_format: false,             // Auto-format code on PLAY/UPDATE (true = format, false = no format) - Story 7.4
  syntax_highlight: true,         // Enable syntax highlighting (true = CodeMirror, false = plain) - Story 7.6
  editor_theme: 'atomone',        // CodeMirror theme: 'atomone', 'abcdef', 'bespin', 'dracula', 'gruvboxDark', 'materialDark', 'nord', 'solarizedDark' - Story 7.6
  default_w: 600,                 // Default panel width in px (300-2000) - Story 7.2
  default_h: 400,                 // Default panel height in px (200-1500) - Story 7.2
  text: {                         // Text editor settings - Story 7.5
    colors: {
      functions: '#61afef',       // Blue (Atom One Dark theme)
      strings: '#98c379',         // Green
      numbers: '#d19a66',         // Orange
      comments: '#5c6370',        // Gray
      operators: '#c678dd'        // Purple
    }
  },
  behavior: {
    autoSaveInterval: 'manual',   // 'manual', '30s', '1min', '5min'
    restoreSession: true,         // Restore panel state on load
    confirmationDialogs: true     // Show confirmation prompts
  },
  projection: {
    marginTop: 0,                 // Top margin in px for projection (0-200)
    marginRight: 0,               // Right margin in px for projection (0-200)
    marginBottom: 0,              // Bottom margin in px for projection (0-200)
    marginLeft: 0                 // Left margin in px for projection (0-200)
  },
  advanced: {
    show_tempo_knob: true,        // Show automatic TEMPO control (CPM/BPM)
    show_cpm: false               // Display as CPM (true) or BPM (false)
  },
  snippetLocation: '',            // URL/path to snippet JSON
  remoteWSLayout: 'side-panel',   // 'side-panel', 'modal', 'hidden'
  skinPack: ''                    // Path to WinAmp-style skin folder (future)
};

// Current settings in memory
let currentSettings = { ...DEFAULT_SETTINGS };

/**
 * Validate and sanitize settings object
 * @param {Object} settings - Settings to validate
 * @returns {Object} Validated and sanitized settings
 */
function validateSettings(settings) {
  const valid = { ...settings };

  // Validate version
  if (typeof valid.version !== 'number') {
    valid.version = 1;
  }

  // Validate colorScheme
  const allowedSchemes = ['dark', 'light'];
  if (!allowedSchemes.includes(valid.colorScheme)) {
    console.warn(`Invalid colorScheme: ${valid.colorScheme}, using default`);
    valid.colorScheme = 'dark';
  }

  // Validate yolo flag
  valid.yolo = Boolean(valid.yolo);

  // Validate wrap_lines flag (Story 7.1)
  valid.wrap_lines = Boolean(valid.wrap_lines);

  // Validate auto_format flag (Story 7.4)
  valid.auto_format = Boolean(valid.auto_format);

  // Validate syntax_highlight flag (Story 7.6)
  valid.syntax_highlight = valid.syntax_highlight !== false; // Default true

  // Validate editor_theme (Story 7.6)
  const allowedThemes = ['atomone', 'abcdef', 'bespin', 'dracula', 'gruvboxDark', 'materialDark', 'nord', 'solarizedDark'];
  if (!allowedThemes.includes(valid.editor_theme)) {
    console.warn(`Invalid editor_theme: ${valid.editor_theme}, using default (atomone)`);
    valid.editor_theme = 'atomone';
  }

  // Validate animationSpeed
  const allowedSpeeds = ['slow', 'normal', 'fast', 'disabled'];
  if (!allowedSpeeds.includes(valid.animationSpeed)) {
    console.warn(`Invalid animationSpeed: ${valid.animationSpeed}, using default (normal)`);
    valid.animationSpeed = 'normal';
  }

  // Validate default_w (Story 7.2: width 300-2000px)
  if (typeof valid.default_w !== 'number' || valid.default_w < 300 || valid.default_w > 2000) {
    console.warn(`Invalid default_w: ${valid.default_w}, using default (600)`);
    valid.default_w = 600;
  }

  // Validate default_h (Story 7.2: height 200-1500px)
  if (typeof valid.default_h !== 'number' || valid.default_h < 200 || valid.default_h > 1500) {
    console.warn(`Invalid default_h: ${valid.default_h}, using default (400)`);
    valid.default_h = 400;
  }

  // Validate text object (Story 7.5)
  if (!valid.text || typeof valid.text !== 'object') {
    valid.text = { ...DEFAULT_SETTINGS.text };
  }
  if (!valid.text.colors || typeof valid.text.colors !== 'object') {
    valid.text.colors = { ...DEFAULT_SETTINGS.text.colors };
  }
  // Validate each color is a valid hex color
  const hexColorRegex = /^#[0-9A-F]{6}$/i;
  Object.keys(DEFAULT_SETTINGS.text.colors).forEach(key => {
    if (!valid.text.colors[key] || !hexColorRegex.test(valid.text.colors[key])) {
      console.warn(`Invalid color for ${key}: ${valid.text.colors[key]}, using default`);
      valid.text.colors[key] = DEFAULT_SETTINGS.text.colors[key];
    }
  });

  // Validate behavior object
  if (!valid.behavior || typeof valid.behavior !== 'object') {
    valid.behavior = { ...DEFAULT_SETTINGS.behavior };
  }

  // Validate behavior.autoSaveInterval
  const allowedIntervals = ['manual', '30s', '1min', '5min'];
  if (!allowedIntervals.includes(valid.behavior.autoSaveInterval)) {
    console.warn(`Invalid autoSaveInterval: ${valid.behavior.autoSaveInterval}, using default`);
    valid.behavior.autoSaveInterval = 'manual';
  }

  // Validate behavior boolean flags
  valid.behavior.restoreSession = Boolean(valid.behavior.restoreSession);
  valid.behavior.confirmationDialogs = Boolean(valid.behavior.confirmationDialogs);

  // Validate projection margins (Story: Projection tweaks for screen sharing)
  if (!valid.projection || typeof valid.projection !== 'object') {
    valid.projection = { ...DEFAULT_SETTINGS.projection };
  }
  ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].forEach(margin => {
    const value = Number(valid.projection[margin]);
    if (isNaN(value) || value < 0 || value > 200) {
      console.warn(`Invalid projection.${margin}: ${valid.projection[margin]}, using 0`);
      valid.projection[margin] = 0;
    } else {
      valid.projection[margin] = Math.round(value);
    }
  });

  // Validate advanced object
  if (!valid.advanced || typeof valid.advanced !== 'object') {
    valid.advanced = { ...DEFAULT_SETTINGS.advanced };
  }

  // Validate advanced boolean flags
  valid.advanced.show_tempo_knob = valid.advanced.show_tempo_knob !== false; // Default true
  valid.advanced.show_cpm = Boolean(valid.advanced.show_cpm);

  // Validate remoteWSLayout
  const allowedLayouts = ['side-panel', 'modal', 'hidden'];
  if (!allowedLayouts.includes(valid.remoteWSLayout)) {
    console.warn(`Invalid remoteWSLayout: ${valid.remoteWSLayout}, using default`);
    valid.remoteWSLayout = 'side-panel';
  }

  // Validate string fields
  valid.snippetLocation = String(valid.snippetLocation || '');
  valid.skinPack = String(valid.skinPack || '');

  return valid;
}

/**
 * Migrate settings from old version to current version
 * @param {Object} settings - Settings to migrate
 * @returns {Object} Migrated settings
 */
function migrateSettings(settings) {
  const currentVersion = DEFAULT_SETTINGS.version;
  const settingsVersion = settings.version || 0;

  if (settingsVersion === currentVersion) {
    return settings;
  }

  console.log(`Migrating settings from version ${settingsVersion} to ${currentVersion}`);

  // Future migrations go here
  // Example:
  // if (settingsVersion < 2) {
  //   settings.newField = 'defaultValue';
  //   settings.version = 2;
  // }

  settings.version = currentVersion;
  return settings;
}

/**
 * Load settings from localStorage
 * @returns {Object} Loaded settings or defaults if not found/invalid
 */
export function loadSettings() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);

    if (!json) {
      console.log('No saved settings found, using defaults');
      currentSettings = { ...DEFAULT_SETTINGS };
      return currentSettings;
    }

    const loadedSettings = JSON.parse(json);

    // Merge with defaults (fill missing keys)
    const mergedSettings = { ...DEFAULT_SETTINGS, ...loadedSettings };

    // Migrate if needed
    const migratedSettings = migrateSettings(mergedSettings);

    // Validate and sanitize
    currentSettings = validateSettings(migratedSettings);

    console.log('Settings loaded successfully:', currentSettings);
    return currentSettings;
  } catch (error) {
    console.error('Failed to load settings, using defaults:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
    return currentSettings;
  }
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object to save
 * @returns {boolean} True if save succeeded, false otherwise
 */
export function saveSettings(settings) {
  try {
    // Validate before saving
    const validSettings = validateSettings(settings);

    // Pretty-print for readability in localStorage
    const json = JSON.stringify(validSettings, null, 2);

    localStorage.setItem(STORAGE_KEY, json);
    currentSettings = validSettings;

    console.log('Settings saved successfully');
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      alert('Cannot save settings: storage quota exceeded. Clear browser data or use fewer panels.');
    } else {
      console.error('Failed to save settings:', error);
      alert('Settings could not be saved. Check browser console for details.');
    }
    return false;
  }
}

/**
 * Get current settings
 * @returns {Object} Current settings object
 */
export function getSettings() {
  return { ...currentSettings };
}

/**
 * Update a specific setting and auto-save
 * Supports nested keys using dot notation (e.g., 'behavior.autoSaveInterval')
 * @param {string} key - Setting key to update
 * @param {*} value - New value
 */
let saveTimeout;
export function updateSetting(key, value) {
  // Handle nested keys (e.g., 'behavior.autoSaveInterval')
  const keys = key.split('.');
  const newSettings = { ...currentSettings };

  let target = newSettings;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }

  target[keys[keys.length - 1]] = value;

  // Update in-memory settings
  currentSettings = newSettings;

  // Debounce save to prevent excessive writes
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveSettings(currentSettings);
  }, 200); // Wait 200ms before saving
}

/**
 * Reset settings to defaults
 * @returns {boolean} True if reset succeeded
 */
export function resetSettings() {
  currentSettings = { ...DEFAULT_SETTINGS };
  return saveSettings(currentSettings);
}
