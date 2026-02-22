# Tech Stack

**Version:** v4
**Last Updated:** 2025-11-16

## Overview

r0astr uses a minimal, modern vanilla JavaScript stack with Web Audio APIs and Strudel npm packages. No frameworks required - keep it lightweight and performant.

## Core Technologies

### Runtime Environment
| Technology | Version | Purpose |
|------------|---------|---------|
| **Browser** | Modern (ES2020+) | Chrome, Firefox, Safari with Web Audio API support |
| **Web Audio API** | Native | Low-latency audio synthesis and processing |
| **WebSocket API** | Native | Real-time remote control (v0.2.0) |
| **LocalStorage API** | Native | Settings and panel state persistence (future) |

### Build Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | 6.0.11 | Development server with HMR, production bundler |
| **vite-plugin-bundle-audioworklet** | 0.1.1 | Bundles AudioWorklet processors for Web Audio |

### Language
| Technology | Version | Purpose |
|------------|---------|---------|
| **JavaScript** | ES2020+ | Application code (no TypeScript) |
| **CSS** | CSS3 | Styling (inline in index.html, future: external with variables) |
| **HTML** | HTML5 | Static structure (index.html) |

## Strudel Package Dependencies

All Strudel functionality imported from published npm packages (stable fork, locked to v1.2.x):

| Package | Version | Purpose | Key Imports |
|---------|---------|---------|-------------|
| **@strudel/core** | 1.2.5 | Pattern engine, REPL, scheduler | `repl`, `evalScope`, `ref` |
| **@strudel/mini** | 1.2.5 | Mini notation parser | Loaded via `evalScope()` |
| **@strudel/transpiler** | 1.2.5 | Code transpilation, widget extraction | `transpiler` |
| **@strudel/webaudio** | 1.2.6 | Web Audio integration, synth registration | `getAudioContext`, `webaudioOutput`, `initAudioOnFirstClick`, `registerSynthSounds` |
| **@strudel/tonal** | 1.2.5 | Music theory (scales, chords) | Loaded via `evalScope()` |
| **@strudel/soundfonts** | 1.2.6 | SoundFont loading, sample support | `registerSoundfonts` |
| **@strudel/codemirror** | 1.2.6 | Slider widgets, reactive refs | `sliderWithID`, `sliderValues` |

### Strudel Version Policy
- **Locked to v1.2.x** - Stable fork, NOT tracking upstream
- **Update only for critical bugs** - Avoid breaking changes
- **Test thoroughly** - OSC, MIDI, sample library compatibility

## External Integrations

### Current (v0.2.0)
| Integration | Protocol | Purpose |
|-------------|----------|---------|
| **dirt-samples** | HTTP (GitHub CDN) | TidalCycles sample library (pre-loaded) |
| **WebSocket Server** | WebSocket | Remote control for live performance |

### Planned (Future)
| Integration | Protocol | Purpose |
|-------------|----------|---------|
| **Snippet Library** | HTTP/File | JSON-based code snippets (local or GitHub) |
| **REST API** | HTTP | Panel control for MCP integration |
| **Theme Skins** | File | WinAmp-style theme packs (CSS + assets) |

## Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **vite** | 6.0.11 | Dev server and bundler |
| **vite-plugin-bundle-audioworklet** | 0.1.1 | AudioWorklet bundling |

### Development Tools (Recommended)
- **ESLint** - Code linting (not yet configured)
- **Prettier** - Code formatting (not yet configured)
- **Chrome DevTools** - Debugging, performance profiling

## Browser Compatibility

### Minimum Requirements
- **Chrome/Edge**: Version 91+ (July 2021)
- **Firefox**: Version 89+ (June 2021)
- **Safari**: Version 14.1+ (April 2021)

### Required Browser APIs
- ✅ Web Audio API (AudioContext, AudioWorklet)
- ✅ ES Modules (import/export)
- ✅ async/await
- ✅ Promises
- ✅ LocalStorage (for settings persistence)
- ✅ WebSocket (for remote control)

### Known Limitations
- **Safari Autoplay Policy**: Strict - requires explicit user interaction before audio plays
- **Firefox AudioWorklet**: Slightly higher latency than Chrome
- **Mobile Browsers**: Limited testing - desktop-first design

