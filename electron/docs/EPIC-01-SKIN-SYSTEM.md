# Epic 01: Skin System

## Overview

Implement a Winamp-style skinning system that allows users to customize the visual appearance of r0astr through loadable CSS themes. Skins are self-contained packages containing stylesheets, assets, and metadata.

## Business Value

- User personalization and expression
- Community engagement through skin sharing
- Differentiation from other live coding tools
- Nostalgia appeal (Winamp heritage)
- Foundation for broader plugin system

## Dependencies

- Epic 00: App Icons (complete)
- Existing CSS architecture understood

## Deliverables

- Skin manifest specification
- Skin loader module
- Skin selector UI
- 3 bundled default skins
- Skin development documentation

---

## Story 1.1: Define Skin Manifest Specification

### Description
Define the JSON manifest format that describes a skin package, including metadata, file references, and customizable variables.

### Acceptance Criteria
- [ ] Manifest schema defined and documented
- [ ] Schema supports required fields (name, version, author)
- [ ] Schema supports optional fields (description, preview, variables)
- [ ] Schema is versioned for future compatibility
- [ ] JSON Schema file created for validation

### Manifest Specification

```json
{
  "$schema": "https://r0astr.app/schemas/skin-manifest-v1.json",
  "manifestVersion": 1,
  "name": "skin-identifier",
  "displayName": "Human Readable Name",
  "version": "1.0.0",
  "description": "A brief description of the skin",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://author-website.com"
  },
  "license": "MIT",
  "preview": "preview.png",
  "style": "style.css",
  "templates": {
    "panel": "panel.html",
    "header": "header.html"
  },
  "assets": [
    "assets/background.png",
    "assets/button-play.png"
  ],
  "variables": {
    "accentColor": {
      "type": "color",
      "default": "#00ff00",
      "description": "Primary accent color"
    },
    "backgroundColor": {
      "type": "color", 
      "default": "#1a1a2e",
      "description": "Main background color"
    },
    "fontFamily": {
      "type": "font",
      "default": "monospace",
      "description": "Primary font family"
    },
    "panelOpacity": {
      "type": "range",
      "default": 0.9,
      "min": 0.5,
      "max": 1.0,
      "description": "Panel background opacity"
    }
  },
  "compatibility": {
    "minAppVersion": "0.6.0",
    "maxAppVersion": "1.x"
  }
}
```

### Validation
- [ ] Create JSON Schema file
- [ ] Validate 3+ example manifests against schema
- [ ] Test with missing required fields (should fail)
- [ ] Test with extra unknown fields (should pass)
- [ ] Document all fields in developer docs

### Deliverables
- `/schemas/skin-manifest-v1.json` (JSON Schema)
- `/docs/skin-development.md` (documentation)

---

## Story 1.2: Implement Skin Directory Structure

### Description
Define and implement the file system structure for skin storage, including bundled skins and user-installed skins.

### Acceptance Criteria
- [ ] Bundled skins stored in app resources
- [ ] User skins stored in user data directory
- [ ] Directory structure supports all skin assets
- [ ] Paths work on macOS, Windows, Linux

### Directory Structure

```
# Bundled skins (read-only, inside app)
{app}/resources/skins/
├── default/
│   ├── manifest.json
│   ├── style.css
│   └── preview.png
├── dark-mode/
│   └── ...
└── retrowave/
    └── ...

# User-installed skins (writable)
{userData}/skins/
├── installed.json          # Registry of installed skins
├── community-skin-1/
│   ├── manifest.json
│   ├── style.css
│   ├── preview.png
│   └── assets/
└── my-custom-skin/
    └── ...
```

### Platform Paths
| Platform | userData Location |
|----------|-------------------|
| macOS | `~/Library/Application Support/r0astr/` |
| Windows | `%APPDATA%/r0astr/` |
| Linux | `~/.config/r0astr/` |

### Implementation
```javascript
// src/utils/paths.js
import { app } from 'electron';
import path from 'path';

export const PATHS = {
  bundledSkins: path.join(app.getAppPath(), 'resources', 'skins'),
  userSkins: path.join(app.getPath('userData'), 'skins'),
  skinRegistry: path.join(app.getPath('userData'), 'skins', 'installed.json')
};
```

