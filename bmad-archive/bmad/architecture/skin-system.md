# Skin System Architecture

**Version:** v1 (Draft)
**Last Updated:** 2025-11-30
**Status:** Proposed Architecture

## Overview

r0astr will support WinAmp-style skin packs that allow users to customize the visual appearance of the interface. Skins can override CSS, provide custom images, and (potentially) add custom animations via JavaScript.

## Design Goals

1. **Easy to create** - Users with CSS knowledge can create skins
2. **Safe** - Prevent malicious code execution
3. **Performant** - Minimal overhead when loading skins
4. **Extensible** - Support future enhancements (animated backgrounds, custom fonts, etc.)
5. **Backward compatible** - Default skin always works

## Directory Structure

```
r0astr/
├── static/
│   ├── css/
│   │   └── style.css              # Base styles (required)
│   └── skins/                     # Skin directory
│       ├── default/               # Default skin (ships with app)
│       │   ├── skin.json          # Skin metadata
│       │   └── preview.png        # Preview thumbnail
│       ├── retro-winamp/          # Example custom skin
│       │   ├── skin.json          # Skin metadata
│       │   ├── theme.css          # CSS overrides
│       │   ├── assets/            # Skin-specific images
│       │   │   ├── background.png
│       │   │   ├── button-play.png
│       │   │   └── speaker.png
│       │   ├── animations.js      # (Optional) Custom animations
│       │   └── preview.png        # Preview thumbnail
│       └── cyberpunk-2077/        # Another example
│           ├── skin.json
│           ├── theme.css
│           └── assets/
```

## Skin Metadata Format

**`skin.json` schema:**

```json
{
  "name": "Retro WinAmp",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Classic WinAmp-inspired skin with green LEDs",
  "thumbnail": "preview.png",
  "assets": {
    "css": "theme.css",
    "js": "animations.js",
    "images": {
      "background": "assets/background.png",
      "speaker": "assets/speaker.png",
      "logo": "assets/custom-logo.png"
    }
  },
  "cssVariables": {
    "--pale-white": "#00ff00",
    "--dark-green": "#00cc00",
    "--burnt-red": "#ff0000",
    "--hole-size": "20px",
    "--corner-ring-size": "50px"
  },
  "permissions": {
    "allowJS": false,
    "allowHTML": false
  }
}
```

## Loading Mechanism

### Settings Integration

Add to existing settings manager:

```javascript
// src/managers/settingsManager.js
const defaultSettings = {
  // ... existing settings
  skin: {
    enabled: true,
    currentSkin: 'default',  // Skin folder name
    customSkinsPath: '/static/skins/'
  }
};
```

### Skin Loader Module

**`src/managers/skinManager.js`:**

```javascript
/**
 * Loads and applies skin based on settings
 */
export async function loadSkin(skinName) {
  const skinPath = `/static/skins/${skinName}`;

  try {
    // 1. Fetch skin.json metadata
    const response = await fetch(`${skinPath}/skin.json`);
    const skinMeta = await response.json();

    // 2. Validate skin metadata
    validateSkinMetadata(skinMeta);

    // 3. Apply CSS variables from skin.json
    if (skinMeta.cssVariables) {
      applyCSSVariables(skinMeta.cssVariables);
    }

    // 4. Load custom CSS if specified
    if (skinMeta.assets?.css) {
      loadStylesheet(`${skinPath}/${skinMeta.assets.css}`);
    }

    // 5. Replace image assets
    if (skinMeta.assets?.images) {
      replaceImageAssets(skinPath, skinMeta.assets.images);
    }

    // 6. (OPTIONAL) Load custom JavaScript
    if (skinMeta.permissions?.allowJS && skinMeta.assets?.js) {
      await loadSkinScript(`${skinPath}/${skinMeta.assets.js}`);
    }

    console.log(`Skin '${skinMeta.name}' loaded successfully`);
    return skinMeta;

  } catch (error) {
    console.error(`Failed to load skin '${skinName}':`, error);
    // Fallback to default skin
    if (skinName !== 'default') {
      return loadSkin('default');
    }
  }
}

function applyCSSVariables(variables) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(key, value);
  }
}

function loadStylesheet(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.dataset.skinStylesheet = 'true'; // Mark for cleanup
  document.head.appendChild(link);
}

function replaceImageAssets(skinPath, images) {
  for (const [key, filename] of Object.entries(images)) {
    const imgPath = `${skinPath}/${filename}`;

    // Replace based on key mapping
    switch(key) {
      case 'background':
        // Update body::before background-image
        document.documentElement.style.setProperty('--skin-background', `url(${imgPath})`);
        break;
      case 'speaker':
        document.querySelector('.speaker-container img')?.setAttribute('src', imgPath);
        break;
      case 'logo':
        document.querySelector('.site-logo img')?.setAttribute('src', imgPath);
        break;
    }
  }
}

/**
 * Security-conscious script loader
 * Only loads scripts from trusted skin directories
 */
async function loadSkinScript(src) {
  // SECURITY: Only allow scripts from /static/skins/*
  if (!src.startsWith('/static/skins/')) {
    throw new Error('Skin scripts must be in /static/skins/ directory');
  }

  // Option 1: Import as ES module (recommended)
  try {
    const module = await import(src);
    if (module.init && typeof module.init === 'function') {
      module.init(); // Call skin initialization function
    }
  } catch (error) {
    console.error('Skin script failed to load:', error);
  }
}

/**
 * Cleanup function to remove skin-specific assets
 */
export function unloadSkin() {
  // Remove skin stylesheets
  document.querySelectorAll('[data-skin-stylesheet]').forEach(el => el.remove());

  // Reset CSS variables to defaults (from settings or base CSS)
  // ... implementation
}
```

