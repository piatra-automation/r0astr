# Changelog

All notable changes to r0astr will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.18.0] - 2026-03-09

### Added
- **Local snippet file loading (Electron)** — snippet manager can now load JSON snippet files from the local filesystem (e.g., `~/snippets.json`) via a new `read-local-file` IPC channel; browser builds show a descriptive error when a local path is used
- **File read security hardening** — IPC handler validates paths against directory traversal, null bytes, protocol prefixes, non-JSON extensions, and enforces a 5MB size limit

## [0.17.7] - 2026-03-09

### Changed
- **Settings modal reorganized** — restructured from 6 sections to 7 clearer categories: Appearance, Session, Playback, Highlighting, Add-ons, Accessibility, Projection

## [0.17.6] - 2026-03-09

### Fixed
- **Panel header toggle with collapseOnBlur** — click handler no longer conflicts with native details toggle; accordion mode works correctly
- **Favicon added to demo app** — uses same icon as docs site

## [0.17.5] - 2026-03-09

### Fixed
- **Port conflict no longer crashes the app** — dev server and Electron production server auto-detect the next available port (5173 → 5174 → …) instead of failing with EADDRINUSE
- **Banner shows active port** — "ORCHESTRATOR" text replaced with `localhost:<port>` so you always know which port the app is running on

## [0.17.4] - 2026-03-09

### Fixed
- **Starter layout now loads for first-time users** — URL resolved to wrong directory; new users see pre-loaded Drums, Bass, and Melody panels ready to play
- **Default skin panel opacity increased** — panels more opaque against background image; all interactive elements (buttons, badges, sliders) at full opacity
- **Resolved all CodeQL security alerts** — XSS, prototype pollution, URL sanitization, rate limiting, workflow permissions (11 alerts)
- **Panels visible after skin switch** — render expanded and restore visual state during hot-reload
- **Default skin panel header toggle** — clicking header now properly expands and collapses panels

## [0.17.3] - 2026-03-08

### Fixed
- **Panels visible after skin switch** — render all panels expanded during skin hot-reload and restore playing/stale/error visual state on new DOM elements

## [0.17.2] - 2026-03-08

### Fixed
- **Default skin panel header toggle** — clicking panel header now properly toggles expand/collapse in both directions; removed summary from interactive-element filter and guarded screen manager code behind layout mode check
- **Default skin background image** — added hero background image behind translucent gradient overlay for richer visual depth

## [0.17.1] - 2026-03-07

### Fixed
- **Master panel samples()/register() now shared globally** — bypasses REPL transpiler (which hangs in master panel context) and auto-awaits async calls so sample maps are registered before child panels evaluate

## [0.17.0] - 2026-03-04

### Added
- **Settings panel redesign** — sidebar-navigated settings modal with per-section dirty state, Reset/Apply controls, unsaved changes banner, and consistent styling across default, glass, and split-column skins
- **Split-column header metronome** — metronome visible in the banner bar between the title and toolbar buttons; step segments styled as thin compact bars
- **Global toolbar in split-column header** — Play All, Stop All, Update All buttons positioned in the banner bar alongside config controls
- **Enlarged split-column header** — banner bar scaled to 180% height with proportionally larger logo; respects Electron OS window control padding

### Fixed
- **Panel drag order persistence** — dragging panels in split-column skin now persists correctly across reloads; `placePartInRegion()` uses `panel.number` display order instead of panelId timestamp digits
- **Layout part display-number sync** — `renumberPanelsLayout()` updates `data-display-number` on all layout parts after drag reorder, ensuring correct ordering on next render

## [0.16.0] - 2026-03-03

### Added
- **Draggable column resizers** — drag borders between columns in split-column skin to resize panels/editors/controls regions; widths persist to localStorage; double-click resets to default
- **Resizable regions skin API** — skins opt in via `resizableRegions: true` in `skin.json` layout config; documented in creating-skins guide
- **Collapse-on-blur in layout mode** — "Collapse unfocused panels" setting now works in split-column skin; collapsed editors show header bar instead of vanishing

### Fixed
- Right column resizer correctly targets the controls column (flex-aware direction detection)
- Master panel editor header placed inside `.panel-editor-container` matching instrument panel DOM structure
- Editor content-height sizing: editors stack to content height with scrollable center region instead of equal-flex distribution
- CodeMirror content visible after skin hot-swap (requestMeasure on all editors after layout settles)
- Stale layout-editor-header cleanup on repeated skin swaps

