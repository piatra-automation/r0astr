# r0astr Frontend Architecture Document

**Version:** v1.0 (Draft)
**Last Updated:** 2025-12-09
**Status:** Proposed Architecture for Skin System Implementation

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-09 | 1.0 | Initial frontend architecture with skin system design | Winston (Architect) |

---

## 1. Overview

r0astr is a multi-instrument live coding interface built on Strudel, using a **vanilla JavaScript** architecture. This document defines the complete frontend architecture including the planned **User Skin System** that allows HTML/CSS/JS customization while maintaining security.

### Design Goals

1. **Minimal & Performant** - No framework overhead, direct DOM manipulation
2. **Secure by Design** - Sandboxed execution for user-provided code
3. **Extensible** - Skin system for visual customization
4. **Maintainable** - Clear separation of concerns, event-driven architecture

### Technology Constraints

- **Framework:** Vanilla JavaScript (ES2020+) - NO React/Vue/Angular
- **Strudel Version:** Locked to v1.2.x (stable fork)
- **Build Tool:** Vite 6.0.11
- **Browser Support:** Desktop-first (Chrome, Firefox, Safari)

---

## 2. Frontend Tech Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| **Framework** | Vanilla JavaScript | ES2020+ | Core application logic | Minimal overhead, full control, no build complexity |
| **Build Tool** | Vite | 6.0.11 | Dev server, HMR, bundling | Fast HMR, native ES modules, AudioWorklet bundling |
| **UI Library** | None (Vanilla DOM) | Native | Direct DOM manipulation | Maximum performance, no framework overhead |
| **State Management** | Event Bus + Plain Objects | Custom | Panel state, settings, WebSocket sync | Simple, transparent, debuggable |
| **Routing** | None (Single Page) | N/A | Static single-page app | No navigation requirements |
| **Styling** | CSS3 + CSS Variables | Native | Visual theming, skin system | Maximum compatibility, easy theming |
| **Code Editor** | @strudel/codemirror | 1.2.6 | Pattern code editing | Syntax highlighting, Strudel integration |
| **Drag/Resize** | interact.js | 1.10.27 | Panel manipulation | Touch support, robust, well-maintained |
| **Testing** | None (Future: Vitest) | TBD | Unit/integration tests | Future consideration |
| **Component Library** | None (Custom) | N/A | Custom button/panel system | Design system via CSS variables |
| **Form Handling** | Native Forms | N/A | Settings modal | Simple requirements, no library needed |
| **Animation** | CSS Animations | Native | Splash screen, metronome | GPU-accelerated, performant |
| **Dev Tools** | Vite Dev Server | 6.0.11 | HMR, debugging | Built-in source maps |

### Alternative Technologies Considered

| Decision | Chosen Path | Alternative Considered | Rationale |
|----------|------------|----------------------|-----------|
| Code Editor | @strudel/codemirror | CodeMirror 6 | Breaking change, requires custom Strudel mode |
| Styling | CSS Variables | Web Components | Future enhancement, not needed for Phase 1 |
| HTML Templates | Template Literals | Handlebars | Zero dependencies, sufficient for current needs |
| Skin Security | CSS-only (Phase 1) | Sandboxed iframe (Phase 2) | Safest starting point |
| State Management | Event Bus | Proxy reactivity | Simpler mental model for vanilla JS |

---

## 3. Project Structure

### Current Structure (v0.6.0)

```plaintext
r0astr/
├── index.html                      # Main UI entry point (400+ lines)
├── remote.html                     # Remote control interface
├── src/
│   ├── main.js                     # Core application logic (~800 lines)
│   ├── managers/
│   │   ├── panelManager.js         # Panel CRUD, state management
│   │   ├── settingsManager.js      # Settings persistence (localStorage)
│   │   ├── sliderManager.js        # Dynamic slider rendering
│   │   ├── websocketManager.js     # Remote control sync
│   │   └── recordingManager.js     # Pattern recording (MIDI input)
│   ├── server/
│   │   └── index.js                # Express WebSocket server
│   └── utils/
│       ├── eventBus.js             # Custom event system
│       └── domHelpers.js           # DOM manipulation utilities
├── static/
│   ├── css/
│   │   └── style.css               # Global styles + CSS variables (~1500 lines)
│   ├── images/
│   │   ├── banner.png              # Logo
│   │   └── speaker.png             # Speaker icon
│   └── skins/                      # Future: Skin directory (not yet implemented)
│       └── default/
│           ├── skin.json           # Metadata
│           └── theme.css           # CSS overrides
├── electron/
│   └── main.cjs                    # Electron main process (desktop app)
├── bmad/                           # Documentation (mkdocs site)
│   ├── prd/                        # Product requirements
│   ├── architecture/               # Technical architecture docs
│   └── stories/                    # User stories
├── package.json                    # Dependencies
├── vite.config.mjs                 # Vite + AudioWorklet config
└── .claude/                        # Claude Code configuration
```

### Proposed Structure with Skin System

