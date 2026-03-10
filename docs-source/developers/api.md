# API Reference

`r0astr` exposes a **REST API** and a **WebSocket server** for real-time control and integration. Both run on the same port as the dev server.

<div class="grid cards" markdown>

-   :material-api:{ .lg .middle } **REST API**

    ---

    CRUD operations on panels, playback control, health check.

    **Base URL** `http://localhost:5173`

-   :material-transit-connection-variant:{ .lg .middle } **WebSocket**

    ---

    Real-time state sync, remote control, slider updates, metronome.

    **URL** `ws://localhost:5173/ws`

</div>

---

## Authentication & CORS

`r0astr` supports optional API key authentication and configurable CORS origins via `server.config.json`.

### Server Configuration File

Create or edit `server.config.json` in the project root:

```json
{
  "cors": {
    "allowedOrigins": ["*"]
  },
  "auth": {
    "apiKey": ""
  }
}
```

Copy `server.config.example.json` as a starting point.

| Field | Default | Description |
|-------|---------|-------------|
| `cors.allowedOrigins` | `["*"]` | Array of allowed origins. Use `["*"]` to allow all, or list specific origins like `["http://192.168.1.50:5173"]` |
| `auth.apiKey` | `""` | API key string. When empty, no authentication is required |

!!! tip "When to set an API key"
    If you're running `r0astr` on an untrusted or shared network, set an API key to prevent unauthorized access. On a private home network, leaving it empty is fine.

### API Key Authentication

When an API key is configured:

- **Localhost requests** are always allowed without a key
- **Remote REST requests** must include the `X-API-Key` header
- **Remote WebSocket connections** must include the key as a query parameter

=== "REST API"

    ```bash
    curl -H "X-API-Key: your-secret-key" \
      http://192.168.1.100:5173/api/panels
    ```

=== "WebSocket"

    ```javascript
    const ws = new WebSocket("ws://192.168.1.100:5173/ws?apiKey=your-secret-key");
    ```

**Public endpoint** — `/api/server-config/auth-required` requires no authentication and returns whether a key is needed:

```json
{ "authRequired": true }
```

Clients can call this first to decide whether to prompt for a key.

### CORS

CORS headers apply to `/api/*` and `/health` endpoints. When `allowedOrigins` is set to `["*"]`, all origins are accepted. To restrict access:

```json
{
  "cors": {
    "allowedOrigins": [
      "http://192.168.1.100:5173",
      "http://192.168.1.50:5173"
    ]
  }
}
```

Requests from unlisted origins will not receive CORS headers and will be blocked by the browser.

### Server Config API (localhost only)

These endpoints are only accessible from localhost and are used by the settings UI.

#### GET /api/server-config { #get-server-config data-toc-label="Get Server Config" }

Returns the current server configuration. The API key is masked.

```json
{
  "cors": { "allowedOrigins": ["*"] },
  "auth": { "apiKey": "****ab12", "hasKey": true }
}
```

#### POST /api/server-config { #set-server-config data-toc-label="Set Server Config" }

Update server configuration. Use `"__KEEP__"` as the `apiKey` value to preserve the existing key without resending it.

```bash
curl -X POST http://localhost:5173/api/server-config \
  -H "Content-Type: application/json" \
  -d '{"cors": {"allowedOrigins": ["*"]}, "auth": {"apiKey": "__KEEP__"}}'
```

---

## REST API

All endpoints return JSON.

**Headers:** `Content-Type: application/json` — plus `X-API-Key: <key>` if authentication is enabled (see above)

---

### :material-heart-pulse:{ style="color: #4caf50" } GET /health { #health data-toc-label="Health Check" }

Health check endpoint.

=== "Response `200`"

    ```json
    {
      "status": "ok",
      "timestamp": "2025-12-14T12:00:00.000Z"
    }
    ```

---

### :material-format-list-bulleted:{ style="color: #2196f3" } GET /api/panels { #list-panels data-toc-label="List Panels" }

Returns all panels and their current state.

=== "Response `200`"

    ```json
    {
      "panels": [
        {
          "id": "panel-1701234567890",
          "title": "Instrument 1",
          "code": "s(\"bd*4\")",
          "playing": true,
          "position": { "x": 0, "y": 0 },
          "size": { "w": 600, "h": 200 },
          "zIndex": 10,
          "stale": false
        }
      ]
    }
    ```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique panel identifier |
