# WebSocket Remote Control

**Last Updated:** 2025-11-16
**Status:** Production Ready

## Overview

r0astr supports real-time remote control via WebSocket, enabling you to control panels from an iPad, phone, or secondary device while the main interface runs on your primary machine.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Mac (Server)   │         │  Laptop (Main)   │         │  iPad (Remote)  │
│                 │         │                  │         │                 │
│  Vite Dev       │◄───────►│  Main Interface  │         │  Remote Control │
│  WebSocket      │         │  Live Coding     │         │  Touch Panel    │
│  Audio Output   │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                            │                            │
        │                            │                            │
        └────────────────────────────┴────────────────────────────┘
                        WebSocket Messages
```

**Components:**
- **Server (Mac):** Runs Vite dev server with WebSocket endpoint, generates audio
- **Main Interface (Laptop):** Full r0astr UI for live-coding patterns
- **Remote Control (iPad):** Simplified touch-optimized panel control

## Usage

### 1. Start the Server (Mac)

```bash
npm run dev
```

The server will display network addresses:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.3.102:5173/
```

### 2. Access Main Interface (Laptop)

Open the network URL in your browser:
```
http://192.168.3.102:5173/
```

This gives you the full interface with code editors for live-coding.

### 3. Access Remote Control (iPad)

Open the remote control interface:
```
http://192.168.3.102:5173/remote.html
```

You'll see:
- Connection status indicator
- 4 large touch-friendly panel buttons
- Stop All button
- Real-time state sync

## WebSocket Protocol

### Message Types

**Client → Server (Commands from Remote):**
```javascript
// Toggle panel play/pause
{ type: 'panel.toggle', panel: 1-4 }

// Force play (if not playing)
{ type: 'panel.play', panel: 1-4 }

// Force pause (if playing)
{ type: 'panel.pause', panel: 1-4 }

// Stop all panels
{ type: 'global.stopAll' }

// Update panel code (future feature)
{ type: 'panel.update', panel: 1-4, data: { code: '...' } }
```

**Server → Clients (State Updates to Remote):**
```javascript
// Full state update
{
  type: 'state.update',
  panels: [
    { panel: 1, playing: true },
    { panel: 2, playing: false },
    { panel: 3, playing: false },
    { panel: 4, playing: true }
  ]
}
```

**Client Registration:**
```javascript
// Main interface registers
{ type: 'client.register', clientType: 'main' }

// Remote control registers
{ type: 'client.register', clientType: 'remote' }
```

### Message Flow

#### Remote → Main (Control Commands)
1. User taps panel button on iPad
2. Remote sends `panel.toggle` command to server
3. Server broadcasts command to all 'main' clients
4. Main interface executes `toggleCard()`
5. Main interface sends `state.update` back to server
6. Server broadcasts state to all 'remote' clients
7. Remote UI updates to reflect new state

#### Main → Remote (State Sync)
1. User clicks Play button in main interface
2. Main interface executes `toggleCard()`
3. Main interface sends `state.update` to server
4. Server broadcasts state to all 'remote' clients
5. Remote UI updates panel button to show "Playing"

## Connection Management

**Auto-Reconnect:**
Both main and remote clients automatically reconnect if the connection is lost.

**Reconnect Timer:** 3 seconds

**Connection States:**
- 🟡 Connecting... (initial connection)
- 🟢 Connected (ready to use)
- 🔴 Disconnected (will auto-reconnect)

## File Structure

```
r0astr/
├── src/
│   ├── main.js                  # Main interface with WebSocket client
│   └── websocket-server.mjs     # WebSocket server implementation
├── vite.config.mjs              # Vite config with WebSocket plugin
├── index.html                   # Main interface UI
└── remote.html                  # Remote control UI
```

## Implementation Details

### Main Interface (src/main.js)

**WebSocket Initialization:**
```javascript
function initializeWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'client.register',
      clientType: 'main'
    }));
  };
}
```

