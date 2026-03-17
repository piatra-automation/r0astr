# Changelog

All notable changes to `r0astr`.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

*For the full detailed changelog, see [CHANGELOG.md](https://github.com/piatra-automation/r0astr/blob/main/CHANGELOG.md) in the repository.*

---

## [0.19.2] - 2026-03-17

### Fixed
- **Arrow keys now work in code editors** — accessibility panel-tree keyboard navigation was intercepting arrow keys bubbling from CodeMirror editors, preventing cursor movement while coding
- **Server config not loading/saving** — `serverConfig.mjs` path resolution broken when Vite esbuild-bundles the module; switched to `process.cwd()`
- **Electron banner shows LAN IP** — health endpoint now returns `lanIP` and `port` in Electron production builds

### Changed
- **Docs updated for auth & CORS** — API reference, remote control, troubleshooting, and FAQ now document API key authentication, CORS configuration, and `server.config.json` setup

## [0.19.1] - 2026-03-10

### Changed
- **Banner shows LAN IP** — header displays the host machine's local network IP and port instead of `localhost`

## [0.19.0] - 2026-03-10

### Added
- **Server settings tab** — new Server section in settings dialog for configuring CORS allowed origins and API key authentication
- **API key authentication** — optional API key for REST API and WebSocket connections; localhost always exempt; remote clients prompted to enter key
- **Server-side config** — `server.config.json` for persisting server settings (CORS, auth) outside of browser localStorage
- **Remote auth flow** — remote panel detects auth requirement, prompts for API key, handles rejection gracefully

## [0.18.x] - 2026-03-10

### Changed
- **Remote panel cards** — full-area touch targets with labelled panels; multitouch support for simultaneous button presses
- **Remote mobile-first restyle** — fluid grid, sticky controls, landscape mode, safe-area support
- **Skin remote.css updates** — all bundled skins updated for new remote layout

### Fixed
- **Skin switch crash** — `handleMasterChange` hoisted to module scope for reliable hot-reload

## [0.17.x] - 2026-03-04 — 2026-03-09

### Added
- **Settings panel redesign** — sidebar-navigated modal with per-section dirty state and Reset/Apply controls
- **Local snippet file loading** — Electron can load JSON snippets from filesystem with security hardening

### Fixed
- **Port conflict auto-detection** — dev server and Electron try next port on EADDRINUSE
- **Starter layout for first-time users** — pre-loaded panels ready to play
- **Panel header toggle** — collapse/expand works reliably in all skins

## [0.16.0] - 2026-03-03

### Added
- **Draggable column resizers** — resize panel regions in split-column skin; widths persist to localStorage
- **Collapse-on-blur in layout mode** — unfocused panels collapse to headers

## [0.15.x] - 2026-02-27

### Added
- **Layout Template System** — skins define page-level layouts distributing panel parts across regions
- **Panel DOM Registry** — Map-based lookup decouples panel resolution from DOM tree
- **Split-column skin** — two-column layout with headers/controls left, editors right

## [0.14.x] - 2026-02-24 — 2026-02-26

### Added
- **Beat-locking** — defer panel evaluation to next beat or cycle boundary for tighter musical timing
- **Play All button** — activate all panels; Shift+click re-evaluates all
- **Tactical console skin** — sci-fi aesthetic with custom Orbitron font, CRT effects

### Fixed
- **Memory leaks** — ref-counted cleanup for long sessions
- **Beat-lock timing** — lookahead prevents boundary edge case

## [0.13.x] — 0.12.x - 2026-02-23 — 2026-02-24

### Added
- **Epic 2: Forest-Green Glassmorphism UI** — oklch colors, translucent surfaces, CodeMirror theme, reduced motion and high contrast support

### Fixed
- **Ghost pattern bug** — duplicate `$:` labels get unique sub-IDs
- **Duplicate editors on skin switch** — old views destroyed before recreation

## [0.11.0] - 2026-02-22

### Added
- **Epic 1: CI/CD Pipeline** — reusable workflows for version detection, Electron builds (macOS/Windows/Linux), GitHub Releases, and Pages deployment
- **Plugin system** — plugin manager, sandbox, and validator
- **Accessibility manager** — screen reader and keyboard navigation support

## [0.10.x] - 2025-12-30 — 2026-02-21

### Added
- **Global variables & functions in Master Panel** — define variables, functions, and cross-panel pattern references
- **Visualization support** — `pianoroll()`, `scope()`, `spectrum()` methods
- **Audio caching** — IndexedDB-based persistent cache for samples
- **Dynamic downloads page** — auto-detects OS, fetches from GitHub API

## [0.9.0] - 2025-12-21

### Added
- **Aftermarket Skin System** — ZIP-based skin import/export, IndexedDB storage, validation, bundled default and glass skins

## [0.8.0] - 2025-12-12

### Added
- **Semantic Release CI/CD** — `^^^ vX.Y.Z` commit pattern triggers automated releases
- **Electron title bar overlay** — custom title bar matching app theme
- **Save/Load layout system** — JSON export/import of panel arrangements

---

*See the [full CHANGELOG.md](https://github.com/piatra-automation/r0astr/blob/main/CHANGELOG.md) for complete details on all releases back to v0.1.0.*
