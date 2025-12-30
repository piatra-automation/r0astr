# Changelog

All notable changes to r0astr will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
