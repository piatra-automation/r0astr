/**
 * WebSocket Server for r0astr Remote Control
 *
 * Provides real-time control of panels from remote devices (iPad, laptop, etc.)
 * Extensible protocol for future features like panel creation, content updates, etc.
 */

import { WebSocketServer } from 'ws';

/**
 * Message Protocol:
 *
 * Client → Server (Commands):
 * - { type: 'panel.toggle', panel: 1-4 }
 * - { type: 'panel.play', panel: 1-4 }
 * - { type: 'panel.pause', panel: 1-4 }
 * - { type: 'panel.update', panel: 1-4, data: { code: '...' } }
 * - { type: 'panel.create', data: { name: '...', code: '...' } }
 * - { type: 'panel.delete', panel: 1-4 }
 * - { type: 'global.stopAll' }
 * - { type: 'global.updateAll' }
 * - { type: 'client.register', clientType: 'remote' | 'main' }
 *
 * Server → Client (State Updates):
 * - { type: 'state.update', panels: [...] }
 * - { type: 'state.panel', panel: 1-4, state: { playing: true/false } }
 */

let wss;
const clients = new Map(); // Store client metadata
let panelManagerRef = null; // Reference to panelManager (set by vite.config.mjs)

export function createWebSocketServer(server) {
  wss = new WebSocketServer({
    noServer: true, // Don't attach to HTTP server directly
  });

  // Handle WebSocket upgrade requests only for /ws path
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, 'http://localhost');

    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Let Vite handle other paths (HMR, etc.)
  });

  console.log('[WebSocket] Server initialized on path /ws');

  wss.on('connection', (ws, req) => {
    const clientId = Math.random().toString(36).substring(7);
    clients.set(ws, {
      id: clientId,
      type: 'unknown',
      connectedAt: new Date()
    });

    console.log(`[WebSocket] Client ${clientId} connected (${clients.size} total)`);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        handleMessage(ws, message);
      } catch (err) {
        console.error('[WebSocket] Failed to parse message:', err);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid JSON'
        }));
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      console.log(`[WebSocket] Client ${client?.id} disconnected`);
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Client error:', err);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'server.hello',
      clientId,
      timestamp: Date.now()
    }));
  });

  return wss;
}

