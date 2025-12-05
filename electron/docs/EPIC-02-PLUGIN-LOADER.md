# Epic 02: Plugin Loader

## Overview

Implement the core plugin infrastructure that discovers, validates, loads, and manages plugins. This forms the foundation for all plugin types (skins, extensions, visualizers, integrations).

## Business Value

- Enables community-driven feature development
- Reduces core codebase complexity
- Allows specialized functionality without bloating main app
- Creates platform for ecosystem growth
- Supports future monetization (plugin marketplace)

## Dependencies

- Epic 01: Skin System (uses similar patterns)

## Deliverables

- Plugin manifest specification (extension type)
- Plugin discovery and validation system
- Plugin lifecycle management (enable/disable)
- Plugin sandbox and isolation
- Permission system
- IPC bridge for plugin ↔ app communication

---

## Story 2.1: Define Plugin Manifest Specification

### Description
Define the comprehensive JSON manifest format for extension-type plugins, building upon the skin manifest but with additional fields for code, permissions, and lifecycle hooks.

### Acceptance Criteria
- [ ] Manifest schema supports all plugin types
- [ ] Permission system defined
- [ ] Entry points defined (main, preload, ui)
- [ ] Lifecycle hooks defined
- [ ] Settings schema supported
- [ ] Backward compatible versioning strategy

### Manifest Specification

```json
{
  "$schema": "https://r0astr.app/schemas/plugin-manifest-v1.json",
  "manifestVersion": 1,
  "type": "extension",
  
  "name": "plugin-identifier",
  "displayName": "Human Readable Name",
  "version": "1.0.0",
  "description": "What this plugin does",
  
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://example.com"
  },
  
  "license": "MIT",
  "repository": "https://github.com/user/plugin",
  "homepage": "https://plugin-docs.com",
  
  "main": "index.js",
  "preload": "preload.js",
  "ui": {
    "settings": "settings.html",
    "panel": "panel.html"
  },
  
  "permissions": [
    "panels:read",
    "panels:write",
    "audio:read",
    "audio:write",
    "storage",
    "network:localhost",
    "network:external",
    "ui:notifications",
    "ui:menu",
    "ui:panel"
  ],
  
  "settings": {
    "serverUrl": {
      "type": "string",
      "default": "localhost:1883",
      "title": "Server URL",
      "description": "The MQTT broker address"
    },
    "autoConnect": {
      "type": "boolean",
      "default": true,
      "title": "Auto-connect",
      "description": "Connect automatically on startup"
    },
    "topic": {
      "type": "string",
      "default": "r0astr/#",
      "title": "Topic Pattern"
    }
  },
  
  "lifecycle": {
    "onEnable": "onEnable",
    "onDisable": "onDisable", 
    "onSettingsChange": "onSettingsChange"
  },
  
  "compatibility": {
    "minAppVersion": "0.7.0",
    "maxAppVersion": "1.x",
    "platforms": ["darwin", "win32", "linux"]
  },
  
  "keywords": ["mqtt", "iot", "remote-control"],
  "category": "integration"
}
```

### Permission Definitions

| Permission | Description | Risk Level |
|------------|-------------|------------|
| `panels:read` | Read panel state and code | Low |
| `panels:write` | Modify panels, create/delete | Medium |
| `audio:read` | Access audio analyser data | Low |
| `audio:write` | Inject audio, modify output | High |
| `storage` | Persist plugin data | Low |
| `network:localhost` | Connect to localhost only | Medium |
| `network:external` | Connect to any host | High |
| `ui:notifications` | Show toast notifications | Low |
| `ui:menu` | Add menu items | Low |
| `ui:panel` | Register custom panels | Medium |
| `filesystem:read` | Read files (scoped) | High |
| `filesystem:write` | Write files (scoped) | High |

### Validation
- [ ] Create JSON Schema file
- [ ] Validate example manifests
- [ ] Test permission parsing
- [ ] Test settings schema parsing
- [ ] Document all fields

### Deliverables
- `/schemas/plugin-manifest-v1.json`
- `/docs/plugin-development.md` (started)

---

## Story 2.2: Implement Plugin Directory Structure

### Description
Define and implement the file system structure for plugin storage, separating bundled plugins from user-installed plugins.

### Acceptance Criteria
- [ ] Bundled plugins in app resources
- [ ] User plugins in user data directory
- [ ] Plugin isolation (each in own folder)
- [ ] Support for plugin data storage
- [ ] Works on all platforms

