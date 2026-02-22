/**
 * Plugin System
 *
 * Foundational plugin loading system with module discovery,
 * validation, and initialization. Provides plugin lifecycle
 * management and sandboxing primitives for secure third-party
 * code execution.
 *
 * @module plugins
 *
 * @example
 * import {
 *   initializePluginSystem,
 *   registerPlugin,
 *   activatePlugin,
 *   executeHooks
 * } from './plugins/index.js';
 *
 * // Initialize the plugin system
 * await initializePluginSystem();
 *
 * // Register a plugin from manifest and files
 * const result = registerPlugin(manifest, files);
 *
 * // Activate the plugin
 * await activatePlugin('my-plugin');
 *
 * // Execute hooks
 * await executeHooks('panel:beforeCreate', { panelId: 'panel-1' });
 */

// Export plugin manager (lifecycle management)
export {
  initializePluginSystem,
  registerPlugin,
  loadPlugin,
  initializePlugin,
  activatePlugin,
  unloadPlugin,
  enablePlugin,
  disablePlugin,
  removePlugin,
  registerHook,
  unregisterHook,
  unregisterAllHooks,
  executeHooks,
  checkDependencies,
  getPluginAPI,
  getPlugin,
  getAllPlugins,
  getPluginsByState,
  updatePluginSettings,
  getPluginSettings,
  activateAllPlugins,
  deactivateAllPlugins,
  isInitialized,
  shutdownPluginSystem,
  PluginState
} from './pluginManager.js';

// Export plugin validator
export {
  validatePlugin,
  validateManifest,
  validateCode,
  validateFiles,
  normalizeManifest,
  VALID_HOOKS,
  VALID_PERMISSIONS
} from './pluginValidator.js';

// Export plugin sandbox
export {
  PluginSandbox,
  createSandbox
} from './pluginSandbox.js';
