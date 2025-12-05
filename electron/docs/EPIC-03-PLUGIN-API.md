# Epic 03: Plugin API

## Overview

Define and implement the comprehensive API surface that plugins use to interact with r0astr. This API provides controlled access to panels, audio, UI, storage, events, and network functionality.

## Business Value

- Enables rich plugin functionality
- Standardized interface reduces plugin bugs
- Clear contract between core and plugins
- Security through controlled access
- Documentation enables community development

## Dependencies

- Epic 02: Plugin Loader (complete)

## Deliverables

- Complete API specification
- Panel API implementation
- Audio API implementation
- UI API implementation
- Events API implementation
- API documentation with examples

---

## Story 3.1: Define API Architecture

### Description
Design the overall API architecture, including namespacing, versioning, and access patterns.

### Acceptance Criteria
- [ ] API organized into logical namespaces
- [ ] Version strategy defined
- [ ] Async patterns consistent
- [ ] Error handling standardized
- [ ] TypeScript definitions created

### API Structure
```javascript
window.r0astr = {
  // API version
  version: '1.0.0',
  
  // Namespaced APIs
  panels: { ... },      // Panel management
  audio: { ... },       // Audio access
  ui: { ... },          // UI manipulation
  storage: { ... },     // Plugin storage
  events: { ... },      // Event system
  network: { ... },     // Network access
  settings: { ... },    // Plugin settings
  
  // Metadata
  app: {
    version: '0.7.0',
    platform: 'darwin',
    isElectron: true
  }
};
```

### Error Handling Pattern
```javascript
// All async methods return consistent error format
try {
  const result = await r0astr.panels.create({ title: 'Test' });
} catch (error) {
  // error.code - Machine-readable code
  // error.message - Human-readable message
  // error.details - Additional context
}

// Error codes
const ErrorCodes = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};
```

### Validation
- [ ] API structure documented
- [ ] TypeScript definitions compile
- [ ] Error codes comprehensive
- [ ] Versioning strategy clear

### Deliverables
- `/src/api/index.js`
- `/src/api/types.d.ts`
- `/docs/plugin-api.md`

---

## Story 3.2: Implement Panels API (Read)

### Description
Implement the read-only portions of the Panels API for listing, querying, and observing panel state.

### Requires Permission
`panels:read`

### API Specification
```javascript
r0astr.panels = {
  /**
   * Get list of all panel IDs
   * @returns {Promise<string[]>}
   */
  list: async () => ['panel-1', 'panel-2', 'master-panel'],
  
  /**
   * Get panel by ID
   * @param {string} panelId
   * @returns {Promise<PanelInfo | null>}
   */
  get: async (panelId) => ({
    id: 'panel-1',
    title: 'Bass',
    code: 'note("c2 e2 g2").s("sawtooth")',
    playing: true,
    position: { x: 100, y: 100 },
    size: { w: 600, h: 200 }
  }),
  
  /**
   * Get all panels
   * @returns {Promise<Map<string, PanelInfo>>}
   */
  getAll: async () => new Map([...]),
  
  /**
   * Check if panel exists
   * @param {string} panelId
   * @returns {Promise<boolean>}
   */
  exists: async (panelId) => true,
  
  /**
   * Subscribe to panel state changes
   * @param {string} panelId - Panel ID or '*' for all
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  onStateChange: (panelId, callback) => {
    // callback receives: { panelId, property, oldValue, newValue }
    return () => { /* unsubscribe */ };
  },
  
  /**
   * Subscribe to panel created events
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  onCreated: (callback) => { },
  
  /**
   * Subscribe to panel deleted events
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  onDeleted: (callback) => { }
};
```

### Validation
- [ ] list() returns all panel IDs
- [ ] get() returns panel info
- [ ] get() returns null for missing panel
- [ ] onStateChange fires on changes
- [ ] Unsubscribe works correctly
- [ ] Permission check enforced

### Test Cases
```javascript
describe('panels read API', () => {
  it('should list all panels', async () => { });
  it('should get panel by ID', async () => { });
  it('should return null for missing panel', async () => { });
  it('should emit state changes', async () => { });
  it('should require panels:read permission', async () => { });
});
```

### Deliverables
- `/src/api/panels.js`
- `/src/api/__tests__/panels.test.js`

---

## Story 3.3: Implement Panels API (Write)

### Description
Implement the write portions of the Panels API for creating, modifying, and controlling panels.

### Requires Permission
`panels:write`

