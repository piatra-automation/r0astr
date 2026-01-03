/**
 * r0astr Electron Main Process
 * 
 * Handles:
 * - Window management
 * - WebSocket server for remote control
 * - Global keyboard shortcuts
 * - Performance mode protection
 */

const { app, BrowserWindow, globalShortcut, ipcMain, dialog, Menu, nativeImage } = require('electron');
const path = require('path');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const express = require('express');

// Set app name (shows in menu bar instead of "Electron")
app.setName('r0astr');

// Keep a global reference of the window object
let mainWindow = null;
let wss = null;
let httpServer = null;

// Performance mode - prevents accidental quit
let performanceMode = false;

// WebSocket client tracking
const clients = new Map();

// Development mode check
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Server port
const PORT = 5173;

/**
 * Create the WebSocket and HTTP server
 */
function createWebSocketAndHttpServer() {
  const expressApp = express();

  // Serve static files from dist in production
  if (!isDev) {
    expressApp.use(express.static(path.join(__dirname, '../dist')));

    // SPA fallback
    expressApp.get('*', (req, res) => {
      // Don't serve index.html for API routes or remote.html
      if (req.path.startsWith('/api') || req.path === '/ws') {
        return res.status(404).send('Not found');
      }
      if (req.path === '/remote.html') {
        return res.sendFile(path.join(__dirname, '../dist/remote.html'));
      }
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  // Health check endpoint
  expressApp.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  httpServer = createServer(expressApp);

  // Create WebSocket server
  wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrade
  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://localhost:${PORT}`);

    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    const clientId = Math.random().toString(36).substring(7);
    clients.set(ws, { id: clientId, type: 'unknown', connectedAt: new Date() });

    console.log(`[WebSocket] Client ${clientId} connected (${clients.size} total)`);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        handleWebSocketMessage(ws, message);
      } catch (err) {
        console.error('[WebSocket] Failed to parse message:', err);
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      console.log(`[WebSocket] Client ${client?.id} disconnected`);
      clients.delete(ws);
    });

    // Send welcome
    ws.send(JSON.stringify({
      type: 'server.hello',
      clientId,
      timestamp: Date.now()
    }));
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] HTTP + WebSocket server running on http://0.0.0.0:${PORT}`);

    // Get network addresses for remote control
    const os = require('os');
    const interfaces = os.networkInterfaces();
    Object.keys(interfaces).forEach((name) => {
      interfaces[name].forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`[Server] Remote control: http://${iface.address}:${PORT}/remote.html`);
        }
      });
    });
  });
}

/**
 * Handle WebSocket messages - relay between main and remote clients
 */
function handleWebSocketMessage(ws, message) {
  const { type, clientType } = message;

  // Client registration
  if (type === 'client.register') {
    const client = clients.get(ws);
    if (client) {
      client.type = clientType || 'unknown';
      console.log(`[WebSocket] Client ${client.id} registered as ${client.type}`);

      // Request full state from main for new remotes
      if (clientType === 'remote') {
        broadcastToMain({ type: 'server.requestFullState', targetClientId: client.id });
      }
    }
    return;
  }

  // Forward state updates to remotes
  if (type === 'state.update' || type === 'full_state' ||
    type === 'panel_created' || type === 'panel_deleted' || type === 'panel_renamed' ||
    type === 'master.sliders' || type === 'master.sliderValue' ||
    type === 'panel.sliders' || type === 'panel.sliderValue') {
    broadcastToRemote(message);
    return;
  }

  // Forward remote commands to main
  if (type.startsWith('panel.') || type.startsWith('global.') ||
    type === 'master.sliderChange' || type === 'panel.sliderChange') {
    broadcastToMain(message, ws);
    return;
  }

  // Default: broadcast to main
  broadcastToMain(message, ws);
}

function broadcastToMain(message, excludeWs = null) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === 1) {
      const clientInfo = clients.get(client);
      if (clientInfo?.type === 'main' || clientInfo?.type === 'unknown') {
        client.send(messageStr);
      }
    }
  });
}

function broadcastToRemote(message) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      const clientInfo = clients.get(client);
      if (clientInfo?.type === 'remote') {
        client.send(messageStr);
      }
    }
  });
}

function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(messageStr);
    }
  });
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'r0astr',
    backgroundColor: '#d9d8d4',
    // Custom title bar to match banner color
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#d9d8d4',
      symbolColor: '#1a1a1a',
      height: 42
    },
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Load the app
  if (isDev) {
    // In dev mode, load from Vite dev server
    mainWindow.loadURL(`http://localhost:${PORT}`);
    // Only open DevTools if ELECTRON_DEV_TOOLS env is set
    if (process.env.ELECTRON_DEV_TOOLS === '1') {
      mainWindow.webContents.openDevTools();
    }
  } else {
    // In production, load from built files via our Express server
    mainWindow.loadURL(`http://localhost:${PORT}`);
  }

  // Handle window close
  mainWindow.on('close', (e) => {
    if (performanceMode) {
      e.preventDefault();
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Stay in Performance', 'Exit Anyway'],
        defaultId: 0,
        cancelId: 0,
        title: 'Performance Mode Active',
        message: 'You are in Performance Mode.',
        detail: 'Are you sure you want to exit? This will stop all audio.'
      }).then((result) => {
        if (result.response === 1) {
          performanceMode = false;
          mainWindow.close();
        }
      });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Custom menu
  createApplicationMenu();
}

/**
 * Create application menu
 *
 * Note: We intercept Cmd+N, Cmd+W, Cmd+P to use as app shortcuts instead of
 * the default "new window", "close window", "print" behaviors.
 * These are handled in the renderer via keyboard.js
 */