### Directory Structure

```
# Bundled plugins (read-only)
{app}/resources/plugins/
├── example-visualizer/
│   ├── manifest.json
│   ├── index.js
│   └── assets/
└── spectrum-analyzer/
    └── ...

# User-installed plugins (writable)
{userData}/plugins/
├── registry.json           # Installed plugins + enabled state
├── mqtt-bridge/
│   ├── manifest.json
│   ├── index.js
│   ├── settings.html
│   └── data/               # Plugin-specific storage
│       └── config.json
└── osc-controller/
    └── ...
```

### Registry Format
```json
// {userData}/plugins/registry.json
{
  "version": 1,
  "plugins": {
    "mqtt-bridge": {
      "enabled": true,
      "installedAt": "2024-01-15T10:30:00Z",
      "version": "1.0.0",
      "source": "user"
    },
    "spectrum-analyzer": {
      "enabled": true,
      "source": "bundled"
    }
  }
}
```

### Validation
- [ ] Paths resolve on all platforms
- [ ] User directory created on first launch
- [ ] Registry file created if missing
- [ ] Bundled plugins accessible when packaged

### Deliverables
- Updated `/src/utils/paths.js`
- `/src/managers/pluginRegistry.js`

---

## Story 2.3: Implement Plugin Discovery

### Description
Create a module that scans plugin directories, validates manifests, and builds a registry of available plugins.

### Acceptance Criteria
- [ ] Discovers bundled plugins
- [ ] Discovers user-installed plugins
- [ ] Validates manifest for each plugin
- [ ] Checks compatibility with app version
- [ ] Returns unified list with metadata
- [ ] Handles invalid plugins gracefully
- [ ] Logs discovery issues

### API Design

```javascript
// src/managers/pluginManager.js

/**
 * @typedef {Object} PluginInfo
 * @property {string} id - Plugin identifier
 * @property {Object} manifest - Parsed manifest
 * @property {string} path - Absolute path to plugin
 * @property {'bundled'|'user'} source - Where plugin came from
 * @property {boolean} valid - Whether plugin passed validation
 * @property {string[]} errors - Validation errors if any
 * @property {boolean} enabled - Whether plugin is enabled
 * @property {boolean} compatible - Meets version requirements
 */

/**
 * Discover all available plugins
 * @returns {Promise<Map<string, PluginInfo>>}
 */
export async function discoverPlugins() { }

/**
 * Validate a single plugin
 * @param {string} pluginPath 
 * @returns {Promise<ValidationResult>}
 */
export async function validatePlugin(pluginPath) { }

/**
 * Check if plugin is compatible with current app version
 * @param {Object} manifest 
 * @returns {boolean}
 */
export function isCompatible(manifest) { }
```

### Discovery Algorithm
```
1. Read bundled plugins directory
2. Read user plugins directory
3. For each potential plugin folder:
   a. Check for manifest.json
   b. Parse and validate manifest
   c. Check version compatibility
   d. Check platform compatibility
   e. Add to registry with status
4. Merge with saved enabled/disabled state
5. Return Map<pluginId, PluginInfo>
```

### Validation
- [ ] Finds bundled plugins
- [ ] Finds user plugins
- [ ] Handles missing manifest
- [ ] Handles invalid JSON
- [ ] Handles missing required fields
- [ ] Checks version compatibility
- [ ] Performance < 200ms for 50 plugins

### Test Cases
```javascript
describe('pluginManager.discoverPlugins', () => {
  it('should discover bundled plugins', async () => { });
  it('should discover user plugins', async () => { });
  it('should validate manifests', async () => { });
  it('should check version compatibility', async () => { });
  it('should handle missing manifest gracefully', async () => { });
  it('should merge with saved enable state', async () => { });
});
```

### Deliverables
- `/src/managers/pluginManager.js`
- `/src/managers/__tests__/pluginManager.test.js`

---

## Story 2.4: Implement Plugin Lifecycle Manager

### Description
Create the system that manages plugin states: loading, enabling, disabling, and unloading plugins with proper lifecycle hooks.

### Acceptance Criteria
- [ ] Load plugin code dynamically
- [ ] Call lifecycle hooks in order
- [ ] Handle async initialization
- [ ] Support enable/disable without restart
- [ ] Clean up on disable
- [ ] Handle plugin errors without crashing app
- [ ] Support hot-reload in development