### API Specification
```javascript
// Extends panels API from 3.2
Object.assign(r0astr.panels, {
  /**
   * Create a new panel
   * @param {PanelConfig} config
   * @returns {Promise<string>} New panel ID
   */
  create: async (config) => 'panel-new-123',
  
  /**
   * Delete a panel
   * @param {string} panelId
   * @returns {Promise<boolean>}
   */
  delete: async (panelId) => true,
  
  /**
   * Update panel code
   * @param {string} panelId
   * @param {string} code
   * @returns {Promise<void>}
   */
  updateCode: async (panelId, code) => { },
  
  /**
   * Update panel title
   * @param {string} panelId
   * @param {string} title
   * @returns {Promise<void>}
   */
  updateTitle: async (panelId, title) => { },
  
  /**
   * Start playing a panel
   * @param {string} panelId
   * @returns {Promise<void>}
   */
  play: async (panelId) => { },
  
  /**
   * Pause a panel
   * @param {string} panelId
   * @returns {Promise<void>}
   */
  pause: async (panelId) => { },
  
  /**
   * Toggle panel playback
   * @param {string} panelId
   * @returns {Promise<boolean>} New playing state
   */
  toggle: async (panelId) => true,
  
  /**
   * Stop all panels
   * @returns {Promise<void>}
   */
  stopAll: async () => { },
  
  /**
   * Move panel to position
   * @param {string} panelId
   * @param {{x: number, y: number}} position
   * @returns {Promise<void>}
   */
  move: async (panelId, position) => { },
  
  /**
   * Resize panel
   * @param {string} panelId
   * @param {{w: number, h: number}} size
   * @returns {Promise<void>}
   */
  resize: async (panelId, size) => { }
});
```

### PanelConfig Type
```typescript
interface PanelConfig {
  title?: string;          // Default: auto-generated
  code?: string;           // Default: ''
  position?: { x: number, y: number };  // Default: auto-positioned
  size?: { w: number, h: number };      // Default: 600x200
  autoPlay?: boolean;      // Default: false
}
```

### Validation
- [ ] create() returns new panel ID
- [ ] delete() removes panel
- [ ] Cannot delete master panel
- [ ] updateCode() changes code
- [ ] play()/pause() control playback
- [ ] Position and size updates work
- [ ] Permission check enforced

### Test Cases
```javascript
describe('panels write API', () => {
  it('should create panel', async () => { });
  it('should delete panel', async () => { });
  it('should prevent master panel deletion', async () => { });
  it('should update panel code', async () => { });
  it('should control playback', async () => { });
  it('should require panels:write permission', async () => { });
});
```

### Deliverables
- Updated `/src/api/panels.js`

---

## Story 3.4: Implement Audio API (Read)

### Description
Implement read-only audio API for accessing audio analysis data (FFT, waveform, beat detection).

### Requires Permission
`audio:read`

### API Specification
```javascript
r0astr.audio = {
  /**
   * Get the Web Audio context
   * @returns {AudioContext}
   */
  getContext: () => audioContext,
  
  /**
   * Get the master analyser node
   * @returns {AnalyserNode}
   */
  getAnalyser: () => analyserNode,
  
  /**
   * Get current frequency data
   * @returns {Uint8Array}
   */
  getFrequencyData: () => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    return data;
  },
  
  /**
   * Get current time domain data (waveform)
   * @returns {Uint8Array}
   */
  getTimeDomainData: () => {
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    return data;
  },
  
  /**
   * Get current RMS level (0-1)
   * @returns {number}
   */
  getLevel: () => 0.75,
  
  /**
   * Get current BPM (if detected)
   * @returns {number | null}
   */
  getBPM: () => 120,
  
  /**
   * Subscribe to beat events
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  onBeat: (callback) => {
    // callback receives: { time, strength }
    return () => { };
  },
  
  /**
   * Get current transport state
   * @returns {TransportState}
   */
  getTransport: () => ({
    playing: true,
    bpm: 120,
    cycle: 4,
    position: 2.5
  })
};
```

### Validation
- [ ] getContext() returns valid AudioContext
- [ ] getAnalyser() returns AnalyserNode
- [ ] Frequency data has correct length
- [ ] Level is normalized 0-1
- [ ] onBeat fires appropriately
- [ ] Permission check enforced

### Test Cases
```javascript
describe('audio read API', () => {
  it('should return AudioContext', () => { });
  it('should return frequency data', () => { });
  it('should return normalized level', () => { });
  it('should emit beat events', async () => { });
  it('should require audio:read permission', () => { });
});
```

### Deliverables
- `/src/api/audio.js`

---

## Story 3.5: Implement Audio API (Write)

### Description
Implement write audio API for injecting audio nodes into the signal chain.