### Integration in `src/main.js`

```javascript
import { loadSkin } from './managers/skinManager.js';
import { getSettings } from './managers/settingsManager.js';

// After Strudel initialization
async function initializeUI() {
  const settings = getSettings();

  if (settings.skin?.enabled) {
    await loadSkin(settings.skin.currentSkin);
  }

  // ... rest of UI initialization
}
```

## Security Considerations

### CSS Injection
- **Risk:** Malicious CSS can hide UI elements, inject content via `::before/::after`
- **Mitigation:**
  - CSS is scoped to skin directory (`/static/skins/`)
  - Base styles always load first (provides fallback)
  - No inline styles from untrusted sources

### JavaScript Execution
- **Risk:** XSS, data theft, malicious behavior
- **Mitigation:**
  - **Option 1 (Recommended):** Disable JS by default (`allowJS: false` in skin.json)
  - **Option 2:** Sandboxed execution using iframe with restricted `sandbox` attribute
  - **Option 3:** CSP (Content Security Policy) headers limiting script sources
  - Only load scripts from `/static/skins/*` directory
  - Use ES modules (no `eval()` or `Function()` constructor)

### Recommended Default
- **Skins WITHOUT JavaScript support** - CSS and assets only
- **Future enhancement:** JS support for trusted/verified skins only

## CSS Variable Override System

Skins can override any CSS variable defined in `/static/css/style.css`:

**Base variables (style.css):**
```css
:root {
  --pale-white: #d1d8e0;
  --hole-size: 16px;
  --radius-sm: 2px;
  /* ... all other variables */
}
```

**Skin override (theme.css):**
```css
:root {
  /* Override specific variables */
  --pale-white: #00ff00;
  --hole-size: 24px;
  --radius-sm: 4px;

  /* Add skin-specific variables */
  --skin-glow-color: rgba(0, 255, 0, 0.5);
}

/* Additional skin-specific styles */
.hero-section {
  box-shadow: 0 0 20px var(--skin-glow-color);
}
```

**Loading order:**
1. `/static/css/style.css` (base styles + default variables)
2. Skin CSS variables via JavaScript (`root.style.setProperty()`)
3. Skin CSS file (`theme.css`)

## UI for Skin Selection

**Settings Modal Enhancement:**

```html
<!-- Settings Modal - Skin Tab -->
<div class="settings-section">
  <h3>Appearance & Skins</h3>

  <div class="skin-selector">
    <label>Current Skin:</label>
    <select id="skin-select">
      <option value="default">Default</option>
      <option value="retro-winamp">Retro WinAmp</option>
      <option value="cyberpunk-2077">Cyberpunk 2077</option>
    </select>
  </div>

  <div class="skin-preview">
    <img src="/static/skins/default/preview.png" alt="Skin Preview">
    <p class="skin-description">Classic r0astr interface</p>
  </div>

  <button id="apply-skin-btn">Apply Skin</button>
  <button id="install-skin-btn">Install Custom Skin...</button>
</div>
```

## Future Enhancements

1. **Hot-reloading** - Live preview skins without page refresh
2. **Skin marketplace** - Download skins from community repository
3. **Skin editor** - Visual CSS variable editor built into settings
4. **Animated backgrounds** - Canvas/WebGL backgrounds via trusted JS
5. **Font packs** - Custom typography bundles
6. **Sound packs** - Custom UI sound effects (button clicks, etc.)

## Example: Creating a Custom Skin

**1. Create skin directory:**
```bash
mkdir -p static/skins/my-custom-skin/assets
```

**2. Create `skin.json`:**
```json
{
  "name": "My Custom Skin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A custom skin for r0astr",
  "thumbnail": "preview.png",
  "assets": {
    "css": "theme.css"
  },
  "cssVariables": {
    "--pale-white": "#ffcc00",
    "--dark-green": "#00aaff",
    "--hole-size": "20px"
  },
  "permissions": {
    "allowJS": false
  }
}
```

**3. Create `theme.css`:**
```css
/* Override specific styles */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card {
  border: 3px solid var(--pale-white);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5);
}
```

**4. Add preview image:**
- `preview.png` (recommended: 400x300px screenshot)

**5. Select in settings:**
- Open Settings → Appearance & Skins
- Select "My Custom Skin"
- Click "Apply Skin"

## Migration Path

**Phase 1: Core Infrastructure** (Current)
- ✅ Extract CSS to external file
- ✅ Define CSS variables for all dimensions/colors
- Create `skinManager.js` module
- Add skin settings to `settingsManager.js`

**Phase 2: Basic Skin Support**
- Implement CSS variable override system
- Create default skin bundle
- Add skin selector to Settings UI

**Phase 3: Asset Replacement**
- Support custom images (background, logo, speaker)
- Implement asset loading/replacement logic

**Phase 4: Advanced Features** (Future)
- JavaScript support (sandboxed, opt-in)
- Skin marketplace/community sharing
- Live preview and hot-reloading

---

**Maintained By:** Development Team
**Review Cycle:** Update with implementation progress