### Validation
- [ ] Paths resolve correctly on macOS
- [ ] Paths resolve correctly on Windows
- [ ] Paths resolve correctly on Linux
- [ ] User directory created on first launch
- [ ] Bundled skins accessible in packaged app

### Deliverables
- `/src/utils/paths.js`
- `/electron/main.cjs` updates for directory initialization

---

## Story 1.3: Implement Skin Discovery

### Description
Create a module that discovers available skins from both bundled and user directories, validates their manifests, and returns a unified list.

### Acceptance Criteria
- [ ] Discovers skins from bundled directory
- [ ] Discovers skins from user directory
- [ ] Validates manifest.json for each skin
- [ ] Returns unified list with source indicator
- [ ] Handles invalid/corrupt skins gracefully
- [ ] Provides meaningful error messages

### API Design
```javascript
// src/managers/skinManager.js

/**
 * Discover all available skins
 * @returns {Promise<SkinInfo[]>}
 */
export async function discoverSkins() {
  // Returns array of:
  // {
  //   id: 'skin-name',
  //   manifest: { ... },
  //   source: 'bundled' | 'user',
  //   path: '/absolute/path/to/skin',
  //   valid: true,
  //   errors: []
  // }
}

/**
 * Validate a skin manifest
 * @param {string} skinPath 
 * @returns {Promise<ValidationResult>}
 */
export async function validateSkin(skinPath) {
  // Returns { valid: boolean, errors: string[] }
}

/**
 * Get skin by ID
 * @param {string} skinId 
 * @returns {Promise<SkinInfo | null>}
 */
export async function getSkin(skinId) { }
```

### Validation
- [ ] Discovers bundled skins correctly
- [ ] Discovers user skins correctly
- [ ] Handles missing manifest.json
- [ ] Handles malformed manifest.json
- [ ] Handles missing required fields
- [ ] Performance: < 100ms for 20 skins

### Test Cases
```javascript
describe('skinManager.discoverSkins', () => {
  it('should find bundled skins', async () => { });
  it('should find user-installed skins', async () => { });
  it('should mark invalid skins', async () => { });
  it('should not throw on corrupt manifest', async () => { });
  it('should deduplicate by ID (user overrides bundled)', async () => { });
});
```

### Deliverables
- `/src/managers/skinManager.js`
- `/src/managers/__tests__/skinManager.test.js`

---

## Story 1.4: Implement CSS Injection System

### Description
Create a system to dynamically load and unload skin CSS, including handling of CSS custom properties (variables) and asset URL resolution.

### Acceptance Criteria
- [ ] Can inject skin CSS into document
- [ ] Can remove previously injected CSS
- [ ] Resolves relative asset URLs to absolute paths
- [ ] Applies CSS custom property overrides
- [ ] Handles CSS syntax errors gracefully
- [ ] Transition between skins is smooth (no flash)

### API Design
```javascript
// src/managers/skinManager.js

/**
 * Apply a skin to the application
 * @param {string} skinId 
 * @param {object} variableOverrides - Optional variable customizations
 * @returns {Promise<void>}
 */
export async function applySkin(skinId, variableOverrides = {}) { }

/**
 * Remove current skin, revert to default
 * @returns {Promise<void>}
 */
export async function removeSkin() { }

/**
 * Update skin variables without full reload
 * @param {object} variables 
 */
export function updateSkinVariables(variables) { }

/**
 * Get currently applied skin
 * @returns {string | null}
 */
export function getCurrentSkin() { }
```

### Implementation Details

```javascript
// CSS injection approach
function injectSkinCSS(css, skinPath) {
  // Remove existing skin stylesheet
  const existing = document.getElementById('r0astr-skin');
  if (existing) existing.remove();

  // Resolve asset URLs
  const resolvedCSS = css.replace(
    /url\(['"]?(?!data:)(?!https?:)([^'")]+)['"]?\)/g,
    (match, url) => `url('${skinPath}/assets/${url}')`
  );

  // Create and inject stylesheet
  const style = document.createElement('style');
  style.id = 'r0astr-skin';
  style.textContent = resolvedCSS;
  document.head.appendChild(style);
}

// CSS variable injection
function applySkinVariables(variables) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(`--skin-${key}`, value);
  }
}
```

