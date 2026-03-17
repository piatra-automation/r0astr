# Plugin Development

Build integrations and extensions for `r0astr`.

---

## Overview

`r0astr` supports plugins that extend functionality through the WebSocket API. Plugins run as separate processes and communicate with `r0astr` over the network.

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
- Familiarity with `r0astr` [API](api.md)
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

const R0ASTR_HOST = process.env.R0ASTR_HOST || 'localhost:5173';
const API_KEY = process.env.R0ASTR_API_KEY || '';

class R0astrPlugin {
  constructor() {
    this.ws = null;
    this.connected = false;
  }

  connect() {
    // Include API key as query param if authentication is enabled
    const url = API_KEY
      ? `ws://${R0ASTR_HOST}/ws?apiKey=${API_KEY}`
      : `ws://${R0ASTR_HOST}/ws`;

    console.log(`Connecting to r0astr at ${R0ASTR_HOST}...`);
    this.ws = new WebSocket(url);

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
    // Register as a remote client to receive state broadcasts
    this.send({ type: 'client.register', clientType: 'remote' });
  }

  onMessage(message) {
    console.log('Received:', message.type);

    switch (message.type) {
      case 'server.hello':
        console.log('Server assigned client ID:', message.clientId);
        break;
      case 'full_state':
        console.log('Panels:', message.panels.length);
        console.log('Master sliders:', message.masterSliders);
        break;
      case 'playback_changed':
        console.log(`Panel ${message.panelId} playing: ${message.playing}`);
        break;
      case 'panel_updated':
        console.log(`Panel ${message.panelId} code updated`);
        break;
    }
  }