## [0.15.1] - 2026-02-27

### Fixed
- **Split-column skin white page** — added dark background and green gradient matching default skin
- **Split-column skin missing menu bar** — settings/config buttons now always visible and accessible

## [0.15.0] - 2026-02-27

### Added
- **Layout Template System** — skins can now define page-level layouts that distribute panel parts (header, editor, controls) across separate DOM regions instead of a single monolithic element
- **Panel DOM Registry** — Map-based lookup (`panelDOMRegistry.js`) decouples panel part resolution from DOM tree position, replacing ~20 `querySelector`/`closest` traversal patterns across 7 files
- **Layout Manager** — `layoutManager.js` manages page regions, part placement, and layout-mode collapse (CSS classes instead of native `<details>`)
- **Split-column skin** — proof-of-concept two-column layout with headers + controls on left, editors on right
- **Part-level templates** — `panel-header.html`, `panel-editor.html`, `panel-controls.html` allow skins to customize individual panel parts
- **Layout-mode drag reorder** — drag panel headers within the header region; editor and controls regions reorder to match
- **Skin setting persistence** — `skin` field added to `DEFAULT_SETTINGS` schema with proper validation

### Changed
- `renumberPanels()` now branches for classic vs layout mode (reads order from header region in layout mode)
- `findFocusedPanel()` checks `[data-panel-id]` ancestors for layout-mode focus detection
- Layout-mode header click handler now focuses the editor after expanding

## [0.14.3] - 2026-02-27

### Added
- **Play All button** — new master panel button between Update All and Stop All; click activates stopped/paused panels, Shift+click re-evaluates all panels including playing ones
- **Play All keyboard shortcut** — Cmd+A (Electron) / Cmd+Alt+A (browser), with Shift modifier for force re-evaluate
- **Play All remote control** — WebSocket `global.playAll` command and button on remote.html

## [0.14.2] - 2026-02-26

### Added
- **Tactical console skin** — sci-fi military console aesthetic with cyan wireframe borders, CRT scan lines, beveled clip-path panels, and bundled Orbitron font
- **Skin font asset support** — custom skins can now bundle WOFF2/TTF font files that load correctly from IndexedDB via blob URL rewriting in skinManager
- **Binary asset handling in skin importer** — font and image files in skin ZIPs are now read as binary strings instead of UTF-8 text, preventing data corruption on import

### Fixed
- **Custom skin menu bar visibility** — skins must now explicitly position and show `.top-menu-bar` (base CSS defaults to hidden); tactical skin sets `opacity: 1` and `pointer-events: auto`
- **Skin validator filename mismatch** — `REQUIRED_TEMPLATES` expected camelCase `sliderCollapsed.html` regardless of manifest `templates` mapping

## [0.14.1] - 2026-02-25

### Fixed
- **Memory leaks for long sessions** — ref-counted console.error interception, master slider/global cleanup on re-eval, Blob URL revocation on skin swap, fontSizeCompartments pruning on panel delete, WebSocket listener teardown on disconnect
- **Beat-lock timing off by one 1/16 step** — moved waitForBeatLock() to immediately before evaluate() and added 1/64 cycle lookahead to prevent boundary edge case
- **Metronome WebSocket spam** — throttled step broadcast to downbeats only (4/cycle vs 16), removed debug console.log
- **Duplicate delete-button handlers** — deduplicated click listeners to prevent double execution

### Added
- **Pending button state** — pulsing dimmed play icon gives immediate visual feedback when beat-locking delays playback start

## [0.14.0] - 2026-02-24

### Added
- **Beat-locking setting** — defer panel evaluation to the next beat (quarter-cycle) or next cycle boundary for tighter musical timing during live performance. Configurable in General settings as Immediately / Next beat / Next cycle.

## [0.13.2] - 2026-02-24

### Fixed
- Downloads page: release info never loaded on SPA navigation — replaced `DOMContentLoaded` listener with IIFE since MkDocs instant navigation doesn't fire that event
- Downloads page: markdown headers rendered as raw `##` text inside HTML div — converted to `<h2>` tags

## [0.13.1] - 2026-02-24

### Fixed
- CI/CD: deploy-pages now waits for detect-version to complete before building, ensuring the latest git tag is available on GitHub when the site goes live (fixes version tag showing stale value in header)
- Synced pyproject.toml version with VERSION file

## [0.12.1] - 2026-02-23

