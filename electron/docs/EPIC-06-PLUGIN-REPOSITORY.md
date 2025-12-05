# Epic 06: Plugin Repository

## Overview

Create a plugin discovery and distribution system that allows users to browse, install, and update plugins from a central repository. This builds the foundation for a community ecosystem around r0astr.

## Business Value

- Grow community and user engagement
- Enable third-party innovation
- Reduce support burden (vetted plugins)
- Potential monetization (featured plugins, pro plugins)
- Differentiation from competitors

## Dependencies

- Epic 02: Plugin Loader (complete)
- Epic 03: Plugin API (complete)
- Epic 04: Plugin Settings (complete)
- Epic 05: Network Plugins (complete)

## Deliverables

- Repository server specification
- Repository client in app
- Plugin browser UI
- Auto-update system
- Plugin submission process
- Security review guidelines

---

## Story 6.1: Define Repository API Specification

### Description
Define the REST API contract for the plugin repository server.

### Acceptance Criteria
- [ ] API specification documented
- [ ] Versioned API (v1)
- [ ] Search and filter capabilities
- [ ] Plugin metadata schema
- [ ] Download endpoints
- [ ] Update check endpoint

### API Endpoints

```yaml
# Base URL: https://plugins.r0astr.app/api/v1

# List/Search plugins
GET /plugins
  Query Parameters:
    - q: string         # Search query
    - type: string      # Filter by type (skin, extension, visualizer)
    - category: string  # Filter by category
    - sort: string      # Sort order (downloads, rating, updated, name)
    - page: number      # Page number (default: 1)
    - limit: number     # Results per page (default: 20, max: 100)
  Response:
    {
      "plugins": [...],
      "total": 150,
      "page": 1,
      "pages": 8
    }

# Get plugin details
GET /plugins/{pluginId}
  Response:
    {
      "id": "mqtt-bridge",
      "displayName": "MQTT Bridge",
      "version": "1.0.0",
      "description": "...",
      "longDescription": "...",
      "author": { "name": "...", "url": "..." },
      "license": "MIT",
      "repository": "https://github.com/...",
      "type": "extension",
      "category": "integration",
      "permissions": [...],
      "screenshots": ["url1", "url2"],
      "downloadUrl": "https://...",
      "downloadCount": 1234,
      "rating": 4.5,
      "reviewCount": 23,
      "compatibility": { "min": "0.7.0", "max": "1.x" },
      "createdAt": "...",
      "updatedAt": "..."
    }

# Get plugin versions
GET /plugins/{pluginId}/versions
  Response:
    {
      "versions": [
        { "version": "1.0.0", "releaseDate": "...", "changelog": "..." },
        { "version": "0.9.0", ... }
      ]
    }

# Download plugin
GET /plugins/{pluginId}/download
GET /plugins/{pluginId}/download/{version}
  Response: ZIP file

# Check for updates (batch)
POST /plugins/check-updates
  Body:
    {
      "plugins": [
        { "id": "mqtt-bridge", "version": "1.0.0" },
        { "id": "osc-bridge", "version": "0.5.0" }
      ]
    }
  Response:
    {
      "updates": [
        { 
          "id": "mqtt-bridge", 
          "currentVersion": "1.0.0",
          "latestVersion": "1.1.0",
          "changelog": "...",
          "downloadUrl": "..."
        }
      ]
    }

# Get featured plugins
GET /plugins/featured
  Response:
    {
      "featured": [...],
      "trending": [...],
      "new": [...]
    }

# Get categories
GET /categories
  Response:
    {
      "categories": [
        { "id": "integration", "name": "Integrations", "count": 15 },
        { "id": "visualization", "name": "Visualizations", "count": 8 },
        ...
      ]
    }
```

### Validation
- [ ] API spec complete
- [ ] All endpoints documented
- [ ] Error responses defined
- [ ] Rate limiting specified

### Deliverables
- `/docs/repository-api.md`
- OpenAPI spec file (optional)

---

## Story 6.2: Implement Repository Client