### Plugin States
```
┌───────────┐
│ Discovered│
└─────┬─────┘
      │ load()
      ▼
┌───────────┐
│  Loaded   │ (code loaded, not running)
└─────┬─────┘
      │ enable()
      ▼
┌───────────┐
│  Enabled  │ (onEnable called, active)
└─────┬─────┘
      │ disable()
      ▼
┌───────────┐
│ Disabled  │ (onDisable called, inactive)
└─────┬─────┘
      │ unload()
      ▼
┌───────────┐
│ Unloaded  │
└───────────┘
```

### API Design
```javascript
/**
 * Load a plugin (parse code, don't execute)
 * @param {string} pluginId 
 * @returns {Promise<void>}
 */
export async function loadPlugin(pluginId) { }

/**
 * Enable a loaded plugin (call onEnable)
 * @param {string} pluginId 
 * @returns {Promise<void>}
 */
export async function enablePlugin(pluginId) { }

/**
 * Disable a plugin (call onDisable, cleanup)
 * @param {string} pluginId 
 * @returns {Promise<void>}
 */
export async function disablePlugin(pluginId) { }

/**
 * Unload a plugin (remove from memory)
 * @param {string} pluginId 
 * @returns {Promise<void>}
 */
export async function unloadPlugin(pluginId) { }

/**
 * Get plugin state
 * @param {string} pluginId 
 * @returns {'discovered'|'loaded'|'enabled'|'disabled'|'error'}
 */
export function getPluginState(pluginId) { }
```

### Lifecycle Hooks
```javascript
// Plugin code (index.js)
export default class MyPlugin {
  /**
   * Called when plugin is enabled
   * @param {PluginAPI} api - The plugin API
   * @param {Object} settings - User settings for this plugin
   */
  async onEnable(api, settings) {
    // Initialize plugin
  }
  
  /**
   * Called when plugin is disabled
   */
  async onDisable() {
    // Cleanup resources
  }
  
  /**
   * Called when settings change
   * @param {Object} newSettings 
   * @param {Object} oldSettings 
   */
  onSettingsChange(newSettings, oldSettings) {
    // React to settings change
  }
}
```

### Error Handling
```javascript
try {
  await plugin.onEnable(api, settings);
} catch (error) {
  console.error(`Plugin ${pluginId} failed to enable:`, error);
  setPluginState(pluginId, 'error');
  setPluginError(pluginId, error.message);
  // Don't crash app, continue with other plugins
}
```

### Validation
- [ ] Plugins load correctly
- [ ] onEnable called with API and settings
- [ ] onDisable called on disable
- [ ] Errors caught and logged
- [ ] State transitions correct
- [ ] Memory freed on unload

### Test Cases
```javascript
describe('plugin lifecycle', () => {
  it('should load plugin code', async () => { });
  it('should call onEnable when enabled', async () => { });
  it('should call onDisable when disabled', async () => { });
  it('should handle onEnable errors', async () => { });
  it('should clean up on unload', async () => { });
  it('should pass settings to onEnable', async () => { });
});
```

### Deliverables
- Updated `/src/managers/pluginManager.js`
- `/src/managers/pluginLifecycle.js`

---

## Story 2.5: Implement Plugin Sandbox

### Description
Create a sandboxed execution environment for plugins that limits their access to browser/Node APIs based on declared permissions.

### Acceptance Criteria
- [ ] Plugins run in isolated context
- [ ] Only declared APIs accessible
- [ ] No access to undeclared permissions
- [ ] Cannot access other plugins' data
- [ ] Cannot modify core app directly
- [ ] Performance overhead < 5%

### Sandbox Approach

**Option A: Compartmentalized Global (Recommended)**
```javascript
// Create restricted global for plugin
function createPluginSandbox(pluginId, permissions) {
  const sandbox = {
    // Safe globals
    console: createScopedConsole(pluginId),
    setTimeout, setInterval, clearTimeout, clearInterval,
    Promise, Map, Set, WeakMap, WeakSet,
    JSON, Math, Date,
    
    // Plugin API (filtered by permissions)
    r0astr: createPluginAPI(pluginId, permissions),
    
    // No access to:
    // - window
    // - document (except through API)
    // - require/import
    // - fetch (except through API)
    // - localStorage
    // - eval
  };
  
  return sandbox;
}
```

**Option B: iframe Isolation**
```javascript
// Run plugin in sandboxed iframe
const iframe = document.createElement('iframe');
iframe.sandbox = 'allow-scripts';
iframe.srcdoc = `
  <script>
    window.parent.postMessage({ type: 'ready' }, '*');
    // Plugin code here
  </script>
