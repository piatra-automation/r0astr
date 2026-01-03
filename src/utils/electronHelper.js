/**
 * Electron Integration Helper
 * 
 * Provides a unified API that works in both browser and Electron environments.
 * In browser: functions are no-ops or use fallbacks
 * In Electron: uses the IPC bridge exposed by preload.js
 */

// Check if running in Electron
export const isElectron = typeof window !== 'undefined' && 
  window.electronAPI?.isElectron === true;

/**
 * Initialize Electron event handlers
 * Call this once from main.js after your app is initialized
 *
 * @param {Object} handlers - Event handler callbacks
 * @param {Function} handlers.onPanicStopAll - Called when panic shortcut triggered
 * @param {Function} handlers.onTogglePanel - Called with panel number (1-8)
 * @param {Function} handlers.onStopAllPanels - Called when stop-all triggered
 * @param {Function} handlers.onPlayAllPanels - Called when play-all triggered
 * @param {Function} handlers.onPerformanceModeChanged - Called with boolean
 * @param {Function} handlers.onNewPanel - Called when Cmd+N pressed (Electron menu)
 * @param {Function} handlers.onDeletePanel - Called when Cmd+W pressed (Electron menu)
 * @param {Function} handlers.onTogglePlayback - Called when Cmd+P pressed (Electron menu)
 * @param {Function} handlers.onUpdatePanel - Called when Cmd+Up pressed (Electron menu)
 * @param {Function} handlers.onUpdateAll - Called when Cmd+U pressed (Electron menu)
 * @param {Function} handlers.onStopAll - Called when Cmd+. pressed (Electron menu)
 * @param {Function} handlers.onOpenSettings - Called when Cmd+, pressed (Electron menu)
 */
export function initElectronHandlers(handlers) {
  if (!isElectron) {
    console.log('[Electron] Not running in Electron, skipping handler setup');
    return;
  }

  console.log('[Electron] Initializing event handlers');

  const api = window.electronAPI;

  if (handlers.onPanicStopAll) {
    api.onPanicStopAll(handlers.onPanicStopAll);
  }

  if (handlers.onTogglePanel) {
    api.onTogglePanel(handlers.onTogglePanel);
  }

  if (handlers.onStopAllPanels) {
    api.onStopAllPanels(handlers.onStopAllPanels);
  }

  if (handlers.onPlayAllPanels) {
    api.onPlayAllPanels(handlers.onPlayAllPanels);
  }

  if (handlers.onPerformanceModeChanged) {
    api.onPerformanceModeChanged(handlers.onPerformanceModeChanged);
  }

  // Menu shortcut handlers (Cmd+N, Cmd+W, Cmd+P, etc.)
  if (handlers.onNewPanel) {
    api.onShortcutNewPanel(handlers.onNewPanel);
  }

  if (handlers.onDeletePanel) {
    api.onShortcutDeletePanel(handlers.onDeletePanel);
  }

  if (handlers.onTogglePlayback) {
    api.onShortcutTogglePlayback(handlers.onTogglePlayback);
  }

  if (handlers.onUpdatePanel) {
    api.onShortcutUpdatePanel(handlers.onUpdatePanel);
  }

  if (handlers.onUpdateAll) {
    api.onShortcutUpdateAll(handlers.onUpdateAll);
  }

  if (handlers.onStopAll) {
    api.onShortcutStopAll(handlers.onStopAll);
  }

  if (handlers.onOpenSettings) {
    api.onShortcutOpenSettings(handlers.onOpenSettings);
  }

  console.log('[Electron] Event handlers registered');
}

/**
 * Get server info (network addresses for remote control)
 * @returns {Promise<{port: number, addresses: Array}>}
 */
export async function getServerInfo() {
  if (!isElectron) {
    // In browser, we can try to get the current host
    return {
      port: parseInt(window.location.port) || 5173,
      addresses: [{
        name: 'current',
        address: window.location.hostname,
        remoteUrl: `${window.location.origin}/remote.html`
      }]
    };
  }
  
  return window.electronAPI.getServerInfo();
}

/**
 * Get current performance mode status
 * @returns {Promise<boolean>}
 */
export async function getPerformanceMode() {
  if (!isElectron) return false;
  return window.electronAPI.getPerformanceMode();
}

/**
 * Set performance mode
 * @param {boolean} enabled
 * @returns {Promise<boolean>}
 */
export async function setPerformanceMode(enabled) {
  if (!isElectron) return false;
  return window.electronAPI.setPerformanceMode(enabled);
}

/**
 * Broadcast a message to all remote control clients
 * @param {Object} message
 */
export function broadcastToRemotes(message) {
  if (!isElectron) {
    // In browser mode, this is handled by WebSocket in main.js
    return;
  }
  window.electronAPI.broadcastToRemotes(message);
}

/**
 * Log Electron status on load
 */
if (typeof window !== 'undefined') {
  if (isElectron) {
    console.log('%c⚡ Running in Electron', 'color: #9b59b6; font-weight: bold;');
    console.log(`   Platform: ${window.electronAPI.platform}`);
  } else {
    console.log('%c🌐 Running in Browser', 'color: #3498db; font-weight: bold;');
  }
}