## Audio Capabilities

### Strudel Built-in Support
| Feature | Status | Notes |
|---------|--------|-------|
| **Web Audio Output** | ✅ Implemented | Default output via `webaudioOutput` |
| **OSC Output** | ⚠️ Untested | Strudel supports `.osc()`, requires backend server |
| **MIDI Output** | ⚠️ Untested | Strudel supports `.midi()`, uses Web MIDI API |
| **Sample Libraries** | ✅ Implemented | dirt-samples pre-loaded, SoundFonts supported |

### Sample Sources
- **dirt-samples**: `samples('github:tidalcycles/dirt-samples')` - Pre-loaded on init
- **Custom Samples**: `samples('https://example.com/samples.json')` - User-provided
- **SoundFonts**: `soundfont('piano')` - Strudel built-in

## File Structure

```
r0astr/
├── index.html              # UI structure (210 lines)
├── src/
│   └── main.js             # Application logic (~300 lines)
├── package.json            # Dependencies
├── package-lock.json       # Locked versions
├── vite.config.mjs         # Vite configuration
├── docs/                   # Documentation
│   ├── prd/                # Product requirements (epics)
│   ├── architecture/       # Technical docs
│   └── stories/            # User stories (future)
├── .claude/                # Claude Code settings
├── .vscode/                # VSCode settings
├── LICENSE                 # AGPL-3.0-or-later
├── CHANGELOG.md            # Version history
├── VERSION                 # Current version (0.2.0)
├── README.md               # User documentation
└── CLAUDE.md               # AI agent instructions
```

## Security Considerations

### Current
- **No Authentication** - Local-only application
- **No Server-Side Logic** - Pure client-side (except WebSocket server)
- **CORS** - WebSocket server requires CORS headers for external clients

### Future (with REST API)
- **API Key Authentication** - Simple `X-API-Key` header
- **Input Validation** - Sanitize pattern code to prevent XSS
- **Rate Limiting** - Prevent API abuse (future consideration)

## Performance Characteristics

### Metrics (v0.2.0)
- **Initial Load**: ~2-3 seconds (Vite dev mode)
- **Sample Loading**: 3 seconds (dirt-samples download)
- **Pattern Evaluation**: <10ms (Strudel transpiler + evaluation)
- **Audio Latency**: ~10-20ms (Web Audio baseline)
- **Memory Usage**: ~50-100MB (browser + samples)

### Optimization Strategies
- **Sample Pre-loading**: Start download on page load
- **Lazy Loading**: Load SoundFonts on-demand
- **Code Splitting**: Vite automatically chunks large dependencies
- **AudioWorklet**: Offloads audio processing to separate thread

## Deployment

### Static Hosting
- **Compatible Platforms**: Netlify, Vercel, GitHub Pages, Cloudflare Pages
- **Requirements**: HTTPS (for Web Audio autoplay policies)
- **Build Output**: `dist/` directory (~500KB gzipped)

### WebSocket Server (v0.2.0)
- **Hosted Separately**: Not part of static build
- **Local Development**: `node server.js` (or integrated in Vite)
- **Production**: Reverse proxy (nginx) or serverless WebSocket (AWS API Gateway)

## Version Management

### Semantic Versioning
- **MAJOR**: Breaking changes to API or architecture
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes, minor improvements

### Current Version: v0.2.0
- Added WebSocket remote control system
- TEMPO slider with CPS conversion
- Master panel with global sliders

### Upgrade Path
- Update `VERSION` file
- Update `CHANGELOG.md`
- Commit and tag: `git tag v0.3.0`

## Future Technology Considerations

### Potential Additions
- **TypeScript** - Type safety (significant refactor required)
- **Web Components** - Encapsulated panel components
- **Service Worker** - Offline support, sample caching
- **IndexedDB** - Large panel state storage (alternative to localStorage)

### Not Planned
- ❌ React/Vue/Svelte - Keep vanilla JavaScript
- ❌ Backend Framework - Static-first approach
- ❌ Database - localStorage sufficient for settings
- ❌ WebAssembly - Strudel handles audio processing

---

**Maintained By:** Development Team
**Review Cycle:** Update with dependency changes or major feature additions