| `title` | string | Display name |
| `code` | string | Current pattern code |
| `playing` | boolean | Playback state |
| `position` | object | `{ x, y }` screen coordinates |
| `size` | object | `{ w, h }` dimensions in pixels |
| `zIndex` | number | Stacking order |
| `stale` | boolean | Code changed since last play |

---

### :material-plus-circle:{ style="color: #4caf50" } POST /api/panels { #create-panel data-toc-label="Create Panel" }

Create a new panel. All fields are optional.

=== "Request"

    ```json
    {
      "title": "My Panel",
      "code": "s(\"bd*4\")",
      "position": { "x": 0, "y": 0 },
      "size": { "w": 600, "h": 200 }
    }
    ```

=== "Response `200`"

    ```json
    {
      "success": true,
      "panelId": "panel-1701234567890"
    }
    ```

=== "Error `400`"

    ```json
    {
      "error": "Validation error",
      "message": "title must be a string"
    }
    ```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | no | Display name (auto-generated if omitted) |
| `code` | string | no | Initial pattern code |
| `position` | object | no | `{ x, y }` screen coordinates |
| `size` | object | no | `{ w, h }` dimensions in pixels |

!!! note "Side effect"
    Broadcasts `panel_created` to all WebSocket clients.

---

### :material-delete:{ style="color: #f44336" } DELETE /api/panels/:id { #delete-panel data-toc-label="Delete Panel" }

Delete a panel by ID.

=== "Response `200`"

    ```json
    { "success": true }
    ```

=== "Error `403`"

    ```json
    {
      "error": "Cannot delete master panel",
      "message": "The master panel is protected and cannot be deleted"
    }
    ```

=== "Error `404`"

    ```json
    {
      "error": "Panel not found"
    }
    ```

!!! note "Side effect"
    Broadcasts `panel_deleted` to all WebSocket clients.

---

### :material-pencil:{ style="color: #ff9800" } POST /api/panels/:id/code { #update-code data-toc-label="Update Code" }

Update a panel's pattern code.

=== "Request"

    ```json
    {
      "code": "s(\"bd*4, hh*8\")",
      "autoPlay": true
    }
    ```

=== "Response `200`"

    ```json
    {
      "success": true,
      "stale": false
    }
    ```

=== "Error `400`"

    ```json
    {
      "error": "Validation error",
      "message": "code must be a string"
    }
    ```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | **yes** | New pattern code |
| `autoPlay` | boolean | no | If `true`, evaluate and play immediately |

!!! note "Side effect"
    Broadcasts `panel_updated` to all WebSocket clients. If the panel was playing and `autoPlay` is false, the panel is marked stale.

---

### :material-play-pause:{ style="color: #9c27b0" } POST /api/panels/:id/playback { #playback data-toc-label="Control Playback" }

Control a panel's playback state.

=== "Request"

    ```json
    { "state": "play" }
    ```

=== "Response `200`"

    ```json
    {
      "success": true,
      "currentState": "playing"
    }
    ```

=== "Error `400`"

    ```json
    {
      "error": "Validation error",
      "message": "state must be one of: play, pause, toggle"
    }
    ```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `state` | string | **yes** | `"play"` · `"pause"` · `"toggle"` |

!!! note "Side effect"
    Broadcasts `playback_changed` to all WebSocket clients.

---

## WebSocket Protocol

All messages are JSON objects with a `type` field. The server runs alongside Vite on the same port.

### Connection

```
ws://[host]:5173/ws
```

If authentication is enabled, include the API key as a query parameter:

```
ws://[host]:5173/ws?apiKey=your-secret-key
```

Connections from localhost do not require a key. Connections from remote addresses without a valid key receive a `401 Unauthorized` and are dropped.

On connect, the server sends:

```json
{
  "type": "server.hello",
  "clientId": "abc123",
  "timestamp": 1702345678000
}
```

### Registration

Register as either the main interface or a remote control:

```json
{
  "type": "client.register",
  "clientType": "main"
}
```

| Value | Behaviour |
|-------|-----------|
| `"main"` | Source of truth — receives commands from remotes |
| `"remote"` | Control surface — receives state broadcasts, automatically gets `full_state` on connect |

