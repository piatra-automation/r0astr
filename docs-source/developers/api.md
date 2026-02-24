# API Reference

r0astr provides both a REST API and a WebSocket server for real-time control and integration.

## REST API

Base URL: `http://localhost:5173`

All endpoints return JSON and include CORS headers (`Access-Control-Allow-Origin: *`).

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-14T12:00:00.000Z"
}
```

### List Panels

```
GET /api/panels
```

Response:
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

### Create Panel

```
POST /api/panels
```

Body:
```json
{
  "title": "My Panel",
  "code": "s(\"bd*4\")",
  "position": { "x": 0, "y": 0 },
  "size": { "w": 600, "h": 200 }
}
```

All fields are optional. Returns `{ "success": true, "panelId": "panel-..." }`.

### Delete Panel

```
DELETE /api/panels/:id
```

Returns `{ "success": true }`.

Returns `403` if you attempt to delete the master panel.

### Update Panel Code

```
POST /api/panels/:id/code
```

Body:
```json
{
  "code": "s(\"bd*4, hh*8\")",
  "autoPlay": true
}
```

- `code` (string, required) — New pattern code
- `autoPlay` (boolean, optional) — If true, evaluate and play immediately

### Control Playback

```
POST /api/panels/:id/playback
```

Body:
```json
{
  "state": "play"
}
```

`state` must be `"play"`, `"pause"`, or `"toggle"`.

Returns `{ "success": true, "currentState": "playing" }`.

---

## WebSocket

### Connection

```
ws://[host]:5173/ws
```

All messages are JSON. The server runs alongside the Vite dev server.

On connection, the server sends:

```json
{
  "type": "server.hello",
  "clientId": "abc123",
  "timestamp": 1702345678000
}
```

### Client Registration

Register as a main interface or remote control:

```json
{
  "type": "client.register",
  "clientType": "main"
}
```

`clientType` is `"main"` or `"remote"`. Remote clients automatically receive a `full_state` broadcast after registration.

### Commands (Remote → Server → Main)

These messages are sent by remote clients and forwarded to the main interface:

| Type | Payload | Description |
|------|---------|-------------|
| `panel.play` | `{ panel: 1 }` | Start a panel |
| `panel.pause` | `{ panel: 1 }` | Pause a panel |
| `panel.toggle` | `{ panel: 1 }` | Toggle play/pause |
| `panel.update` | `{ panel: 1, data: { code: "..." } }` | Update pattern code |
| `global.stopAll` | — | Stop all panels |
| `global.updateAll` | — | Re-evaluate all panels |
| `master.sliderChange` | `{ sliderId, value }` | Change a master slider |
| `panel.sliderChange` | `{ panelId, sliderId, value }` | Change a panel slider |

### Events (Main → Server → Remote)

These messages are broadcast from the main interface to remote clients:

| Type | Payload | Description |
|------|---------|-------------|
| `full_state` | `{ panels, masterCode, masterSliders }` | Complete state sync |
| `panel_created` | `{ panelId, title, code, position, size }` | New panel added |
| `panel_deleted` | `{ panelId }` | Panel removed |
| `panel_renamed` | `{ panelId, title }` | Panel title changed |
| `panel_updated` | `{ panelId, code, autoPlay }` | Pattern code changed |
| `playback_changed` | `{ panelId, playing }` | Play/pause state changed |
| `master.sliders` | `{ sliders: [...] }` | Master slider definitions |
| `master.sliderValue` | `{ sliderId, value }` | Master slider value update |
| `panel.sliders` | `{ panelId, sliders: [...] }` | Panel slider definitions |
| `panel.sliderValue` | `{ panelId, sliderId, value }` | Panel slider value update |
| `metronome.step` | `{ step: 0-15, isDownbeat }` | 16-step metronome tick |

### Error Response

```json
{
  "type": "error",
  "message": "Invalid JSON"
}
```

---

## Security

!!! warning "Local Network Only"
    Both the REST API and WebSocket are designed for local network use. No authentication is enforced. Do not expose to the public internet.

---

*See [Remote Control](../remote-control.md) for the built-in remote interface.*