**State Broadcasting:**
```javascript
function broadcastState() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const panels = Object.keys(cardStates).map(cardId => ({
    panel: parseInt(cardId.replace('card-', '')),
    playing: cardStates[cardId].playing
  }));

  ws.send(JSON.stringify({
    type: 'state.update',
    panels
  }));
}
```

**Command Handling:**
```javascript
function handleWebSocketMessage(message) {
  switch (message.type) {
    case 'panel.toggle':
      toggleCard(`card-${message.panel}`);
      break;
    case 'global.stopAll':
      stopAll();
      break;
  }
}
```

### Server (src/websocket-server.mjs)

**Client Type Tracking:**
```javascript
const clients = new Map(); // Stores { id, type, connectedAt }

wss.on('connection', (ws) => {
  clients.set(ws, {
    id: generateId(),
    type: 'unknown',
    connectedAt: new Date()
  });
});
```

**Message Routing:**
```javascript
// Commands from remote → broadcast to main
if (message.type !== 'client.register' && message.type !== 'state.update') {
  broadcastToMain(message, ws);
}

// State updates from main → broadcast to remote
if (message.type === 'state.update') {
  broadcastToRemote(message);
}
```

### Remote Control (remote.html)

**Touch-Optimized UI:**
- Large 80px circular buttons
- High contrast colors
- No hover effects (touch-only)
- Prevents accidental zoom/scroll
- Active state visual feedback

**State Synchronization:**
```javascript
function updatePanelUI(panelNumber, playing) {
  const panelEl = document.getElementById(`panel-${panelNumber}`);
  const buttonEl = panelEl.querySelector('.panel-button');

  if (playing) {
    panelEl.classList.add('playing');
    buttonEl.textContent = '⏸';
  } else {
    panelEl.classList.remove('playing');
    buttonEl.textContent = '▶';
  }
}
```

## Network Configuration

**Vite Server Config (vite.config.mjs):**
```javascript
export default defineConfig({
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    strictPort: true,
  },
});
```

This allows:
- Laptop to access via network IP
- iPad to access via network IP
- All devices on same WiFi network

## Security Considerations

⚠️ **Development Mode Only**

The current implementation is designed for **local network use during development**. Do NOT expose to the public internet without:

1. Adding authentication
2. Using WSS (WebSocket Secure) with valid certificates
3. Implementing rate limiting
4. Adding message validation
5. Securing the network perimeter

## REST API Endpoints

In addition to WebSocket real-time control, r0astr now provides a REST API for programmatic panel management.

### API Server

**Start Server:**
```bash
npm run dev
```

The API runs on the same Vite dev server (port 5173) that serves the UI. No separate server needed!

**Default Configuration:**
- Port: 5173 (Vite dev server)
- Host: 0.0.0.0 (accessible from network)
- Auth: Not implemented (use for local development only)

### Authentication

⚠️ **Authentication not currently implemented.**

The API is intended for local development only. For production use:
- Add authentication middleware to vite.config.mjs
- Use environment variables for API keys
- Consider rate limiting

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `500 Internal Server Error` - Server error

### POST /api/panels

Create a new panel programmatically.

**Request:**
```http
POST /api/panels
Content-Type: application/json
X-API-Key: your-api-key (production only)

{
  "title": "Bass Drum",                    // Optional: Panel title
  "code": "s(\"bd\").gain(0.8)",          // Optional: Initial pattern code
  "position": { "x": 100, "y": 200 },     // Optional: Position {x, y}
  "size": { "w": 600, "h": 200 }          // Optional: Size {w, h}
}
```

**Response (Success):**
```json
{
  "success": true,
  "panelId": "panel-1763334665693"
}
```

**Response (Error):**
```json
{
  "error": "title must be a string"
}
```

**Default Values:**
- `title`: Auto-generated "Instrument N"
- `code`: Empty string
- `position`: `{ x: 0, y: 0 }`
- `size`: `{ w: 600, h: 200 }`

**WebSocket Broadcast:**
When a panel is created via API, the server broadcasts a `panel_created` event to all connected WebSocket clients:

```javascript
{
  type: 'panel_created',
  panelId: 'panel-1763334665693',
  title: 'Bass Drum',
  code: 's("bd").gain(0.8)',
  position: { x: 100, y: 200 },
  size: { w: 600, h: 200 }
}
```