### Validation
- [ ] Skin CSS applies correctly
- [ ] Previous skin CSS removed completely
- [ ] Asset URLs resolve correctly
- [ ] Variables override defaults
- [ ] No CSS leakage between skins
- [ ] No FOUC (flash of unstyled content)

### Test Cases
```javascript
describe('applySkin', () => {
  it('should inject skin CSS', async () => { });
  it('should remove previous skin CSS', async () => { });
  it('should resolve asset URLs', async () => { });
  it('should apply variable overrides', async () => { });
  it('should handle missing CSS file', async () => { });
});
```

### Deliverables
- Updated `/src/managers/skinManager.js`
- `/src/managers/__tests__/skinManager.test.js` updates

---

## Story 1.5: Implement Skin Persistence

### Description
Save and restore the user's skin preference across application restarts.

### Acceptance Criteria
- [ ] Selected skin ID saved to settings
- [ ] Variable overrides saved to settings
- [ ] Skin applied on application launch
- [ ] Graceful fallback if saved skin not found
- [ ] Settings survive app updates

### Settings Schema
```json
// In ~/.r0astr/config.json
{
  "skin": {
    "activeId": "retrowave",
    "variables": {
      "accentColor": "#ff00ff",
      "panelOpacity": 0.85
    }
  }
}
```

### Implementation
```javascript
// Integration with existing settingsManager.js
export function getSkinSettings() {
  return getSettings().skin || { activeId: 'default', variables: {} };
}

export function saveSkinSettings(skinId, variables = {}) {
  updateSetting('skin', { activeId: skinId, variables });
}
```

### Startup Flow
```javascript
// In main.js initialization
async function initializeSkin() {
  const { activeId, variables } = getSkinSettings();
  
  try {
    await applySkin(activeId, variables);
  } catch (error) {
    console.warn(`Failed to apply skin "${activeId}", using default`);
    await applySkin('default');
    saveSkinSettings('default');
  }
}
```

### Validation
- [ ] Skin preference saved on change
- [ ] Skin restored on restart
- [ ] Variables restored on restart
- [ ] Fallback works when skin deleted
- [ ] No errors on fresh install

### Test Cases
```javascript
describe('skin persistence', () => {
  it('should save skin selection', () => { });
  it('should restore skin on launch', () => { });
  it('should fallback to default if skin missing', () => { });
  it('should preserve variable customizations', () => { });
});
```

### Deliverables
- Updated `/src/managers/settingsManager.js`
- Updated `/src/main.js`

---

## Story 1.6: Create Skin Selector UI

### Description
Build a user interface for browsing, previewing, and applying skins.

### Acceptance Criteria
- [ ] Accessible from Settings modal
- [ ] Shows grid of available skins with previews
- [ ] Displays skin metadata (name, author, description)
- [ ] One-click to apply skin
- [ ] Shows currently active skin
- [ ] Variable customization controls (if skin has variables)
- [ ] Works on remote interface too

### UI Design

