# Epic 04: Plugin Settings

## Overview

Implement a comprehensive settings system that allows plugins to declare configurable options and provides users with a unified interface to customize plugin behavior.

## Business Value

- Plugins become more flexible and user-friendly
- Consistent settings experience across all plugins
- Reduces plugin-specific UI development burden
- Settings persist across restarts
- Enables non-technical users to configure plugins

## Dependencies

- Epic 02: Plugin Loader (complete)
- Epic 03: Plugin API (complete)

## Deliverables

- Settings schema specification
- Settings UI renderer
- Settings persistence
- Settings API for plugins
- Migration support for settings changes

---

## Story 4.1: Define Settings Schema Specification

### Description
Define a JSON schema format that plugins use to declare their configurable settings, including types, validation, and UI hints.

### Acceptance Criteria
- [ ] Support common field types
- [ ] Validation rules supported
- [ ] UI hints for rendering
- [ ] Conditional visibility
- [ ] Field grouping/sections
- [ ] Default values

### Settings Schema Format

```json
{
  "settings": {
    "connection": {
      "type": "group",
      "title": "Connection Settings",
      "description": "Configure the server connection",
      "fields": {
        "serverUrl": {
          "type": "string",
          "title": "Server URL",
          "description": "The MQTT broker address",
          "default": "localhost:1883",
          "placeholder": "host:port",
          "validation": {
            "required": true,
            "pattern": "^[\\w.-]+:\\d+$",
            "message": "Must be in format host:port"
          }
        },
        "useTLS": {
          "type": "boolean",
          "title": "Use TLS",
          "description": "Enable secure connection",
          "default": false
        },
        "username": {
          "type": "string",
          "title": "Username",
          "description": "Authentication username",
          "default": "",
          "showIf": { "field": "requiresAuth", "equals": true }
        },
        "password": {
          "type": "string",
          "title": "Password",
          "inputType": "password",
          "default": "",
          "showIf": { "field": "requiresAuth", "equals": true }
        }
      }
    },
    "behavior": {
      "type": "group",
      "title": "Behavior",
      "fields": {
        "autoConnect": {
          "type": "boolean",
          "title": "Auto-connect on startup",
          "default": true
        },
        "reconnectInterval": {
          "type": "number",
          "title": "Reconnect interval (seconds)",
          "default": 5,
          "min": 1,
          "max": 60,
          "step": 1
        },
        "logLevel": {
          "type": "select",
          "title": "Log Level",
          "default": "info",
          "options": [
            { "value": "debug", "label": "Debug" },
            { "value": "info", "label": "Info" },
            { "value": "warn", "label": "Warning" },
            { "value": "error", "label": "Error" }
          ]
        }
      }
    },
    "topics": {
      "type": "group",
      "title": "Topic Configuration",
      "fields": {
        "subscribeTopics": {
          "type": "array",
          "title": "Subscribe Topics",
          "description": "Topics to subscribe to",
          "itemType": "string",
          "default": ["r0astr/#"],
          "minItems": 1
        }
      }
    }
  }
}
```

### Supported Field Types

| Type | Description | UI Component |
|------|-------------|--------------|
| `string` | Text input | `<input type="text">` |
| `number` | Numeric input | `<input type="number">` |
| `boolean` | Toggle | `<input type="checkbox">` |
| `select` | Dropdown | `<select>` |
| `multiselect` | Multi-select | `<select multiple>` |
| `color` | Color picker | `<input type="color">` |
| `range` | Slider | `<input type="range">` |
| `array` | List of items | Custom list UI |
| `group` | Field grouping | Collapsible section |
| `file` | File picker | File dialog |

### Validation Rules

```json
{
  "validation": {
    "required": true,
    "min": 0,
    "max": 100,
    "minLength": 1,
    "maxLength": 255,
    "pattern": "^[a-z]+$",
    "message": "Custom error message"
  }
}
```

### Conditional Visibility

```json
{
  "showIf": { "field": "enableAdvanced", "equals": true },
  "hideIf": { "field": "simpleMode", "equals": true },
  "enableIf": { "field": "isConnected", "equals": true }
}
```

### Validation
- [ ] All field types documented
- [ ] Validation rules comprehensive
- [ ] Examples for each type
- [ ] Schema validates correctly

### Deliverables
- `/schemas/plugin-settings-v1.json`
- `/docs/plugin-settings.md`

---

## Story 4.2: Implement Settings Storage

### Description
Implement persistent storage for plugin settings, separate from plugin data storage.