`;
```

**Option C: Web Worker**
```javascript
// Run plugin in dedicated worker
const worker = new Worker(pluginBlobUrl);
worker.postMessage({ type: 'init', settings });
worker.onmessage = handlePluginMessage;
```

### Permission Enforcement
```javascript
function createPluginAPI(pluginId, permissions) {
  const api = {};
  
  if (permissions.includes('panels:read')) {
    api.panels = {
      list: () => getPanelList(),
      get: (id) => getPanel(id),
    };
  }
  
  if (permissions.includes('panels:write')) {
    api.panels = {
      ...api.panels,
      create: (config) => createPanel(config),
      updateCode: (id, code) => updatePanelCode(id, code),
      play: (id) => playPanel(id),
      pause: (id) => pausePanel(id),
    };
  }
  
  // ... etc for each permission
  
  return Object.freeze(api);
}
```

### Validation
- [ ] Plugins cannot access window directly
- [ ] Plugins cannot access document directly
- [ ] Plugins cannot access other plugins
- [ ] Permission checks enforced
- [ ] Blocked APIs throw clear errors
- [ ] No prototype pollution possible

### Test Cases
```javascript
describe('plugin sandbox', () => {
  it('should not expose window', () => { });
  it('should not expose document', () => { });
  it('should only expose permitted APIs', () => { });
  it('should isolate plugins from each other', () => { });
  it('should prevent prototype pollution', () => { });
});
```

### Deliverables
- `/src/managers/pluginSandbox.js`
- `/src/managers/__tests__/pluginSandbox.test.js`

---

## Story 2.6: Implement Plugin Storage

### Description
Provide each plugin with isolated key-value storage for persisting data.

### Acceptance Criteria
- [ ] Each plugin has isolated storage namespace
- [ ] Simple get/set/delete API
- [ ] Data persists across restarts
- [ ] Storage quota per plugin (e.g., 5MB)
- [ ] Data cleared on plugin uninstall

### API Design
```javascript
// Exposed to plugins via api.storage
const storage = {
  /**
   * Get a value
   * @param {string} key 
   * @param {*} defaultValue 
   * @returns {Promise<*>}
   */
  get: async (key, defaultValue = null) => { },
  
  /**
   * Set a value
   * @param {string} key 
   * @param {*} value 
   * @returns {Promise<void>}
   */
  set: async (key, value) => { },
  
  /**
   * Delete a key
   * @param {string} key 
   * @returns {Promise<boolean>}
   */
  delete: async (key) => { },
  
  /**
   * List all keys
   * @returns {Promise<string[]>}
   */
  keys: async () => { },
  
  /**
   * Clear all plugin data
   * @returns {Promise<void>}
   */
  clear: async () => { },
  
  /**
   * Get storage usage in bytes
   * @returns {Promise<number>}
   */
  usage: async () => { }
};
```

### Storage Location
```
{userData}/plugins/{pluginId}/data/
├── storage.json         # Key-value store
└── ...                  # Plugin can request additional files
```

### Implementation
```javascript
// src/managers/pluginStorage.js
class PluginStorage {
  constructor(pluginId, quotaBytes = 5 * 1024 * 1024) {
    this.pluginId = pluginId;
    this.quotaBytes = quotaBytes;
    this.storagePath = path.join(PATHS.userPlugins, pluginId, 'data', 'storage.json');
    this.cache = null;
  }
  
  async load() {
    try {
      this.cache = JSON.parse(await fs.readFile(this.storagePath, 'utf8'));
    } catch {
      this.cache = {};
    }
  }
  
  async get(key, defaultValue = null) {
    if (!this.cache) await this.load();
    return this.cache[key] ?? defaultValue;
  }
  
  async set(key, value) {
    if (!this.cache) await this.load();
    this.cache[key] = value;
    await this.persist();
  }
  
  async persist() {
    const data = JSON.stringify(this.cache);
    if (data.length > this.quotaBytes) {
      throw new Error(`Storage quota exceeded (${this.quotaBytes} bytes)`);
    }
    await fs.writeFile(this.storagePath, data, 'utf8');
  }
}
```

### Validation
- [ ] Data persists across restarts
- [ ] Plugins cannot access each other's storage
- [ ] Quota enforced
- [ ] Clear removes all data
- [ ] JSON serialization works for complex objects