```
┌─────────────────────────────────────────────────────┐
│  Appearance Settings                            [X] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Select Theme:                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  [preview]  │ │  [preview]  │ │  [preview]  │   │
│  │             │ │             │ │             │   │
│  │   Default   │ │  Dark Mode  │ │  Retrowave  │   │
│  │      ✓      │ │             │ │             │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                     │
│  ┌─────────────┐ ┌─────────────┐                   │
│  │  [preview]  │ │     +       │                   │
│  │             │ │   Install   │                   │
│  │ User Skin 1 │ │    Skin     │                   │
│  │             │ │             │                   │
│  └─────────────┘ └─────────────┘                   │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  Customize "Retrowave":                             │
│                                                     │
│  Accent Color:    [#ff00ff] [████]                 │
│  Background:      [#0a0a1a] [████]                 │
│  Panel Opacity:   [═══════●══] 85%                 │
│                                                     │
│                    [Reset to Defaults]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Implementation
- Add "Appearance" tab to existing Settings modal
- Create `SkinSelector` component
- Create `SkinCard` component
- Create `SkinVariableEditor` component

### Validation
- [ ] All skins displayed with previews
- [ ] Click applies skin immediately
- [ ] Active skin visually indicated
- [ ] Variables update in real-time
- [ ] Reset button restores defaults
- [ ] UI accessible (keyboard navigation)
- [ ] Works on small screens

### Test Cases
```javascript
describe('SkinSelector', () => {
  it('should display all available skins', () => { });
  it('should indicate active skin', () => { });
  it('should apply skin on click', () => { });
  it('should show variable editor for skins with variables', () => { });
  it('should update preview when variables change', () => { });
});
```

### Deliverables
- `/src/ui/skinSelector.js`
- `/src/ui/skinSelector.css`
- Updated `/src/ui/settingsModal.js`

---

## Story 1.7: Create Default Skin

### Description
Create the "Default" bundled skin that matches current r0astr styling, serving as the baseline and fallback.

### Acceptance Criteria
- [ ] Matches current visual appearance exactly
- [ ] Extracts hardcoded colors to CSS variables
- [ ] Documents all available CSS hooks
- [ ] Serves as template for skin developers

### CSS Variable Extraction
```css
/* skins/default/style.css */
:root {
  /* Colors */
  --skin-bg-primary: #1a1a2e;
  --skin-bg-secondary: #16213e;
  --skin-bg-panel: #0f0f1a;
  --skin-accent: #51cf66;
  --skin-accent-secondary: #e64980;
  --skin-text-primary: #ffffff;
  --skin-text-secondary: #a0a0a0;
  --skin-border: #333;
  
  /* Typography */
  --skin-font-family: 'JetBrains Mono', monospace;
  --skin-font-size-base: 14px;
  --skin-font-size-small: 12px;
  
  /* Spacing */
  --skin-panel-padding: 12px;
  --skin-panel-gap: 8px;
  --skin-border-radius: 8px;
  
  /* Effects */
  --skin-panel-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  --skin-glow-color: rgba(81, 207, 102, 0.3);
}

/* Panel styling */
.panel {
  background: var(--skin-bg-panel);
  border: 1px solid var(--skin-border);
  border-radius: var(--skin-border-radius);
  box-shadow: var(--skin-panel-shadow);
}

.panel-header {
  background: var(--skin-bg-secondary);
  color: var(--skin-text-primary);
}

