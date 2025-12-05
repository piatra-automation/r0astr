# Epic 05: Network Plugins

## Overview

Implement network access capabilities for plugins, enabling integrations with MQTT, OSC, WebSocket, and HTTP services. This includes the permission system, secure sandboxing, and reference implementations.

## Business Value

- Enables IoT and home automation integration
- Professional audio integration (DAWs, hardware)
- Remote performance control
- API integrations with external services
- Community-driven protocol support

## Dependencies

- Epic 02: Plugin Loader (complete)
- Epic 03: Plugin API (complete)
- Epic 04: Plugin Settings (complete)

## Deliverables

- Network permission system
- MQTT client API
- OSC client API
- WebSocket client API
- HTTP fetch API
- Reference plugin implementations
- Security documentation

---

## Story 5.1: Implement Network Permission System

### Description
Create a granular permission system for network access that allows plugins to request specific capabilities while protecting user security.

### Acceptance Criteria
- [ ] Permissions declared in manifest
- [ ] User prompted on first use
- [ ] Permissions can be revoked
- [ ] Scoped permissions (localhost vs external)
- [ ] Domain allowlisting supported
- [ ] Connection attempts logged

### Permission Levels

| Permission | Description | Risk |
|------------|-------------|------|
| `network:localhost` | Connect to localhost only | Medium |
| `network:local` | Connect to local network (192.168.x.x, etc.) | Medium |
| `network:external` | Connect to any host | High |
| `network:domains` | Connect to specified domains only | Medium |

### Manifest Declaration
```json
{
  "permissions": [
    "network:localhost",
    "network:domains"
  ],
  "networkDomains": [
    "mqtt.example.com",
    "*.myservice.io"
  ]
}
```

### Permission Prompt UI
```
┌────────────────────────────────────────────────────────┐
│  Permission Request                                [X] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  "MQTT Bridge" is requesting network access            │
│                                                        │
│  This plugin wants to connect to:                      │
│  • localhost:1883 (MQTT broker)                        │
│  • mqtt.example.com (external)                         │
│                                                        │
│  ⚠ Network access allows the plugin to send and       │
│    receive data from these servers.                    │
│                                                        │
│  ┌────────────────────────────────────────────────┐    │
│  │ ☑ Remember this choice                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│                          [Deny]    [Allow]             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Permission Storage
```json
// {userData}/permissions.json
{
  "mqtt-bridge": {
    "network:localhost": { "granted": true, "grantedAt": "..." },
    "network:domains": { 
      "granted": true, 
      "domains": ["mqtt.example.com"],
      "grantedAt": "..."
    }
  }
}
```

### Implementation
```javascript
// src/managers/permissionManager.js

class PermissionManager {
  async checkPermission(pluginId, permission, details = {}) {
    const saved = await this.getSavedPermission(pluginId, permission);
    
    if (saved !== null) {
      return saved;
    }
    
    // Prompt user
    const granted = await this.promptUser(pluginId, permission, details);
    await this.savePermission(pluginId, permission, granted);
    return granted;
  }
  
