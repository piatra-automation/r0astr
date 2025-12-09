# r0astr Architecture Documentation

**Version:** v4
**Last Updated:** 2025-11-16
**Target Audience:** Development Agents

## Overview

This directory contains architectural documentation for r0astr, a vanilla JavaScript live coding interface built on Strudel. The architecture follows a modular, event-driven pattern with Web Audio integration.

## Quick Links

### Core Architecture
- **[Tech Stack](tech-stack.md)** - Technologies, libraries, and versions
- **[Source Tree](source-tree.md)** - File organization and module structure
- **[Coding Standards](coding-standards.md)** - Code style, patterns, and conventions

### Specialized Documentation
- **[Strudel Integration Gotchas](strudel-integration-gotchas.md)** - ⚠️ Critical lessons learned (READ FIRST)
- **[Brownfield Architecture](../brownfield-architecture.md)** - Comprehensive v0.1.0 analysis
- **[Remote Control](../remote-control.md)** - WebSocket remote control system (v0.2.0)

## Architecture Principles

### 1. Vanilla JavaScript
- No framework dependencies (React, Vue, etc.)
- Direct DOM manipulation for UI updates
- ES modules for code organization
- Modern browser APIs (Web Audio, WebSocket)

### 2. Strudel Integration
- Wrapper around published Strudel npm packages (v1.2.x)
- Shared audio context and scheduler across all panels
- Independent pattern control via `.p(panelId)` method
- Reactive sliders using `sliderWithID()` pattern

### 3. Event-Driven State Management
- Global `window.sliderValues` for reactive slider state
- Panel state tracked in JavaScript objects
- Event listeners for user interactions
- WebSocket events for remote control

### 4. Modular Design (Roadmap)
- Panel Manager: CRUD operations for panels
- Settings Manager: JSON-based configuration persistence
- Theme Manager: CSS variable-based theming (future)
- API Server: HTTP/WebSocket endpoints (partial in v0.2.0)

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                    │
│  ├─ index.html (Static structure + inline CSS)              │
│  ├─ Panel Components (dynamic, future refactor)             │
│  ├─ Settings Modal                                           │
│  └─ Splash Screen                                            │
├─────────────────────────────────────────────────────────────┤
│  Application Layer                                           │
│  ├─ src/main.js (Entry point, initialization)               │
│  ├─ panelManager.js (CRUD, state management) [future]       │
│  ├─ settingsManager.js (localStorage, JSON) [future]        │
│  └─ themeManager.js (CSS variables) [future]                │
├─────────────────────────────────────────────────────────────┤
│  Strudel Integration Layer                                   │
│  ├─ repl (Pattern evaluation engine)                        │
│  ├─ scheduler (Timing and synchronization)                  │
│  ├─ transpiler (slider() → sliderWithID())                  │
│  └─ evalScope (Pattern language functions)                  │
├─────────────────────────────────────────────────────────────┤
│  Audio Layer                                                 │
│  ├─ AudioContext (Shared Web Audio context)                 │
│  ├─ webaudioOutput (Strudel audio integration)              │
│  ├─ registerSynthSounds (Synth registration)                │
│  └─ samples (dirt-samples, SoundFonts)                      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              WebSocket Server (localhost:6010)               │
│  ├─ Remote control endpoints (v0.2.0)                        │
│  ├─ Panel control messages                                   │
│  └─ State synchronization                                    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Panel Play/Pause Flow
```
User clicks Play
  → toggleCard(cardId)
    → Get pattern code from textarea
    → transpiler(code) → { output, widgets }
    → renderSliders(cardId, widgets)
    → evaluate(`${output}.p('${cardId}')`)
      → Strudel scheduler starts pattern
      → Web Audio outputs sound
  → Update button UI (Play → Pause)
```

### Slider Interaction Flow
```
User moves slider
  → HTML input onchange event
    → sliderValues[sliderId] = newValue
      → Pattern ref() reads sliderValues (reactive)
        → Pattern re-evaluates with new value
          → Audio parameter updates in real-time
```

### WebSocket Remote Control Flow (v0.2.0)
```
External client sends message
  → WebSocket server receives
    → Parse command (PLAY, PAUSE, SET, etc.)
      → Call corresponding panel function
        → Update UI and audio state
      → Send confirmation back to client
```

## Critical Gotchas

⚠️ **MUST READ: [strudel-integration-gotchas.md](strudel-integration-gotchas.md)**

Before working with Strudel integration, review documented issues:
- Transpiler blocking in master panel context
- CPS vs CPM confusion (use `scheduler.setCps()`)
- Master panel pattern (regex parsing, not transpiler)
- Slider reactivity pattern (`ref(() => sliderValues[id])`)
- TEMPO special handling (CPS conversion required)

## Development Workflow

### Local Development
```bash
npm install      # Install dependencies
npm run dev      # Start Vite dev server (localhost:5173)
```

### Production Build
```bash
npm run build    # Build to dist/
npm run preview  # Test production build
```

### Testing Strategy
- **Manual Testing**: Primary QA method (browser-based)
- **Future**: Unit tests for managers, integration tests for API

## Key Files Reference

| File | Purpose | Lines of Code |
|------|---------|---------------|
| `index.html` | Static UI structure, inline CSS | ~210 |
| `src/main.js` | Application entry point, Strudel init | ~300 |
| `vite.config.mjs` | Vite configuration, AudioWorklet plugin | ~10 |
| `package.json` | Dependencies, scripts | ~40 |

## Architecture Evolution

### v0.1.0 (Initial)
- Static 4-panel layout
- Basic play/pause controls
- Sample pre-loading

### v0.2.0 (Current)
- WebSocket remote control system
- TEMPO slider with CPS conversion
- Master panel with global sliders

### Future Roadmap
- Dynamic panel management (Epic 1)
- Draggable/resizable panels (Epic 2)
- Settings persistence (Epic 4)
- Staleness detection (Epic 6)
- Full REST API (Epic 5)

## Related Documentation

- [PRD Index](../prd/index.md) - Product requirements and epic roadmap
- [CLAUDE.md](../../CLAUDE.md) - AI agent instructions
- [README.md](../../README.md) - User-facing documentation
- [CHANGELOG.md](../../CHANGELOG.md) - Version history

---

**Maintained By:** Development Team
**Review Cycle:** Update with each major architecture change
