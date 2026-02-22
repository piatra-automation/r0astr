/**
 * Plugin Manager
 *
 * Core plugin lifecycle management:
 * - Module discovery and registration
 * - Plugin loading, initialization, and teardown
 * - Hook management and execution
 * - Plugin state persistence
 *
 * @module pluginManager
 */

import { eventBus } from '../utils/eventBus.js';
import {
  validatePlugin,
  validateManifest,
  normalizeManifest,
  VALID_HOOKS
} from './pluginValidator.js';
import { createSandbox, PluginSandbox } from './pluginSandbox.js';

/**
 * Storage key for plugin state
 * @type {string}
 */
const STORAGE_KEY = 'r0astr_plugins';

/**
 * Plugin lifecycle states
 * @enum {string}
 */
export const PluginState = {
  DISCOVERED: 'discovered',   // Found but not loaded
  LOADING: 'loading',         // Currently loading
  LOADED: 'loaded',           // Loaded but not initialized
  INITIALIZING: 'initializing', // Running init hooks
  ACTIVE: 'active',           // Fully active
  ERROR: 'error',             // Failed to load/init
  DISABLED: 'disabled',       // Manually disabled
  UNLOADING: 'unloading'      // Being unloaded
};

/**
 * Registry of all discovered plugins
 * @type {Map<string, PluginEntry>}
 */
const plugins = new Map();

/**
 * Registered hooks by event name
 * @type {Map<string, Array<{pluginName: string, handler: Function, priority: number}>>}
 */
const hooks = new Map();

/**
 * Active sandboxes by plugin name
 * @type {Map<string, PluginSandbox>}
 */
const sandboxes = new Map();

/**
 * Plugin load order (for dependency resolution)
 * @type {string[]}
 */
let loadOrder = [];

/**
 * Whether the plugin system is initialized
 * @type {boolean}
 */
let initialized = false;

/**
 * @typedef {Object} PluginEntry
 * @property {string} name - Plugin identifier
 * @property {Object} manifest - Plugin manifest
 * @property {PluginState} state - Current lifecycle state
 * @property {Object|null} exports - Plugin exports after loading
 * @property {string|null} error - Error message if state is ERROR
 * @property {boolean} enabled - Whether plugin is enabled
 * @property {Object} settings - Plugin-specific settings
 */

/**
 * Initialize the plugin system
 * Loads plugin state and discovers available plugins
 * @returns {Promise<void>}
 */
export async function initializePluginSystem() {
  if (initialized) {
    console.warn('[PluginManager] Already initialized');
    return;
  }

  console.log('[PluginManager] Initializing plugin system...');

  // Load persisted plugin state
  loadPluginState();

  // Initialize hooks map
  for (const hook of VALID_HOOKS) {
    if (!hooks.has(hook)) {
      hooks.set(hook, []);
    }
  }

  // Set up event bus listeners for plugin events
  setupEventListeners();

  initialized = true;

  // Emit system ready event
  eventBus.emit('plugin:systemReady', {
    pluginCount: plugins.size,
    hooks: Array.from(hooks.keys())
  });

  console.log(`[PluginManager] Plugin system initialized with ${plugins.size} plugins`);
}

/**
 * Set up event bus listeners for plugin management
 * @private
 */
function setupEventListeners() {
  // Handle permission requests from plugins
  eventBus.on('plugin:requestPermission', async ({ pluginName, permission }) => {
    console.log(`[PluginManager] Permission request from ${pluginName}: ${permission}`);

    // For now, auto-deny all runtime permission requests
    // In future, this could show a UI prompt
    eventBus.emit('plugin:permissionResponse', {
      pluginName,
      permission,
      granted: false
    });
  });

  // Handle plugin errors
  eventBus.on('plugin:error', ({ pluginName, error }) => {
    console.error(`[PluginManager] Plugin error from ${pluginName}:`, error);
    const plugin = plugins.get(pluginName);
    if (plugin) {
      plugin.state = PluginState.ERROR;
      plugin.error = error.message || String(error);
    }
  });
}