```plaintext
r0astr/
├── index.html                      # Entry point (dynamic skin loading)
├── src/
│   ├── main.js                     # App initialization + Strudel setup
│   ├── managers/
│   │   ├── panelManager.js         # Panel lifecycle
│   │   ├── settingsManager.js      # Settings + skin preferences
│   │   ├── skinManager.js          # 🆕 Skin loading/validation
│   │   ├── templateEngine.js       # 🆕 HTML template rendering
│   │   └── securityValidator.js    # 🆕 Skin security checks
│   ├── templates/
│   │   ├── defaultPanel.js         # Default panel HTML template
│   │   └── skinTemplates.js        # Skin-provided templates
│   └── security/
│       ├── sandbox.js              # 🆕 iframe sandbox wrapper
│       └── csp.js                  # 🆕 Content Security Policy helpers
├── static/
│   ├── css/
│   │   ├── base.css                # Base variables (always loaded)
│   │   └── themes/                 # 🆕 Pre-installed themes
│   │       ├── dark.css
│   │       └── light.css
│   └── skins/
│       ├── default/                # Default skin (required)
│       │   ├── skin.json
│       │   ├── layout.html         # 🆕 Custom panel layout
│       │   ├── theme.css
│       │   └── preview.png
│       └── retro-winamp/           # Example custom skin
│           ├── skin.json
│           ├── layout.html         # 🆕 WinAmp-style layout
│           ├── theme.css
│           ├── animations.js       # Optional (sandboxed)
│           └── assets/
│               ├── background.png
│               └── buttons/
```

---

## 4. Component Standards

### Component Pattern (Vanilla JavaScript)

r0astr uses vanilla JavaScript with direct DOM manipulation. Components are created via template literals and event delegation.

#### Panel Component Template

```javascript
/**
 * Creates a new panel element
 * @param {string} id - Unique panel identifier
 * @param {string} code - Initial pattern code
 * @param {object} options - Panel configuration
 * @returns {HTMLElement} Panel DOM element
 */
function createPanel(id, code = '', options = {}) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.id = id;
  panel.dataset.panelId = id;

  // Apply skin template if available
  const skinTemplate = getSkinTemplate('panel');

  panel.innerHTML = skinTemplate ?
    renderSkinTemplate(skinTemplate, { id, code, options }) :
    defaultPanelTemplate(id, code, options);

  // Attach event listeners
  attachPanelEvents(panel);

  return panel;
}

/**
 * Default panel HTML template (fallback)
 */
function defaultPanelTemplate(id, code, options) {
  return `
    <div class="panel-header">
      <h3 class="panel-title">${escapeHTML(options.title || 'Panel')}</h3>
      <div class="panel-controls">
        <button class="btn-hole btn-hole-slim action-play" data-action="play">
          <div class="btn-raised btn-raised-slim btn-dark-green">
            <span class="material-icons">play_arrow</span>
          </div>
        </button>
        <button class="btn-hole btn-hole-slim action-pause" data-action="pause">
          <div class="btn-raised btn-raised-slim btn-pearl">
            <span class="material-icons">pause</span>
          </div>
        </button>
        <button class="btn-hole btn-hole-slim action-delete" data-action="delete">
          <div class="btn-raised btn-raised-slim btn-burnt-red">
            <span class="material-icons">close</span>
          </div>
        </button>
      </div>
    </div>
    <div class="panel-body">
      <textarea class="code-input" data-panel="${id}">${escapeHTML(code)}</textarea>
      <div class="slider-container"></div>
    </div>
  `;
}

/**
 * HTML escape utility (CRITICAL for security)
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### Naming Conventions

- **Files:** camelCase for JavaScript (`panelManager.js`), kebab-case for CSS (`panel-styles.css`)
- **Classes:** BEM-inspired (`.panel__header`, `.panel__controls--active`)
- **IDs:** Prefixed with purpose (`panel-${uuid}`, `slider-${id}`)
- **Functions:** camelCase verbs (`createPanel`, `attachPanelEvents`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_PANEL_CODE`, `MAX_PANELS`)
- **Event names:** Namespaced (`panel:created`, `skin:loaded`, `slider:changed`)

---

## 5. Skin System Architecture

### Core Concept

Skins provide CSS, HTML templates, and optionally sandboxed JavaScript to customize the visual appearance and layout of r0astr.

### Skin Metadata (`skin.json`)

```json
{
  "schemaVersion": "1.0",
  "name": "Retro WinAmp",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Classic WinAmp-inspired skin",
  "thumbnail": "preview.png",

  "assets": {
    "css": "theme.css",
    "html": "layout.html",
    "js": "animations.js"
  },

  "templates": {
    "panel": "templates/panel.html",
    "hero": "templates/hero.html"
  },

  "cssVariables": {
    "--pale-white": "#00ff00",
    "--hole-size": "20px"
  },

  "permissions": {
    "allowJS": false,
    "allowHTML": true,
    "trustedOrigin": false
  },

  "security": {
    "hash": "sha256-abc123...",
    "signature": "GPG signature (future)"
  }
}
```