**curl Examples:**

```bash
# Create panel with default settings
curl -X POST http://localhost:5173/api/panels \
  -H "Content-Type: application/json" \
  -d '{}'

# Create panel with title and code
curl -X POST http://localhost:5173/api/panels \
  -H "Content-Type: application/json" \
  -d '{"title": "Kick", "code": "s(\"bd*4\")"}'

# Create panel with full options
curl -X POST http://localhost:5173/api/panels \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bass",
    "code": "note(\"c2\").s(\"sawtooth\").lpf(800)",
    "position": {"x": 50, "y": 100},
    "size": {"w": 800, "h": 300}
  }'
```

### DELETE /api/panels/:id

Delete a panel by ID.

**Request:**
```http
DELETE /api/panels/:id
Content-Type: application/json
```

**Response (Success):**
```json
{
  "success": true
}
```

**Response (Panel Not Found):**
```json
{
  "error": "Panel not found"
}
```

**Response (Master Panel Protected):**
```json
{
  "error": "Cannot delete master panel",
  "message": "The master panel is protected and cannot be deleted"
}
```

**Default Behavior:**
- Panel audio is stopped automatically before deletion
- Panel is removed from UI immediately
- WebSocket clients receive `panel_deleted` event
- The master panel (ID: `master-panel`) cannot be deleted (returns 403 Forbidden)

**WebSocket Broadcast:**
When a panel is deleted via API, the server broadcasts a `panel_deleted` event to all connected WebSocket clients:

```javascript
{
  type: 'panel_deleted',
  panelId: 'panel-1763334665693'
}
```

**curl Examples:**

```bash
# Delete panel by ID
curl -X DELETE http://localhost:5173/api/panels/panel-1763334665693 \
  -H "Content-Type: application/json"

# Attempt to delete master panel (returns 403 error)
curl -X DELETE http://localhost:5173/api/panels/master-panel \
  -H "Content-Type: application/json"

# Delete non-existent panel (returns 404 error)
curl -X DELETE http://localhost:5173/api/panels/panel-nonexistent \
  -H "Content-Type: application/json"
```

### POST /api/panels/:id/code

Update a panel's code and optionally auto-play it.

**Request:**
```http
POST /api/panels/:id/code
Content-Type: application/json

{
  "code": "s(\"bd hh sd hh\")",  // Required: New pattern code
  "autoPlay": true              // Optional: Auto-play after update (default: false)
}
```

**Response (Success):**
```json
{
  "success": true,
  "stale": false
}
```

**Response (Panel Not Found):**
```json
{
  "error": "Panel not found"
}
```

**Response (Validation Error):**
```json
{
  "error": "code must be a string"
}
```

**Staleness Detection:**
The `stale` field in the response indicates whether the panel's running pattern differs from the new code:
- `stale: true` - Panel was playing and `autoPlay: false` (code updated but pattern still running old code)
- `stale: false` - Panel was stopped, or `autoPlay: true` (new code is now playing)

**Note:** Staleness is detected client-side. The server always returns `stale: false`; clients determine actual staleness based on their local state.

**Behavior Matrix:**

| Panel State | autoPlay | Result |
|-------------|----------|--------|
| Stopped | `false` | Code updated in textarea, remains stopped |
| Stopped | `true` | Code updated, panel starts playing new pattern |
| Playing | `false` | Code updated in textarea, old pattern keeps playing (STALE) |
| Playing | `true` | Code updated, panel switches to new pattern immediately |

**WebSocket Broadcast:**
When code is updated via API, the server broadcasts a `panel_updated` event to all connected WebSocket clients:

```javascript
{
  type: 'panel_updated',
  panelId: 'panel-1763334665693',
  code: 's("bd hh sd hh")',
  autoPlay: true
}
```

Clients receiving this event:
1. Update their textarea with new code
2. Detect staleness (was panel playing && !autoPlay)
3. Auto-play pattern if `autoPlay: true`

**curl Examples:**