### Requires Permission
`audio:write`

### API Specification
```javascript
Object.assign(r0astr.audio, {
  /**
   * Connect an audio node to the output
   * @param {AudioNode} node
   * @returns {Function} disconnect
   */
  connect: (node) => {
    // Connect to master output
    return () => { /* disconnect */ };
  },
  
  /**
   * Create a gain node connected to output
   * @param {number} initialGain
   * @returns {{ node: GainNode, disconnect: Function }}
   */
  createOutput: (initialGain = 1.0) => { },
  
  /**
   * Set master volume
   * @param {number} volume 0-1
   */
  setVolume: (volume) => { },
  
  /**
   * Get master volume
   * @returns {number}
   */
  getVolume: () => 0.8
});
```

### Validation
- [ ] Custom nodes can connect to output
- [ ] Disconnect removes from chain
- [ ] Volume control works
- [ ] Permission check enforced

### Deliverables
- Updated `/src/api/audio.js`

---

## Story 3.6: Implement UI API

### Description
Implement UI API for plugins to show notifications, register menu items, and create custom panels.

### Requires Permissions
- `ui:notifications` - Show toast notifications
- `ui:menu` - Add menu items
- `ui:panel` - Register custom panel types

### API Specification
```javascript
r0astr.ui = {
  /**
   * Show a toast notification
   * @param {string} message
   * @param {NotificationOptions} options
   */
  notify: (message, options = {}) => {
    // options: { type: 'info'|'success'|'warning'|'error', duration: 3000 }
  },
  
  /**
   * Show a confirmation dialog
   * @param {string} message
   * @param {ConfirmOptions} options
   * @returns {Promise<boolean>}
   */
  confirm: async (message, options = {}) => true,
  
  /**
   * Register a menu item
   * @param {MenuLocation} location
   * @param {MenuItem} item
   * @returns {Function} remove
   */
  registerMenuItem: (location, item) => {
    // location: 'file' | 'edit' | 'view' | 'plugins' | 'help'
    // item: { label, accelerator?, click, enabled?, checked? }
    return () => { /* remove */ };
  },
  
  /**
   * Register a custom panel type
   * @param {PanelTypeConfig} config
   * @returns {Function} unregister
   */
  registerPanelType: (config) => {
    // config: { id, title, icon, render: (container) => {} }
    return () => { /* unregister */ };
  },
  
  /**
   * Open plugin's settings panel
   */
  openSettings: () => { },
  
  /**
   * Register a settings section
   * @param {SettingsSection} section
   * @returns {Function} unregister
   */
  registerSettingsSection: (section) => {
    // section: { id, title, render: (container) => {} }
    return () => { };
  }
};
```

### Custom Panel Registration
```javascript
// Example: Spectrum visualizer plugin
r0astr.ui.registerPanelType({
  id: 'spectrum-visualizer',
  title: 'Spectrum',
  icon: '📊',
  render: (container, api) => {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    function draw() {
      const data = api.audio.getFrequencyData();
      // ... draw visualization
      requestAnimationFrame(draw);
    }
    draw();
    
    return () => {
      // Cleanup function
    };
  }
});
```

### Validation
- [ ] Notifications display correctly
- [ ] Confirm dialog returns boolean
- [ ] Menu items appear
- [ ] Custom panels render
- [ ] Settings sections register
- [ ] Permission checks enforced

### Deliverables
- `/src/api/ui.js`

---

## Story 3.7: Implement Events API

### Description
Implement a pub/sub event system for inter-plugin communication and app events.

### No Permission Required
(Basic events always available)

### API Specification
```javascript
r0astr.events = {
  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  on: (event, callback) => {
    return () => { /* unsubscribe */ };
  },
  
  /**
   * Subscribe to an event (once)
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  once: (event, callback) => { },
  
  /**
   * Emit an event
   * @param {string} event
   * @param {*} data
   */
  emit: (event, data) => { },
  
  /**
   * Remove all listeners for an event
   * @param {string} event
   */
  off: (event) => { }
};
```

### Built-in Events
```javascript
// App lifecycle
'app:ready'           // App fully initialized
'app:beforeQuit'      // App about to quit

// Panel events (also available via panels.onX)
'panel:created'       // { panelId }
'panel:deleted'       // { panelId }
'panel:stateChange'   // { panelId, property, value }

// Audio events
'audio:play'          // Transport started
'audio:pause'         // Transport stopped
'audio:beat'          // Beat detected

// Plugin events
'plugin:enabled'      // { pluginId }
'plugin:disabled'     // { pluginId }
```