/**
 * Register a plugin from manifest and files
 * @param {Object} manifest - Plugin manifest object
 * @param {Object} files - Map of file paths to content
 * @returns {Object} { success: boolean, errors: string[], warnings: string[] }
 */
export function registerPlugin(manifest, files) {
  // Validate the plugin
  const validation = validatePlugin(manifest, files);

  if (!validation.valid) {
    console.error(`[PluginManager] Plugin validation failed:`, validation.errors);
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }

  // Normalize manifest with defaults
  const normalizedManifest = normalizeManifest(manifest);
  const pluginName = normalizedManifest.name;

  // Check for duplicate
  if (plugins.has(pluginName)) {
    return {
      success: false,
      errors: [`Plugin '${pluginName}' is already registered`],
      warnings: validation.warnings
    };
  }

  // Create plugin entry
  const entry = {
    name: pluginName,
    manifest: normalizedManifest,
    files,
    state: PluginState.DISCOVERED,
    exports: null,
    error: null,
    enabled: true,
    settings: {}
  };

  plugins.set(pluginName, entry);

  // Emit discovery event
  eventBus.emit('plugin:discovered', {
    name: pluginName,
    version: normalizedManifest.version,
    description: normalizedManifest.description
  });

  console.log(`[PluginManager] Plugin '${pluginName}' registered (v${normalizedManifest.version})`);

  return {
    success: true,
    errors: [],
    warnings: validation.warnings
  };
}

/**
 * Load a registered plugin
 * Creates sandbox and executes main module
 * @param {string} pluginName - Plugin identifier
 * @returns {Promise<Object>} { success: boolean, error: string|null }
 */
export async function loadPlugin(pluginName) {
  const entry = plugins.get(pluginName);

  if (!entry) {
    return { success: false, error: `Plugin '${pluginName}' not found` };
  }

  if (entry.state === PluginState.ACTIVE) {
    return { success: true, error: null };
  }

  if (entry.state === PluginState.LOADING || entry.state === PluginState.INITIALIZING) {
    return { success: false, error: `Plugin '${pluginName}' is already loading` };
  }

  if (!entry.enabled) {
    return { success: false, error: `Plugin '${pluginName}' is disabled` };
  }

  // Check dependencies
  const depCheck = checkDependencies(pluginName);
  if (!depCheck.satisfied) {
    entry.state = PluginState.ERROR;
    entry.error = `Missing dependencies: ${depCheck.missing.join(', ')}`;
    return { success: false, error: entry.error };
  }

  // Load dependencies first
  for (const dep of entry.manifest.dependencies || []) {
    const depResult = await loadPlugin(dep);
    if (!depResult.success) {
      entry.state = PluginState.ERROR;
      entry.error = `Failed to load dependency '${dep}': ${depResult.error}`;
      return { success: false, error: entry.error };
    }
  }

  try {
    entry.state = PluginState.LOADING;

    // Create sandbox
    const sandbox = createSandbox(
      pluginName,
      entry.manifest.permissions || [],
      {
        allowedDomains: entry.manifest.allowedDomains || []
      }
    );
    sandboxes.set(pluginName, sandbox);

    // Get main entry file
    const mainFile = entry.manifest.main || 'index.js';
    const mainCode = entry.files[mainFile];

    if (!mainCode) {
      throw new Error(`Main file '${mainFile}' not found`);
    }

    // Execute module in sandbox
    const exports = await sandbox.executeModule(mainCode, {
      // Provide plugin API
      registerHook: (event, handler, priority = 0) => {
        registerHook(pluginName, event, handler, priority);
      },
      unregisterHook: (event, handler) => {
        unregisterHook(pluginName, event, handler);
      },
      getPluginAPI: () => getPluginAPI(pluginName)
    });

    entry.exports = exports;
    entry.state = PluginState.LOADED;

    // Add to load order
    if (!loadOrder.includes(pluginName)) {
      loadOrder.push(pluginName);
    }

    console.log(`[PluginManager] Plugin '${pluginName}' loaded`);

    // Emit loaded event
    eventBus.emit('plugin:loaded', {
      name: pluginName,
      version: entry.manifest.version
    });

    return { success: true, error: null };

  } catch (e) {
    entry.state = PluginState.ERROR;
    entry.error = e.message;

    // Clean up sandbox
    const sandbox = sandboxes.get(pluginName);
    if (sandbox) {
      sandbox.destroy();
      sandboxes.delete(pluginName);
    }

    console.error(`[PluginManager] Failed to load plugin '${pluginName}':`, e);
    return { success: false, error: e.message };
  }
}