### Skin Manager Implementation

```javascript
// src/managers/skinManager.js

export class SkinManager {
  constructor() {
    this.currentSkin = null;
    this.previousSkin = null;
    this.templates = new Map();
  }

  async loadSkin(skinName) {
    const skinPath = `/static/skins/${skinName}`;

    // Save for rollback
    this.previousSkin = this.currentSkin;

    try {
      // 1. Fetch and validate skin.json
      const metadata = await this.fetchSkinMetadata(skinPath);
      await this.validateSkin(metadata);

      // 2. Load CSS (always allowed)
      if (metadata.assets?.css) {
        await this.loadStylesheet(`${skinPath}/${metadata.assets.css}`);
      }

      // 3. Apply CSS variables
      this.applyCSSVariables(metadata.cssVariables);

      // 4. Load HTML templates (if allowed)
      if (metadata.permissions?.allowHTML && metadata.templates) {
        await this.loadTemplates(skinPath, metadata.templates);
      }

      // 5. Load JavaScript (only if trusted + allowed)
      if (metadata.permissions?.allowJS && metadata.assets?.js) {
        await this.loadSkinScript(skinPath, metadata);
      }

      // 6. Verify UI integrity
      await this.verifySkinIntegrity();

      this.currentSkin = metadata;
      eventBus.emit('skin:loaded', metadata);

    } catch (error) {
      console.error('Skin load failed:', error);

      // Rollback to previous or default
      if (this.previousSkin) {
        console.warn('Rolling back to previous skin...');
        await this.loadSkin(this.previousSkin.name);
      } else {
        console.warn('Rolling back to default skin...');
        await this.loadSkin('default');
      }

      throw error;
    }
  }

  async loadTemplates(skinPath, templates) {
    for (const [key, templateFile] of Object.entries(templates)) {
      const html = await fetch(`${skinPath}/${templateFile}`).then(r => r.text());
      this.templates.set(key, html);
    }
  }

  renderTemplate(templateName, data) {
    const template = this.templates.get(templateName);
    if (!template) return null;

    // Safe template rendering with HTML escaping
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');

    // Walk DOM and replace placeholders in text nodes only
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      node.textContent = node.textContent.replace(/\{\{(\w+)\}\}/g,
        (match, key) => data[key] ?? ''
      );
    }

    return doc.body.innerHTML;
  }

  applyCSSVariables(variables) {
    if (!variables) return;

    // Batch updates to avoid layout thrashing
    requestAnimationFrame(() => {
      const root = document.documentElement;
      const batch = Object.entries(variables);

      // Process in chunks
      const chunkSize = 20;
      let index = 0;

      function applyChunk() {
        const chunk = batch.slice(index, index + chunkSize);
        chunk.forEach(([key, value]) => root.style.setProperty(key, value));

        index += chunkSize;
        if (index < batch.length) {
          requestAnimationFrame(applyChunk);
        }
      }

      applyChunk();
    });
  }

  async loadStylesheet(href) {
    const css = await fetch(href).then(r => r.text());

    // Sanitize CSS for security
    const safeCss = this.sanitizeCSS(css);

    const style = document.createElement('style');
    style.textContent = safeCss;
    style.dataset.skinStylesheet = 'true';
    document.head.appendChild(style);
  }

  sanitizeCSS(css) {
    const ALLOWED_DOMAINS = ['localhost', 'r0astr.org', 'strudel.cc'];

    // Remove external URLs except whitelisted
    return css.replace(/url\(['"]?(https?:\/\/[^'"]+)['"]?\)/g,
      (match, url) => {
        try {
          const domain = new URL(url).hostname;
          if (ALLOWED_DOMAINS.includes(domain)) {
            return match;
          }
        } catch {}
        console.warn('Blocked external URL in CSS:', url);
        return 'url()';
      }
    );
  }

  async verifySkinIntegrity() {
    // Check critical elements exist
    const required = [
      '.panel',
      '.hero-controls',
      '.btn-hole.action-play'
    ];

    for (const selector of required) {
      if (!document.querySelector(selector)) {
        throw new Error(`Skin broke required element: ${selector}`);
      }
    }

    // Setup emergency escape hatch
    this.setupEmergencyReset();
  }

  setupEmergencyReset() {
    // Ctrl+Shift+R = Reset to default skin
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        console.warn('Emergency skin reset triggered');
        this.loadSkin('default');
      }
    });
  }

  async validateSkin(metadata) {
    const supportedVersions = ['1.0'];

    // Schema version check
    if (!supportedVersions.includes(metadata.schemaVersion)) {
      throw new Error(
        `Unsupported skin schema version: ${metadata.schemaVersion}`
      );
    }

    // Basic validation
    if (!metadata.name || !metadata.version) {
      throw new Error('Invalid skin metadata');
    }

    // Hash verification (if provided)
    if (metadata.security?.hash) {
      const computedHash = await this.computeSkinHash(metadata);
      if (computedHash !== metadata.security.hash) {
        throw new Error('Skin integrity check failed');
      }
    }

    // Future: GPG signature verification
    // if (metadata.security?.signature) {
    //   await this.verifyGPGSignature(metadata);
    // }
  }

  unloadSkin() {
    // Remove skin stylesheets
    document.querySelectorAll('[data-skin-stylesheet]').forEach(el => el.remove());

    // Clear templates
    this.templates.clear();

    // Reset CSS variables to defaults
    // (Implementation depends on base theme)
  }
}
```