### Acceptance Criteria
- [ ] Settings stored per-plugin
- [ ] Settings persist across restarts
- [ ] Default values applied automatically
- [ ] Settings versioning for migrations
- [ ] Atomic writes (no corruption)

### Storage Location
```
{userData}/plugins/{pluginId}/
├── settings.json       # User's settings values
├── settings.version    # Settings schema version (for migrations)
└── data/
    └── storage.json    # Plugin data (separate)
```

### Settings File Format
```json
// settings.json
{
  "version": "1.0.0",
  "values": {
    "serverUrl": "mqtt.example.com:1883",
    "autoConnect": true,
    "logLevel": "debug"
  },
  "lastModified": "2024-01-15T10:30:00Z"
}
```

### Implementation
```javascript
// src/managers/pluginSettings.js

class PluginSettingsManager {
  constructor(pluginId, schema) {
    this.pluginId = pluginId;
    this.schema = schema;
    this.values = {};
    this.listeners = new Set();
  }
  
  async load() {
    // Load from disk, merge with defaults
    const saved = await this.readSettingsFile();
    this.values = this.mergeWithDefaults(saved);
  }
  
  get(key) {
    return this.values[key] ?? this.getDefault(key);
  }
  
  async set(key, value) {
    const oldValue = this.values[key];
    this.values[key] = value;
    await this.persist();
    this.notifyListeners(key, value, oldValue);
  }
  
  async setMultiple(updates) {
    const changes = [];
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = this.values[key];
      this.values[key] = value;
      changes.push({ key, value, oldValue });
    }
    await this.persist();
    changes.forEach(c => this.notifyListeners(c.key, c.value, c.oldValue));
  }
  
  getAll() {
    return { ...this.values };
  }
  
  reset(key) {
    return this.set(key, this.getDefault(key));
  }
  
  resetAll() {
    this.values = this.extractDefaults(this.schema);
    return this.persist();
  }
}
```

### Validation
- [ ] Settings load on plugin enable
- [ ] Defaults applied for missing values
- [ ] Changes persist across restart
- [ ] File not corrupted on crash
- [ ] Version tracking works

### Test Cases
```javascript
describe('PluginSettingsManager', () => {
  it('should load settings from disk', async () => { });
  it('should apply defaults for missing values', () => { });
  it('should persist changes', async () => { });
  it('should notify listeners on change', async () => { });
  it('should reset to defaults', async () => { });
});
```

### Deliverables
- `/src/managers/pluginSettings.js`

---

## Story 4.3: Implement Settings API

### Description
Expose settings API to plugins for reading and modifying their settings programmatically.

### API Specification
```javascript
r0astr.settings = {
  /**
   * Get a setting value
   * @param {string} key
   * @param {*} defaultValue - Fallback if not set
   * @returns {*}
   */
  get: (key, defaultValue) => { },
  
  /**
   * Set a setting value
   * @param {string} key
   * @param {*} value
   * @returns {Promise<void>}
   */
  set: async (key, value) => { },
  
  /**
   * Set multiple values at once
   * @param {Object} updates
   * @returns {Promise<void>}
   */
  setMultiple: async (updates) => { },
  
  /**
   * Get all settings
   * @returns {Object}
   */
  getAll: () => { },
  
  /**
   * Reset a setting to default
   * @param {string} key
   * @returns {Promise<void>}
   */
  reset: async (key) => { },
  
  /**
   * Reset all settings to defaults
   * @returns {Promise<void>}
   */
  resetAll: async () => { },
  
  /**
   * Subscribe to setting changes
   * @param {string} key - Key or '*' for all
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  onChange: (key, callback) => {
    // callback receives: { key, value, oldValue }
    return () => { /* unsubscribe */ };
  },
  
  /**
   * Open the settings UI for this plugin
   */
  openUI: () => { },
  
  /**
   * Validate a value against the schema
   * @param {string} key
   * @param {*} value
   * @returns {{ valid: boolean, error?: string }}
   */
  validate: (key, value) => { }
};
```

### Usage in Plugin
```javascript
class MyPlugin {
  async onEnable(api, settings) {
    // Initial settings passed to onEnable
    this.serverUrl = settings.serverUrl;
    
    // Can also read via API
    const level = api.settings.get('logLevel', 'info');
    
    // Subscribe to changes
    api.settings.onChange('serverUrl', ({ value }) => {
      this.reconnect(value);
    });
  }
  
  // Alternative: use lifecycle hook
  onSettingsChange(newSettings, oldSettings) {
    if (newSettings.serverUrl !== oldSettings.serverUrl) {
      this.reconnect(newSettings.serverUrl);
    }
  }
}
```