### Test Cases
```javascript
describe('plugin storage', () => {
  it('should store and retrieve values', async () => { });
  it('should persist across restarts', async () => { });
  it('should isolate plugin storage', async () => { });
  it('should enforce quota', async () => { });
  it('should clear all data', async () => { });
});
```

### Deliverables
- `/src/managers/pluginStorage.js`
- `/src/managers/__tests__/pluginStorage.test.js`

---

## Story 2.7: Implement IPC Bridge (Main ↔ Renderer)

### Description
Create communication bridge for plugins that need to run code in both Electron main process and renderer process.

### Acceptance Criteria
- [ ] Plugins can send messages to main process
- [ ] Main process can send messages to plugins
- [ ] Messages scoped to plugin namespace
- [ ] Async request/response pattern
- [ ] Event subscription pattern

### IPC Channel Naming
```
r0astr:plugin:{pluginId}:{channel}

Examples:
r0astr:plugin:mqtt-bridge:connect
r0astr:plugin:mqtt-bridge:message
```

### API Design

**Renderer Side (Plugin)**
```javascript
// Exposed via api.ipc
const ipc = {
  /**
   * Send message to main process
   * @param {string} channel 
   * @param {...any} args 
   */
  send: (channel, ...args) => { },
  
  /**
   * Send message and wait for response
   * @param {string} channel 
   * @param {...any} args 
   * @returns {Promise<any>}
   */
  invoke: async (channel, ...args) => { },
  
  /**
   * Listen for messages from main
   * @param {string} channel 
   * @param {Function} callback 
   * @returns {Function} unsubscribe
   */
  on: (channel, callback) => { }
};
```

**Main Process (Plugin Preload)**
```javascript
// In plugin preload.js
const { ipcMain } = require('electron');

// Plugin registers handlers
ipcMain.handle('r0astr:plugin:mqtt-bridge:connect', async (event, options) => {
  // Handle connection
  return { success: true };
});
```

### Validation
- [ ] Messages delivered correctly
- [ ] Namespacing prevents cross-plugin interference
- [ ] Invoke returns response
- [ ] Listeners can unsubscribe
- [ ] Errors propagated correctly

### Test Cases
```javascript
describe('plugin IPC', () => {
  it('should send messages to main', () => { });
  it('should receive responses from invoke', async () => { });
  it('should namespace channels per plugin', () => { });
  it('should support event listeners', () => { });
});
```

### Deliverables
- `/src/managers/pluginIPC.js`
- Updated `/electron/preload.cjs`

---

## Story 2.8: Implement Plugin Manager UI

### Description
Create user interface for viewing, enabling/disabling, and managing installed plugins.

### Acceptance Criteria
- [ ] List all discovered plugins
- [ ] Show plugin metadata (name, version, author)
- [ ] Toggle enable/disable
- [ ] Show plugin status (enabled, disabled, error)
- [ ] Show required permissions
- [ ] Link to plugin settings
- [ ] Show error details for failed plugins

### UI Design

