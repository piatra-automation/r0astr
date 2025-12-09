/**
 * WebSocket Manager
 * Handles WebSocket connection for remote control integration
 */

import { eventBus } from '../utils/eventBus.js';

/**
 * Message types for WebSocket communication
 * @constant
 */
export const MESSAGE_TYPES = {
  // Incoming (remote → main)
  PANEL_PLAY: 'panel.play',
  PANEL_PAUSE: 'panel.pause',
  PANEL_TOGGLE: 'panel.toggle',
  PANEL_UPDATE_CODE: 'panel.updateCode',
  STOP_ALL: 'global.stopAll',
  UPDATE_ALL: 'global.updateAll',
  REQUEST_STATE: 'server.requestFullState',
  SLIDER_CHANGE: 'master.sliderChange',

  // Outgoing (main → remote)
  PANEL_CREATED: 'panel_created',
  PANEL_DELETED: 'panel_deleted',
  PANEL_RENAMED: 'panel_renamed',
  PANEL_STATE_CHANGED: 'panel_state_changed',
  PANEL_SLIDERS: 'panel_sliders',
  MASTER_SLIDERS: 'master.sliders',
  STATE_SYNC: 'full_state',
  CLIENT_REGISTER: 'client.register',
  CLIENT_SYNC_PANELS: 'client.syncPanels'
};

// Module-private WebSocket instance
let ws = null;
let wsReconnectTimer = null;
let outgoingListenersSetup = false;

/**
 * Connect to WebSocket server
 * @param {string} url - WebSocket URL (default: auto-detect from window.location)
 * @returns {void}
 *
 * @example
 * connect('ws://localhost:8080/ws');
 */
export function connect(url) {
  // Auto-detect URL if not provided
  if (!url) {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5173';
    url = `${protocol}//${host}/ws`;
  }

  console.log('[WebSocket] Connecting to:', url);

  ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('[WebSocket] Connected to server');

    // Register as main interface client
    send(MESSAGE_TYPES.CLIENT_REGISTER, { clientType: 'main' });

    // Setup outgoing event listeners (once)
    if (!outgoingListenersSetup) {
      setupOutgoingListeners();
      outgoingListenersSetup = true;
    }

    // Emit connection event
    eventBus.emit('websocket:connected', { url });

    // Clear reconnect timer
    if (wsReconnectTimer) {
      clearTimeout(wsReconnectTimer);
      wsReconnectTimer = null;
    }
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleMessage(message);
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('[WebSocket] Error:', error);
    eventBus.emit('websocket:error', { error });
  };

  ws.onclose = () => {
    console.log('[WebSocket] Disconnected - will reconnect in 3s');
    ws = null;

    eventBus.emit('websocket:disconnected');

    // Auto-reconnect after 3 seconds
    wsReconnectTimer = setTimeout(() => {
      connect(url);
    }, 3000);
  };
}

/**
 * Handle incoming WebSocket message
 * @private
 * @param {Object} message - Parsed WebSocket message
 * @returns {void}
 */
function handleMessage(message) {
  const { type, panel, data, panels, sliderId, value } = message;

  console.log('[WebSocket] Received:', type, panel ? `panel: ${panel}` : '');

  switch (type) {
    case 'server.hello':
      console.log('[WebSocket] Server hello:', message);
      break;

    case MESSAGE_TYPES.REQUEST_STATE:
      // Server requests full state sync
      eventBus.emit('websocket:requestState');
      break;

    case MESSAGE_TYPES.PANEL_TOGGLE:
      if (panel) {
        eventBus.emit('panel:toggle', panel);
      }
      break;

    case MESSAGE_TYPES.PANEL_PLAY:
      if (panel) {
        eventBus.emit('panel:play', panel);
      }
      break;

    case MESSAGE_TYPES.PANEL_PAUSE:
      if (panel) {
        eventBus.emit('panel:pause', panel);
      }
      break;

    case MESSAGE_TYPES.PANEL_UPDATE_CODE:
      if (data) {
        eventBus.emit('panel:updateCode', data);
      }
      break;

    case MESSAGE_TYPES.STOP_ALL:
      eventBus.emit('stopAll');
      break;

    case MESSAGE_TYPES.UPDATE_ALL:
      eventBus.emit('updateAll');
      break;

    case MESSAGE_TYPES.SLIDER_CHANGE:
      if (sliderId !== undefined && value !== undefined) {
        eventBus.emit('slider:remoteChange', { sliderId, value });
      }
      break;

    default:
      console.warn('[WebSocket] Unknown message type:', type);
  }
}