### Validation
- [ ] get() returns current value
- [ ] set() persists and notifies
- [ ] onChange fires correctly
- [ ] validate() checks against schema
- [ ] Scoped to calling plugin

### Deliverables
- `/src/api/settings.js`

---

## Story 4.4: Implement Settings UI Renderer

### Description
Create a UI component that automatically renders settings forms based on plugin schemas.

### Acceptance Criteria
- [ ] Renders all field types
- [ ] Shows validation errors
- [ ] Handles conditional visibility
- [ ] Groups fields into sections
- [ ] Supports nested groups
- [ ] Responsive layout

### UI Design

```
┌────────────────────────────────────────────────────────┐
│  MQTT Bridge Settings                              [X] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ▼ Connection Settings                                 │
│  ──────────────────────────────────────────────────    │
│                                                        │
│  Server URL                                            │
│  ┌────────────────────────────────────────────────┐    │
│  │ mqtt.example.com:1883                          │    │
│  └────────────────────────────────────────────────┘    │
│  The MQTT broker address                               │
│                                                        │
│  ☑ Use TLS                                             │
│    Enable secure connection                            │
│                                                        │
│  ▼ Behavior                                            │
│  ──────────────────────────────────────────────────    │
│                                                        │
│  ☑ Auto-connect on startup                             │
│                                                        │
│  Reconnect interval (seconds)                          │
│  [═══════●══════════════════════] 5                    │
│                                                        │
│  Log Level                                             │
│  ┌────────────────────────────────────────────── ▼┐    │
│  │ Info                                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
│  ▶ Topic Configuration (collapsed)                     │
│                                                        │
│  ──────────────────────────────────────────────────    │
│                                                        │
│              [Reset to Defaults]    [Save]             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Implementation
```javascript
// src/ui/settingsRenderer.js

class SettingsRenderer {
  constructor(schema, values, onChange) {
    this.schema = schema;
    this.values = values;
    this.onChange = onChange;
    this.errors = {};
  }
  
  render(container) {
    container.innerHTML = '';
    
    for (const [key, field] of Object.entries(this.schema)) {
      if (field.type === 'group') {
        this.renderGroup(container, key, field);
      } else {
        this.renderField(container, key, field);
      }
    }
    
    this.renderActions(container);
  }
  
  renderField(container, key, field) {
    // Check visibility conditions
    if (!this.shouldShow(field)) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'settings-field';
    
    // Render based on type
    switch (field.type) {
      case 'string': this.renderString(wrapper, key, field); break;
      case 'number': this.renderNumber(wrapper, key, field); break;
      case 'boolean': this.renderBoolean(wrapper, key, field); break;
      case 'select': this.renderSelect(wrapper, key, field); break;
      case 'range': this.renderRange(wrapper, key, field); break;
      case 'color': this.renderColor(wrapper, key, field); break;
      case 'array': this.renderArray(wrapper, key, field); break;
    }
    
    // Add error display
    if (this.errors[key]) {
      const error = document.createElement('div');
      error.className = 'settings-error';
      error.textContent = this.errors[key];
      wrapper.appendChild(error);
    }
    
    container.appendChild(wrapper);
  }
  
  renderGroup(container, key, group) {
    const section = document.createElement('details');
    section.className = 'settings-group';
    section.open = true;
    
    const summary = document.createElement('summary');
    summary.textContent = group.title;
    section.appendChild(summary);
    
    if (group.description) {
      const desc = document.createElement('p');
      desc.className = 'settings-group-description';
      desc.textContent = group.description;
      section.appendChild(desc);
    }
    
    const content = document.createElement('div');
    content.className = 'settings-group-content';
    
    for (const [fieldKey, field] of Object.entries(group.fields)) {
      this.renderField(content, fieldKey, field);
    }
    
    section.appendChild(content);
    container.appendChild(section);
  }
}
```

### Validation
- [ ] All field types render correctly
- [ ] Validation errors displayed
- [ ] Conditional fields show/hide
- [ ] Changes trigger onChange
- [ ] Groups collapsible
- [ ] Reset works

### Test Cases
```javascript
describe('SettingsRenderer', () => {
  it('should render string fields', () => { });
  it('should render boolean fields', () => { });
  it('should render select fields', () => { });
  it('should show validation errors', () => { });
  it('should handle conditional visibility', () => { });
});
```

### Deliverables
- `/src/ui/settingsRenderer.js`
- `/src/ui/settingsRenderer.css`

---

## Story 4.5: Integrate Settings into Plugin Manager UI

### Description
Add settings access to the Plugin Manager UI, allowing users to configure plugins.

### Acceptance Criteria
- [ ] "Settings" button on plugin cards
- [ ] Opens settings modal for plugin
- [ ] Shows settings renderer
- [ ] Save persists changes
- [ ] Cancel discards changes
- [ ] Shows plugin without settings appropriately

### UI Flow
```
Plugin Manager
    │
    ▼ Click "Settings" on plugin card
    │