### HTML Template Example

```html
<!-- static/skins/retro-winamp/templates/panel.html -->
<div class="panel winamp-panel" data-id="{{id}}">
  <div class="winamp-titlebar">
    <span class="winamp-title">{{title}}</span>
    <div class="winamp-buttons">
      <button class="winamp-btn minimize">_</button>
      <button class="winamp-btn maximize">□</button>
      <button class="winamp-btn close">X</button>
    </div>
  </div>

  <div class="winamp-display">
    <div class="led-text">{{status}}</div>
  </div>

  <div class="winamp-editor">
    <textarea data-panel="{{id}}">{{code}}</textarea>
  </div>

  <div class="winamp-controls">
    <!-- Custom control layout -->
  </div>
</div>
```

---

## 6. Security & Trust Model

### Security Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: CSS-Only Skins (Phase 1)      │
│  - No JavaScript execution              │
│  - CSS variable overrides only          │
│  - Safe by design                       │
└─────────────────────────────────────────┘
           ↓ User enables JS skins
┌─────────────────────────────────────────┐
│  Layer 2: Sandboxed Execution (Phase 2) │
│  - iframe sandbox attribute             │
│  - No same-origin access                │
│  - postMessage API only                 │
└─────────────────────────────────────────┘
           ↓ Enhanced trust
┌─────────────────────────────────────────┐
│  Layer 3: Content Security Policy       │
│  - Restrict script sources              │
│  - Block inline scripts                 │
│  - Report violations                    │
└─────────────────────────────────────────┘
           ↓ Community skins
┌─────────────────────────────────────────┐
│  Layer 4: Trusted Skin Registry         │
│  - Code review process                  │
│  - GPG signature verification           │
│  - SHA-256 integrity checks             │
└─────────────────────────────────────────┘
```

### Phase 1: CSS-Only Skins (Current Implementation)

**Scope:**
- Skins can only provide CSS and images
- No JavaScript execution
- HTML templates allowed with strict escaping
- Settings UI warns if skin requests JS

**Security Guarantees:**
- ✅ No XSS via JavaScript
- ✅ Limited tracking (CSS-based only)
- ✅ Automatic rollback on UI breakage
- ✅ Emergency reset (Ctrl+Shift+R)

### Phase 2: Sandboxed JavaScript (Future)

```javascript
// src/security/sandbox.js

export class SkinSandbox {
  constructor() {
    this.trustedIframes = new Set();
    this.messageRateLimit = new Map();
  }

  async loadSandboxedScript(skinPath, scriptFile) {
    const iframe = document.createElement('iframe');

    // Strict sandbox: no same-origin, no forms
    iframe.sandbox = 'allow-scripts';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    this.trustedIframes.add(iframe.contentWindow);

    // Inject limited skin API
    iframe.contentWindow.postMessage({
      type: 'SKIN_API_INIT',
      api: {
        updateCSS: true,
        triggerAnimation: true,
        // NO DOM access, NO XHR, NO localStorage
      }
    }, '*');

    // Load skin script in isolated context
    const script = await fetch(`${skinPath}/${scriptFile}`).then(r => r.text());

    // Execute in iframe context (no access to parent)
    const scriptElement = iframe.contentDocument.createElement('script');
    scriptElement.textContent = script;
    iframe.contentDocument.body.appendChild(scriptElement);
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Verify origin (sandboxed iframes have 'null' origin)
      if (event.origin !== 'null') {
        console.warn('Rejecting message from untrusted origin:', event.origin);
        return;
      }

      // Verify source is trusted iframe
      if (!this.trustedIframes.has(event.source)) {
        console.warn('Message from unknown iframe');
        return;
      }

      // Rate limiting
      if (this.isRateLimited(event.source)) {
        console.warn('Rate limit exceeded for iframe');
        return;
      }

      // Validate message
      const { type, payload } = event.data;
      const ALLOWED_TYPES = ['css:update', 'animation:trigger'];

      if (!ALLOWED_TYPES.includes(type)) {
        console.warn('Unknown message type:', type);
        return;
      }

      // Process message
      this.handleSkinMessage(type, payload);
    });
  }

  isRateLimited(source) {
    const now = Date.now();
    const history = this.messageRateLimit.get(source) || [];

    // Allow max 10 messages per second
    const recent = history.filter(t => now - t < 1000);

    if (recent.length >= 10) {
      return true;
    }

    recent.push(now);
    this.messageRateLimit.set(source, recent);
    return false;
  }

  handleSkinMessage(type, payload) {
    switch (type) {
      case 'css:update':
        this.handleCSSUpdate(payload);
        break;
      case 'animation:trigger':
        this.handleAnimation(payload);
        break;
    }
  }

  handleCSSUpdate({ variable, value }) {
    const ALLOWED_CSS_VARS = [
      '--pale-white', '--dark-green', '--hole-size',
      // ... whitelist
    ];

    if (ALLOWED_CSS_VARS.includes(variable)) {
      document.documentElement.style.setProperty(variable, value);
    } else {
      console.warn('CSS variable not whitelisted:', variable);
    }
  }

  handleAnimation({ selector, animationClass }) {
    // Only allow animation on specific elements
    const ALLOWED_SELECTORS = ['.panel', '.hero-section', '.btn-hole'];

    if (ALLOWED_SELECTORS.some(s => selector.startsWith(s))) {
      const element = document.querySelector(selector);
      if (element) {
        element.classList.add(animationClass);
      }
    }
  }
}
```

### Phase 3: Content Security Policy

```http
Content-Security-Policy:
  default-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://strudel.cc;
  script-src 'self';
  connect-src 'self' wss://localhost:*;
  font-src 'self';
  media-src 'self';
  frame-src 'none';