### Fixed
- Duplicate CodeMirror editors in master panel on skin switch — old editor views now destroyed and container cleared before recreation
- Missing onChange callbacks after skin switch — editor auto-save, staleness detection, and master code evaluation now restored
- macOS Electron crash (SIGABRT / Team ID mismatch) — unsigned CI builds now disable `hardenedRuntime` and clear entitlements

## [0.12.0] - 2026-02-23

### Added
- **Epic 2: UI Redesign — Forest-Green Glassmorphism**
  - Story 2.1: Design token overhaul — oklch color system with forest-green brand palette, translucent surface hierarchy, semantic color tokens
  - Story 2.2: Default skin theme rewrite — all components converted to glassmorphism with oklch colors
  - Story 2.3: Panel and component refresh — panel surfaces, buttons, sliders, modals rewritten with translucent glass design
  - Story 2.4: Settings modal and secondary UI — settings tabs, metronome, banner bar, CodeMirror editor theme, toast notifications, icon sizing standardization
  - Story 2.5: Remote control and responsive polish — remote CSS rewrite, mobile breakpoints, projection mode compatibility
- Reduced motion support (`prefers-reduced-motion`) — modal opacity-only fade, disabled glow/pulse animations
- High contrast support (`prefers-contrast: more`) — bumped border opacity, text contrast, surface distinction
- CodeMirror glassmorphism theme — green cursor, selection highlight, translucent gutters

### Changed
- All CSS colors converted from hex/hsl/rgba to oklch color space
- Remote base CSS now self-contained with local design tokens (documented sync requirement)
- `body.reduced-motion` class uses targeted rules instead of nuclear `0.01ms` override
- Toast notifications refactored from inline JS styles to CSS classes
- `--dark-green` alias removed — all references use `--color-primary` directly
- Blocking `alert()` dialogs in settings replaced with non-blocking `showSettingsNotification()` toasts

## [0.11.7] - 2026-02-23

### Fixed
- Ghost pattern bug: multiple `$:` labels in one panel now get unique sub-IDs, preventing orphaned patterns that couldn't be silenced

## [0.11.6] - 2026-02-22

### Added
- Debug logging for ghost pattern investigation (evaluate, scheduler.setPattern, periodic pattern list)

## [0.11.5] - 2026-02-22

### Fixed
- Panel pause: removed erroneous `scheduler.stop(patternId)` which killed all patterns instead of one
- Panel pause: `autoSchedule=false` on silence evaluation to prevent scheduler restart side-effects

## [0.11.4] - 2026-02-22 [YANKED]

### Fixed
- Panel pause: `scheduler.stop()` doesn't accept a pattern ID — broke multi-panel playback

## [0.11.3] - 2026-02-22

### Fixed
- macOS build: universal binary (arm64+x64) instead of separate arch builds — eliminates Rosetta 2 performance penalty on Apple Silicon

## [0.11.2] - 2026-02-22

### Fixed
- macOS signing: don't pass empty `CSC_LINK` env var to electron-builder (step-level env overrode GITHUB_ENV)
- Windows build: force `bash` shell for steps using Unix commands and bash variable expansion

## [0.11.1] - 2026-02-22

