/**
 * API Server Entry Point
 * Express server with REST API endpoints and WebSocket support
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import panelRoutes from './routes/panels.js';
import authMiddleware from './middleware/auth.js';
import { initializeWebSocket } from './websocket.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Apply auth middleware to all /api/* routes
app.use('/api', authMiddleware);

// Routes
app.use('/api/panels', panelRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server (for WebSocket integration)
const server = createServer(app);

// Initialize WebSocket server
initializeWebSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 API server listening on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server available at ws://localhost:${PORT}/ws`);
  console.log(`🔐 API authentication: ${process.env.API_KEY ? 'enabled' : 'disabled (dev mode)'}`);
});

export default server;