function handleMessage(ws, message) {
  const { type, panel, data, clientType } = message;

  // Debug: log all message types (throttle metronome)
  if (type !== 'metronome.step' || message.step === 0) {
    console.log(`[WebSocket] handleMessage type='${type}'`);
  }

  // Handle client registration
  if (type === 'client.register') {
    const client = clients.get(ws);
    if (client) {
      client.type = clientType || 'unknown';
      console.log(`[WebSocket] Client ${client.id} registered as ${client.type}`);

      // Story 8.4: Request full_state from main client for remote clients
      // Server doesn't maintain authoritative state - main client does
      if (clientType === 'remote') {
        // Ask main client to send full_state to this remote
        broadcastToMain({
          type: 'server.requestFullState',
          targetClientId: client.id
        });
        console.log(`[WebSocket] Requested full_state from main client for remote ${client.id}`);
      }
    }
    return;
  }

  // Handle panel state sync from client
  if (type === 'client.syncPanels') {
    if (!panelManagerRef) {
      console.error('[WebSocket] Panel manager not initialized, cannot sync panels');
      return;
    }

    const { panels } = message;
    if (!Array.isArray(panels)) {
      console.error('[WebSocket] Invalid panel sync data: panels must be an array');
      return;
    }

    console.log(`[WebSocket] Syncing ${panels.length} panels from client to server`);

    // Clear existing panels on server (except master panel)
    const existingPanels = panelManagerRef.getAllPanels();
    existingPanels.forEach((panel, panelId) => {
      if (panelId !== 'master-panel') {
        existingPanels.delete(panelId);
      }
    });

    // Add all panels from client
    let syncedCount = 0;
    panels.forEach((panelData) => {
      // Skip master panel (it's not managed by panelManager in the same way)
      if (panelData.id === 'master-panel') {
        return;
      }

      try {
        panelManagerRef.createPanel({
          id: panelData.id,
          title: panelData.title,
          code: panelData.code,
          position: panelData.position,
          size: panelData.size,
          playing: panelData.playing || false,
          zIndex: panelData.zIndex
        });
        syncedCount++;
      } catch (error) {
        console.error(`[WebSocket] Failed to sync panel ${panelData.id}:`, error);
      }
    });

    console.log(`[WebSocket] Successfully synced ${syncedCount} panels to server`);
    return;
  }

  // Handle state updates from main interface -> broadcast to remote controls
  if (type === 'state.update') {
    console.log(`[WebSocket] State update from main interface`);
    broadcastToRemote(message);
    return;
  }

  // Story 8.1-8.3: Handle panel event broadcasts from main interface
  if (type === 'panel_created' || type === 'panel_deleted' || type === 'panel_renamed') {
    console.log(`[WebSocket] ${type} event from main interface`);
    broadcastToRemote(message);
    return;
  }

  // Story 8.4: Handle full_state from main client - broadcast to all remotes
  if (type === 'full_state') {
    console.log(`[WebSocket] Received full_state from main, broadcasting to remotes`);
    broadcastToRemote(message);
    return;
  }

  // Handle master slider broadcasts from main interface
  if (type === 'master.sliders') {
    console.log(`[WebSocket] Master sliders from main interface`);
    broadcastToRemote(message);
    return;
  }

  if (type === 'master.sliderValue') {
    console.log(`[WebSocket] Master slider value update from main interface`);
    broadcastToRemote(message);
    return;
  }

  // Handle master slider changes from remote -> forward to main
  if (type === 'master.sliderChange') {
    console.log(`[WebSocket] Master slider change from remote`);
    broadcastToMain(message, ws);
    return;
  }

  // Handle panel slider broadcasts from main interface
  if (type === 'panel.sliders') {
    console.log(`[WebSocket] Panel sliders from main interface`);
    broadcastToRemote(message);
    return;
  }

  if (type === 'panel.sliderValue') {
    console.log(`[WebSocket] Panel slider value update from main interface`);
    broadcastToRemote(message);
    return;
  }

  // Handle panel slider changes from remote -> forward to main
  if (type === 'panel.sliderChange') {
    console.log(`[WebSocket] Panel slider change from remote`);
    broadcastToMain(message, ws);
    return;
  }

  // Handle metronome step updates from main -> broadcast to remotes
  if (type === 'metronome.step') {
    // Debug: log step 0 to confirm server is receiving
    if (message.step === 0) {
      const remoteCount = [...clients.values()].filter(c => c.type === 'remote').length;
      console.log(`[WebSocket] Server received step 0, broadcasting to ${remoteCount} remotes`);
    }
    broadcastToRemote(message);
    return;
  }

  // Log command
  console.log(`[WebSocket] Command: ${type}`, panel ? `panel ${panel}` : '');

  // Broadcast to all main interface clients (not the sender)
  broadcastToMain(message, ws);
}

/**
 * Broadcast message to all "main" interface clients (not remote controls)
 */
function broadcastToMain(message, excludeWs = null) {
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === 1) {
      const clientInfo = clients.get(client);
      // Send to main interface clients only (not remote controls)
      if (clientInfo?.type === 'main' || clientInfo?.type === 'unknown') {
        client.send(JSON.stringify(message));
      }
    }
  });
}

/**
 * Broadcast message to all remote control clients
 */
function broadcastToRemote(message) {
  if (!wss) return;

  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      const clientInfo = clients.get(client);
      // Send to remote controls only
      if (clientInfo?.type === 'remote') {
        client.send(messageStr);
        sentCount++;
      }
    }
  });

  // Debug: log metronome step 0 broadcasts
  if (message.type === 'metronome.step' && message.step === 0) {
    console.log(`[WebSocket] broadcastToRemote sent to ${sentCount} clients`);
  }
}

/**
 * Broadcast state update to all remote control clients (legacy function)
 */
export function broadcastState(state) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'state.update',
    ...state,
    timestamp: Date.now()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      const clientInfo = clients.get(client);
      // Send state updates to remote controls
      if (clientInfo?.type === 'remote') {
        client.send(message);
      }
    }
  });
}

export function getWebSocketServer() {
  return wss;
}

/**
 * Set panelManager reference (called from vite.config.mjs)
 */
export function setPanelManager(manager) {
  panelManagerRef = manager;
  console.log('[WebSocket] Panel manager reference set');
}

/**
 * Broadcast message to ALL connected clients (main + remote)
 * Used by Express API server to notify all clients of changes
 */
export function broadcastToAll(message) {
  if (!wss) {
    console.warn('[WebSocket] Server not initialized');
    return;
  }

  const messageStr = JSON.stringify(message);
  let clientCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(messageStr);
      clientCount++;
    }
  });

  console.log(`[WebSocket] Broadcasted '${message.type}' to ${clientCount} clients`);
}