```

### Phase 4: Trusted Skin Registry (Future)

```javascript
async function verifySkinTrust(skinMeta) {
  const registryURL = 'https://r0astr.org/api/skins/verify';

  const response = await fetch(registryURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: skinMeta.name,
      version: skinMeta.version,
      hash: skinMeta.security.hash,
    }),
  });

  const { trusted, signature, reviewStatus } = await response.json();

  return {
    trusted,
    reviewedBy: reviewStatus?.reviewer,
    reviewDate: reviewStatus?.date,
    signatureValid: signature?.valid,
  };
}
```

### Critical Security Fixes Required

1. ✅ **HTML escaping in template renderer** (prevents XSS)
2. ✅ **postMessage origin validation** (prevents iframe spoofing)
3. ✅ **CSS URL sanitization** (blocks external trackers)
4. ✅ **Emergency skin reset** (Ctrl+Shift+R)
5. ✅ **Skin rollback mechanism** (automatic on failure)
6. ✅ **Schema versioning** (forward compatibility)

---

## 7. CodeMirror Integration Architecture

### Current Implementation (@strudel/codemirror v1.2.6)

```javascript
// src/main.js - CodeMirror initialization per panel

import { sliderWithID, sliderValues } from '@strudel/codemirror';

// CodeMirror is embedded in Strudel transpiler
// Widgets are extracted during pattern evaluation
const { evaluate, transpiler } = repl({
  defaultOutput: webaudioOutput,
  getTime: () => ctx.currentTime,
  transpiler, // Handles slider() → sliderWithID() conversion
});

// Slider rendering happens after evaluation
function renderSliders(panelId, widgets) {
  const sliderContainer = document.querySelector(
    `[data-panel="${panelId}"] .slider-container`
  );

  widgets.forEach(widget => {
    if (widget.type === 'slider') {
      const slider = createSliderElement(widget);
      sliderContainer.appendChild(slider);

      // Link to reactive ref
      slider.addEventListener('input', (e) => {
        sliderValues[widget.id] = parseFloat(e.target.value);
      });
    }
  });
}
```

### CodeMirror Features Used

1. **Syntax Highlighting** - Basic JavaScript/Strudel syntax
2. **Widget Extraction** - `slider()` detection via transpiler
3. **Reactive Refs** - `sliderValues` object for live updates

### CodeMirror Features NOT Used

- Autocomplete
- Linting/error highlighting
- Code formatting (using Prettier separately)
- Bracket matching
- Search/replace

### Future Enhancement (CodeMirror 6 Migration)

**Note:** Requires custom Strudel syntax mode. Not planned for Phase 1.

```javascript
// Future: Upgrade to CodeMirror 6 for better features

import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { strudelMode } from './syntax/strudelMode.js'; // Custom syntax

class PanelEditor {
  constructor(panelId, initialCode) {
    this.view = new EditorView({
      doc: initialCode,
      extensions: [
        basicSetup,
        javascript(),
        strudelMode(), // Custom Strudel syntax highlighting
        this.sliderExtension(), // Widget detection
      ],
      parent: document.querySelector(`[data-panel="${panelId}"]`),
    });
  }

  sliderExtension() {
    // Custom extension to detect slider() calls
    // Replace with sliderWithID() and track widgets
  }
}
```

### Widget Extraction Fallback

**Emergency Pattern:** If CodeMirror breaks, parse sliders via regex.

```javascript
// If CodeMirror has vulnerabilities, degrade gracefully
const FORCE_PLAIN_TEXTAREA = false; // Emergency flag

function initializeEditor(panelId, code) {
  if (FORCE_PLAIN_TEXTAREA) {
    return createPlainTextarea(panelId, code);
  }
  return createCodeMirrorEditor(panelId, code);
}