### Fixed
- CI/CD concurrency deadlock between `ci.yml` and `deploy-pages.yml`
- macOS unsigned build failure when `CSC_LINK` secret is empty
- Rollup platform-specific optional deps missing in CI (npm bug #4828) — delete lockfile + node_modules before install

## [0.11.0] - 2026-02-22

### Added
- **Epic 1: CI/CD Pipeline Ground-Up Rebuild**
  - Reusable `detect-version.yml` workflow — parses `^^^ vX.Y.Z` from commit messages, creates annotated git tags
  - Reusable `build-electron.yml` workflow — parallel build matrix for macOS (universal), Windows (x64), Linux (x64) with `npm ci` and code signing
  - Reusable `create-release.yml` workflow — idempotent GitHub Release creation with all platform artifacts
  - Reusable `deploy-pages.yml` workflow — MkDocs site + lite web app deployed to GitHub Pages with pip/npm caching
  - `ci.yml` orchestrator — single entry point for all CI/CD, replaces fragile ad-hoc workflows
  - Manual `workflow_dispatch` release trigger with version input
- **Plugin system** — plugin manager, sandbox, and validator
- **Accessibility manager** — screen reader and keyboard navigation support
- **Playwright config** — end-to-end test infrastructure

### Changed
- Moved BMAD historical docs from `bmad/` to `bmad-archive/` (read-only archive)
- Updated branding assets (banner, icon, logo)
- UI improvements to panel editor, settings modal, keyboard shortcuts, and skin templates
- `.gitignore` updated to exclude `_site/`, `test-results/`, `.automaker/`

### Removed
- Old CI/CD workflows: `release.yml`, `docs.yml.disabled`, `static.yml.disabled`
- `deploy-pages.yml` standalone push trigger (now called by orchestrator)

## [0.10.15] - 2026-02-21

### Fixed
- **Commit missing accessibility.css for CI builds**
  - `static/css/accessibility.css` was untracked, causing Vite to skip bundling `.sr-only` styles in CI

## [0.10.14] - 2026-02-21

### Fixed
- **Consolidate static assets into Vite public directory**
  - Merged `static/` directory into `public/` so all assets deploy to GitHub Pages
  - Fixes missing `.sr-only` styles causing tooltip/description text to render visibly
  - Fixes outdated banner image on hosted "Try It Now" page
  - All fonts, CSS, and images now served from a single source for both dev and production

## [0.10.13] - 2026-02-21

### Fixed
- **GitHub Pages asset loading**
  - Material Icons and fonts failing to load on the hosted "Try It Now" page (404 for woff2)
  - Changed absolute asset paths to relative in `index.html` and `fonts.css`
  - Fixes all `/static/` and `/fonts/` references that broke under the `/app/` subdirectory

## [0.10.12] - 2026-01-07

### Added
- **Audio Caching**
  - IndexedDB-based persistent cache for audio samples and soundfonts
  - Samples cached between app restarts (no re-downloading on subsequent launches)
  - Automatic caching for Strudel CDN, GitHub raw content, and soundfont hosts

### Changed
- **Performance: Local Fonts**
  - Bundled Noto Sans and Material Icons locally (no Google Fonts CDN)
  - Added `font-display: swap` for faster initial paint
  - Eliminates render-blocking network requests on slow connections

## [0.10.11] - 2026-01-04

### Changed
- **Downloads Page**
  - Dynamic download links fetched from GitHub API (no more stale links)
  - Auto-detects user's OS and architecture
  - Shows version number and file sizes for all downloads
  - Fallback to GitHub releases page if API fetch fails

## [0.10.10] - 2026-01-04

### Fixed
- **Electron Build**
  - Fixed missing Express dependencies (body-parser, etc.) in packaged app
  - Let electron-builder handle node_modules bundling automatically
  - Fixed race condition: window now waits for HTTP server to be ready
  - Fixed crash when quitting second instance before app ready
  - Fixed Express 5 wildcard route incompatibility (path-to-regexp error)
- **API**
  - Fixed /health endpoint URL matching in Vite middleware
  - Added CORS headers for external API access

## [0.10.7] - 2026-01-04

### Fixed
- **Lite Build**
  - Skins now load correctly when deployed to subdirectory (uses Vite BASE_URL)
- **CI/CD Release Workflow**
  - Merged semantic-release into release workflow (fixes GITHUB_TOKEN limitation)
  - Single workflow now: detects `^^^ v1.2.3` pattern → creates tag → builds all platforms → publishes release
  - Added Python 3.11 + setuptools to all platforms (macOS, Windows, Linux) for node-gyp

## [0.10.3] - 2026-01-04

### Fixed
- **CI/CD Workflows**
  - Fixed rollup native module error by removing `--ignore-scripts` from npm ci
  - Added setuptools installation for node-gyp distutils compatibility
  - Pinned Python to 3.11 across all workflows

### Changed
- **Keyboard Shortcuts**
  - `Cmd+↑` now triggers Update All (was Update Panel)
  - Removed `Cmd+U` shortcut (conflicts with CodeMirror undo)

## [0.10.2] - 2026-01-03

### Fixed
- CI/CD workflow Python 3.11 pinning for node-gyp compatibility

## [0.10.1] - 2026-01-03

### Added
- **Electron App Improvements**
  - Simpler keyboard shortcuts in Electron (Cmd+N, Cmd+W, Cmd+P vs Cmd+Opt+N in browser)
  - Settings menu item (Cmd+,) in app menu
  - Custom About dialog with logo and app details
  - App name shows "r0astr" in menu bar instead of "Electron"
  - File and Playback menus with documented accelerators

### Changed
- **Settings Panel Reorganization**
  - Collapsible sections: General, Editor, Behaviour, Integrations, Advanced
  - Improved text contrast for dark theme
  - Removed redundant "Show Confirmation Dialogs" (YOLO mode covers this)
  - YOLO mode moved to General section
- **Panel Reordering**
  - Drag order now persists after reload
  - Panels saved and loaded in correct number order

### Fixed
- Memory leaks in panel deletion lifecycle
- Electron app port conflict on restart
- Remote panel metronome synchronization
- Settings section chevron icons (CSS-only, no font dependency)
- Remote panel masonry grid layout

## [0.10.0] - 2025-12-30

### Added
- **Global Variables & Functions in Master Panel**
  - Define variables (`let SCALE = "e:minor"`) in master panel, accessible in all cards
  - Define functions (`function WHICH_PHASE()`) for orchestration logic
  - Scheduler exposed globally for time-based orchestration (`scheduler.now()`)
- **Cross-Panel Pattern References**
  - Panels auto-register patterns under sanitized titles (e.g., "Bass" → `BASS`)
  - Reference patterns from other panels: `stack(BASS, LEAD.fast(2))`
  - Cascade re-evaluation when referenced patterns change
  - Debounced pre-registration on code edit (no need to play first)
- **Visualization Support**
  - `pianoroll()`, `scope()`, `spectrum()` methods for full-page visualization
  - `_pianoroll()`, `_scope()`, `_spectrum()` for in-panel canvas rendering
  - Proper cleanup on panel stop

### Fixed
- Named pattern shortcuts (`.d1`, `.p(1)`) now correctly tracked for panel pause control
- Global function registration preserves whitespace/indentation

## [0.9.0] - 2025-12-21

### Added
- **Aftermarket Skin System**
  - ZIP-based skin import/export functionality
  - IndexedDB storage for custom skins (works in web and Electron)
  - Skin validation with schema checking and security protections
  - Dual-source skin loading (custom skins override bundled)
  - Import UI in settings modal with status feedback
  - Export/delete controls for custom skins
  - Protection against deleting active skin
- **Bundled Skins**
  - Default skin with metronome hover trigger
  - Glass skin with left-edge hover menu
  - Hover target system with extended trigger zones
  - Skinnable templates (panel.html, slider.html, sliderCollapsed.html)
- **CI/CD Improvements**
  - GitLab Pages deployment builds app into docs/app/
  - Relative paths for subdirectory deployments
  - Bundled skins included in production builds

### Changed
- Vite base path now uses relative paths for all builds
- Hover trigger zones extended to overlap controlled elements (fixes "Tantalus problem")
- Settings modal loads skin list dynamically
- Metronome visible by default in both skins

### Removed
- Splash screen animation and settings
- Sample loading now happens silently in background

### Fixed
- Hot-reload preserves panel state when switching skins
- Menu hover persistence (trigger zones now include menu area)
- Default skin metronome visibility
- Electron drag region interference with hover targets

## [0.8.0] - 2025-12-12

### Added
- **Semantic Release CI/CD**
  - New GitHub workflow for commit-based releases
  - Commit pattern `^^^ v1.2.3` triggers automatic tag creation
  - Extracts SemVer from commit message and creates annotated git tag
  - Triggers existing release workflow for Electron builds
- **Electron Title Bar Overlay**
  - Custom title bar matching banner color (#d9d8d4)
  - macOS traffic lights positioned at (12, 12)
  - Draggable window region in top bar
- **Save/Load Layout System**
  - Save button exports panel layouts as JSON files
  - Load button imports layouts and restores panel state
  - Version-stamped layout format with timestamps
- **Enhanced Focus Indicators**
  - Focus highlight wraps entire panel container (code + controls)
  - CSS custom properties for skinnable focus styling
  - `--panel-focus-color`, `--panel-focus-width`, `--panel-focus-glow` variables

### Changed
- Panel delete hotkey (Cmd+Opt+W) now works on collapsed/unfocused panels
- CodeMirror editors auto-size to content (minimum 3 lines, grows as needed)
- Main window scrollable for panel overflow

### Removed
- Animation settings and CSS transitions (all animations disabled)
- `animationSpeed` from settings manager
- `--transition-duration` CSS variable

### Fixed
- Box-shadow bug on first panel caused by legacy `#master-panel.active` CSS rule
- `findFocusedPanel()` now checks both `.level-panel.focused` and `.card.focused`

## [0.7.1] - 2025-12-10

### Added
- Play-pause-stale hybrid button for panel controls
- Configurable splash screen on load
- Panel focus state on creation
- Draggable panel rows

### Fixed
- Pause icon display (was showing stop icon)
- Electron builder icon paths
- npm package-lock sync

### Changed
- Refactored main.js to use shared state module and extract managers
- Updated Pages site with lite build

## [0.6.0] - 2025-11-18

### Added
- **Panel Slider Synchronization**
  - Two-way slider sync between main UI and remote control interface
  - Panel-specific sliders appear inline within panel cards on remote
  - Real-time slider value updates across all connected clients
  - Slider metadata broadcast via WebSocket (panel.sliders, panel.sliderValue messages)
  - Remote slider controls with 20px thumbs (vs 32px for master sliders)

### Fixed
- **Slider Value Persistence Bug**
  - Sliders now clear completely on panel pause (UI and cached values)
  - Playing a panel always renders sliders with default values from code definition
  - Deleted slider entries from sliderValues object when pausing
  - Slider values no longer cached across pause/play cycles
- **Slider Type Conversion**
  - Fixed string-to-number conversion for widget.value from transpiler
  - Remote now properly parses numeric string values (e.g., "1" → 1)
  - Added parseFloat conversion on both main and remote sides
  - Eliminated "value.toFixed is not a function" error on remote

### Changed
- Slider rendering behavior: clear on pause, restore from code on play
- Enhanced error handling for non-numeric slider values
- Added comprehensive debug logging for slider value tracking

### Technical Details
- **Slider Metadata Structure**: `{ sliderId, label, value, min, max, step }`
- **WebSocket Protocol**: panel.sliders (broadcast metadata), panel.sliderValue (individual updates), panel.sliderChange (remote input)
- **Value Resolution**: `sliderValues[id] ?? widget.value ?? 0` with parseFloat for string values
- **State Management**: panelSliders object tracks slider metadata per panel

## [0.5.0] - 2025-11-18

### Added
- **Epic 8: Remote Control Panel Synchronization** (Story 8.4)
  - Full panel state synchronization on remote client connect/reconnect
  - Main client as authoritative state source (server is stateless relay)
  - Dynamic remote UI rebuild from full_state WebSocket message
  - Server requests full_state from main client when remote connects
- **Custom Code Formatter**
  - Quote-preserving formatter for Strudel semantic quote usage
  - Bracket-tracking indentation without quote normalization
  - Preserves single quotes for mini notation, double quotes for note strings

### Changed
- Remote control architecture: main client is now authoritative source of truth
- Panel ID format throughout WebSocket communication (timestamp-based IDs)
- Remote panels container now dynamically populated (no hardcoded panels)
- Replaced Prettier formatting with custom formatCodeCustom() function
- Updated createRemotePanelControl() to handle playing/stale state on creation

### Fixed
- Remote reload now shows current state instead of stale/outdated panels
- Panel ID consistency in WebSocket messages (panel-{timestamp} format)
- Remote panel buttons now correctly trigger actions in main interface
- broadcastState() uses full panel IDs instead of extracting numbers
- panel.toggle/play/pause handlers accept full panel IDs directly
- updatePanelUI() uses correct remote-${panelId} element ID format

### Removed
- Stale warning icon (⚠️) from panel titles and UI
- All .stale-icon CSS styling and animations
- Hardcoded panels from remote.html (now fully dynamic)

### Technical Details
- **Architecture Pattern**: Main client → Server relay → Remote clients
- **State Flow**: Main maintains getAllPanels() + cardStates, server relays on request
- **Full State Message**: Sent on remote registration via server.requestFullState
- **Quote Preservation**: Custom formatter never modifies quote characters
- **Visual State**: Staleness still indicated via border colors (yellow glow)

## [0.4.1] - 2025-11-18

### Changed
- Syntax highlighting configurable and disabled by default for improved performance
- Increased debounce timers: validation (500ms → 2000ms), syntax highlighting (200ms → 800ms), auto-save (1s → 3s)
- Disabled live validation to prevent eval spam and typing lag

### Fixed
- Removed validation from updateActivateButton to eliminate eval spam source
- Reduced presentation delay by disabling syntax highlighting (23ms improvement)

### Performance
- Debounced updateAllButton to prevent keystroke spam
- Added performance timing metrics to input event listeners
- Overall typing responsiveness improved

## [0.4.0] - 2025-11-17

### Added
- **Epic 6: Staleness Detection System** (Stories 6.1-6.5)
  - **Story 6.1**: Staleness detection logic - tracks when panel code differs from running audio
  - **Story 6.2**: Separate PAUSE and ACTIVATE buttons - replaces single toggle with two buttons
  - **Story 6.3**: Visual staleness indicators - border colors, glows, and warning icons
  - **Story 6.4**: UPDATE ALL button - batch update for all stale panels with visual feedback
  - **Story 6.5**: Textarea change detection - immediate staleness updates on code edit
- **Panel State Management**
  - New `stale` and `lastEvaluatedCode` fields in panel state
  - Real-time comparison of current code vs. evaluated code
  - Staleness only applies to playing panels (paused panels cannot be stale)
- **UI Enhancements**
  - UPDATE ALL button in global controls with stale panel count display
  - Three panel visual states: paused (gray), playing (green), stale (yellow)
  - Dynamic button states: PLAY, UPDATE, and disabled (grayed out)
  - Pulsing animations for stale panels and UPDATE buttons
  - Flash animation during batch updates
- **Event Delegation**
  - Document-level event listeners for dynamic panel support
  - Automatic staleness checking on textarea input
  - UPDATE ALL button state updates on all panel state changes

### Changed
- Removed single Play/Pause toggle button in favor of separate PAUSE and ACTIVATE buttons
- ACTIVATE button now shows dynamic text: "PLAY" (paused) or "UPDATE" (stale)
- Panel borders now indicate state with colors and glow effects
- Button update logic integrated throughout panel lifecycle events

### Fixed
- Sequential batch updates with 50ms delay prevent audio scheduler conflicts
- Button state synchronization across pausePanel, activatePanel, and textarea input
- Visual indicators update immediately without debounce delay

### Technical Details
- **Architecture**: Dual-state management (cardStates + panelManager persistence)
- **Performance**: Sequential updates with controlled timing for smooth audio transitions
- **Accessibility**: ARIA attributes and screen reader support for staleness indicators
- **Integration**: Full WebSocket state sync for remote control compatibility

## [0.3.0] - 2025-11-17

### Added
- **Epic 5: Complete REST API Implementation**
  - POST /api/panels - Create panels programmatically
  - DELETE /api/panels/:id - Delete panels with master panel protection
  - POST /api/panels/:id/code - Update panel code with autoPlay option
  - POST /api/panels/:id/playback - Control playback (play/pause/toggle)
  - GET /api/panels - List all panels with full state
  - WebSocket state synchronization for all CRUD operations
- **Client-Server State Synchronization**
  - Automatic panel state sync from client to server on WebSocket connection
  - Server-side panel state tracking for API operations
  - Real-time WebSocket events: panel_created, panel_deleted, panel_updated, playback_changed
- **Auto-Reconnect WebSocket Client**
  - 3-second reconnect delay on disconnection
  - Error handling and connection resilience
- **Comprehensive API Documentation**
  - Complete REST API reference in docs/remote-control.md
  - WebSocket event specifications
  - curl examples for all endpoints

### Changed
- Migrated from separate Express server to single-server architecture (Vite dev server with middleware)
- Enhanced panelManager.js for server-side compatibility (environment checks for document/localStorage)

### Fixed
- Panel deletion now properly removes from both client and server state
- Master panel protection enforced at API level (403 Forbidden)
- Middleware routing to prevent path collision between POST /api/panels and POST /api/panels/:id/code

## [0.2.1] - 2025-11-16

### Added
- **Complete BMAD Documentation Structure**
  - 7 epic PRD documents with 32 detailed user stories
  - Epic 1: Dynamic Panel Management (3 stories)
  - Epic 2: Enhanced Panel UI (4 stories)
  - Epic 3: Splash/Hero Screen (3 stories)
  - Epic 4: Settings System (6 stories)
  - Epic 5: Server Endpoints (6 stories)
  - Epic 6: Staleness Detection (5 stories)
  - Epic 7: Text Panel Improvements (5 stories)
- **Architecture Documentation**
  - docs/architecture/index.md - Architecture overview
  - docs/architecture/tech-stack.md - Technologies and versions
  - docs/architecture/coding-standards.md - Code style guide
  - docs/architecture/source-tree.md - File organization
- **PRD Documentation**
  - docs/prd/index.md - Product requirements roadmap
  - Individual epic files with user stories and acceptance criteria

### Changed
- Updated PRD from v1 to v2 with Epic 7
- Removed hardcoded 4-panel limit from HTML structure

### Documentation
- All 32 user stories include detailed task breakdowns with architecture citations
- Each story includes testing checklists and acceptance criteria
- Stories 1.1-1.3 marked "Ready for Development"

## [0.2.0] - 2025-11-16

### Added
- **WebSocket Remote Control System** for live performance control
  - Real-time remote control via WebSocket (ws://host:5173/ws)
  - Touch-optimized iPad/phone interface (remote.html)
  - Bidirectional state synchronization between devices
  - Auto-reconnection on connection loss
  - Client type tracking (main vs remote)
  - Extensible message protocol for future features
- **Master Panel Controls**
  - Global slider variables shared across all panels
  - TEMPO slider with CPM (cycles per minute) control
  - Compact/expanded view modes
  - Reactive slider references using ref()
- **Network Access Configuration**
  - Vite server accessible on LAN (host: 0.0.0.0)
  - Support for multi-device architecture
- **Comprehensive Documentation**
  - docs/remote-control.md - Setup and protocol guide
  - docs/architecture/strudel-integration-gotchas.md - Critical implementation lessons
  - Updated README with remote control instructions

### Changed
- Master panel slider parsing now uses regex instead of transpiler (fixes blocking issue)
- Tempo control uses CPS (cycles per second) via scheduler.setCps()
- WebSocket server uses noServer mode to coexist with Vite HMR
- Network configuration allows iPad/phone access on local network

### Fixed
- Transpiler blocking issue in master panel evaluation
- CPS vs CPM confusion in tempo control
- WebSocket frame header conflicts with Vite HMR
- Master panel slider rendering and reactivity

### Technical Details
- **New Dependencies**: ws@8.18.3 for WebSocket server
- **Architecture**: Multi-device support (Mac server + laptop main + iPad remote)
- **Protocol**: Extensible WebSocket message protocol
- **Commands**: panel.toggle, panel.play, panel.pause, global.stopAll, panel.update
- **State Sync**: Real-time panel state broadcasting to remote clients

## [0.1.0] - 2025-11-15

### Added
- Initial release of r0astr multi-instrument live coding interface
- 4 independent instrument cards with synchronized audio clock
- Interactive slider controls for real-time parameter manipulation
- Pattern transpiler with widget support
- Shared Web Audio context architecture
- Independent pattern control via unique IDs
- Integration with Strudel npm packages (@strudel/core, @strudel/mini, @strudel/webaudio, etc.)
- Vite-based build system with hot module reload
- AudioWorklet plugin integration for Web Audio processing
- Default patterns for bass, drums, melody, and pads
- Sample library pre-loading with feedback
- Claude Code integration (.claude/piatra.json)
- Project documentation (README.md, CLAUDE.md)

### Changed
- Migrated from Strudel monorepo fork to standalone npm package consumer
- Restructured project to minimal wrapper architecture
- Updated dependencies to use published Strudel packages from npm registry
- Moved legacy Strudel monorepo code to delete_me/ folder

### Removed
- Local Strudel package dependencies (replaced with npm packages)
- Monorepo configuration (pnpm-workspace, lerna)
- Unused Strudel infrastructure (website, tools, tests, desktop app)

### Technical Details
- **Dependencies**: All Strudel packages now from npm (v1.2.5-1.2.6)
- **Architecture**: Vanilla JavaScript + Vite
- **Audio Engine**: Web Audio API via @strudel/webaudio
- **Pattern Language**: Strudel mini notation
- **Build Tool**: Vite 6.0.11
- **License**: AGPL-3.0-or-later

[0.8.0]: https://gitlab.com/piatra_eng/r0astr/-/tags/v0.8.0
[0.7.1]: https://gitlab.com/piatra_eng/r0astr/-/tags/v0.7.1
[0.6.0]: https://gitlab.com/piatra_eng/r0astr/-/tags/v0.6.0
[0.5.0]: https://gitlab.com/piatra_eng/r0astr/-/tags/v0.5.0
[0.4.1]: https://gitlab.com/piatra_eng/r0astr/-/tags/v0.4.1
[0.4.0]: https://gitlab.com/piatra_eng/r0astr/-/tags/v0.4.0
[0.3.0]: https://gitlab.com/piatra_eng/r0astr/-/tags/v0.3.0
[0.2.1]: https://gitlab.com/piatra_eng/r0astr/-/tags/v0.2.1
[0.2.0]: https://gitlab.com/piatra_eng/r0astr/-/tags/v0.2.0
[0.1.0]: https://gitlab.com/piatra_eng/r0astr/-/tags/v0.1.0
