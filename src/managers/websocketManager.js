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
  PANEL_SLIDER_CHANGE: 'panel.sliderChange',
  STOP_ALL: 'global.stopAll',
  UPDATE_ALL: 'global.updateAll',
  REQUEST_STATE: 'server.requestFullState',
  SLIDER_CHANGE: 'master.sliderChange',

  // Incoming (API/server → main)
  PANEL_CREATED_API: 'panel_created',
  PANEL_DELETED_API: 'panel_deleted',
  PANEL_UPDATED_API: 'panel_updated',
  PLAYBACK_CHANGED_API: 'playback_changed',
  FULL_STATE_INCOMING: 'full_state',

  // Outgoing (main → remote)
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
 * Emits events for all message types - main.js wires listeners
 * @private
 * @param {Object} message - Parsed WebSocket message
 * @returns {void}
 */
function handleMessage(message) {
  const { type, panel, data, panelId, sliderId, value, code, title, position, size, playing, autoPlay } = message;

  console.log('[WebSocket] Received:', type, panel || panelId ? `panel: ${panel || panelId}` : '');

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
        eventBus.emit('panel:remotePlay', panel);
      }
      break;

    case MESSAGE_TYPES.PANEL_PAUSE:
      if (panel) {
        eventBus.emit('panel:remotePause', panel);
      }
      break;

    case MESSAGE_TYPES.PANEL_UPDATE_CODE:
      if (data) {
        eventBus.emit('panel:updateCode', data);
      }
      break;

    case MESSAGE_TYPES.STOP_ALL:
      eventBus.emit('global:stopAll');
      break;

    case MESSAGE_TYPES.UPDATE_ALL:
      eventBus.emit('global:updateAll');
      break;

    case MESSAGE_TYPES.SLIDER_CHANGE:
      if (sliderId !== undefined && value !== undefined) {
        eventBus.emit('slider:masterRemoteChange', { sliderId, value });
      }
      break;

    case MESSAGE_TYPES.PANEL_SLIDER_CHANGE:
      if (panelId && sliderId !== undefined && value !== undefined) {
        eventBus.emit('slider:panelRemoteChange', { panelId, sliderId, value });
      }
      break;

    // API/Server initiated events
    case MESSAGE_TYPES.PANEL_CREATED_API:
      if (panelId || message.panelId) {
        eventBus.emit('panel:apiCreated', {
          panelId: panelId || message.panelId,
          title: title || message.title,
          code: code || message.code || '',
          position: position || message.position,
          size: size || message.size
        });
      }
      break;

    case MESSAGE_TYPES.PANEL_DELETED_API:
      if (panelId || message.panelId) {
        eventBus.emit('panel:apiDeleted', { panelId: panelId || message.panelId });
      }
      break;

    case MESSAGE_TYPES.PANEL_UPDATED_API:
      if (panelId || message.panelId) {
        eventBus.emit('panel:apiUpdated', {
          panelId: panelId || message.panelId,
          code: code || message.code,
          autoPlay: autoPlay || message.autoPlay || false
        });
      }
      break;

    case MESSAGE_TYPES.PLAYBACK_CHANGED_API:
      if ((panelId || message.panelId) && (playing !== undefined || message.playing !== undefined)) {
        eventBus.emit('panel:apiPlaybackChanged', {
          panelId: panelId || message.panelId,
          playing: playing !== undefined ? playing : message.playing
        });
      }
      break;

    case MESSAGE_TYPES.FULL_STATE_INCOMING:
      // Main interface should ignore these (intended for remote clients)
      console.log('[WebSocket] Ignoring full_state message (intended for remote clients)');
      break;

    case 'panel.update':
      // Legacy: Remote code update
      if (panel && data && data.code) {
        eventBus.emit('panel:legacyUpdate', { panel, code: data.code });
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
