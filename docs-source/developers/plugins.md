# Plugin Development

Build integrations and extensions for r0astr.

---

## Overview

r0astr supports plugins that extend functionality through the WebSocket API. Plugins run as separate processes and communicate with r0astr over the network.

### What Plugins Can Do

- **Control panels** - Start, stop, and update patterns programmatically
- **Add interfaces** - MIDI controllers, OSC, custom GUIs
- **Generate patterns** - Algorithmic composition, sequencers
- **Integrate services** - Lighting (DMX), visuals, external apps
- **Monitor state** - React to pattern changes and playback events

---

## Getting Started

### Prerequisites

- Node.js 18+
- Familiarity with r0astr [API](api.md)
- Understanding of WebSocket communication

### Plugin Structure

```
my-r0astr-plugin/
├── package.json        # Dependencies and metadata
├── src/
│   └── index.js        # Entry point
├── README.md           # Documentation
└── LICENSE             # License file
```

### Minimal package.json

```json
{
  "name": "my-r0astr-plugin",
  "version": "1.0.0",
  "description": "My r0astr plugin",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "ws": "^8.0.0"
  }
}
```

---

## Hello World Plugin

A complete working plugin:

```javascript
// src/index.js
const WebSocket = require('ws');

const R0ASTR_URL = process.env.R0ASTR_URL || 'ws://localhost:5173/ws';

class R0astrPlugin {
  constructor() {
    this.ws = null;
    this.connected = false;
  }

  connect() {
    console.log(`Connecting to r0astr at ${R0ASTR_URL}...`);
    this.ws = new WebSocket(R0ASTR_URL);

    this.ws.on('open', () => {
      console.log('Connected to r0astr!');
      this.connected = true;
      this.onConnected();
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.onMessage(message);
    });

    this.ws.on('close', () => {
      console.log('Disconnected from r0astr');
      this.connected = false;
      // Attempt reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    });

    this.ws.on('error', (err) => {
      console.error('Connection error:', err.message);
    });
  }

  onConnected() {
    // Request current state on connect
    this.send({ type: 'state:get' });
  }

  onMessage(message) {
    console.log('Received:', message.type);

    switch (message.type) {
      case 'state:current':
        console.log('Current state:', message.payload);
        break;
      case 'event:panel-state':
        console.log('Panel changed:', message.payload);
        break;
    }
  }

  send(message) {
    if (this.connected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Panel control methods
  startPanel(panelId) {
    this.send({
      type: 'panel:start',
      payload: { panelId }
    });
  }

  stopPanel(panelId) {
    this.send({
      type: 'panel:stop',
      payload: { panelId }
    });
  }

  updatePattern(panelId, pattern) {
    this.send({
      type: 'panel:update',
      payload: { panelId, pattern }
    });
  }

  stopAll() {
    this.send({ type: 'playback:stop-all' });
  }
}

// Start the plugin
const plugin = new R0astrPlugin();
plugin.connect();

// Example: Start panel 1 after 3 seconds
setTimeout(() => {
  console.log('Starting panel 1...');
  plugin.startPanel('panel-1');
}, 3000);
```

### Running the Plugin

```bash
npm install
npm start
```

---

## Lifecycle Events

The r0astr server broadcasts events your plugin can listen to:

### Panel State Changed

Fired when any panel starts or stops:

```javascript
{
  "type": "event:panel-state",
  "payload": {
    "panelId": "panel-1",
    "playing": true
  }
}
```

### Pattern Updated

Fired when a panel's pattern changes:

```javascript
{
  "type": "event:pattern-update",
  "payload": {
    "panelId": "panel-1",
    "pattern": "s(\"bd*4\")"
  }
}
```

### Subscribing to Events

Events are automatically broadcast to all connected clients. Simply handle them in your `onMessage` handler:

```javascript
onMessage(message) {
  switch (message.type) {
    case 'event:panel-state':
      this.handlePanelState(message.payload);
      break;
    case 'event:pattern-update':
      this.handlePatternUpdate(message.payload);
      break;
  }
}
```

---

## API Integration

### Available Commands

