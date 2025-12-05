/**
 * WebSocket Broadcast Utilities
 * Manages WebSocket connections and broadcasts messages to all connected clients
 */

import { WebSocketServer } from 'ws';

let wss;

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 */
export function initializeWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server initialized on /ws');
}

/**
 * Broadcast message to all connected WebSocket clients
 * @param {Object} message - Message object to broadcast
 */
export function broadcastWebSocket(message) {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }

  const data = JSON.stringify(message);
  let clientCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(data);
      clientCount++;
    }
  });

  console.log(`Broadcasted to ${clientCount} WebSocket clients:`, message.type);
}