  send(message) {
    if (this.connected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Panel control methods
  playPanel(panelIndex) {
    this.send({ type: 'panel.play', panel: panelIndex });
  }

  pausePanel(panelIndex) {
    this.send({ type: 'panel.pause', panel: panelIndex });
  }

  togglePanel(panelIndex) {
    this.send({ type: 'panel.toggle', panel: panelIndex });
  }

  updateCode(panelId, code) {
    this.send({ type: 'panel.updateCode', panelId, code });
  }

  stopAll() {
    this.send({ type: 'global.stopAll' });
  }

  setMasterSlider(sliderId, value) {
    this.send({ type: 'master.sliderChange', sliderId, value });
  }
}

// Start the plugin
const plugin = new R0astrPlugin();
plugin.connect();

// Example: Toggle panel 1 after 3 seconds
setTimeout(() => {
  console.log('Toggling panel 1...');
  plugin.togglePanel(1);
}, 3000);
```

### Running the Plugin

```bash
npm install
npm start

# With authentication:
R0ASTR_HOST=192.168.1.100:5173 R0ASTR_API_KEY=my-secret npm start
```

---

## Authentication

If `r0astr` has an API key configured in `server.config.json`, your plugin must include it when connecting:

```javascript
// API key is passed as a query parameter on the WebSocket URL
const ws = new WebSocket('ws://192.168.1.100:5173/ws?apiKey=your-key');
```

Connections from localhost are always allowed without a key. To check if authentication is required, query the public REST endpoint:

```bash
curl http://192.168.1.100:5173/api/server-config/auth-required
# Returns: { "authRequired": true }
```

See [API Reference — Authentication & CORS](api.md#authentication-cors) for details.

---

## Lifecycle Events

The `r0astr` server broadcasts events your plugin can listen to. Register as a `remote` client to receive them.

### Full State (on connect)

Sent automatically when a remote client connects:

```json
{
  "type": "full_state",
  "panels": [
    { "id": "panel-123", "title": "Drums", "code": "s(\"bd*4\")", "playing": true }
  ],
  "masterCode": "let TEMPO = slider(30, 15, 45);",
  "masterSliders": [{ "id": 0, "label": "TEMPO", "min": 15, "max": 45, "default": 30 }]
}
```

### Playback Changed

Fired when any panel starts or stops:

```json
{
  "type": "playback_changed",
  "panelId": "panel-123",
  "playing": true
}
```

### Panel Updated

Fired when a panel's code changes:

```json
{
  "type": "panel_updated",
  "panelId": "panel-123",
  "code": "s(\"bd*4, hh*8\")",
  "autoPlay": true
}
```

### Panel Lifecycle

```json
{ "type": "panel_created", "panelId": "panel-456", "title": "Bass" }
{ "type": "panel_deleted", "panelId": "panel-456" }
{ "type": "panel_renamed", "panelId": "panel-123", "title": "New Name" }
```

### Slider Updates

```json
{ "type": "master.sliderValue", "sliderId": 0, "value": 25 }
{ "type": "panel.sliderValue", "panelId": "panel-123", "sliderId": 0, "value": 800 }
```

### Subscribing to Events

Events are automatically broadcast to all registered remote clients. Handle them in your `onMessage` handler:

```javascript
onMessage(message) {
  switch (message.type) {
    case 'playback_changed':
      this.handlePlaybackChange(message);
      break;
    case 'panel_updated':
      this.handlePatternUpdate(message);
      break;
    case 'master.sliderValue':
      this.handleSliderChange(message);
      break;
  }
}
```

---

## API Integration

### Available Commands

| Command | Payload | Description |
|---------|---------|-------------|
| `client.register` | `{ clientType: "remote" }` | Register to receive state broadcasts |
| `panel.play` | `{ panel: 1 }` | Start a panel (by index) |
| `panel.pause` | `{ panel: 1 }` | Pause a panel |
| `panel.toggle` | `{ panel: 1 }` | Toggle play/pause |
| `panel.updateCode` | `{ panelId, code }` | Update pattern code |
| `global.stopAll` | — | Stop all panels |
| `global.updateAll` | — | Re-evaluate all panels |
| `master.sliderChange` | `{ sliderId, value }` | Change a master slider |
| `panel.sliderChange` | `{ panelId, sliderId, value }` | Change a panel slider |

### Broadcast Events

| Type | Payload | When |
|------|---------|------|
| `server.hello` | `{ clientId, timestamp }` | On connection |
| `full_state` | `{ panels, masterCode, masterSliders }` | After remote registration |
| `playback_changed` | `{ panelId, playing }` | Panel starts/stops |
| `panel_updated` | `{ panelId, code }` | Code changed |
| `panel_created` | `{ panelId, title }` | New panel added |
| `panel_deleted` | `{ panelId }` | Panel removed |
| `master.sliderValue` | `{ sliderId, value }` | Master slider moved |
| `panel.sliderValue` | `{ panelId, sliderId, value }` | Panel slider moved |

See [API Reference](api.md) for complete documentation including REST endpoints.

---

## Testing Your Plugin

### Local Testing

1. Start `r0astr`:
   ```bash
   cd r0astr
   npm run dev
   ```

2. Start your plugin:
   ```bash
   cd my-plugin
   npm start
   ```

3. Verify in `r0astr` UI that commands work

### Debugging Tips

- Log all incoming messages during development
- Register as `remote` to get `full_state` on connect
- Check the browser console for errors
- Use environment variables for connection URL:
  ```bash
  R0ASTR_HOST=192.168.1.100:5173 R0ASTR_API_KEY=my-key npm start
  ```

### Testing Checklist

- [ ] Plugin connects successfully (with and without auth)
- [ ] Panel commands work (play, pause, toggle, updateCode)
- [ ] Events are received correctly
- [ ] Reconnection works after disconnect
- [ ] Errors are handled gracefully

---

## Plugin Ideas

### MIDI Controller

Map MIDI CC to master sliders, notes to panel triggers:

```javascript
const midi = require('midi');

// ... MIDI setup ...

midiInput.on('message', (deltaTime, message) => {
  const [status, cc, value] = message;

  if (status === 0xB0) { // CC message
    // Map CC 1-4 to master slider IDs 0-3
    const sliderId = cc - 1;
    const normalized = value / 127;
    plugin.setMasterSlider(sliderId, normalized);
  }

  if (status === 0x90) { // Note on
    const panelIndex = (cc % 8) + 1;
    plugin.togglePanel(panelIndex);
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
  if (oscMessage.address === '/r0astr/panel/1/toggle') {
    plugin.togglePanel(1);
  }
  if (oscMessage.address === '/r0astr/stop') {
    plugin.stopAll();
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
  plugin.updateCode('panel-1', patterns[index]);
  index = (index + 1) % patterns.length;
}, 4000); // Change every 4 seconds
```

### Visualizer

React to playback changes for visuals:

```javascript
onMessage(message) {
  if (message.type === 'playback_changed') {
    updateVisualization(message.panelId, message.playing);
  }
  if (message.type === 'master.sliderValue') {
    updateSliderDisplay(message.sliderId, message.value);
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
- Configuration options (including auth setup)
- Usage examples
- `r0astr` version compatibility

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
const R0ASTR_HOST = process.env.R0ASTR_HOST || 'localhost:5173';
const API_KEY = process.env.R0ASTR_API_KEY || '';
```

### Logging

Provide clear console output:

```javascript
console.log('[r0astr-plugin] Connected');
console.log('[r0astr-plugin] Panel 1 toggled');
```

---

## Related Documentation

- [API Reference](api.md) - Full endpoint documentation
- [Architecture](architecture.md) - System design overview
- [Contributing](contributing.md) - Contribute to `r0astr` core