```bash
# Update code without auto-playing
curl -X POST http://localhost:5173/api/panels/panel-1763334665693/code \
  -H "Content-Type: application/json" \
  -d '{"code": "s(\"bd*4\")"}'

# Update code and auto-play immediately
curl -X POST http://localhost:5173/api/panels/panel-1763334665693/code \
  -H "Content-Type: application/json" \
  -d '{"code": "s(\"bd hh sd hh\")", "autoPlay": true}'

# Update with complex pattern
curl -X POST http://localhost:5173/api/panels/panel-1763334665693/code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "note(\"c2 e2 g2\").s(\"sawtooth\").lpf(800).gain(0.6)",
    "autoPlay": true
  }'
```

### POST /api/panels/:id/playback

Control panel playback state (play/pause/toggle).

**Request:**
```http
POST /api/panels/:id/playback
Content-Type: application/json

{
  "state": "play"  // Required: "play", "pause", or "toggle"
}
```

**Response (Success):**
```json
{
  "success": true,
  "currentState": "playing"
}
```

**Response (Panel Not Found):**
```json
{
  "error": "Panel not found"
}
```

**Response (Validation Error):**
```json
{
  "error": "state must be one of: play, pause, toggle"
}
```

**State Options:**
- `"play"` - Start playback (idempotent - calling on already playing panel has no effect)
- `"pause"` - Stop playback (idempotent - calling on already paused panel has no effect)
- `"toggle"` - Flip current playback state (playing → paused, paused → playing)

**Behavior:**
- Commands are idempotent: play on playing panel or pause on paused panel have no effect
- UI play/pause button updates automatically to reflect new state
- Audio starts/stops accordingly
- WebSocket clients receive `playback_changed` event
- All connected clients see synchronized button state changes

**WebSocket Broadcast:**
When playback state changes via API, the server broadcasts a `playback_changed` event to all connected WebSocket clients:

```javascript
{
  type: 'playback_changed',
  panelId: 'panel-1763334665693',
  playing: true
}
```

Clients receiving this event:
1. Check if state actually needs to change (idempotency check)
2. Call `toggleCard()` to handle play/pause logic
3. Update button text and CSS classes
4. Start/stop audio playback via Strudel scheduler

**State Transition Table:**

| Current State | Command  | New State | Action                     |
|---------------|----------|-----------|----------------------------|
| Paused        | `play`   | Playing   | Start audio, button "Pause"|
| Playing       | `play`   | Playing   | No change (idempotent)     |
| Paused        | `pause`  | Paused    | No change (idempotent)     |
| Playing       | `pause`  | Paused    | Stop audio, button "Play"  |
| Paused        | `toggle` | Playing   | Start audio, button "Pause"|
| Playing       | `toggle` | Paused    | Stop audio, button "Play"  |

**curl Examples:**

```bash
# Play a paused panel
curl -X POST http://localhost:5173/api/panels/panel-1763334665693/playback \
  -H "Content-Type: application/json" \
  -d '{"state": "play"}'

# Pause a playing panel
curl -X POST http://localhost:5173/api/panels/panel-1763334665693/playback \
  -H "Content-Type: application/json" \
  -d '{"state": "pause"}'

# Toggle playback state
curl -X POST http://localhost:5173/api/panels/panel-1763334665693/playback \
  -H "Content-Type: application/json" \
  -d '{"state": "toggle"}'
```

### GET /api/panels

Retrieve all panel states.

**Request:**
```http
GET /api/panels
```

**Response (Success):**
```json
{
  "panels": [
    {
      "id": "panel-1763334665693",
      "title": "Bass Drum",
      "code": "s(\"bd*4\")",
      "playing": true,
      "position": { "x": 0, "y": 0 },
      "size": { "w": 600, "h": 200 },
      "zIndex": 20,
      "stale": false
    },
    {
      "id": "panel-1763334665694",
      "title": "Hi-Hat",
      "code": "s(\"hh*8\")",
      "playing": false,
      "position": { "x": 620, "y": 0 },
      "size": { "w": 600, "h": 200 },
      "zIndex": 30,
      "stale": false
    }
  ]
}
```