### Description
Create a client module in the app that communicates with the repository server.

### Acceptance Criteria
- [ ] Fetch plugin listings
- [ ] Search plugins
- [ ] Download plugins
- [ ] Check for updates
- [ ] Handle offline gracefully
- [ ] Cache responses appropriately

### API Design
```javascript
// src/managers/repositoryClient.js

class RepositoryClient {
  constructor(baseUrl = 'https://plugins.r0astr.app/api/v1') {
    this.baseUrl = baseUrl;
    this.cache = new Map();
  }
  
  /**
   * Search for plugins
   * @param {SearchOptions} options
   * @returns {Promise<SearchResult>}
   */
  async search(options = {}) {
    const params = new URLSearchParams(options);
    const response = await fetch(`${this.baseUrl}/plugins?${params}`);
    return response.json();
  }
  
  /**
   * Get plugin details
   * @param {string} pluginId
   * @returns {Promise<PluginDetails>}
   */
  async getPlugin(pluginId) {
    const response = await fetch(`${this.baseUrl}/plugins/${pluginId}`);
    return response.json();
  }
  
  /**
   * Download a plugin
   * @param {string} pluginId
   * @param {string} version - Optional, defaults to latest
   * @returns {Promise<ArrayBuffer>}
   */
  async download(pluginId, version = 'latest') {
    const url = version === 'latest' 
      ? `${this.baseUrl}/plugins/${pluginId}/download`
      : `${this.baseUrl}/plugins/${pluginId}/download/${version}`;
    const response = await fetch(url);
    return response.arrayBuffer();
  }
  
  /**
   * Check for updates to installed plugins
   * @param {Array<{id: string, version: string}>} plugins
   * @returns {Promise<UpdateResult[]>}
   */
  async checkUpdates(plugins) {
    const response = await fetch(`${this.baseUrl}/plugins/check-updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plugins })
    });
    return response.json();
  }
  
  /**
   * Get featured plugins
   * @returns {Promise<FeaturedResult>}
   */
  async getFeatured() {
    const response = await fetch(`${this.baseUrl}/plugins/featured`);
    return response.json();
  }
  
  /**
   * Get categories
   * @returns {Promise<Category[]>}
   */
  async getCategories() {
    const response = await fetch(`${this.baseUrl}/categories`);
    return response.json();
  }
}
```

### Offline Handling
```javascript
async search(options) {
  try {
    const result = await this.fetchWithCache('search', options);
    return result;
  } catch (error) {
    if (this.isOffline()) {
      return this.getFromCache('search', options) || { plugins: [], offline: true };
    }
    throw error;
  }
}
```

### Validation
- [ ] Fetches plugins successfully
- [ ] Search works with filters
- [ ] Downloads complete successfully
- [ ] Update check works
- [ ] Handles network errors
- [ ] Cache prevents excessive requests

### Test Cases
```javascript
describe('RepositoryClient', () => {
  it('should fetch plugin list', async () => { });
  it('should search with filters', async () => { });
  it('should download plugin', async () => { });
  it('should check for updates', async () => { });
  it('should handle offline mode', async () => { });
});
```

### Deliverables
- `/src/managers/repositoryClient.js`

---

## Story 6.3: Implement Plugin Browser UI

### Description
Create a user interface for browsing, searching, and installing plugins from the repository.

### Acceptance Criteria
- [ ] Browse all plugins
- [ ] Search functionality
- [ ] Filter by type/category
- [ ] Sort options
- [ ] Plugin details view
- [ ] Install button
- [ ] Loading states
- [ ] Offline indicator

### UI Design

```
┌───────────────────────────────────────────────────────────────────┐
│  Plugin Browser                                               [X] │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────┐  [🔍 Search...]      │
│  │ All │ Extensions │ Skins │ Visualizers │                       │
│  └─────────────────────────────────────────┘                       │
│                                                                   │
│  Sort: [Popular ▼]                                    150 plugins │
│                                                                   │
│  ─────────────────────────────────────────────────────────────    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 🔌 MQTT Bridge                                    ★★★★★ (23) │ │
│  │                                                    v1.0.0    │ │
│  │ Control r0astr via MQTT protocol for IoT and            │ │
│  │ home automation integration.                                 │ │
│  │                                                              │ │
│  │ by Plugin Author                        1.2K downloads       │ │
│  │                                                              │ │
│  │                                              [Install]       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 🎨 Retrowave Deluxe                               ★★★★☆ (8) │ │
│  │                                                    v2.1.0    │ │
│  │ A vibrant 80s-inspired theme with animated neon             │ │
│  │ effects and synthwave aesthetics.                           │ │
│  │                                                              │ │
│  │ by Theme Designer                        856 downloads       │ │
│  │                                                              │ │
│  │                                              [Install]       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 📊 Spectrum Analyzer                              ★★★★★ (15)│ │
│  │                                                    v1.2.0    │ │
│  │ Real-time audio spectrum visualization with                 │ │
│  │ customizable colors and display modes.          [Installed] │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [Load More...]                                                   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Plugin Details Modal