| Command | Payload | Description |
|---------|---------|-------------|
| `panel:start` | `{ panelId }` | Start a panel |
| `panel:stop` | `{ panelId }` | Stop a panel |
| `panel:update` | `{ panelId, pattern }` | Update pattern |
| `playback:stop-all` | - | Stop all panels |
| `playback:tempo` | `{ bpm }` | Set tempo |
| `state:get` | - | Request current state |

### Response Types

| Type | Payload | When |
|------|---------|------|
| `state:current` | Full state object | After `state:get` |
| `event:panel-state` | Panel status | When panel starts/stops |
| `error` | Error details | On invalid command |

See [API Reference](api.md) for complete documentation.

---

## Testing Your Plugin

### Local Testing

1. Start r0astr:
   ```bash
   cd r0astr
   npm run dev
   ```

2. Start your plugin:
   ```bash
   cd my-plugin
   npm start
   ```

3. Verify in r0astr UI that commands work

### Debugging Tips

- Log all incoming messages during development
- Use `state:get` to verify initial state
- Check the browser console for errors
- Use environment variables for connection URL:
  ```bash
  R0ASTR_URL=ws://192.168.1.100:5173/ws npm start
  ```

### Testing Checklist

- [ ] Plugin connects successfully
- [ ] Panel commands work (start, stop, update)
- [ ] Events are received correctly
- [ ] Reconnection works after disconnect
- [ ] Errors are handled gracefully

---

## Plugin Ideas

### MIDI Controller

Map MIDI CC to sliders, notes to panel triggers:

```javascript
const midi = require('midi');

// ... MIDI setup ...

midiInput.on('message', (deltaTime, message) => {
  const [status, cc, value] = message;

  if (status === 0xB0) { // CC message
    // Map CC to slider value
    const sliderValue = value / 127;
    // Update pattern with new value
  }

  if (status === 0x90) { // Note on
    const panelId = `panel-${(cc % 4) + 1}`;
    plugin.startPanel(panelId);
  }
});
```

### OSC Bridge

Connect to SuperCollider, Max/MSP, TouchOSC:

```javascript
const osc = require('osc');

const oscPort = new osc.UDPPort({
  localPort: 57121
});

oscPort.on('message', (oscMessage) => {
  if (oscMessage.address === '/r0astr/panel/1/start') {
    plugin.startPanel('panel-1');
  }
});
```

### Pattern Sequencer

Programmatically change patterns over time:

```javascript
const patterns = [
  's("bd*4")',
  's("bd*4, hh*8")',
  's("bd*4, hh*8, ~ sd ~ sd")'
];

let index = 0;

setInterval(() => {
  plugin.updatePattern('panel-1', patterns[index]);
  index = (index + 1) % patterns.length;
}, 4000); // Change every 4 seconds
```

### Visualizer

React to pattern changes for visuals:

```javascript
onMessage(message) {
  if (message.type === 'event:panel-state') {
    // Update visuals based on which panels are playing
    updateVisualization(message.payload);
  }
}
```

---

## Distribution

### Current Options

1. **GitHub** - Host your plugin repository
2. **npm** - Publish as an npm package
3. **Direct sharing** - Zip file distribution

### Publishing to npm

```bash
npm login
npm publish
```

### Documentation Requirements

Include in your README:

- Installation instructions
- Configuration options
- Usage examples
- r0astr version compatibility

### Future: Plugin Marketplace

A community marketplace for plugins is planned. Stay tuned for updates.

---

## Best Practices

### Error Handling

```javascript
try {
  this.ws.send(JSON.stringify(message));
} catch (err) {
  console.error('Failed to send message:', err);
}
```

### Reconnection

Always implement automatic reconnection:

```javascript
ws.on('close', () => {
  setTimeout(() => this.connect(), 5000);
});
```

### Configuration

Use environment variables for flexibility:

```javascript
const R0ASTR_URL = process.env.R0ASTR_URL || 'ws://localhost:5173/ws';
```

### Logging

Provide clear console output:

```javascript
console.log('[r0astr-plugin] Connected');
console.log('[r0astr-plugin] Panel 1 started');
```

---

## Related Documentation

- [API Reference](api.md) - Full endpoint documentation
- [Architecture](architecture.md) - System design overview
- [Contributing](contributing.md) - Contribute to r0astr core