/**
 * Initialize a loaded plugin
 * Runs init hooks and activates the plugin
 * @param {string} pluginName - Plugin identifier
 * @returns {Promise<Object>} { success: boolean, error: string|null }
 */
export async function initializePlugin(pluginName) {
  const entry = plugins.get(pluginName);

  if (!entry) {
    return { success: false, error: `Plugin '${pluginName}' not found` };
  }

  if (entry.state === PluginState.ACTIVE) {
    return { success: true, error: null };
  }

  if (entry.state !== PluginState.LOADED) {
    return { success: false, error: `Plugin '${pluginName}' must be loaded first (current state: ${entry.state})` };
  }

  try {
    entry.state = PluginState.INITIALIZING;

    // Call plugin's init function if exported
    if (entry.exports && typeof entry.exports.init === 'function') {
      const sandbox = sandboxes.get(pluginName);
      if (sandbox) {
        await sandbox.execute(`
          if (typeof exports.init === 'function') {
            await exports.init();
          }
        `, { exports: entry.exports });
      }
    }

    entry.state = PluginState.ACTIVE;

    // Emit activated event
    eventBus.emit('plugin:activated', {
      name: pluginName,
      version: entry.manifest.version
    });

    console.log(`[PluginManager] Plugin '${pluginName}' activated`);

    return { success: true, error: null };

  } catch (e) {
    entry.state = PluginState.ERROR;
    entry.error = e.message;

    console.error(`[PluginManager] Failed to initialize plugin '${pluginName}':`, e);
    return { success: false, error: e.message };
  }
}

/**
 * Load and initialize a plugin
 * Convenience method combining load and init
 * @param {string} pluginName - Plugin identifier
 * @returns {Promise<Object>} { success: boolean, error: string|null }
 */
export async function activatePlugin(pluginName) {
  const loadResult = await loadPlugin(pluginName);
  if (!loadResult.success) {
    return loadResult;
  }

  return await initializePlugin(pluginName);
}

/**
 * Unload a plugin
 * Cleans up hooks, sandbox, and resources
 * @param {string} pluginName - Plugin identifier
 * @returns {Promise<Object>} { success: boolean, error: string|null }
 */
export async function unloadPlugin(pluginName) {
  const entry = plugins.get(pluginName);

  if (!entry) {
    return { success: false, error: `Plugin '${pluginName}' not found` };
  }

  if (entry.state === PluginState.DISCOVERED || entry.state === PluginState.DISABLED) {
    return { success: true, error: null };
  }

  try {
    entry.state = PluginState.UNLOADING;

    // Call plugin's destroy function if exported
    if (entry.exports && typeof entry.exports.destroy === 'function') {
      const sandbox = sandboxes.get(pluginName);
      if (sandbox) {
        try {
          await sandbox.execute(`
            if (typeof exports.destroy === 'function') {
              await exports.destroy();
            }
          `, { exports: entry.exports });
        } catch (e) {
          console.warn(`[PluginManager] Error in destroy hook for '${pluginName}':`, e);
        }
      }
    }

    // Unregister all hooks
    unregisterAllHooks(pluginName);

    // Destroy sandbox
    const sandbox = sandboxes.get(pluginName);
    if (sandbox) {
      sandbox.destroy();
      sandboxes.delete(pluginName);
    }

    // Clear exports
    entry.exports = null;
    entry.state = PluginState.DISCOVERED;
    entry.error = null;

    // Remove from load order
    loadOrder = loadOrder.filter(n => n !== pluginName);

    // Emit unloaded event
    eventBus.emit('plugin:unloaded', {
      name: pluginName
    });

    console.log(`[PluginManager] Plugin '${pluginName}' unloaded`);

    return { success: true, error: null };

  } catch (e) {
    console.error(`[PluginManager] Error unloading plugin '${pluginName}':`, e);
    entry.state = PluginState.ERROR;
    entry.error = e.message;
    return { success: false, error: e.message };
  }
}

