/**
 * WebSocket Manager - Lite Mode Stub
 * All functions are no-ops for static deployment without server
 */

// Empty message types (prevents undefined errors)
export const MESSAGE_TYPES = {
  PANEL_PLAY: 'panel.play',
  PANEL_PAUSE: 'panel.pause',
  PANEL_TOGGLE: 'panel.toggle',
  PANEL_UPDATE_CODE: 'panel.updateCode',
  PANEL_SLIDER_CHANGE: 'panel.sliderChange',
  STOP_ALL: 'global.stopAll',
  UPDATE_ALL: 'global.updateAll',
  REQUEST_STATE: 'server.requestFullState',
  SLIDER_CHANGE: 'master.sliderChange',
  PANEL_CREATED_API: 'panel_created',
  PANEL_DELETED_API: 'panel_deleted',
  PANEL_UPDATED_API: 'panel_updated',
  PLAYBACK_CHANGED_API: 'playback_changed',
  FULL_STATE_INCOMING: 'full_state',
  PANEL_CREATED: 'panel_created',
  PANEL_DELETED: 'panel_deleted',
  PANEL_RENAMED: 'panel_renamed',
  PANEL_STATE_CHANGED: 'panel_state_changed',
  PANEL_SLIDERS: 'panel_sliders',
  MASTER_SLIDERS: 'master.sliders',
  STATE_SYNC: 'full_state',
  STATE_UPDATE: 'state.update',
  CLIENT_REGISTER: 'client.register',
  CLIENT_SYNC_PANELS: 'client.syncPanels'
};

/**
 * Connect stub - logs message and does nothing
 */
export function connect(url) {
  console.log('[Lite Mode] WebSocket disabled - running in standalone mode');
}

/**
 * Send stub - always returns false (not connected)
 */
export function send(type, payload = {}) {
  return false;
}

/**
 * Broadcast stub - alias for send
 */
export function broadcast(type, payload) {
  return false;
}

/**
 * Disconnect stub - no-op
 */
export function disconnect() {}

/**
 * isConnected stub - always returns false
 */
export function isConnected() {
  return false;
}

/**
 * getConnectionState stub - returns null
 */
export function getConnectionState() {
  return null;
}

/**
 * getConnectionStateString stub - returns LITE_MODE
 */
export function getConnectionStateString() {
  return 'LITE_MODE';
}

/**
 * syncPanelState stub - returns false
 */
export function syncPanelState(panels) {
  return false;
}

/**
 * sendFullState stub - returns false
 */
export function sendFullState(state) {
  return false;
}