function extractSlidersManually(code) {
  const sliderRegex = /slider\(([^)]+)\)/g;
  const sliders = [];
  let match;

  while ((match = sliderRegex.exec(code)) !== null) {
    const args = match[1].split(',').map(s => s.trim());
    sliders.push({
      default: parseFloat(args[0]),
      min: parseFloat(args[1]),
      max: parseFloat(args[2]),
    });
  }

  return sliders;
}
```

---

## 8. State Management Architecture

### Event Bus Pattern

```javascript
// src/utils/eventBus.js

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event) || [];
    this.listeners.set(event, callbacks.filter(cb => cb !== callback));
  }
}

export const eventBus = new EventBus();

// Usage across application
eventBus.on('panel:created', (panel) => {
  websocketManager.broadcast('panel_created', panel);
});

eventBus.on('slider:changed', ({ panelId, sliderId, value }) => {
  sliderValues[sliderId] = value;
});

eventBus.on('skin:loaded', (skinMeta) => {
  console.log(`Skin '${skinMeta.name}' loaded`);
});
```

### Panel State Object

```javascript
// src/managers/panelManager.js

const panelState = {
  panels: new Map(), // Map<panelId, PanelData>
  activePanel: null,
  nextPanelId: 1,
};

class PanelData {
  constructor(id, code = '') {
    this.id = id;
    this.code = code;
    this.playing = false;
    this.sliders = [];
    this.position = { x: 100, y: 100 };
    this.size = { width: 400, height: 300 };
    this.zIndex = 1;
  }

  serialize() {
    return {
      id: this.id,
      code: this.code,
      position: this.position,
      size: this.size,
    };
  }
}
```

### Settings State (localStorage)

```javascript
// src/managers/settingsManager.js

const defaultSettings = {
  appearance: {
    colorScheme: 'dark',
    fontSize: 14,
  },
  skin: {
    enabled: true,
    currentSkin: 'default',
    allowUntrustedSkins: false,
  },
  audio: {
    sampleLibrary: 'dirt-samples',
  },
};

export function saveSettings(settings) {
  localStorage.setItem('r0astr-settings', JSON.stringify(settings));
  eventBus.emit('settings:saved', settings);
}

export function loadSettings() {
  const saved = localStorage.getItem('r0astr-settings');
  return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
}
```

---

## 9. API Integration (WebSocket)

### Remote Control API

```javascript
// src/managers/websocketManager.js

class WebSocketManager {
  constructor() {
    this.clients = new Set();
    this.ws = null;
  }

  connect(url = 'ws://localhost:8080') {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }

  handleMessage({ type, payload }) {
    switch (type) {
      case 'PANEL_PLAY':
        eventBus.emit('panel:play', payload.panelId);
        break;
      case 'PANEL_PAUSE':
        eventBus.emit('panel:pause', payload.panelId);
        break;
      case 'PANEL_UPDATE_CODE':
        eventBus.emit('panel:updateCode', payload);
        break;
      case 'STOP_ALL':
        eventBus.emit('stopAll');
        break;
    }
  }