/**
 * Enable a disabled plugin
 * @param {string} pluginName - Plugin identifier
 * @returns {boolean} Success status
 */
export function enablePlugin(pluginName) {
  const entry = plugins.get(pluginName);
  if (!entry) return false;

  entry.enabled = true;
  entry.state = PluginState.DISCOVERED;
  entry.error = null;

  savePluginState();

  eventBus.emit('plugin:enabled', { name: pluginName });
  console.log(`[PluginManager] Plugin '${pluginName}' enabled`);

  return true;
}

/**
 * Disable a plugin
 * @param {string} pluginName - Plugin identifier
 * @returns {Promise<boolean>} Success status
 */
export async function disablePlugin(pluginName) {
  const entry = plugins.get(pluginName);
  if (!entry) return false;

  // Unload first if active
  if (entry.state === PluginState.ACTIVE || entry.state === PluginState.LOADED) {
    await unloadPlugin(pluginName);
  }

  entry.enabled = false;
  entry.state = PluginState.DISABLED;

  savePluginState();

  eventBus.emit('plugin:disabled', { name: pluginName });
  console.log(`[PluginManager] Plugin '${pluginName}' disabled`);

  return true;
}

/**
 * Remove a plugin completely
 * @param {string} pluginName - Plugin identifier
 * @returns {Promise<boolean>} Success status
 */
export async function removePlugin(pluginName) {
  // Unload first
  await unloadPlugin(pluginName);

  const removed = plugins.delete(pluginName);

  if (removed) {
    savePluginState();
    eventBus.emit('plugin:removed', { name: pluginName });
    console.log(`[PluginManager] Plugin '${pluginName}' removed`);
  }

  return removed;
}

/**
 * Register a hook handler
 * @param {string} pluginName - Plugin identifier
 * @param {string} event - Hook event name
 * @param {Function} handler - Handler function
 * @param {number} priority - Execution priority (lower = earlier)
 */
export function registerHook(pluginName, event, handler, priority = 0) {
  if (!VALID_HOOKS.includes(event)) {
    console.warn(`[PluginManager] Unknown hook event: ${event}`);
    return;
  }

  if (!hooks.has(event)) {
    hooks.set(event, []);
  }

  const hookList = hooks.get(event);
  hookList.push({ pluginName, handler, priority });

  // Sort by priority
  hookList.sort((a, b) => a.priority - b.priority);

  console.debug(`[PluginManager] Hook registered: ${event} by ${pluginName}`);
}

/**
 * Unregister a specific hook handler
 * @param {string} pluginName - Plugin identifier
 * @param {string} event - Hook event name
 * @param {Function} handler - Handler function to remove
 */
export function unregisterHook(pluginName, event, handler) {
  if (!hooks.has(event)) return;

  const hookList = hooks.get(event);
  const index = hookList.findIndex(h => h.pluginName === pluginName && h.handler === handler);

  if (index !== -1) {
    hookList.splice(index, 1);
    console.debug(`[PluginManager] Hook unregistered: ${event} by ${pluginName}`);
  }
}

/**
 * Unregister all hooks for a plugin
 * @param {string} pluginName - Plugin identifier
 */
export function unregisterAllHooks(pluginName) {
  for (const [event, hookList] of hooks) {
    const filtered = hookList.filter(h => h.pluginName !== pluginName);
    hooks.set(event, filtered);
  }
  console.debug(`[PluginManager] All hooks unregistered for ${pluginName}`);
}