```
┌───────────────────────────────────────────────────────────────────┐
│  ← MQTT Bridge                                                [X] │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  MQTT Bridge v1.0.0                             │
│  │             │  by Plugin Author                               │
│  │   [icon]    │  ★★★★★ (23 reviews) • 1.2K downloads           │
│  │             │                                                  │
│  └─────────────┘  [Install]  [View Source]                       │
│                                                                   │
│  ─────────────────────────────────────────────────────────────    │
│                                                                   │
│  Description                                                      │
│  Control r0astr via MQTT protocol. Perfect for IoT and       │
│  home automation integration. Features include:                   │
│  • Connect to any MQTT broker                                     │
│  • Map topics to panel controls                                   │
│  • Publish state changes automatically                            │
│  • Support for TLS connections                                    │
│                                                                   │
│  ─────────────────────────────────────────────────────────────    │
│                                                                   │
│  Screenshots                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                             │
│  │         │ │         │ │         │                             │
│  └─────────┘ └─────────┘ └─────────┘                             │
│                                                                   │
│  ─────────────────────────────────────────────────────────────    │
│                                                                   │
│  Permissions Required                                             │
│  ⚠ Network Access (external servers)                             │
│  • Read panel information                                         │
│  • Control panel playback                                         │
│  • Show notifications                                             │
│                                                                   │
│  ─────────────────────────────────────────────────────────────    │
│                                                                   │
│  Version History                                                  │
│  v1.0.0 (Jan 15, 2024) - Initial release                         │
│  v0.9.0 (Dec 20, 2023) - Beta release                            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Implementation
- Tab-based navigation for categories
- Virtual scrolling for large lists
- Debounced search
- Skeleton loading states
- Error boundaries

### Validation
- [ ] Browse shows plugins
- [ ] Search filters results
- [ ] Category tabs work
- [ ] Sort changes order
- [ ] Details modal opens
- [ ] Install triggers download
- [ ] Loading states shown
- [ ] Errors handled gracefully

### Deliverables
- `/src/ui/pluginBrowser.js`
- `/src/ui/pluginBrowser.css`
- `/src/ui/pluginDetails.js`

---

## Story 6.4: Implement Plugin Installation from Repository

### Description
Integrate the repository browser with the plugin installer to enable one-click installation.

### Acceptance Criteria
- [ ] Install button triggers download
- [ ] Progress indicator shown
- [ ] Verification of downloaded package
- [ ] Automatic extraction
- [ ] Post-install enable prompt
- [ ] Error handling with retry

### Installation Flow
```
1. User clicks "Install" on plugin card
2. Show installation modal with progress
3. Download ZIP from repository
4. Verify checksum/signature
5. Extract to user plugins directory
6. Update registry
7. Prompt to enable plugin
8. Refresh plugin list
```

### Progress UI
```
┌────────────────────────────────────────────────────────┐
│  Installing MQTT Bridge                            [X] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Downloading...                                        │
│  [████████████████████░░░░░░░░░░░░░░] 65%              │
│                                                        │
│  2.1 MB / 3.2 MB                                       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Verification
```javascript
async function verifyPlugin(zipBuffer, expectedChecksum) {
  const hash = await crypto.subtle.digest('SHA-256', zipBuffer);
  const checksum = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  if (checksum !== expectedChecksum) {
    throw new Error('Plugin verification failed: checksum mismatch');
  }
}
```

