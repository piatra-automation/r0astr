# Plugin Development

!!! note "Coming Soon"
    Plugin architecture documentation is under development.

## Overview

r0astr supports plugins that extend functionality through the API.

## Plugin Concepts

Plugins can:

- Add new control interfaces
- Integrate with external hardware (MIDI, OSC)
- Provide pattern generators
- Connect to external services

## Getting Started

### Prerequisites

- Node.js 18+
- Familiarity with r0astr [API](api.md)
- Understanding of WebSocket communication

### Basic Structure

```
my-r0astr-plugin/
├── package.json
├── src/
│   └── index.js
└── README.md
```

### Minimal Plugin

```javascript
// src/index.js
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5173/ws');

ws.on('open', () => {
  console.log('Connected to r0astr');

  // Example: Start panel 1
  ws.send(JSON.stringify({
    type: 'panel:start',
    payload: { panelId: 'panel-1' }
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message);
});
```

## Plugin Ideas

- **MIDI Controller** - Map MIDI CC to sliders
- **OSC Bridge** - Connect to SuperCollider, Max/MSP
- **Pattern Sequencer** - Programmatic pattern changes
- **Visualizer** - React to audio/pattern data

## Distribution

*Plugin marketplace documentation coming soon.*

---

*See the [API Reference](api.md) for available endpoints.*