/**
 * Execute all hooks for an event
 * @param {string} event - Hook event name
 * @param {Object} data - Data to pass to handlers
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} { results: any[], errors: Error[] }
 */
export async function executeHooks(event, data = {}, options = {}) {
  if (!hooks.has(event)) {
    return { results: [], errors: [] };
  }

  const hookList = hooks.get(event);
  const results = [];
  const errors = [];

  for (const { pluginName, handler } of hookList) {
    const entry = plugins.get(pluginName);

    // Skip if plugin is not active
    if (!entry || entry.state !== PluginState.ACTIVE) {
      continue;
    }

    try {
      const result = await handler(data);
      results.push({ pluginName, result });
    } catch (e) {
      console.error(`[PluginManager] Hook error (${event}) from ${pluginName}:`, e);
      errors.push({ pluginName, error: e });

      // Optionally stop on error
      if (options.stopOnError) {
        break;
      }
    }
  }

  return { results, errors };
}

/**
 * Check if plugin dependencies are satisfied
 * @param {string} pluginName - Plugin identifier
 * @returns {Object} { satisfied: boolean, missing: string[] }
 */
export function checkDependencies(pluginName) {
  const entry = plugins.get(pluginName);
  if (!entry) {
    return { satisfied: false, missing: [] };
  }

  const dependencies = entry.manifest.dependencies || [];
  const missing = [];

  for (const dep of dependencies) {
    if (!plugins.has(dep)) {
      missing.push(dep);
    }
  }

  return {
    satisfied: missing.length === 0,
    missing
  };
}

/**
 * Get plugin API for inter-plugin communication
 * @param {string} pluginName - Plugin identifier
 * @returns {Object|null} Plugin's exported API
 */
export function getPluginAPI(pluginName) {
  const entry = plugins.get(pluginName);
  if (!entry || entry.state !== PluginState.ACTIVE) {
    return null;
  }

  // Return frozen exports to prevent modification
  return entry.exports ? Object.freeze({ ...entry.exports }) : null;
}

/**
 * Get plugin info
 * @param {string} pluginName - Plugin identifier
 * @returns {Object|null} Plugin information
 */
export function getPlugin(pluginName) {
  const entry = plugins.get(pluginName);
  if (!entry) return null;

  return {
    name: entry.name,
    version: entry.manifest.version,
    description: entry.manifest.description,
    author: entry.manifest.author,
    state: entry.state,
    enabled: entry.enabled,
    error: entry.error,
    permissions: entry.manifest.permissions || [],
    hooks: entry.manifest.hooks || []
  };
}

/**
 * Get all registered plugins
 * @returns {Object[]} Array of plugin info objects
 */
export function getAllPlugins() {
  return Array.from(plugins.keys()).map(name => getPlugin(name));
}

/**
 * Get plugins by state
 * @param {PluginState} state - State to filter by
 * @returns {Object[]} Array of plugin info objects
 */
export function getPluginsByState(state) {
  return getAllPlugins().filter(p => p.state === state);
}

/**
 * Load plugin state from localStorage
 * @private
 */
function loadPluginState() {
  if (typeof localStorage === 'undefined') return;

  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return;

    const state = JSON.parse(json);

    // Restore plugin enabled/disabled state and settings
    if (state.plugins && Array.isArray(state.plugins)) {
      for (const saved of state.plugins) {
        if (plugins.has(saved.name)) {
          const entry = plugins.get(saved.name);
          entry.enabled = saved.enabled !== false;
          entry.settings = saved.settings || {};
          if (!entry.enabled) {
            entry.state = PluginState.DISABLED;
          }
        }
      }
    }

    // Restore load order
    if (state.loadOrder && Array.isArray(state.loadOrder)) {
      loadOrder = state.loadOrder.filter(n => plugins.has(n));
    }

    console.log('[PluginManager] Plugin state loaded');
  } catch (e) {
    console.warn('[PluginManager] Failed to load plugin state:', e);
  }
}