  async checkNetworkAccess(pluginId, url) {
    const parsed = new URL(url);
    
    // Check if localhost
    if (this.isLocalhost(parsed.hostname)) {
      return this.checkPermission(pluginId, 'network:localhost');
    }
    
    // Check if local network
    if (this.isLocalNetwork(parsed.hostname)) {
      return this.checkPermission(pluginId, 'network:local');
    }
    
    // Check domain allowlist
    const plugin = getPlugin(pluginId);
    if (plugin.manifest.networkDomains) {
      if (this.matchesDomain(parsed.hostname, plugin.manifest.networkDomains)) {
        return this.checkPermission(pluginId, 'network:domains', {
          domain: parsed.hostname
        });
      }
    }
    
    // External access
    return this.checkPermission(pluginId, 'network:external', {
      host: parsed.hostname
    });
  }
}
```

### Validation
- [ ] Permission check before network access
- [ ] Prompt shown for new permissions
- [ ] Saved permissions restored
- [ ] Denied permissions block access
- [ ] Domain matching works correctly
- [ ] Local network detection accurate

### Test Cases
```javascript
describe('PermissionManager', () => {
  it('should prompt for new permission', async () => { });
  it('should remember granted permission', async () => { });
  it('should block denied permission', async () => { });
  it('should detect localhost correctly', () => { });
  it('should detect local network correctly', () => { });
  it('should match domains with wildcards', () => { });
});
```

### Deliverables
- `/src/managers/permissionManager.js`
- `/src/ui/permissionPrompt.js`

---

## Story 5.2: Implement MQTT Client API

### Description
Provide a secure MQTT client API for plugins to connect to MQTT brokers.

### Requires Permission
`network:localhost` or `network:external` or `network:domains`

### API Specification
```javascript
r0astr.network.mqtt = {
  /**
   * Create an MQTT client
   * @param {MQTTOptions} options
   * @returns {Promise<MQTTClient>}
   */
  connect: async (options) => {
    // options: { broker, port, username?, password?, clientId?, useTLS? }
    return {
      /**
       * Subscribe to a topic
       * @param {string} topic - Topic pattern (supports wildcards)
       * @param {Function} callback
       * @returns {Promise<Function>} unsubscribe
       */
      subscribe: async (topic, callback) => { },
      
      /**
       * Publish a message
       * @param {string} topic
       * @param {string|Buffer} payload
       * @param {PublishOptions} options
       * @returns {Promise<void>}
       */
      publish: async (topic, payload, options = {}) => { },
      
      /**
       * Disconnect from broker
       * @returns {Promise<void>}
       */
      disconnect: async () => { },
      
      /**
       * Check connection status
       * @returns {boolean}
       */
      isConnected: () => true,
      
      /**
       * Listen for connection events
       * @param {'connect'|'disconnect'|'error'} event
       * @param {Function} callback
       * @returns {Function} unsubscribe
       */
      on: (event, callback) => { }
    };
  }
};
```

### Usage Example
```javascript
// In plugin
async onEnable(api, settings) {
  try {
    this.mqtt = await api.network.mqtt.connect({
      broker: settings.broker,
      port: settings.port || 1883,
      username: settings.username,
      password: settings.password
    });
    
    this.mqtt.on('connect', () => {
      api.ui.notify('MQTT connected', { type: 'success' });
    });
    
    this.mqtt.on('error', (err) => {
      api.ui.notify(`MQTT error: ${err.message}`, { type: 'error' });
    });
    
    // Subscribe to control topics
    await this.mqtt.subscribe('r0astr/panel/+/play', (topic, message) => {
      const panelId = topic.split('/')[2];
      api.panels.play(`panel-${panelId}`);
    });
    
    // Publish state changes
    api.panels.onStateChange('*', (change) => {
      this.mqtt.publish(`r0astr/state/${change.panelId}`, 
        JSON.stringify(change));
    });
    
  } catch (error) {
    api.ui.notify(`Failed to connect: ${error.message}`, { type: 'error' });
  }
}