┌───────────────────────────────────┐
│ Plugin Name Settings          [X] │
├───────────────────────────────────┤
│                                   │
│   [Settings Renderer Here]        │
│                                   │
├───────────────────────────────────┤
│  [Reset]         [Cancel] [Save]  │
└───────────────────────────────────┘
```

### Implementation
```javascript
// In PluginCard component
function renderSettingsButton(plugin) {
  if (!plugin.manifest.settings || Object.keys(plugin.manifest.settings).length === 0) {
    return null; // No settings defined
  }
  
  const button = document.createElement('button');
  button.className = 'plugin-settings-btn';
  button.innerHTML = '⚙ Settings';
  button.onclick = () => openPluginSettings(plugin.id);
  return button;
}

function openPluginSettings(pluginId) {
  const plugin = getPlugin(pluginId);
  const modal = createModal({
    title: `${plugin.manifest.displayName} Settings`,
    content: (container) => {
      const renderer = new SettingsRenderer(
        plugin.manifest.settings,
        plugin.settingsManager.getAll(),
        (key, value) => {
          pendingChanges[key] = value;
        }
      );
      renderer.render(container);
    },
    actions: [
      { label: 'Reset', onClick: () => resetSettings() },
      { label: 'Cancel', onClick: () => modal.close() },
      { label: 'Save', primary: true, onClick: () => saveSettings() }
    ]
  });
}
```

### Validation
- [ ] Settings button visible for plugins with settings
- [ ] Settings button hidden for plugins without settings
- [ ] Modal opens with correct settings
- [ ] Save persists changes
- [ ] Cancel discards changes
- [ ] Plugin receives onSettingsChange

### Deliverables
- Updated `/src/ui/pluginManager.js`

---

## Story 4.6: Implement Settings Migration

### Description
Support schema versioning and automatic migration when plugins update their settings schema.

### Acceptance Criteria
- [ ] Schema version tracked
- [ ] Migration functions supported
- [ ] Backward compatibility maintained
- [ ] Invalid settings reset gracefully
- [ ] Migration logged for debugging

### Migration Format
```javascript
// In plugin manifest
{
  "settings": { ... },
  "settingsVersion": "2.0.0",
  "settingsMigrations": {
    "1.0.0->2.0.0": "migrations/v1-to-v2.js"
  }
}

// migrations/v1-to-v2.js
export default function migrate(oldSettings) {
  return {
    ...oldSettings,
    // Rename 'server' to 'serverUrl'
    serverUrl: oldSettings.server,
    // Add new field with default
    timeout: 30,
    // Remove obsolete field
    // (don't include 'legacyField')
  };
}
```

### Migration Flow
```
1. Load saved settings (with version)
2. Compare saved version to schema version
3. If different, find migration path
4. Execute migration functions in order
5. Save migrated settings
6. Continue with normal load
```

### Validation
- [ ] Version mismatch detected
- [ ] Migration path found
- [ ] Migration executed correctly
- [ ] New settings saved
- [ ] Old settings backed up
- [ ] Failure handled gracefully

### Deliverables
- Updated `/src/managers/pluginSettings.js`

---

## Testing Matrix

| Test | String | Number | Boolean | Select | Range | Array | Group |
|------|--------|--------|---------|--------|-------|-------|-------|
| Renders | | | | | | | |
| Default value | | | | | | | |
| Validation | | | | | | | |
| Persistence | | | | | | | |
| Conditional | | | | | | | |
| Reset | | | | | | | |

---

## Definition of Done

- [ ] Settings schema documented
- [ ] All field types implemented
- [ ] Persistence working
- [ ] UI renderer complete
- [ ] Plugin API exposed
- [ ] Migration support working
- [ ] Tests passing

---

## Estimated Effort

| Story | Points | Notes |
|-------|--------|-------|
| 4.1 Schema Specification | 3 | |
| 4.2 Storage | 3 | |
| 4.3 API | 2 | |
| 4.4 UI Renderer | 8 | Many field types |
| 4.5 Manager Integration | 3 | |
| 4.6 Migration | 3 | |
| **Total** | **22** | |
