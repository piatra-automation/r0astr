# r0astr Lite Build for GitHub Pages

## Status: IMPLEMENTED

See commits for full implementation.

## Goal
Create a standalone, static build of r0astr that can be hosted on GitHub Pages without:
- WebSocket server/client functionality
- REST API endpoints
- Remote control interface (remote.html)
- Server-side panel management

## Architecture Overview

### Current Build
- `npm run build` outputs to `dist/`
- Includes: `index.html`, `remote.html`, WebSocket client code
- Requires: Vite dev server OR Electron for full functionality
- WebSocket connects to `ws://localhost:5173/ws` or auto-detects

### Lite Build Target
- Static files only (HTML, JS, CSS, assets)
- No server required - works from any static file host
- All panel state is localStorage only (already works)
- No remote.html (single-user mode)

## Files to Modify/Create

### 1. Create Lite Vite Config
Create `vite.config.lite.mjs`:
```javascript
import { defineConfig } from 'vite';
import bundleAudioWorkletPlugin from 'vite-plugin-bundle-audioworklet';

export default defineConfig({
  base: '/r0astr/',  // GitHub Pages subpath
  plugins: [bundleAudioWorkletPlugin()],
  build: {
    outDir: 'dist-lite',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html'
        // No remote.html
      }
    }
  },
  define: {
    'import.meta.env.LITE_MODE': 'true'
  }
});
```

### 2. Create WebSocket Manager Stub
Create `src/managers/websocketManager.lite.js`:
```javascript
// Stub implementation - all functions are no-ops
export const MESSAGE_TYPES = {};
export function connect() { console.log('[Lite] WebSocket disabled'); }
export function send() { return false; }
export function broadcast() { return false; }
export function disconnect() {}
export function isConnected() { return false; }
export function syncPanelState() { return false; }
export function sendFullState() { return false; }
```

### 3. Conditional WebSocket Import in main.js
Modify `src/main.js` line 19:
```javascript
// Option A: Build-time replacement
import { connect as wsConnect, ... } from './managers/websocketManager.js';

// Option B: Runtime check (simpler)
const wsModule = import.meta.env.LITE_MODE
  ? await import('./managers/websocketManager.lite.js')
  : await import('./managers/websocketManager.js');
```

### 4. Guard All WebSocket Calls
Locations in `src/main.js` that call WebSocket functions:
- Line 525: `if (!wsIsConnected()) return;`
- Line 535: `wsSend(MESSAGE_TYPES.MASTER_SLIDERS, ...)`
- Line 542-544: slider value sync
- Line 864-870: panel created broadcast
- Line 1060-1069: panel renamed broadcast
- Line 1147-1152: panel deleted broadcast
- Line 2366: `wsConnect()` - **MAIN CONNECTION CALL**
- Line 2587-2600: state update
- Line 2706-2719: panel sliders sync
- Line 2801-2807: panel created (duplicate location)
- Line 3244-3249: panel deleted (duplicate location)

**Solution**: All these already check `wsIsConnected()` which will return `false` in lite mode. Only need to skip the initial `wsConnect()` call at line 2366.

### 5. Add Build Script to package.json
```json
{
  "scripts": {
    "build:lite": "vite build --config vite.config.lite.mjs",
    "deploy:gh-pages": "npm run build:lite && gh-pages -d dist-lite"
  }
}
```

### 6. GitHub Pages Deployment

**Option A: GitHub Actions (Recommended)**
Create `.github/workflows/deploy-lite.yml`:
```yaml
name: Deploy Lite to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'index.html'
      - 'static/**'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build:lite
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist-lite
```

**Option B: Manual with gh-pages package**
```bash
npm install --save-dev gh-pages
npm run deploy:gh-pages
```

### 7. Settings Modal - Hide Remote Control Section
In `src/ui/settingsModal.js`, conditionally hide remote control settings:
```javascript
if (import.meta.env.LITE_MODE) {
  // Hide WebSocket/remote control section
  document.querySelector('.settings-remote-section')?.remove();
}
```

## Implementation Tasks

### Phase 1: Build Configuration
- [x] Create `vite.config.lite.mjs` with GitHub Pages base path
- [x] Create `src/managers/websocketManager.lite.js` stub
- [x] Add `build:lite` script to package.json
- [x] Test local build with `npm run build:lite`

### Phase 2: Code Modifications
- [x] Add conditional import via Vite resolve.alias (swaps module at build time)
- [x] WebSocket stub makes connect() a no-op (no code changes needed in main.js)
- [ ] Hide remote control settings in settings modal (optional - future)
- [x] Remove remote.html from lite build input

### Phase 3: GitHub Pages Setup
- [x] Create `.github/workflows/deploy-pages.yml` (combined docs + app)
- [x] Disabled old `docs.yml` and `static.yml` workflows
- [ ] Configure GitHub repo settings for Pages (needs manual setup)
- [ ] Test deployment with manual workflow trigger

### Phase 4: Polish
- [ ] Add "Lite Mode" indicator in UI (optional)
- [ ] Update splash screen for lite version
- [ ] Test on multiple browsers
- [ ] Verify localStorage persistence works
- [ ] Verify all Strudel features work (samples, synths, etc.)

## Considerations

### Audio Context Restrictions
- GitHub Pages serves over HTTPS (good for AudioContext)
- User interaction required before audio plays (already handled)

### Sample Loading
- Strudel samples load from CDN (strudel.cc) - works on any host
- No local sample server needed

### CORS
- All Strudel dependencies are npm packages, bundled into JS
- No CORS issues expected

### What Works in Lite Mode
- All pattern editing and playback
- Master panel global sliders
- Panel creation/deletion/reorder
- Settings persistence (localStorage)
- Theme/appearance settings
- Keyboard shortcuts
- Metronome/visualization

### What's Disabled in Lite Mode
- WebSocket connection (remote control)
- REST API endpoints
- remote.html interface
- Multi-device sync
- Server-side panel management

## Alternative: Environment Variable Approach

Instead of separate config file, use single config with env var:

```bash
# Full build (default)
npm run build

# Lite build
LITE_MODE=true npm run build
```

```javascript
// vite.config.mjs
export default defineConfig({
  base: process.env.LITE_MODE ? '/r0astr/' : '/',
  build: {
    outDir: process.env.LITE_MODE ? 'dist-lite' : 'dist',
    rollupOptions: {
      input: process.env.LITE_MODE
        ? { main: './index.html' }
        : { main: './index.html', remote: './remote.html' }
    }
  },
  define: {
    'import.meta.env.LITE_MODE': JSON.stringify(!!process.env.LITE_MODE)
  }
});
```

## References
- Current vite.config.mjs: lines 1-413
- WebSocket manager: `src/managers/websocketManager.js`
- WebSocket calls in main.js: 20+ locations (most already guarded)
- GitHub Pages docs: https://docs.github.com/en/pages