### Event Namespacing
```javascript
// Plugins should namespace their custom events
r0astr.events.emit('mqtt-bridge:connected', { broker: '...' });
r0astr.events.emit('mqtt-bridge:message', { topic: '...', payload: '...' });
```

### Validation
- [ ] on() registers listeners
- [ ] emit() triggers listeners
- [ ] once() only fires once
- [ ] Unsubscribe works
- [ ] Built-in events fire correctly

### Deliverables
- `/src/api/events.js`

---

## Story 3.8: API Documentation

### Description
Create comprehensive API documentation with examples for plugin developers.

### Acceptance Criteria
- [ ] All methods documented
- [ ] TypeScript definitions complete
- [ ] Examples for each API
- [ ] Permission requirements clear
- [ ] Error codes documented

### Documentation Structure
```markdown
# r0astr Plugin API Reference

## Overview
## Getting Started
## API Reference
  ### r0astr.panels
  ### r0astr.audio
  ### r0astr.ui
  ### r0astr.storage
  ### r0astr.events
  ### r0astr.network
## Permissions
## Error Handling
## Examples
## TypeScript Support
## Changelog
```

### Deliverables
- `/docs/plugin-api.md`
- `/src/api/types.d.ts` (complete)

---

## Story 3.9: Create Example Plugin

### Description
Create a well-documented example plugin demonstrating all API features.

### Acceptance Criteria
- [ ] Uses multiple API namespaces
- [ ] Demonstrates permissions
- [ ] Demonstrates settings
- [ ] Demonstrates events
- [ ] Thoroughly commented
- [ ] Serves as template

### Example Plugin: "Panel Stats"
```javascript
// Shows statistics about panel usage

export default class PanelStats {
  constructor() {
    this.totalPlays = 0;
    this.panelPlays = new Map();
  }
  
  async onEnable(api, settings) {
    // Load saved stats
    this.totalPlays = await api.storage.get('totalPlays', 0);
    
    // Subscribe to panel events
    this.unsubscribe = api.panels.onStateChange('*', (change) => {
      if (change.property === 'playing' && change.newValue === true) {
        this.recordPlay(change.panelId);
      }
    });
    
    // Register stats panel
    this.unregisterPanel = api.ui.registerPanelType({
      id: 'panel-stats',
      title: 'Stats',
      render: (container) => this.renderStats(container)
    });
    
    // Add menu item
    this.removeMenuItem = api.ui.registerMenuItem('view', {
      label: 'Show Panel Stats',
      click: () => api.ui.notify(`Total plays: ${this.totalPlays}`)
    });
  }
  
  async onDisable() {
    this.unsubscribe?.();
    this.unregisterPanel?.();
    this.removeMenuItem?.();
  }
  
  recordPlay(panelId) {
    this.totalPlays++;
    const count = this.panelPlays.get(panelId) || 0;
    this.panelPlays.set(panelId, count + 1);
    this.api.storage.set('totalPlays', this.totalPlays);
  }
  
  renderStats(container) {
    container.innerHTML = `
      <div class="stats">
        <h3>Total Plays: ${this.totalPlays}</h3>
        <ul>
          ${[...this.panelPlays.entries()]
            .map(([id, count]) => `<li>${id}: ${count}</li>`)
            .join('')}
        </ul>
      </div>
    `;
  }
}
```

### Deliverables
- `/resources/plugins/panel-stats/manifest.json`
- `/resources/plugins/panel-stats/index.js`
- `/resources/plugins/panel-stats/README.md`

---

## Testing Matrix

| API | Unit Tests | Integration Tests | Permission Tests |
|-----|------------|-------------------|------------------|
| panels (read) | | | |
| panels (write) | | | |
| audio (read) | | | |
| audio (write) | | | |
| ui.notify | | | |
| ui.menu | | | |
| ui.panel | | | |
| storage | | | |
| events | | | |

---

## Definition of Done

- [ ] All API namespaces implemented
- [ ] Permission checks working
- [ ] TypeScript definitions complete
- [ ] Documentation complete
- [ ] Example plugin working
- [ ] All tests passing
- [ ] API versioned

---

## Estimated Effort

| Story | Points | Notes |
|-------|--------|-------|
| 3.1 API Architecture | 3 | |
| 3.2 Panels Read | 3 | |
| 3.3 Panels Write | 3 | |
| 3.4 Audio Read | 3 | |
| 3.5 Audio Write | 2 | |
| 3.6 UI API | 5 | |
| 3.7 Events API | 2 | |
| 3.8 Documentation | 3 | |
| 3.9 Example Plugin | 3 | |
| **Total** | **27** | |
