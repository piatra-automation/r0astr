# API Reference

r0astr provides WebSocket endpoints for real-time control and integration.

## Overview

The API enables:

- Remote control of panels (start, stop, update patterns)
- Playback control (tempo, stop all)
- State queries (current patterns, playing status)

## Connection

### WebSocket Endpoint

```
ws://[host]:5173/ws
```

The WebSocket server runs alongside the development server.

## Message Format

All messages are JSON objects:

```json
{
  "type": "message-type",
  "payload": { ... }
}
```

## Panel Control

### Start Panel

```json
{
  "type": "panel:start",
  "payload": {
    "panelId": "panel-1"
  }
}
```

### Stop Panel

```json
{
  "type": "panel:stop",
  "payload": {
    "panelId": "panel-1"
  }
}
```

### Update Pattern

```json
{
  "type": "panel:update",
  "payload": {
    "panelId": "panel-1",
    "pattern": "s(\"bd*4\")"
  }
}
```

## Playback Control

### Stop All

```json
{
  "type": "playback:stop-all"
}
```

### Set Tempo

```json
{
  "type": "playback:tempo",
  "payload": {
    "bpm": 120
  }
}
```

## State Queries

### Get State

```json
{
  "type": "state:get"
}
```

Response:
```json
{
  "type": "state:current",
  "payload": {
    "panels": [
      {
        "id": "panel-1",
        "playing": true,
        "pattern": "s(\"bd*4\")"
      }
    ],
    "tempo": 120
  }
}
```

## Events

The server broadcasts state changes:

### Panel State Changed

```json
{
  "type": "event:panel-state",
  "payload": {
    "panelId": "panel-1",
    "playing": true
  }
}
```

## Error Handling

Errors are returned as:

```json
{
  "type": "error",
  "payload": {
    "code": "INVALID_PANEL",
    "message": "Panel not found: panel-99"
  }
}
```

## Rate Limiting

No rate limiting is currently enforced. Be reasonable with message frequency.

## Security

!!! warning "Local Network Only"
    The API is designed for local network use. Do not expose to the public internet without additional security measures.

---

*See [Remote Control](../guides/remote-control.md) for the built-in remote interface.*
