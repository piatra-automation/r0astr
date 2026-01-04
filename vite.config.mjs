import { defineConfig } from 'vite';
import bundleAudioWorkletPlugin from 'vite-plugin-bundle-audioworklet';
import { createWebSocketServer, broadcastToAll, setPanelManager } from './src/websocket-server.mjs';

// Plugin to add WebSocket server and API routes to Vite
const websocketAndApiPlugin = () => ({
  name: 'websocket-and-api',
  configureServer(server) {
    const wss = createWebSocketServer(server.httpServer);

    // Import panel management functions
    let panelManager;
    import('./src/managers/panelManager.js').then(module => {
      panelManager = module;
      // Set panelManager reference in WebSocket server
      setPanelManager(module);
    });

    // API middleware - runs before Vite's default middleware
    server.middlewares.use('/api/panels', async (req, res, next) => {
      // Only handle POST requests to /api/panels (not sub-paths like /api/panels/:id/code)
      if (req.method !== 'POST' || (req.url && req.url !== '' && req.url !== '/')) {
        next();
        return;
      }

      // Parse request body
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { title, code, position, size } = JSON.parse(body);

          // Validate request body
          if (title !== undefined && typeof title !== 'string') {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'title must be a string' }));
            return;
          }
          if (code !== undefined && typeof code !== 'string') {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'code must be a string' }));
            return;
          }

          // Create panel
          const panelId = panelManager.createPanel({
            title: title || undefined,
            code: code || '',
            position: position || { x: 0, y: 0 },
            size: size || { w: 600, h: 200 }
          });

          // Broadcast WebSocket event
          broadcastToAll({
            type: 'panel_created',
            panelId,
            title,
            code: code || '',
            position: position || { x: 0, y: 0 },
            size: size || { w: 600, h: 200 }
          });

          // Send response
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, panelId }));
        } catch (error) {
          console.error('Error creating panel:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Failed to create panel',
            details: error.message
          }));
        }
      });
    });

    // DELETE /api/panels/:id endpoint
    server.middlewares.use('/api/panels/', async (req, res, next) => {
      // Only handle DELETE requests
      if (req.method !== 'DELETE') {
        next();
        return;
      }

      // Parse panel ID from URL (e.g., /api/panels/panel-123 or /panel-123)
      // Middleware may strip the /api/panels prefix, so we handle both cases
      const match = req.url.match(/\/([^/?]+)$/);
      if (!match) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Panel ID required' }));
        return;
      }

      const panelId = match[1];

      try {
        // Import MASTER_PANEL_ID constant
        const { MASTER_PANEL_ID } = await import('./src/managers/panelManager.js');

        // Protect master panel (403 Forbidden)
        if (panelId === MASTER_PANEL_ID) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Cannot delete master panel',
            message: 'The master panel is protected and cannot be deleted'
          }));
          return;
        }

        // Check if panel exists
        const panel = panelManager.getPanel(panelId);
        if (!panel) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Panel not found' }));
          return;
        }

        // Delete panel (panelManager handles state and DOM cleanup)
        // Note: Audio stopping happens on the client side when they receive the panel_deleted event
        const deleted = panelManager.deletePanel(panelId);

        if (!deleted) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to delete panel' }));
          return;
        }

        // Broadcast WebSocket event to all clients
        broadcastToAll({
          type: 'panel_deleted',
          panelId
        });

        // Send success response
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('Error deleting panel:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Failed to delete panel',
          details: error.message
        }));
      }
    });

    // POST /api/panels/:id/code endpoint
    server.middlewares.use('/api/panels/', async (req, res, next) => {
      // Only handle POST requests to /code path
      if (req.method !== 'POST' || !req.url.match(/\/code$/)) {
        next();
        return;
      }

      // Parse panel ID from URL (e.g., /api/panels/panel-123/code or /panel-123/code)
      const match = req.url.match(/\/([^/]+)\/code$/);
      if (!match) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Panel ID required' }));
        return;
      }

      const panelId = match[1];

      // Parse request body
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { code, autoPlay = false } = JSON.parse(body);

          // Validate request body
          if (typeof code !== 'string') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'code must be a string' }));
            return;
          }
          if (autoPlay !== undefined && typeof autoPlay !== 'boolean') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'autoPlay must be a boolean' }));
            return;
          }

          // Check if panel exists
          const panel = panelManager.getPanel(panelId);
          if (!panel) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Panel not found' }));
            return;
          }

          // Staleness detection: panel is stale if it was playing and autoPlay is false
          // Note: We can't reliably detect "playing" state from server side since cardStates
          // is client-side. Client will handle staleness detection.
          // For now, return stale: false (client will determine actual staleness)
          const stale = false;

          // Update panel code
          panelManager.updatePanel(panelId, { code });

          // Broadcast WebSocket event to all clients
          // Clients will:
          // 1. Update their textarea
          // 2. Determine if panel is stale (was playing && !autoPlay)
          // 3. Execute autoPlay if requested
          broadcastToAll({
            type: 'panel_updated',
            panelId,
            code,
            autoPlay
          });

          // Send response
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, stale }));
        } catch (error) {
          console.error('Error updating panel code:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Failed to update panel code',
            details: error.message
          }));
        }
      });
    });

    // POST /api/panels/:id/playback endpoint
    server.middlewares.use('/api/panels/', async (req, res, next) => {
      // Only handle POST requests to /playback path
      if (req.method !== 'POST' || !req.url.match(/\/playback$/)) {
        next();
        return;
      }

      // Parse panel ID from URL (e.g., /api/panels/panel-123/playback or /panel-123/playback)
      const match = req.url.match(/\/([^/]+)\/playback$/);
      if (!match) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Panel ID required' }));
        return;
      }

      const panelId = match[1];

      // Parse request body
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { state } = JSON.parse(body);

          // Validate request body
          if (!['play', 'pause', 'toggle'].includes(state)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: 'state must be one of: play, pause, toggle'
            }));
            return;
          }

          // Check if panel exists
          const panel = panelManager.getPanel(panelId);
          if (!panel) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Panel not found' }));
            return;
          }

          // Determine new playing state based on command
          let newPlayingState;
          switch (state) {
            case 'play':
              newPlayingState = true;
              break;
            case 'pause':
              newPlayingState = false;
              break;
            case 'toggle':
              // Toggle based on current state
              newPlayingState = !panel.playing;
              break;
          }

          // Update panel state
          panelManager.updatePanel(panelId, { playing: newPlayingState });

          // Broadcast WebSocket event to all clients
          // Clients will handle the actual play/pause logic (evaluate/scheduler)
          broadcastToAll({
            type: 'playback_changed',
            panelId,
            playing: newPlayingState
          });

          // Send response
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            currentState: newPlayingState ? 'playing' : 'paused'
          }));
        } catch (error) {
          console.error('Error changing playback state:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Failed to change playback state',
            details: error.message
          }));
        }
      });
    });

    // GET /api/panels endpoint
    server.middlewares.use('/api/panels', async (req, res, next) => {
      // Only handle GET requests to /api/panels (not sub-paths)
      if (req.method !== 'GET' || (req.url && req.url !== '' && req.url !== '/')) {
        next();
        return;
      }

      try {
        // Get all panels from panelManager
        const allPanels = panelManager.getAllPanels();

        // Convert Map to array and serialize panel data
        const panelsArray = Array.from(allPanels.values()).map(panel => ({
          id: panel.id,
          title: panel.title,
          code: panel.code,
          playing: panel.playing || false,
          position: panel.position || { x: 0, y: 0 },
          size: panel.size || { w: 600, h: 200 },
          zIndex: panel.zIndex || 10,
          stale: false  // TODO: Implement staleness detection in Epic 6
        }));

        // Send response
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ panels: panelsArray }));
      } catch (error) {
        console.error('Error listing panels:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Failed to list panels',
          details: error.message
        }));
      }
    });

    // Health check endpoint
    server.middlewares.use('/health', (req, res, next) => {
      if ((req.url === '/' || req.url === '') && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString()
        }));
      } else {
        next();
      }
    });
  }
});

// Check if building for Electron
const isElectron = process.env.ELECTRON === 'true';

export default defineConfig({
  // Use relative paths for all builds (works for Electron, file://, and /app/ subdirectory)
  base: './',
  plugins: [
    bundleAudioWorkletPlugin(),
    // Only add WebSocket plugin in dev mode (Electron main process handles it in production)
    ...(process.env.NODE_ENV === 'production' ? [] : [websocketAndApiPlugin()])
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces (allows iPad/phone access)
    port: 5173,
    strictPort: true
  },
  build: {
    // Generate sourcemaps for debugging
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        remote: './remote.html'
      }
    }
  }
});