### Validation
- [ ] Download completes
- [ ] Checksum verified
- [ ] Extraction successful
- [ ] Plugin appears in list
- [ ] Enable prompt shown
- [ ] Errors shown clearly

### Deliverables
- Updated `/src/managers/pluginInstaller.js`
- Updated `/src/ui/pluginBrowser.js`

---

## Story 6.5: Implement Auto-Update System

### Description
Create a system that checks for plugin updates and allows users to update with one click.

### Acceptance Criteria
- [ ] Check for updates on app launch
- [ ] Check for updates periodically
- [ ] Show update notifications
- [ ] Update individual plugins
- [ ] Update all plugins at once
- [ ] Preserve settings during update
- [ ] Rollback on failure

### Update Check Flow
```
1. On app launch (or daily check)
2. Gather installed plugin versions
3. Call repository check-updates endpoint
4. If updates available:
   a. Show badge on Plugins in settings
   b. Optional notification
5. User opens Plugin Manager
6. Show "Update Available" badges
7. User clicks Update (single or all)
8. Download new version
9. Backup current version
10. Install new version
11. Restore settings
12. Enable updated plugin
```

### UI Updates Badge
```
Settings Menu:
┌──────────────────┐
│ Appearance       │
│ Plugins      (3) │  ← Badge shows update count
│ Audio            │
│ ...              │
└──────────────────┘
```

### Plugin Card with Update
```
┌──────────────────────────────────────────────────────┐
│ ☑ MQTT Bridge                              v1.0.0   │
│   Control r0astr via MQTT              ⬆ v1.1.0 │
│                                    available        │
│   [⚙ Settings]  [Update]  [ⓘ Info]                 │
└──────────────────────────────────────────────────────┘
```

### Validation
- [ ] Update check runs automatically
- [ ] Updates detected correctly
- [ ] Badge shown on menu
- [ ] Update download works
- [ ] Settings preserved
- [ ] Rollback works on failure

### Deliverables
- `/src/managers/pluginUpdater.js`
- Updated `/src/ui/pluginManager.js`

---

## Story 6.6: Implement Update Notifications

### Description
Notify users about available plugin updates in a non-intrusive way.

### Acceptance Criteria
- [ ] Notification on launch if updates available
- [ ] Can be dismissed
- [ ] Links to Plugin Manager
- [ ] Setting to disable notifications
- [ ] Doesn't show for recently dismissed

### Notification UI
```
┌────────────────────────────────────────────────────────────────┐
│ 🔄 3 plugin updates available                            [X]  │
│    MQTT Bridge, OSC Bridge, Spectrum Analyzer                 │
│    [Update All]  [View Details]  [Remind Me Later]            │
└────────────────────────────────────────────────────────────────┘
```

### Settings
```json
{
  "updates": {
    "checkAutomatically": true,
    "checkInterval": "daily",
    "showNotifications": true,
    "autoUpdate": false
  }
}
```

### Validation
- [ ] Notification appears when updates available
- [ ] Dismiss works
- [ ] "Remind Me Later" postpones
- [ ] Links work
- [ ] Settings respected

### Deliverables
- Updated `/src/managers/pluginUpdater.js`
- `/src/ui/updateNotification.js`

---

## Story 6.7: Define Plugin Submission Process

### Description
Document and implement the process for developers to submit plugins to the repository.

### Acceptance Criteria
- [ ] Submission guidelines documented
- [ ] Required metadata defined
- [ ] Security review checklist
- [ ] Quality requirements
- [ ] Submission form/process
- [ ] Review workflow defined