async onDisable() {
  await this.mqtt?.disconnect();
}
```

### Implementation Notes
- Use `mqtt` npm package in main process
- IPC bridge for renderer communication
- Connection management in main process
- Message routing to correct plugin

### Validation
- [ ] Connects to MQTT broker
- [ ] Subscribes with wildcards
- [ ] Receives messages
- [ ] Publishes messages
- [ ] Handles disconnection
- [ ] Permission checked before connect

### Deliverables
- `/src/api/network/mqtt.js`
- `/electron/services/mqttService.cjs`

---

## Story 5.3: Implement OSC Client API

### Description
Provide an OSC (Open Sound Control) client API for plugins to communicate with audio software and hardware.

### Requires Permission
`network:localhost` or `network:local`

### API Specification
```javascript
r0astr.network.osc = {
  /**
   * Create an OSC client (UDP sender)
   * @param {OSCOptions} options
   * @returns {Promise<OSCClient>}
   */
  createClient: async (options) => {
    // options: { host, port }
    return {
      /**
       * Send an OSC message
       * @param {string} address - OSC address (e.g., '/track/1/volume')
       * @param {...any} args - OSC arguments
       */
      send: (address, ...args) => { },
      
      /**
       * Close the client
       */
      close: () => { }
    };
  },
  
  /**
   * Create an OSC server (UDP receiver)
   * @param {number} port
   * @returns {Promise<OSCServer>}
   */
  createServer: async (port) => {
    return {
      /**
       * Listen for OSC messages
       * @param {string} address - Address pattern to match
       * @param {Function} callback
       * @returns {Function} unsubscribe
       */
      on: (address, callback) => { },
      
      /**
       * Listen for all messages
       * @param {Function} callback
       * @returns {Function} unsubscribe
       */
      onAny: (callback) => { },
      
      /**
       * Close the server
       */
      close: () => { }
    };
  }
};
```

### Usage Example
```javascript
// Ableton Link style sync
async onEnable(api, settings) {
  // Send to DAW
  this.oscClient = await api.network.osc.createClient({
    host: settings.dawHost,
    port: settings.dawPort
  });
  
  // Listen for DAW messages
  this.oscServer = await api.network.osc.createServer(settings.listenPort);
  
  this.oscServer.on('/transport/play', () => {
    api.panels.stopAll();
    // Start all enabled panels
  });
  
  this.oscServer.on('/track/*/volume', (address, value) => {
    const track = address.split('/')[2];
    // Map to panel volume
  });
  
  // Send panel state to DAW
  api.panels.onStateChange('*', (change) => {
    if (change.property === 'playing') {
      this.oscClient.send(`/r0astr/panel/${change.panelId}/playing`, 
        change.newValue ? 1 : 0);
    }
  });
}
```

### Implementation Notes
- Use `osc` or `node-osc` npm package
- UDP sockets in main process
- Support for OSC bundles
- Pattern matching for addresses

### Validation
- [ ] Sends OSC messages
- [ ] Receives OSC messages
- [ ] Pattern matching works
- [ ] Multiple clients supported
- [ ] Permission checked

### Deliverables
- `/src/api/network/osc.js`
- `/electron/services/oscService.cjs`

---

## Story 5.4: Implement WebSocket Client API

### Description
Provide a WebSocket client API for plugins to establish persistent connections.

### Requires Permission
`network:localhost` or `network:external` or `network:domains`

### API Specification
```javascript
r0astr.network.websocket = {
  /**
   * Create a WebSocket connection
   * @param {string} url - WebSocket URL (ws:// or wss://)
   * @param {WebSocketOptions} options
   * @returns {Promise<WebSocketClient>}
   */
  connect: async (url, options = {}) => {
    return {
      /**
       * Send a message
       * @param {string|ArrayBuffer} data
       */
      send: (data) => { },
      
      /**
       * Send JSON data
       * @param {object} data
       */
      sendJSON: (data) => { },
      
      /**
       * Close the connection
       * @param {number} code
       * @param {string} reason
       */
      close: (code, reason) => { },
      
      /**
       * Get connection state
       * @returns {'connecting'|'open'|'closing'|'closed'}
       */
      getState: () => 'open',
      
      /**
       * Listen for events
       * @param {'open'|'message'|'error'|'close'} event
       * @param {Function} callback
       * @returns {Function} unsubscribe
       */
      on: (event, callback) => { }
    };
  }
};
```

### Validation
- [ ] Connects to WebSocket servers
- [ ] Sends string messages
- [ ] Sends binary messages
- [ ] Receives messages
- [ ] Handles disconnection
- [ ] Auto-reconnect option

### Deliverables
- `/src/api/network/websocket.js`

---

## Story 5.5: Implement HTTP Fetch API

### Description
Provide a sandboxed HTTP fetch API for plugins to make HTTP requests.

### Requires Permission
`network:localhost` or `network:external` or `network:domains`

### API Specification
```javascript
r0astr.network.fetch = {
  /**
   * Make an HTTP request (similar to browser fetch)
   * @param {string} url
   * @param {RequestOptions} options
   * @returns {Promise<Response>}
   */
  request: async (url, options = {}) => {
    // options: { method, headers, body, timeout }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map(),
      text: async () => '...',
      json: async () => ({ }),
      arrayBuffer: async () => new ArrayBuffer()
    };
  },
  
  // Convenience methods
  get: async (url, options) => { },
  post: async (url, body, options) => { },
  put: async (url, body, options) => { },
  delete: async (url, options) => { }
};
```

### Usage Example
```javascript
// Integration with web service
async syncWithService(api, settings) {
  const response = await api.network.fetch.post(
    `${settings.serviceUrl}/api/patterns`,
    {
      panels: await api.panels.getAll()
    },
    {
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response.json();
}
```

### Validation
- [ ] GET requests work
- [ ] POST with body works
- [ ] Headers sent correctly
- [ ] Response parsed correctly
- [ ] Timeout handled
- [ ] Permission checked

### Deliverables
- `/src/api/network/fetch.js`

---

## Story 5.6: Create MQTT Bridge Reference Plugin

### Description
Create a fully-featured MQTT integration plugin as a reference implementation.

### Features
- Connect to MQTT broker
- Map topics to panel controls
- Publish panel state changes
- Configurable topic patterns
- Connection status indicator
- Message logging (debug)

### Manifest
```json
{
  "name": "mqtt-bridge",
  "displayName": "MQTT Bridge",
  "version": "1.0.0",
  "description": "Control r0astr via MQTT protocol",
  "type": "extension",
  "permissions": [
    "panels:read",
    "panels:write",
    "network:localhost",
    "network:domains",
    "ui:notifications",
    "storage"
  ],
  "networkDomains": [],
  "main": "index.js",
  "settings": {
    "connection": {
      "type": "group",
      "title": "Connection",
      "fields": {
        "broker": { "type": "string", "title": "Broker", "default": "localhost" },
        "port": { "type": "number", "title": "Port", "default": 1883 },
        "useTLS": { "type": "boolean", "title": "Use TLS", "default": false },
        "username": { "type": "string", "title": "Username", "default": "" },
        "password": { "type": "string", "title": "Password", "inputType": "password", "default": "" }
      }
    },
    "topics": {
      "type": "group",
      "title": "Topics",
      "fields": {
        "baseTopic": { "type": "string", "title": "Base Topic", "default": "r0astr" },
        "publishState": { "type": "boolean", "title": "Publish State Changes", "default": true },
        "subscribeControl": { "type": "boolean", "title": "Accept Remote Control", "default": true }
      }
    }
  }
}
```

### Topic Structure
```
r0astr/
├── panel/
│   ├── {panelId}/
│   │   ├── play          # (subscribe) Start playback
│   │   ├── pause         # (subscribe) Stop playback
│   │   ├── toggle        # (subscribe) Toggle playback
│   │   ├── code          # (subscribe) Update code
│   │   └── state         # (publish) Current state JSON
│   └── stopAll           # (subscribe) Stop all panels
├── master/
│   └── code              # (subscribe) Update master code
└── state                 # (publish) Full app state JSON
```

### Validation
- [ ] Connects to broker successfully
- [ ] Subscribes to control topics
- [ ] Publishes state changes
- [ ] Handles reconnection
- [ ] Settings UI works
- [ ] Well documented

### Deliverables
- `/resources/plugins/mqtt-bridge/manifest.json`
- `/resources/plugins/mqtt-bridge/index.js`
- `/resources/plugins/mqtt-bridge/README.md`

---

## Story 5.7: Create OSC Bridge Reference Plugin

### Description
Create an OSC integration plugin for DAW and hardware control.

### Features
- Send OSC messages to DAW
- Receive OSC messages from controllers
- Map OSC addresses to panels
- Learn mode for mapping
- Support for common DAW protocols

### Protocol Mappings
```javascript
const protocolMappings = {
  'generic': {
    playPanel: '/panel/{id}/play',
    pausePanel: '/panel/{id}/pause',
    volume: '/panel/{id}/volume',
  },
  'touchosc': {
    // TouchOSC specific mappings
  },
  'ableton': {
    // Ableton Live mappings
  }
};
```

### Validation
- [ ] Sends OSC correctly
- [ ] Receives OSC correctly
- [ ] Protocol mappings work
- [ ] Learn mode functional
- [ ] Settings complete

### Deliverables
- `/resources/plugins/osc-bridge/manifest.json`
- `/resources/plugins/osc-bridge/index.js`
- `/resources/plugins/osc-bridge/README.md`

---

## Story 5.8: Network Security Documentation

### Description
Document security considerations and best practices for network plugins.

### Topics to Cover
- Permission system explained
- Security model
- Best practices for plugins
- Common vulnerabilities
- Auditing network access
- Reporting security issues

### Deliverables
- `/docs/network-security.md`

---

## Testing Matrix

| Test | MQTT | OSC | WebSocket | HTTP |
|------|------|-----|-----------|------|
| Connect | | | | |
| Permission check | | | | |
| Send data | | | | |
| Receive data | | | | |
| Disconnect | | | | |
| Reconnect | | | | |
| Error handling | | | | |

---

## Definition of Done

- [ ] Permission system working
- [ ] All network APIs implemented
- [ ] MQTT bridge plugin complete
- [ ] OSC bridge plugin complete
- [ ] Security documentation complete
- [ ] All tests passing

---

## Estimated Effort

| Story | Points | Notes |
|-------|--------|-------|
| 5.1 Permission System | 5 | Security critical |
| 5.2 MQTT API | 5 | |
| 5.3 OSC API | 5 | |
| 5.4 WebSocket API | 3 | |
| 5.5 HTTP API | 3 | |
| 5.6 MQTT Bridge | 5 | |
| 5.7 OSC Bridge | 5 | |
| 5.8 Documentation | 2 | |
| **Total** | **33** | |