  broadcast(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}
```

### API Message Types

| Type | Direction | Payload | Purpose |
|------|-----------|---------|---------|
| `PANEL_CREATED` | Main → Remote | `{ id, code, position }` | Notify remote of new panel |
| `PANEL_PLAY` | Remote → Main | `{ panelId }` | Trigger panel playback |
| `PANEL_PAUSE` | Remote → Main | `{ panelId }` | Pause panel |
| `PANEL_UPDATE_CODE` | Remote → Main | `{ panelId, code }` | Update pattern code |
| `PANEL_DELETED` | Main → Remote | `{ panelId }` | Notify panel deletion |
| `STOP_ALL` | Remote → Main | `{}` | Stop all playback |
| `STATE_SYNC` | Main → Remote | `{ panels: [...] }` | Full state synchronization |

---

## 10. Styling Guidelines

### CSS Variable System

```css
/* static/css/base.css - Base Theme */

:root {
  /* Colors */
  --pale-white: #d1d8e0;
  --dark-green: #0e4a2b;
  --burnt-red: #8b2e2e;
  --darkness: #1a1a1a;

  /* Dimensions */
  --hole-size: 16px;
  --corner-ring-size: 40px;
  --radius-sm: 2px;
  --radius-md: 4px;

  /* Typography */
  --font-family: 'marvelregular', sans-serif;
  --font-size-base: 14px;
  --font-size-lg: 18px;

  /* Spacing */
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  /* Z-index layers */
  --z-panel: 10;
  --z-modal: 100;
  --z-splash: 1000;
}

/* Dark theme (default) */
body {
  background-color: var(--darkness);
  color: var(--pale-white);
}

/* Light theme override */
body[data-theme="light"] {
  --pale-white: #2c2c2c;
  --darkness: #f5f5f5;
  --dark-green: #2ecc71;
}
```

### Skin CSS Override Pattern

```css
/* static/skins/retro-winamp/theme.css */

:root {
  /* Override base variables */
  --pale-white: #00ff00;  /* Green LED text */
  --dark-green: #003300;
  --hole-size: 20px;

  /* Add skin-specific variables */
  --winamp-metal: linear-gradient(135deg, #444 0%, #222 100%);
  --led-glow: 0 0 10px rgba(0, 255, 0, 0.8);
}

/* Custom panel styling */
.panel {
  background: var(--winamp-metal);
  border: 2px solid #555;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.1),
    0 5px 15px rgba(0,0,0,0.5);
}

.panel-title {
  color: var(--pale-white);
  text-shadow: var(--led-glow);
  font-family: 'Courier New', monospace;
}
```

---

## 11. Testing Requirements

### Testing Strategy (Future Implementation)

```javascript
// tests/unit/skinManager.test.js

import { SkinManager } from '../src/managers/skinManager.js';

describe('SkinManager', () => {
  let skinManager;

  beforeEach(() => {
    skinManager = new SkinManager();
  });

  test('loads default skin successfully', async () => {
    const skin = await skinManager.loadSkin('default');
    expect(skin.name).toBe('Default');
  });

  test('sanitizes malicious CSS URLs', () => {
    const maliciousCSS = `
      background: url('https://evil.com/tracker.gif');
    `;
    const sanitized = skinManager.sanitizeCSS(maliciousCSS);
    expect(sanitized).not.toContain('evil.com');
  });

  test('escapes XSS in template data', () => {
    const data = { title: '<script>alert(1)</script>' };
    const result = skinManager.renderTemplate('panel', data);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  test('rolls back to default on skin load failure', async () => {
    await skinManager.loadSkin('default');
    await expect(skinManager.loadSkin('broken-skin')).rejects.toThrow();
    expect(skinManager.currentSkin.name).toBe('Default');
  });
});
```

### Security Testing Checklist

```markdown
## Pre-Launch Security Tests

- [ ] XSS attack via template injection
- [ ] CSS injection with external trackers
- [ ] postMessage spoofing from malicious iframe
- [ ] Large skin CSS (5MB+) performance impact
- [ ] Broken skin rollback mechanism
- [ ] Emergency reset keyboard shortcut (Ctrl+Shift+R)
- [ ] Skin format migration (v1.0 → v1.1)
- [ ] Privacy: External resource blocking in CSS
- [ ] Rate limiting on postMessage API
- [ ] Sandboxed iframe escape attempts
```

---

## 12. Environment Configuration

### Environment Variables

```bash
# .env.example

# Development
VITE_DEV_PORT=5173
VITE_WS_URL=ws://localhost:8080

# Production
VITE_PROD_URL=https://r0astr.org
VITE_WS_URL=wss://r0astr.org/ws

# Skin System
VITE_SKIN_REGISTRY_URL=https://r0astr.org/api/skins
VITE_ALLOW_UNTRUSTED_SKINS=false

# Audio
VITE_SAMPLE_LIBRARY_URL=https://raw.githubusercontent.com/tidalcycles/dirt-samples/master
```

### Vite Configuration

```javascript
// vite.config.mjs

import { defineConfig } from 'vite';
import bundleAudioworklet from 'vite-plugin-bundle-audioworklet';

export default defineConfig({
  plugins: [bundleAudioworklet()],

  server: {
    port: process.env.VITE_DEV_PORT || 5173,
    host: '0.0.0.0', // Allow network access (iPad remote)
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },

  define: {
    'import.meta.env.SKIN_REGISTRY_URL': JSON.stringify(
      process.env.VITE_SKIN_REGISTRY_URL
    ),
  },
});
```

---

## 13. Developer Standards

### Critical Coding Rules

1. **Always escape user input in templates**
   ```javascript
   // ❌ WRONG
   element.innerHTML = userInput;

   // ✅ CORRECT
   element.textContent = userInput;
   ```

2. **Validate postMessage origins**
   ```javascript
   // ❌ WRONG
   window.postMessage(data, '*');

   // ✅ CORRECT
   window.addEventListener('message', (e) => {
     if (e.origin !== expectedOrigin) return;
     // ...
   });
   ```

3. **Never use eval() on user code**
   ```javascript
   // ❌ WRONG (except in sandboxed iframe)
   eval(userCode);

   // ✅ CORRECT
   evaluateInSandbox(userCode);
   ```

4. **Sanitize CSS from external sources**
   ```javascript
   // ❌ WRONG
   styleElement.textContent = externalCSS;

   // ✅ CORRECT
   styleElement.textContent = sanitizeCSS(externalCSS);
   ```

5. **Use eventBus for cross-component communication**
   ```javascript
   // ❌ WRONG (tight coupling)
   panelManager.onPanelCreated = () => { websocketManager.sync(); };

   // ✅ CORRECT (decoupled)
   eventBus.on('panel:created', () => websocketManager.sync());
   ```

---

## 14. Quick Reference

### Common Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:5173)
npm run server                 # Start WebSocket server
npm run electron:dev           # Start Electron app

# Production
npm run build                  # Build for production
npm run preview                # Preview production build

# Electron
npm run electron:build         # Build desktop app (all platforms)
npm run electron:build:mac     # Build for macOS
```

### Key Import Patterns

```javascript
// Strudel imports
import { repl, evalScope } from '@strudel/core';
import { transpiler } from '@strudel/transpiler';
import { getAudioContext, webaudioOutput } from '@strudel/webaudio';
import { sliderWithID, sliderValues } from '@strudel/codemirror';

// Internal imports
import { eventBus } from './utils/eventBus.js';
import { panelManager } from './managers/panelManager.js';
import { skinManager } from './managers/skinManager.js';
```

### File Naming Conventions

- Components: `panelManager.js`, `skinManager.js`
- Utilities: `eventBus.js`, `domHelpers.js`
- Styles: `style.css`, `panel-styles.css`
- Tests: `skinManager.test.js`, `panel-lifecycle.test.js`

### Project-Specific Patterns

```javascript
// Creating panels
const panel = panelManager.createPanel('unique-id', 'note("c3")');
document.querySelector('.screen').appendChild(panel);

// Event handling
eventBus.on('panel:created', (panel) => {
  console.log('Panel created:', panel.id);
});

// Skin loading
await skinManager.loadSkin('retro-winamp');

// Settings management
const settings = loadSettings();
saveSettings({ ...settings, skin: { currentSkin: 'cyberpunk' } });
```

---

## 15. Implementation Roadmap

### Phase 1: CSS-Only Skins (Immediate)

**Scope:**
- ✅ Extract CSS to external file with CSS variables
- ✅ Create `skinManager.js` module
- ✅ Implement CSS variable override system
- ✅ Add skin selector to Settings UI
- ✅ Create default skin bundle
- ✅ HTML template support (with strict escaping)
- ✅ Emergency rollback mechanism (Ctrl+Shift+R)

**Security:**
- ✅ CSS URL sanitization
- ✅ HTML escaping in templates
- ✅ Schema versioning
- ✅ Automatic rollback on failure

**Deliverables:**
- `bmad/architecture/frontend-architecture.md` (this document)
- `src/managers/skinManager.js`
- `src/templates/defaultPanel.js`
- `static/skins/default/` directory
- Updated settings UI

### Phase 2: Sandboxed JavaScript (Future)

**Scope:**
- Implement iframe sandbox for JS execution
- Create postMessage API for skin scripts
- Add rate limiting and origin validation
- Develop trusted skin registry backend

**Security:**
- Full sandbox isolation
- CSP headers
- Message validation
- Rate limiting

### Phase 3: Community Features (Future)

**Scope:**
- Skin marketplace/gallery
- User skin uploads
- Code review process
- GPG signature verification

---

## 16. Architectural Decisions

### Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Vanilla JavaScript over React | Minimal overhead, full control, no framework lock-in | React (too heavy), Preact (still overkill) |
| CSS Variables for theming | Native browser support, no build step, runtime switching | CSS-in-JS (requires framework), Tailwind (not dynamic) |
| Template Literals over Handlebars | Zero dependencies, sufficient for current needs | Handlebars (adds 50KB), Lit-HTML (future consideration) |
| iframe sandbox for JS skins | Best isolation, prevents XSS/data theft | Web Workers (no DOM access), CSP only (insufficient) |
| Event Bus over reactive state | Simple, debuggable, no framework required | Proxy reactivity (more complex), Redux (overkill) |
| @strudel/codemirror v1.2.6 | Required for Strudel integration, proven stable | CodeMirror 6 (breaking change), Monaco (too heavy) |

---

## Appendix A: Glossary

- **Skin:** A package of CSS, HTML templates, and optionally JavaScript that customizes the visual appearance of r0astr
- **Panel:** An independent musical instrument interface with code editor and controls
- **Strudel:** JavaScript port of TidalCycles live coding language
- **Transpiler:** Converts Strudel pattern code to JavaScript (handles `slider()` → `sliderWithID()`)
- **Widget:** Interactive UI element extracted from pattern code (e.g., slider)
- **Master Panel:** Global control panel with sliders affecting all instrument panels
- **Remote Control:** iPad/phone interface for triggering panels via WebSocket

---

## Appendix B: References

### Internal Documentation

- [CLAUDE.md](../../CLAUDE.md) - AI agent instructions
- [bmad/architecture/tech-stack.md](./tech-stack.md) - Technology stack details
- [bmad/architecture/skin-system.md](./skin-system.md) - Original skin system proposal
- [bmad/architecture/strudel-integration-gotchas.md](./strudel-integration-gotchas.md) - Critical Strudel patterns

### External References

- [Strudel Documentation](https://strudel.cc/learn/)
- [Strudel Pattern Reference](https://strudel.cc/learn/functions/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Vite Documentation](https://vitejs.dev/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [iframe sandbox Attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox)

---

**Maintained By:** Winston (Architect)
**Review Cycle:** Update with implementation progress
**Next Review:** After Phase 1 implementation