### Submission Requirements

#### Required Files
- `manifest.json` - Valid manifest
- `README.md` - Documentation
- `LICENSE` - Open source license
- `CHANGELOG.md` - Version history
- `icon.png` - 256x256 icon

#### Required Metadata
- Display name and description
- Author information
- Repository URL
- At least one screenshot
- Category selection
- Keywords/tags

#### Quality Requirements
- No malicious code
- Proper error handling
- Reasonable permissions (not over-requesting)
- Works with current app version
- Documentation complete
- No hardcoded credentials

### Security Review Checklist
- [ ] Permissions match functionality
- [ ] No eval() or dynamic code execution
- [ ] Network access justified
- [ ] No data exfiltration
- [ ] Proper input sanitization
- [ ] No known vulnerabilities in dependencies

### Submission Process
```
1. Developer creates plugin
2. Runs validation tool locally
3. Creates GitHub release with assets
4. Submits via web form or CLI
5. Automated checks run
6. Manual review (if needed)
7. Approval or feedback
8. Plugin published
```

### Validation Tool
```bash
# CLI tool for developers
npx r0astr-plugin validate ./my-plugin

# Output:
✓ manifest.json valid
✓ Required files present
✓ Permissions reasonable
✓ No security issues found
✓ Compatible with r0astr 0.7.0+

Ready for submission!
```

### Deliverables
- `/docs/plugin-submission.md`
- `/tools/validate-plugin/` (CLI tool)

---

## Story 6.8: Repository Server Implementation (Out of Scope)

### Description
The actual repository server is out of scope for the app development but is documented here for completeness.

### Required Infrastructure
- API server (Node.js/Go/etc.)
- Database (PostgreSQL)
- File storage (S3)
- CDN for downloads
- Admin dashboard
- CI/CD for deployments

### Placeholder/Development Mode
For development and self-hosting, support a local/custom repository:

```json
// In app settings
{
  "repository": {
    "url": "https://plugins.r0astr.app/api/v1",
    "customUrl": null,  // Override for self-hosted
    "enabled": true
  }
}
```

### Self-Hosted Option
```javascript
// Simple local repository for development
// Just serves plugins from a directory
const express = require('express');
const app = express();

app.get('/api/v1/plugins', (req, res) => {
  const plugins = scanPluginDirectory('./plugins');
  res.json({ plugins, total: plugins.length });
});

app.get('/api/v1/plugins/:id/download', (req, res) => {
  res.sendFile(`./plugins/${req.params.id}.zip`);
});
```

### Deliverables
- `/docs/repository-server.md` (specification)
- `/tools/local-repository/` (development server)

---

## Testing Matrix

| Test | Browse | Search | Install | Update | Offline |
|------|--------|--------|---------|--------|---------|
| UI loads | | | | | |
| Data fetches | | | | | |
| Actions work | | | | | |
| Errors handled | | | | | |
| Performance | | | | | |

---

## Definition of Done

- [ ] Repository API documented
- [ ] Client implementation complete
- [ ] Browser UI functional
- [ ] Installation from repo works
- [ ] Auto-updates working
- [ ] Submission process documented
- [ ] Security guidelines published
- [ ] All tests passing

---

## Estimated Effort

| Story | Points | Notes |
|-------|--------|-------|
| 6.1 API Specification | 3 | |
| 6.2 Repository Client | 5 | |
| 6.3 Browser UI | 8 | |
| 6.4 Installation | 3 | |
| 6.5 Auto-Update | 5 | |
| 6.6 Notifications | 2 | |
| 6.7 Submission Process | 3 | |
| 6.8 Server (Out of Scope) | - | |
| **Total** | **29** | |

---

## Future Considerations

- Plugin ratings and reviews (in-app)
- Developer analytics
- Monetization (pro plugins, donations)
- Plugin bundles/collections
- Verified developer badges
- Featured/promoted plugins
- Plugin dependencies