/**
 * Save plugin state to localStorage
 * @private
 */
function savePluginState() {
  if (typeof localStorage === 'undefined') return;

  try {
    const state = {
      plugins: Array.from(plugins.values()).map(entry => ({
        name: entry.name,
        enabled: entry.enabled,
        settings: entry.settings
      })),
      loadOrder
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
    console.debug('[PluginManager] Plugin state saved');
  } catch (e) {
    console.warn('[PluginManager] Failed to save plugin state:', e);
  }
}

/**
 * Update plugin settings
 * @param {string} pluginName - Plugin identifier
 * @param {Object} settings - Settings to merge
 * @returns {boolean} Success status
 */
export function updatePluginSettings(pluginName, settings) {
  const entry = plugins.get(pluginName);
  if (!entry) return false;

  entry.settings = { ...entry.settings, ...settings };
  savePluginState();

  eventBus.emit('plugin:settingsChanged', {
    name: pluginName,
    settings: entry.settings
  });

  return true;
}

/**
 * Get plugin settings
 * @param {string} pluginName - Plugin identifier
 * @returns {Object|null} Plugin settings
 */
export function getPluginSettings(pluginName) {
  const entry = plugins.get(pluginName);
  return entry ? { ...entry.settings } : null;
}

/**
 * Activate all enabled plugins
 * Loads and initializes plugins in dependency order
 * @returns {Promise<Object>} { activated: string[], failed: Array<{name: string, error: string}> }
 */
export async function activateAllPlugins() {
  const activated = [];
  const failed = [];

  // Get enabled plugins
  const enabledPlugins = Array.from(plugins.entries())
    .filter(([_, entry]) => entry.enabled && entry.state === PluginState.DISCOVERED)
    .map(([name]) => name);

  // Sort by dependencies (simple topological sort)
  const sorted = sortByDependencies(enabledPlugins);

  for (const pluginName of sorted) {
    const result = await activatePlugin(pluginName);
    if (result.success) {
      activated.push(pluginName);
    } else {
      failed.push({ name: pluginName, error: result.error });
    }
  }

  console.log(`[PluginManager] Activated ${activated.length} plugins, ${failed.length} failed`);

  return { activated, failed };
}

/**
 * Sort plugins by dependencies (topological sort)
 * @param {string[]} pluginNames - List of plugin names
 * @returns {string[]} Sorted list
 * @private
 */
function sortByDependencies(pluginNames) {
  const visited = new Set();
  const result = [];

  function visit(name) {
    if (visited.has(name)) return;
    visited.add(name);

    const entry = plugins.get(name);
    if (!entry) return;

    for (const dep of entry.manifest.dependencies || []) {
      if (pluginNames.includes(dep)) {
        visit(dep);
      }
    }

    result.push(name);
  }

  for (const name of pluginNames) {
    visit(name);
  }

  return result;
}

/**
 * Deactivate all plugins
 * @returns {Promise<void>}
 */
export async function deactivateAllPlugins() {
  // Unload in reverse order
  const toUnload = [...loadOrder].reverse();

  for (const pluginName of toUnload) {
    await unloadPlugin(pluginName);
  }

  console.log('[PluginManager] All plugins deactivated');
}

/**
 * Check if plugin system is initialized
 * @returns {boolean}
 */
export function isInitialized() {
  return initialized;
}

/**
 * Shutdown the plugin system
 * @returns {Promise<void>}
 */
export async function shutdownPluginSystem() {
  if (!initialized) return;

  console.log('[PluginManager] Shutting down plugin system...');

  // Execute beforeUnload hooks
  await executeHooks('app:beforeUnload', {});

  // Deactivate all plugins
  await deactivateAllPlugins();

  // Save state
  savePluginState();

  // Clear all hooks
  hooks.clear();

  initialized = false;

  eventBus.emit('plugin:systemShutdown', {});

  console.log('[PluginManager] Plugin system shut down');
}