/**
 * Send message to WebSocket server
 * @param {string} type - Message type
 * @param {*} payload - Message payload
 * @returns {boolean} True if sent, false if not connected
 *
 * @example
 * send('panel_created', { id: 'panel-1', title: 'Bass' });
 */
export function send(type, payload = {}) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
    return true;
  }
  return false;
}

/**
 * Broadcast message to WebSocket server (alias for send)
 * @param {string} type - Message type
 * @param {*} payload - Message payload
 * @returns {boolean} True if sent, false if not connected
 */
export function broadcast(type, payload) {
  return send(type, payload);
}

/**
 * Setup listeners for outgoing events from event bus
 * @private
 * @returns {void}
 */
function setupOutgoingListeners() {
  // Panel lifecycle events
  eventBus.on('panel:created', (data) => {
    send(MESSAGE_TYPES.PANEL_CREATED, {
      id: data.id,
      title: data.title,
      code: data.code
    });
  });

  eventBus.on('panel:deleted', (panelId) => {
    send(MESSAGE_TYPES.PANEL_DELETED, { panel: panelId });
  });

  eventBus.on('panel:codeUpdated', (data) => {
    // Only broadcast if significant code change (not just keystrokes)
    // This could be debounced in the future
    send(MESSAGE_TYPES.PANEL_UPDATE_CODE, {
      panelId: data.panelId,
      code: data.code
    });
  });

  eventBus.on('panel:playingChanged', (data) => {
    send(MESSAGE_TYPES.PANEL_STATE_CHANGED, {
      panel: data.panelId,
      playing: data.playing
    });
  });

  // Slider events
  eventBus.on('slider:changed', (data) => {
    send(MESSAGE_TYPES.PANEL_SLIDERS, {
      panelId: data.panelId,
      sliderId: data.sliderId,
      value: data.value
    });
  });

  eventBus.on('sliders:rendered', (data) => {
    send(MESSAGE_TYPES.PANEL_SLIDERS, {
      panelId: data.panelId,
      sliders: data.sliders
    });
  });

  console.log('[WebSocket] Outgoing event listeners setup complete');
}

/**
 * Disconnect WebSocket connection
 * @returns {void}
 */
export function disconnect() {
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }

  console.log('[WebSocket] Disconnected');
}

/**
 * Check if WebSocket is currently connected
 * @returns {boolean} True if connected, false otherwise
 */
export function isConnected() {
  return ws?.readyState === WebSocket.OPEN;
}

/**
 * Get current WebSocket connection state
 * @returns {number|null} WebSocket.readyState or null if not initialized
 */
export function getConnectionState() {
  return ws?.readyState ?? null;
}

/**
 * Get connection state as human-readable string
 * @returns {string} Connection state description
 */
export function getConnectionStateString() {
  if (!ws) return 'DISCONNECTED';

  switch (ws.readyState) {
    case WebSocket.CONNECTING:
      return 'CONNECTING';
    case WebSocket.OPEN:
      return 'OPEN';
    case WebSocket.CLOSING:
      return 'CLOSING';
    case WebSocket.CLOSED:
      return 'CLOSED';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Sync full panel state to WebSocket server
 * @param {Array} panels - Array of panel state objects
 * @returns {boolean} True if sent, false if not connected
 */
export function syncPanelState(panels) {
  return send(MESSAGE_TYPES.CLIENT_SYNC_PANELS, { panels });
}

/**
 * Send full state to remote clients (via server)
 * @param {Object} state - Full application state
 * @returns {boolean} True if sent, false if not connected
 */
export function sendFullState(state) {
  return send(MESSAGE_TYPES.STATE_SYNC, state);
}