function createApplicationMenu() {
  // Configure About panel with logo and details
  // Logo is in public/images (copied to dist/images during build)
  const logoPath = isDev
    ? path.join(__dirname, '../public/images/logo.png')
    : path.join(__dirname, '../dist/images/logo.png');

  // Try to load the logo, fall back gracefully if not found
  let aboutIcon = null;
  try {
    aboutIcon = nativeImage.createFromPath(logoPath);
    if (aboutIcon.isEmpty()) {
      console.warn('[App] Logo not found at:', logoPath);
      aboutIcon = null;
    }
  } catch (e) {
    console.warn('[App] Could not load logo:', e.message);
  }

  app.setAboutPanelOptions({
    applicationName: 'r0astr',
    applicationVersion: require('../package.json').version,
    version: 'Multi-instrument live coding interface',
    copyright: '© 2024-2025 Peter Kalt / Piatra Engineering\nBuilt on Strudel by Felix Roos',
    credits: 'https://strudel.cc | https://piatra.com.au',
    iconPath: logoPath
  });

  const template = [
    {
      label: 'r0astr',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Settings...',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('shortcut-open-settings')
        },
        {
          label: 'Performance Mode',
          type: 'checkbox',
          checked: performanceMode,
          accelerator: 'CmdOrCtrl+Shift+P',
          click: (menuItem) => {
            performanceMode = menuItem.checked;
            mainWindow?.webContents.send('performance-mode-changed', performanceMode);
            console.log(`[App] Performance mode: ${performanceMode ? 'ON' : 'OFF'}`);
          }
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        // Cmd+N = New Panel (handled in renderer)
        {
          label: 'New Panel',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('shortcut-new-panel')
        },
        // Cmd+W = Delete Panel (handled in renderer, NOT close window)
        {
          label: 'Delete Panel',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow?.webContents.send('shortcut-delete-panel')
        },
        { type: 'separator' },
        // Keep Cmd+Shift+W for actual close window
        {
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+Shift+W',
          click: () => mainWindow?.close()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Playback',
      submenu: [
        // Cmd+P = Toggle Play/Pause (NOT print)
        {
          label: 'Toggle Play/Pause',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.send('shortcut-toggle-playback')
        },
        {
          label: 'Update Panel',
          accelerator: 'CmdOrCtrl+Up',
          click: () => mainWindow?.webContents.send('shortcut-update-panel')
        },
        { type: 'separator' },
        {
          label: 'Update All',
          accelerator: 'CmdOrCtrl+U',
          click: () => mainWindow?.webContents.send('shortcut-update-all')
        },
        {
          label: 'Stop All',
          accelerator: 'CmdOrCtrl+.',
          click: () => mainWindow?.webContents.send('shortcut-stop-all')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Register global keyboard shortcuts
 */
function registerGlobalShortcuts() {
  // PANIC BUTTON - Stop all audio (works even when app not focused!)
  globalShortcut.register('CommandOrControl+Shift+Escape', () => {
    console.log('[Shortcut] PANIC - Stop All');
    mainWindow?.webContents.send('panic-stop-all');
    broadcastToAll({ type: 'global.stopAll' });
  });

  // Toggle Performance Mode
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    performanceMode = !performanceMode;
    mainWindow?.webContents.send('performance-mode-changed', performanceMode);
    console.log(`[Shortcut] Performance mode: ${performanceMode ? 'ON' : 'OFF'}`);
  });

  // Quick panel toggles (F1-F8 for panels)
  for (let i = 1; i <= 8; i++) {
    globalShortcut.register(`F${i}`, () => {
      console.log(`[Shortcut] Toggle panel ${i}`);
      mainWindow?.webContents.send('toggle-panel', i);
    });
  }

  // F9 - Stop all panels
  globalShortcut.register('F9', () => {
    console.log('[Shortcut] Stop all panels');
    mainWindow?.webContents.send('stop-all-panels');
    broadcastToAll({ type: 'global.stopAll' });
  });

  // F10 - Play all panels
  globalShortcut.register('F10', () => {
    console.log('[Shortcut] Play all panels');
    mainWindow?.webContents.send('play-all-panels');
  });

  // F11 is typically fullscreen, F12 is devtools - leave those alone

  console.log('[App] Global shortcuts registered');
}

/**
 * IPC Handlers
 */
function setupIpcHandlers() {
  // Get performance mode status
  ipcMain.handle('get-performance-mode', () => performanceMode);

  // Set performance mode
  ipcMain.handle('set-performance-mode', (event, enabled) => {
    performanceMode = enabled;
    return performanceMode;
  });

  // Broadcast to remotes
  ipcMain.on('broadcast-to-remotes', (event, message) => {
    broadcastToRemote(message);
  });

  // Get server info
  ipcMain.handle('get-server-info', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const addresses = [];

    Object.keys(interfaces).forEach((name) => {
      interfaces[name].forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({
            name,
            address: iface.address,
            remoteUrl: `http://${iface.address}:${PORT}/remote.html`
          });
        }
      });
    });

    return { port: PORT, addresses };
  });
}

// App lifecycle
app.whenReady().then(() => {
  // Only start server in production - in dev mode, Vite handles this
  if (!isDev) {
    createWebSocketAndHttpServer();
  }
  createWindow();
  registerGlobalShortcuts();
  setupIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();

  // Close WebSocket server
  if (wss) {
    wss.close();
  }
  if (httpServer) {
    httpServer.close();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
