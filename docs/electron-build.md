# Electron Build Guide

This document covers building and distributing r0astr as a desktop application using Electron.

## Quick Start

### Development Mode

Run both Vite dev server and Electron together:

```bash
npm install
npm run electron:dev
```

This starts:
1. Vite dev server on port 5173
2. Electron window loading from Vite (with hot reload!)
3. WebSocket server for remote control

### Production Build

Build distributable packages:

```bash
# Build for current platform
npm run electron:build

# Build for specific platform
npm run electron:build:mac    # macOS (dmg + zip)
npm run electron:build:win    # Windows (installer + portable)
npm run electron:build:linux  # Linux (AppImage + deb)
```

Output goes to the `release/` folder.

## Features

### Global Keyboard Shortcuts

These work even when the app is not focused:

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+Shift+Escape` | **PANIC** - Stop all audio immediately |
| `Cmd/Ctrl+Shift+P` | Toggle Performance Mode |
| `F1` - `F8` | Toggle panels 1-8 |
| `F9` | Stop all panels |
| `F10` | Play all panels |

### Performance Mode

When enabled:
- Prevents accidental app quit (shows confirmation dialog)
- Accessible via menu or `Cmd/Ctrl+Shift+P`

Perfect for live performances where an accidental `Cmd+Q` would be catastrophic.

### Remote Control

Works exactly like the browser version:
- iPad/phone connects to `http://<your-ip>:5173/remote.html`
- The server IP is printed in the console on startup
- Full WebSocket sync between all devices

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │  Global Hotkeys │  │  HTTP + WebSocket Server     │  │
│  │  (works always) │  │  (port 5173)                 │  │
│  └─────────────────┘  └──────────────────────────────┘  │
│                              │                           │
│                              ▼                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │              BrowserWindow (Renderer)              │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │            r0astr UI (Vite)             │  │  │
│  │  │  - Strudel patterns                         │  │  │
│  │  │  - CodeMirror editors                       │  │  │
│  │  │  - Web Audio                                │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
          WebSocket connection (ws://localhost:5173/ws)
                              │
                              ▼
              ┌───────────────────────────────┐
              │   Remote Control (iPad/Phone) │
              │   remote.html                 │
              └───────────────────────────────┘
```

## Using Electron APIs in Your Code

Import the helper module:

```javascript
import { 
  isElectron, 
  initElectronHandlers,
  getServerInfo,
  getPerformanceMode 
} from './utils/electronHelper.js';

// Check if running in Electron
if (isElectron) {
  console.log('Running in Electron!');
}

// Set up event handlers for global shortcuts
initElectronHandlers({
  onPanicStopAll: () => {
    // Stop all audio immediately
    stopAllPanels();
  },
  onTogglePanel: (panelNumber) => {
    // Toggle specific panel (1-8)
    togglePanel(panelNumber);
  },
  onPerformanceModeChanged: (enabled) => {
    // Update UI to show performance mode status
    updatePerformanceIndicator(enabled);
  }
});

// Get network addresses for remote control
const info = await getServerInfo();
console.log('Remote control URLs:', info.addresses);
```

## App Icons

Before building for distribution, add icons to `build-resources/`:

| Platform | File | Size |
|----------|------|------|
| macOS | `icon.icns` | 1024x1024 (multi-resolution) |
| Windows | `icon.ico` | 256x256 (multi-resolution) |
| Linux | `icons/` | 16x16 to 512x512 PNGs |

### Generate Icons

You can use a tool like [electron-icon-maker](https://www.npmjs.com/package/electron-icon-maker):

```bash
npx electron-icon-maker --input=./logo.png --output=./build-resources
```

## Troubleshooting

### "App can't be opened" on macOS

The app isn't code-signed. Right-click → Open, or:
```bash
xattr -cr /Applications/r0astr.app
```

### Remote control not connecting

1. Check firewall allows port 5173
2. Ensure devices are on the same network
3. Use the IP address shown in console, not `localhost`

### Audio crackling in Electron

Try increasing the buffer size in Web Audio. Electron sometimes has slightly higher latency than Chrome.

## Code Signing (for distribution)

For proper distribution, you'll need to code sign:

### macOS
```bash
# Set environment variables
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your-password
export APPLE_ID=your@apple.id
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx

npm run electron:build:mac
```

### Windows
```bash
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your-password

npm run electron:build:win
```

## File Structure

```
r0astr/
├── electron/
│   ├── main.js          # Main process (server, shortcuts, window)
│   └── preload.js       # IPC bridge to renderer
├── build-resources/
│   ├── icon.icns        # macOS icon
│   ├── icon.ico         # Windows icon
│   ├── icons/           # Linux icons
│   └── entitlements.mac.plist
├── electron-builder.json # Build configuration
├── src/
│   └── utils/
│       └── electronHelper.js  # Renderer-side Electron API
└── release/             # Built packages (generated)
```