/* ... etc */
```

### Validation
- [ ] App looks identical with default skin applied
- [ ] All UI elements use CSS variables
- [ ] No hardcoded colors remain in main CSS
- [ ] Skin loads without errors

### Deliverables
- `/resources/skins/default/manifest.json`
- `/resources/skins/default/style.css`
- `/resources/skins/default/preview.png`

---

## Story 1.8: Create "Dark Mode" Skin

### Description
Create a high-contrast dark skin optimized for low-light performance environments.

### Acceptance Criteria
- [ ] OLED-friendly (true blacks)
- [ ] High contrast for visibility
- [ ] Reduced eye strain
- [ ] All UI elements visible

### Design Specifications
```css
:root {
  --skin-bg-primary: #000000;
  --skin-bg-secondary: #0a0a0a;
  --skin-bg-panel: #050505;
  --skin-accent: #00ff00;
  --skin-text-primary: #00ff00;
  --skin-text-secondary: #008800;
  --skin-border: #1a1a1a;
}
```

### Validation
- [ ] Readable on OLED displays
- [ ] Sufficient contrast (WCAG AA)
- [ ] All controls visible and usable
- [ ] Preview image accurate

### Deliverables
- `/resources/skins/dark-mode/manifest.json`
- `/resources/skins/dark-mode/style.css`
- `/resources/skins/dark-mode/preview.png`

---

## Story 1.9: Create "Retrowave" Skin

### Description
Create a vibrant 80s-inspired skin with neon colors and retro aesthetics.

### Acceptance Criteria
- [ ] Neon color palette (pink, cyan, purple)
- [ ] Gradient backgrounds
- [ ] Glow effects on interactive elements
- [ ] Retro typography (if web-safe)
- [ ] Nostalgic but usable

### Design Specifications
```css
:root {
  --skin-bg-primary: #0a0a1a;
  --skin-bg-secondary: linear-gradient(135deg, #1a0a2e 0%, #0a1a2e 100%);
  --skin-bg-panel: rgba(20, 10, 40, 0.9);
  --skin-accent: #ff00ff;
  --skin-accent-secondary: #00ffff;
  --skin-text-primary: #ffffff;
  --skin-text-secondary: #ff88ff;
  --skin-border: #ff00ff44;
  --skin-glow-color: rgba(255, 0, 255, 0.5);
}

/* Neon glow effect */
.panel:hover {
  box-shadow: 
    0 0 10px var(--skin-accent),
    0 0 20px var(--skin-accent),
    0 0 30px var(--skin-accent);
}
```

### Validation
- [ ] Visually striking but usable
- [ ] Glow effects don't impact performance
- [ ] Text remains readable
- [ ] Preview captures aesthetic

### Deliverables
- `/resources/skins/retrowave/manifest.json`
- `/resources/skins/retrowave/style.css`
- `/resources/skins/retrowave/preview.png`
- `/resources/skins/retrowave/assets/` (if needed)

---

## Story 1.10: Skin Installation from File

### Description
Allow users to install skins from a `.zip` file or folder.

### Acceptance Criteria
- [ ] Install from `.zip` file via dialog
- [ ] Install from folder via drag-drop
- [ ] Validate skin before installation
- [ ] Extract to user skins directory
- [ ] Show success/error feedback
- [ ] Refresh skin list after install

### Implementation Flow
```
1. User clicks "Install Skin" or drops file
2. Validate file/folder is a valid skin
3. Extract/copy to ~/.r0astr/skins/{name}/
4. Update installed.json registry
5. Refresh skin list
6. Optionally apply new skin
```

### Validation
- [ ] Can install from .zip
- [ ] Can install from folder
- [ ] Rejects invalid skins
- [ ] Handles duplicate names
- [ ] Shows appropriate errors
- [ ] Installed skin appears in list

### Test Cases
```javascript
describe('skin installation', () => {
  it('should install valid skin from zip', async () => { });
  it('should install valid skin from folder', async () => { });
  it('should reject skin with invalid manifest', async () => { });
  it('should handle duplicate skin names', async () => { });
});
```

### Deliverables
- Updated `/src/managers/skinManager.js`
- Updated `/src/ui/skinSelector.js`

---

## Story 1.11: Write Skin Development Documentation

### Description
Create comprehensive documentation for skin developers.

### Acceptance Criteria
- [ ] Manifest format fully documented
- [ ] CSS variable reference
- [ ] Step-by-step tutorial
- [ ] Best practices
- [ ] Troubleshooting guide
- [ ] Example skin template

### Documentation Outline
```markdown
# Skin Development Guide

## Quick Start
## Manifest Reference
## CSS Variables
## Asset Handling
## Testing Your Skin
## Publishing
## Best Practices
## Troubleshooting
```

### Deliverables
- `/docs/skin-development.md`
- `/resources/skins/template/` (starter template)

---

## Testing Matrix

| Test | Default | Dark Mode | Retrowave | User Skin |
|------|---------|-----------|-----------|-----------|
| Loads without error | | | | |
| Panel styling correct | | | | |
| Button states work | | | | |
| CodeMirror themed | | | | |
| Variables apply | | | | |
| Hot-switch works | | | | |
| Persists across restart | | | | |
| Remote interface styled | | | | |

---

## Definition of Done

- [ ] All stories completed and tested
- [ ] 3 bundled skins working
- [ ] Skin selector UI functional
- [ ] Persistence working
- [ ] Documentation complete
- [ ] No performance regression
- [ ] Works on all platforms

---

## Estimated Effort

| Story | Points | Notes |
|-------|--------|-------|
| 1.1 Manifest Specification | 2 | |
| 1.2 Directory Structure | 1 | |
| 1.3 Skin Discovery | 3 | |
| 1.4 CSS Injection | 5 | Core complexity |
| 1.5 Persistence | 2 | |
| 1.6 Selector UI | 5 | |
| 1.7 Default Skin | 3 | CSS refactoring |
| 1.8 Dark Mode Skin | 2 | |
| 1.9 Retrowave Skin | 3 | |
| 1.10 Installation | 3 | |
| 1.11 Documentation | 2 | |
| **Total** | **31** | |
