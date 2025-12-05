# r0astr Electron Distribution & Plugin System Roadmap

## Overview

This document outlines the phased development of r0astr's desktop distribution, theming system, and plugin architecture. Each phase builds upon the previous, creating a robust and extensible platform.

## Phase Summary

| Phase | Epic | Description | Complexity | Dependencies |
|-------|------|-------------|------------|--------------|
| 0 | [App Icons](./EPIC-00-APP-ICONS.md) | Multi-platform app icons | Low | None |
| 1 | [Skin System](./EPIC-01-SKIN-SYSTEM.md) | Winamp-style CSS theming | Medium | Phase 0 |
| 2 | [Plugin Loader](./EPIC-02-PLUGIN-LOADER.md) | Core plugin infrastructure | High | Phase 1 |
| 3 | [Plugin API](./EPIC-03-PLUGIN-API.md) | Panels, audio, UI hooks | High | Phase 2 |
| 4 | [Plugin Settings](./EPIC-04-PLUGIN-SETTINGS.md) | Configuration UI | Medium | Phase 3 |
| 5 | [Network Plugins](./EPIC-05-NETWORK-PLUGINS.md) | MQTT, OSC, WebSocket | High | Phase 4 |
| 6 | [Plugin Repository](./EPIC-06-PLUGIN-REPOSITORY.md) | Discovery & distribution | High | Phase 5 |

## Architecture Vision

```
┌─────────────────────────────────────────────────────────────────┐
│                        r0astr Core                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Strudel   │  │   Panel     │  │      Audio Engine       │  │
│  │   Engine    │  │   Manager   │  │   (Web Audio + Superdough)│ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      Plugin Host Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Loader    │  │  Sandbox    │  │    Permission System    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        Plugin API                               │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌─────────┐ │
│  │Panels │ │ Audio │ │  UI   │ │Storage│ │Network│ │ Events  │ │
│  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                         Plugins                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐ │
│  │  Skins  │  │ Viz/FX  │  │  MQTT   │  │  Custom Extensions  │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Plugin Types

| Type | Purpose | Permissions | Example |
|------|---------|-------------|---------|
| `skin` | Visual themes | CSS injection | Winamp Classic |
| `extension` | Feature additions | Varies | MQTT Bridge |
| `visualizer` | Audio-reactive visuals | Audio read | Spectrum Analyzer |
| `instrument` | Custom synths/samplers | Audio write | FM Synth |
| `integration` | External service bridges | Network | Ableton Link |

## Directory Structure

```
~/.r0astr/                    # User data directory
├── config.json                   # Global settings
├── plugins/
│   ├── installed.json            # Installed plugin registry
│   ├── skins/
│   │   └── {skin-name}/
│   │       ├── manifest.json
│   │       ├── style.css
│   │       └── assets/
│   ├── extensions/
│   │   └── {extension-name}/
│   │       ├── manifest.json
│   │       ├── index.js
│   │       └── settings.html
│   └── visualizers/
│       └── {visualizer-name}/
│           ├── manifest.json
│           └── index.js
├── presets/                      # User pattern presets
└── logs/                         # Application logs
```

## Milestone Targets

| Milestone | Target | Deliverables |
|-----------|--------|--------------|
| **M1: Distributable** | Phase 0 complete | App with icons, ready for GitHub Release |
| **M2: Themeable** | Phase 1 complete | 3 bundled skins, skin selector UI |
| **M3: Extensible** | Phase 3 complete | Working plugin API, 2 example plugins |
| **M4: Connected** | Phase 5 complete | MQTT + OSC support via plugins |
| **M5: Ecosystem** | Phase 6 complete | Public plugin repository |

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Plugin load time | < 100ms | Performance profiling |
| Memory overhead per plugin | < 10MB | Heap snapshots |
| Skin switch time | < 50ms | User-perceived latency |
| API coverage | 100% documented | JSDoc completeness |
| Plugin isolation | Zero cross-contamination | Security audit |

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Plugin crashes app | High | Medium | Sandbox + error boundaries |
| Security vulnerabilities | High | Low | Permission system, code review |
| API breaking changes | Medium | Medium | Semantic versioning, deprecation policy |
| Performance degradation | Medium | Medium | Plugin budgets, lazy loading |
| Scope creep | Medium | High | Strict phase boundaries |

## Document Index

- [EPIC-00-APP-ICONS.md](./EPIC-00-APP-ICONS.md) - Application icon assets
- [EPIC-01-SKIN-SYSTEM.md](./EPIC-01-SKIN-SYSTEM.md) - CSS theming infrastructure
- [EPIC-02-PLUGIN-LOADER.md](./EPIC-02-PLUGIN-LOADER.md) - Plugin discovery and loading
- [EPIC-03-PLUGIN-API.md](./EPIC-03-PLUGIN-API.md) - Core plugin API surface
- [EPIC-04-PLUGIN-SETTINGS.md](./EPIC-04-PLUGIN-SETTINGS.md) - Plugin configuration UI
- [EPIC-05-NETWORK-PLUGINS.md](./EPIC-05-NETWORK-PLUGINS.md) - Network integration plugins
- [EPIC-06-PLUGIN-REPOSITORY.md](./EPIC-06-PLUGIN-REPOSITORY.md) - Plugin marketplace

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-XX-XX | Claude | Initial roadmap |