**Response (Error):**
```json
{
  "error": "Failed to list panels",
  "details": "error message"
}
```

**Response Fields:**
- `id` (string) - Unique panel identifier
- `title` (string) - Panel display title
- `code` (string) - Current pattern code in textarea
- `playing` (boolean) - Whether panel is actively playing audio
- `position` (object) - Panel position `{ x, y }` in pixels
- `size` (object) - Panel dimensions `{ w, h }` in pixels
- `zIndex` (number) - Panel layer order (higher = front)
- `stale` (boolean) - True if code differs from running pattern (currently always false, will be implemented in Epic 6)

**Behavior:**
- Returns all panels in the session
- Empty array if no panels exist
- Includes all panel metadata for session state reconstruction
- Stale flag will indicate when panel code has been updated without auto-play (future enhancement)

**curl Examples:**

```bash
# Get all panels
curl -s http://localhost:5173/api/panels

# Pretty print with jq
curl -s http://localhost:5173/api/panels | jq '.panels'

# Count total panels
curl -s http://localhost:5173/api/panels | jq '.panels | length'

# List panel titles
curl -s http://localhost:5173/api/panels | jq '.panels[] | .title'

# Filter playing panels (using jq)
curl -s http://localhost:5173/api/panels | jq '.panels[] | select(.playing == true)'
```

### Health Check Endpoint

**GET /health**

Check if server is running.

**Request:**
```bash
curl http://localhost:5173/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T23:00:00.000Z"
}
```

### Architecture: Single Server Design

The REST API is implemented as Vite middleware in `vite.config.mjs`. This means:

✅ **One server** handles everything (UI, API, WebSocket) on port 5173
✅ **Direct WebSocket access** - no HTTP callbacks needed
✅ **Simpler deployment** - just run `npm run dev`
✅ **Hot module reload** works for both UI and API changes

The API routes are defined in the `websocketAndApiPlugin` which runs before Vite's default middleware:

```javascript
// vite.config.mjs
server.middlewares.use('/api/panels', async (req, res, next) => {
  // Handle POST /api/panels
  const panelId = panelManager.createPanel({...});

  // Broadcast WebSocket event (same process!)
  broadcastToAll({ type: 'panel_created', panelId, ... });

  res.end(JSON.stringify({ success: true, panelId }));
});
```

## Future Extensions

The protocol is designed to be extensible. Planned features:

**Panel Management:**
```javascript
// Create new panel
{ type: 'panel.create', data: { name: 'Instrument 5', code: '...' } }

// Delete panel
{ type: 'panel.delete', panel: 5 }

// Update panel code remotely
{ type: 'panel.update', panel: 1, data: { code: 'n("0 2 3")...' } }
```

**Master Controls:**
```javascript
// Update master panel code
{ type: 'master.update', data: { code: 'let TEMPO = ...' } }

// Adjust master sliders
{ type: 'master.slider', varName: 'TEMPO', value: 35 }
```

**Session Management:**
```javascript
// Save current session
{ type: 'session.save', name: 'my-live-set' }

// Load session
{ type: 'session.load', name: 'my-live-set' }
```

## Troubleshooting

**Remote can't connect:**
- Verify all devices are on same WiFi network
- Check firewall isn't blocking port 5173
- Ensure Vite server is running
- Try accessing from laptop first to verify network address

**State not syncing:**
- Check browser console for WebSocket errors
- Verify connection status is "Connected"
- Check server console for message logs

**Buttons not responding:**
- Ensure connection status shows "Connected"
- Check browser console for errors
- Verify main interface is loaded (server needs at least one main client)

## Performance

**Latency:** ~10-50ms on local network
**Bandwidth:** ~1KB per state update
**Concurrent Clients:** No hard limit (tested with 5 devices)

## Related Documentation

- [Strudel Integration Gotchas](./architecture/strudel-integration-gotchas.md)
- [Brownfield Architecture](./brownfield-architecture.md)
- [WebSocket Server Implementation](../src/websocket-server.mjs)

---

**Created during implementation session 2025-11-16**