---

### Commands { data-toc-label="WS Commands" }

Sent by remote clients, forwarded by the server to the main interface.

#### Panel Control

| Type | Payload | Description |
|------|---------|-------------|
| `panel.play` | `{ panel: 1 }` | Start playback |
| `panel.pause` | `{ panel: 1 }` | Pause playback |
| `panel.toggle` | `{ panel: 1 }` | Toggle play/pause |
| `panel.updateCode` | `{ panelId, code }` | Update pattern code |

#### Global Control

| Type | Payload | Description |
|------|---------|-------------|
| `global.stopAll` | — | Stop all panels |
| `global.updateAll` | — | Re-evaluate all panels |

#### Slider Control

| Type | Payload | Description |
|------|---------|-------------|
| `master.sliderChange` | `{ sliderId, value }` | Change a master panel slider |
| `panel.sliderChange` | `{ panelId, sliderId, value }` | Change a panel slider |

---

### Events { data-toc-label="WS Events" }

Broadcast from the main interface to remote clients.

#### State Sync

| Type | Payload | Description |
|------|---------|-------------|
| `full_state` | `{ panels, masterCode, masterSliders }` | Complete state snapshot (sent on remote connect) |
| `client.syncPanels` | `{ panels: [...] }` | Bulk panel sync |

??? example "`full_state` payload"

    ```json
    {
      "type": "full_state",
      "panels": [
        {
          "id": "panel-123",
          "title": "Instrument 1",
          "code": "s(\"bd*4\")",
          "playing": true,
          "position": { "x": 0, "y": 0 },
          "size": { "w": 600, "h": 200 },
          "zIndex": 10
        }
      ],
      "masterCode": "let SLIDER_LPF = slider(800, 100, 5000);",
      "masterSliders": [
        { "id": 0, "label": "LPF", "min": 100, "max": 5000, "default": 800 }
      ]
    }
    ```

#### Panel Lifecycle

| Type | Payload | Description |
|------|---------|-------------|
| `panel_created` | `{ panelId, title, code, position, size }` | New panel added |
| `panel_deleted` | `{ panelId }` | Panel removed |
| `panel_renamed` | `{ panelId, title }` | Panel title changed |
| `panel_updated` | `{ panelId, code, autoPlay }` | Pattern code changed |
| `playback_changed` | `{ panelId, playing }` | Play/pause state changed |

#### Slider State

| Type | Payload | Description |
|------|---------|-------------|
| `master.sliders` | `{ sliders: [{ id, label, min, max, default }] }` | Master slider definitions |
| `master.sliderValue` | `{ sliderId, value }` | Master slider value update |
| `panel.sliders` | `{ panelId, sliders: [...] }` | Panel slider definitions |
| `panel.sliderValue` | `{ panelId, sliderId, value }` | Panel slider value update |

#### Metronome

| Type | Payload | Description |
|------|---------|-------------|
| `metronome.step` | `{ step, isDownbeat }` | 16-step metronome tick (`step`: 0–15, `isDownbeat`: true on step 0) |

---

### Error

```json
{
  "type": "error",
  "message": "Invalid JSON"
}
```

---

## Quick Examples

### curl — list panels, start one

```bash
# List all panels (no auth)
curl http://localhost:5173/api/panels | jq

# List all panels (with auth, from remote device)
curl -H "X-API-Key: your-secret-key" \
  http://192.168.1.100:5173/api/panels | jq

# Start panel 1
curl -X POST http://192.168.1.100:5173/api/panels/panel-1/playback \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key" \
  -d '{"state": "play"}'

# Check if auth is required (always public)
curl http://192.168.1.100:5173/api/server-config/auth-required
```

### JavaScript — WebSocket remote

```javascript
// Include apiKey param if auth is enabled
const ws = new WebSocket("ws://192.168.1.100:5173/ws?apiKey=your-secret-key");

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: "client.register",
    clientType: "remote"
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === "full_state") {
    console.log("Panels:", msg.panels);
  }
};

// Toggle panel 1
ws.send(JSON.stringify({
  type: "panel.toggle",
  panel: 1
}));
```

---

*See [Remote Control](../remote-control.md) for the built-in remote interface, or [Plugin Development](plugins.md) for building integrations.*