```
┌───────────────────────────────────────────────────────┐
│  Plugins                                          [X] │
├───────────────────────────────────────────────────────┤
│                                                       │
│  Installed Plugins                                    │
│  ─────────────────────────────────────────────────    │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ☑ MQTT Bridge                          v1.0.0  │  │
│  │   Control r0astr via MQTT                   │  │
│  │   by Author Name                                │  │
│  │                                                 │  │
│  │   Permissions: network, panels:read/write       │  │
│  │                                                 │  │
│  │   [⚙ Settings]  [ⓘ Info]                       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ☐ OSC Controller                       v0.5.0  │  │
│  │   Send and receive OSC messages                 │  │
│  │   by Another Author          [Disabled]         │  │
│  │                                                 │  │
│  │   [⚙ Settings]  [ⓘ Info]                       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ⚠ Broken Plugin                        v1.0.0  │  │
│  │   Failed to load                     [Error]    │  │
│  │                                                 │  │
│  │   Error: Cannot find module './missing.js'      │  │
│  │                                                 │  │
│  │   [🗑 Remove]                                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  ─────────────────────────────────────────────────    │
│                    [+ Install Plugin]                 │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Implementation
- Add "Plugins" tab to Settings modal
- Create `PluginList` component
- Create `PluginCard` component
- Create `PluginPermissions` component

### Validation
- [ ] All plugins displayed
- [ ] Enable/disable works immediately
- [ ] Status indicators accurate
- [ ] Settings link opens plugin settings
- [ ] Errors displayed clearly
- [ ] UI updates on state change

### Test Cases
```javascript
describe('PluginManager UI', () => {
  it('should list all plugins', () => { });
  it('should toggle enable/disable', async () => { });
  it('should show plugin status', () => { });
  it('should display errors for failed plugins', () => { });
});
```

### Deliverables
- `/src/ui/pluginManager.js`
- `/src/ui/pluginManager.css`
- Updated `/src/ui/settingsModal.js`

---

## Story 2.9: Implement Plugin Installation

### Description
Allow users to install plugins from zip files or folders.

### Acceptance Criteria
- [ ] Install from .zip file
- [ ] Install from folder (dev mode)
- [ ] Validate before installation
- [ ] Extract to user plugins directory
- [ ] Update registry
- [ ] Handle version conflicts
- [ ] Show installation progress

### Installation Flow
```
1. User selects file/folder
2. Validate manifest exists and is valid
3. Check for conflicts (existing plugin with same ID)
4. Extract/copy to {userData}/plugins/{pluginId}/
5. Update registry.json
6. Refresh plugin list
7. Optionally enable new plugin
```

### Conflict Resolution
```
┌───────────────────────────────────────────────────┐
│  Plugin Conflict                              [X] │
├───────────────────────────────────────────────────┤
│                                                   │
│  A plugin with ID "mqtt-bridge" is already        │
│  installed.                                       │
│                                                   │
│  Installed: v1.0.0                                │
│  New:       v1.1.0                                │
│                                                   │
│  What would you like to do?                       │
│                                                   │
│  [Replace Existing]  [Keep Both]  [Cancel]        │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Validation
- [ ] Valid plugin installs successfully
- [ ] Invalid plugin rejected with message
- [ ] Conflict detected and handled
- [ ] Plugin appears in list after install
- [ ] Files in correct location

### Test Cases
```javascript
describe('plugin installation', () => {
  it('should install valid plugin from zip', async () => { });
  it('should install valid plugin from folder', async () => { });
  it('should reject invalid plugin', async () => { });
  it('should detect and handle conflicts', async () => { });
  it('should update registry', async () => { });
});
```

### Deliverables
- `/src/managers/pluginInstaller.js`
- Updated `/src/ui/pluginManager.js`

---

## Story 2.10: Implement Plugin Uninstallation

### Description
Allow users to remove installed plugins, cleaning up all associated data.

### Acceptance Criteria
- [ ] Cannot uninstall bundled plugins
- [ ] Disables plugin before removal
- [ ] Removes plugin files
- [ ] Removes plugin data/storage
- [ ] Updates registry
- [ ] Confirmation dialog

### Uninstall Flow
```
1. Show confirmation dialog
2. Call onDisable if enabled
3. Delete {userData}/plugins/{pluginId}/
4. Remove from registry.json
5. Refresh plugin list
```

### Validation
- [ ] Bundled plugins cannot be removed
- [ ] Plugin disabled before removal
- [ ] All files removed
- [ ] Registry updated
- [ ] UI refreshed

### Deliverables
- Updated `/src/managers/pluginManager.js`
- Updated `/src/ui/pluginManager.js`

---

## Testing Matrix

| Test | Bundled Plugin | User Plugin | Invalid Plugin |
|------|---------------|-------------|----------------|
| Discovery | | | |
| Validation | | | |
| Load | | | |
| Enable | | | |
| Disable | | | |
| Unload | | | |
| Storage | | | |
| Settings | | | |
| Error handling | | | |

---

## Definition of Done

- [ ] All stories completed and tested
- [ ] Plugin manifest schema published
- [ ] Lifecycle management working
- [ ] Sandbox providing isolation
- [ ] Storage working
- [ ] UI functional
- [ ] At least 1 example plugin working
- [ ] Documentation complete

---

## Estimated Effort

| Story | Points | Notes |
|-------|--------|-------|
| 2.1 Manifest Specification | 3 | |
| 2.2 Directory Structure | 2 | |
| 2.3 Plugin Discovery | 3 | |
| 2.4 Lifecycle Manager | 5 | Core complexity |
| 2.5 Plugin Sandbox | 8 | Security critical |
| 2.6 Plugin Storage | 3 | |
| 2.7 IPC Bridge | 5 | |
| 2.8 Manager UI | 5 | |
| 2.9 Installation | 3 | |
| 2.10 Uninstallation | 2 | |
| **Total** | **39** | |
