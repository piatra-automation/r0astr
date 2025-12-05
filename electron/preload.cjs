/**
 * r0astr Electron Preload Script
 * 
 * Exposes a secure API to the renderer process via contextBridge.
 * This is the only way renderer can communicate with main process.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer to interact with main process
contextBridge.exposeInMainWorld('electronAPI', {
  // Performance mode
  getPerformanceMode: () => ipcRenderer.invoke('get-performance-mode'),
  setPerformanceMode: (enabled) => ipcRenderer.invoke('set-performance-mode', enabled),

  // Server info for displaying remote control URLs
  getServerInfo: () => ipcRenderer.invoke('get-server-info'),

  // Broadcast to remote controls
  broadcastToRemotes: (message) => ipcRenderer.send('broadcast-to-remotes', message),

  // Listen for main process events
  onPanicStopAll: (callback) => {
    ipcRenderer.on('panic-stop-all', () => callback());
  },

  onPerformanceModeChanged: (callback) => {
    ipcRenderer.on('performance-mode-changed', (event, enabled) => callback(enabled));
  },

  onTogglePanel: (callback) => {
    ipcRenderer.on('toggle-panel', (event, panelNumber) => callback(panelNumber));
  },

  onStopAllPanels: (callback) => {
    ipcRenderer.on('stop-all-panels', () => callback());
  },

  onPlayAllPanels: (callback) => {
    ipcRenderer.on('play-all-panels', () => callback());
  },

  // Platform info
  platform: process.platform,

  // Check if running in Electron
  isElectron: true
});

// Log that preload is running
console.log('[Preload] r0astr Electron API exposed');
