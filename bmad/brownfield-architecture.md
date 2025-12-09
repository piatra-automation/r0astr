# r0astr Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the r0astr codebase as of v0.1.0, including technical implementation, architectural patterns, and planned enhancement roadmap. It serves as a comprehensive reference for senior BMAD development agents working on UI enhancements, multipanel functionality, and future extensibility.

### Document Scope

Comprehensive documentation of entire system with focus on:
- **Compatibility**: Maintaining OSC, MIDI support, and sound library integration
- **UI Enhancement**: Draggable/resizable modal panels, WinAmp-style theming
- **Multipanel Architecture**: Dynamic user-created panel system
- **Code Snippet Library**: JSON-based hierarchical snippet management
- **Future Extensions**: Webhook API for MCP service integration

### Change Log

| Date       | Version | Description                 | Author         |
| ---------- | ------- | --------------------------- | -------------- |
| 2025-11-15 | 1.0     | Initial brownfield analysis | BMad Master    |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `index.html` - 4-card UI structure with inline CSS
- **Application Logic**: `src/main.js` - Strudel initialization, pattern evaluation, card management
- **Configuration**: `vite.config.mjs` - AudioWorklet plugin configuration
- **Package Dependencies**: `package.json` - All Strudel npm packages (v1.2.5-1.2.6)
- **Project Metadata**: `.claude/piatra.json` - Piatra client/project tracking
- **Version History**: `CHANGELOG.md` - Migration from monorepo to standalone wrapper

### Key Architectural Components

| Component              | File/Location         | Purpose                                      |
| ---------------------- | --------------------- | -------------------------------------------- |
| UI Structure           | `index.html:172-204`  | 4 instrument cards with headers and textareas|
| Card State Management  | `src/main.js:28-33`   | Playing state tracking per card              |
| Pattern Evaluation     | `src/main.js:172-251` | Toggle play/pause, transpile, evaluate       |
| Slider Rendering       | `src/main.js:123-169` | Dynamic slider UI from widget metadata       |
| Strudel Initialization | `src/main.js:59-120`  | Async module loading, sample pre-loading     |
| Shared REPL Instance   | `src/main.js:76-83`   | Single repl for all cards with shared clock  |

### Enhancement Impact Areas (Planned)

Based on roadmap requirements, these areas will be affected:

**Dynamic Panel System:**
- `index.html` - Convert from static 4-card HTML to dynamic panel container
- `src/main.js:44-56` - Refactor `initializeCards()` to support dynamic panel creation
- New: Panel state management (positions, sizes, z-index)
- New: Panel CRUD operations (create, delete, serialize state)

**Snippet Library:**
- New: `src/snippetManager.js` - JSON loading, hierarchical navigation
- New: Settings panel UI for snippet file configuration
- Integration: `src/main.js` - Load snippets into card textareas

**Draggable/Resizable UI:**
- New: Drag/resize library or custom implementation
- `index.html` styles - Modal panel styling, z-index management
- New: Panel persistence (localStorage or file-based)

**Theming System:**
- New: `src/themeManager.js` - WinAmp-style skin loading (folder with resources)
- New: Theme switching via settings panel
- `index.html` styles - CSS variable-based theming

**Webhook API (Extension Goal):**
- New: `src/api/` - Express.js or similar HTTP endpoints
- Endpoints: `POST /panels`, `POST /panels/:id/code`, `POST /panels/:id/play`, `DELETE /panels/:id`
- For future MCP service integration

## High Level Architecture

### Technical Summary

r0astr is a **stable fork** of Strudel, architected as a minimal vanilla JavaScript wrapper around published Strudel npm packages. It provides a multi-instrument live coding interface with synchronized audio playback across independent pattern instances.

**Current State**: Static 4-card layout with basic play/pause controls and dynamic slider generation.

**Roadmap Goals**:
1. Dynamic user-created panel system (draggable, resizable, modal)
2. JSON-based snippet library (local/remote GitHub)
3. WinAmp-style theming with skin folders
4. Webhook API for external AI control (MCP integration)

### Actual Tech Stack

| Category           | Technology                  | Version      | Notes                                        |
| ------------------ | --------------------------- | ------------ | -------------------------------------------- |
| Runtime            | Browser (Web Audio API)     | Modern       | Chrome, Firefox, Safari (WebKit)             |
| Build Tool         | Vite                        | 6.0.11       | HMR, AudioWorklet bundling                   |
| Language           | JavaScript (ES Modules)     | ES2020+      | No TypeScript, no framework                  |
| Pattern Engine     | @strudel/core               | 1.2.5        | Core pattern primitives                      |
| Mini Notation      | @strudel/mini               | 1.2.5        | Pattern parsing (e.g., `s('bd hh')`)         |
| Transpiler         | @strudel/transpiler         | 1.2.5        | Converts `slider()` to `sliderWithID()`      |
| Audio Output       | @strudel/webaudio           | 1.2.6        | Web Audio integration, synth registration    |
| Music Theory       | @strudel/tonal              | 1.2.5        | Scales, chords, note conversions             |
| Samples            | @strudel/soundfonts         | 1.2.6        | SoundFont loading, dirt-samples support      |
| Editor Support     | @strudel/codemirror         | 1.2.6        | Slider widgets, reactive refs                |
| AudioWorklet       | vite-plugin-bundle-audioworklet | 0.1.1    | Bundles AudioWorklet processors              |

**Important Compatibility Notes**:
- **OSC Support**: Via Strudel's `osc()` output (requires backend OSC server)
- **MIDI Support**: Via Strudel's `midi()` output and Web MIDI API
- **Sound Libraries**: Strudel supports dirt-samples (TidalCycles), SoundFonts, custom samples
- **Stable Fork**: Not tracking Strudel upstream; locked to v1.2.x packages

### Repository Structure Reality Check

- **Type**: Standalone project (migrated from monorepo fork)
- **Package Manager**: npm (package-lock.json present)
- **Build System**: Vite with ES modules
- **Notable**: `delete_me/` folder contains legacy Strudel monorepo (safe to delete)

## Source Tree and Module Organization

### Project Structure (Actual)

```text
r0astr/
├── index.html              # Main UI (4 static cards, inline CSS)
├── src/
│   └── main.js             # Application entry point (~256 lines)
│       ├── Strudel imports (lines 1-5)
│       ├── Default patterns (lines 20-25)
│       ├── Card state (lines 28-33)
│       ├── Audio context init (lines 36-41)
│       ├── initializeCards() (lines 44-56)
│       ├── initializeStrudel() (lines 59-120)
│       ├── renderSliders() (lines 123-169)
│       └── toggleCard() (lines 172-251)
├── package.json            # Dependencies & scripts
├── vite.config.mjs         # Vite config (AudioWorklet plugin)
├── .claude/
│   ├── piatra.json         # Piatra project tracking
│   └── settings.local.json # Local Claude Code settings
├── .vscode/
│   └── settings.json       # VSCode configuration
├── LICENSE                 # AGPL-3.0-or-later
├── CHANGELOG.md            # Version history
├── VERSION                 # Current version (0.1.0)
├── README.md               # User documentation
├── CLAUDE.md               # AI agent instructions
└── delete_me/              # Legacy Strudel monorepo (can be deleted)
```

### Key Modules and Their Purpose

**`src/main.js`** - Monolithic application logic (currently 256 lines)
- **Lines 1-11**: Imports from Strudel packages, exposes `sliderValues` globally
- **Lines 14-25**: Default patterns for 4 cards with slider examples
- **Lines 28-33**: `cardStates` object tracking play/pause state
- **Lines 36-41**: Audio context initialization (`getAudioContext()`, `initAudioOnFirstClick()`)
- **Lines 44-56**: `initializeCards()` - Sets default patterns, attaches button listeners
- **Lines 59-120**: `initializeStrudel()` - Async module loading, synth/soundfont registration, sample pre-loading (3s delay)
- **Lines 76-83**: Creates shared `repl` instance with `webaudioOutput` and transpiler
- **Lines 123-169**: `renderSliders()` - Dynamically generates HTML sliders from transpiler widget metadata
- **Lines 172-251**: `toggleCard()` - Core play/pause logic, pattern transpilation, evaluation with `.p(cardId)`

**`index.html`** - Static 4-card UI structure
- **Lines 8-169**: Inline CSS (dark theme, card layout, slider styles)
- **Lines 172-204**: 4 `.card` divs with headers, buttons, textareas
- **Line 210**: Script import `<script type="module" src="/src/main.js">`

**Pattern Evaluation Flow**:
1. User clicks "Play" button → `toggleCard(cardId)` called
2. Get pattern code from textarea
3. Transpile code: `transpiler(patternCode, { addReturn: false })` → returns `{ output, widgets }`
4. Render sliders from `widgets` metadata → `renderSliders(cardId, widgets)`
5. Evaluate transpiled code with unique ID: `evaluate(\`${output}.p('${cardId}')\`, true, false)`
6. Pattern registered in Strudel's `pPatterns[cardId]` and starts playing
7. Update button state: "Pause", add `.playing` class

**Pause Flow**:
1. User clicks "Pause" → `toggleCard(cardId)` called
2. Replace pattern with silence: `evaluate(\`silence.p('${cardId}')\`, true, false)`
3. Update button state: "Play", remove `.playing` class

### Critical Architectural Patterns

**Shared Audio Context** (src/main.js:36-83):
- Single `AudioContext` created via `getAudioContext()`
- Single `scheduler` instance shared by all cards
- All patterns use same `ctx.currentTime` clock → perfect sync
- CRITICAL: Browser autoplay policy requires user interaction before audio plays

**Independent Pattern Control** (src/main.js:240):
- Each card uses `.p(cardId)` method to register pattern with unique ID
- Strudel internally stores patterns in `pPatterns[cardId]`
- Patterns can start/stop independently without affecting others
- `evaluate()` signature: `evaluate(code, shouldHush=false, shouldClearPatterns=false)`
  - 2nd arg `false` prevents hushing all patterns
  - 3rd arg `false` prevents auto-clearing on evaluate

**Reactive Slider System** (src/main.js:6-17, 123-169):
- Transpiler converts `slider(800, 100, 5000)` → `sliderWithID('slider_<id>', 800, 100, 5000)`
- `sliderWithID` creates reactive `ref()` that reads from global `sliderValues` object
- `renderSliders()` extracts widget metadata from transpiler output
- Creates HTML `<input type="range">` elements bound to `sliderValues[sliderId]`
- User moves slider → updates `sliderValues[sliderId]` → reactive ref picks up change → audio parameter updates in real-time

**Sample Loading Strategy** (src/main.js:98-113):
- Pre-loads dirt-samples pack on initialization: `samples('github:tidalcycles/dirt-samples')`
- 3-second delay to allow common samples to download
- Sample loading is async in background (not blocking)
- First use of uncommon sample may cause brief error until download completes
- Users warned via console if pattern uses `s()` before samples ready

## Data Models and APIs

### Internal Data Structures

**Card State** (src/main.js:28-33):
```javascript
const cardStates = {
  'card-1': { playing: false },
  'card-2': { playing: false },
  'card-3': { playing: false },
  'card-4': { playing: false },
};
```

**Slider Values** (src/main.js:6-11):
```javascript
// Global reactive state shared with Strudel patterns
window.sliderValues = {
  'slider_<uniqueId>': <currentValue>,
  // Dynamically populated by sliderWithID() calls
};
```

**Default Patterns** (src/main.js:20-25):
```javascript
const defaultPatterns = {
  'card-1': 'note("c2 ~ c2 ~").s("sawtooth").lpf(slider(800, 100, 5000)).gain(slider(0.6, 0, 1))',
  'card-2': 's("bd*4, ~ sd ~ sd").gain(0.8)',
  'card-3': 'n("0 2 3 5").scale("C4:minor").s("triangle").lpf(600).fast(2).gain(0.5)',
  'card-4': 'n("0 3 7").scale("C3:minor").s("sawtooth").lpf(600).room(0.9).slow(4).gain(0.3)',
};
```

### Strudel Pattern API

All patterns use Strudel's mini notation and function chaining API. Reference actual Strudel docs:
- **Pattern Functions**: [strudel.cc/learn/functions](https://strudel.cc/learn/functions/)
- **Mini Notation**: [strudel.cc/learn/mini-notation](https://strudel.cc/learn/mini-notation/)

**Key Functions Used in r0astr**:
- `s(pattern)` - Sample/sound selection
- `note(pattern)` - MIDI note or note name
- `n(pattern)` - Scale degree (used with `.scale()`)
- `.scale(name)` - Apply musical scale
- `.lpf(freq)` - Low-pass filter
- `.gain(level)` - Volume (0-1)
- `.room(amount)` - Reverb (0-1)
- `.fast(factor)` - Speed up pattern
- `.slow(factor)` - Slow down pattern
- `.p(id)` - Register pattern with unique ID
- `slider(init, min, max)` - Create reactive slider control (transpiled to `sliderWithID()`)

### Planned Webhook API (Future Extension)

**Not yet implemented** - Design for MCP service integration:

| Endpoint                  | Method | Purpose                          | Request Body                        |
| ------------------------- | ------ | -------------------------------- | ----------------------------------- |
| `/api/panels`             | POST   | Create new panel                 | `{ title: string, code?: string }`  |
| `/api/panels/:id/code`    | POST   | Push code to panel               | `{ code: string }`                  |
| `/api/panels/:id/play`    | POST   | Play/pause panel                 | `{ state: 'play' \| 'pause' }`      |
| `/api/panels/:id`         | DELETE | Delete panel                     | -                                   |
| `/api/panels`             | GET    | List all panels                  | -                                   |
| `/api/panels/:id`         | GET    | Get panel state                  | -                                   |

**Implementation Notes**:
- Use lightweight HTTP server (Express.js or similar)
- CORS headers required for browser access
- Authentication/authorization TBD (likely API key-based)
- Panel state must be synchronized between HTTP API and browser UI (WebSocket or polling)

## Technical Debt and Known Issues

### Current Limitations

**1. Static Card Structure**:
- HTML hardcodes 4 cards in `index.html:172-204`
- Card initialization assumes fixed `card-1` through `card-4` IDs
- Cannot add/remove cards without editing HTML and JavaScript
- **Planned Resolution**: Dynamic panel system with programmatic panel creation

**2. Monolithic `src/main.js`**:
- All application logic in single 256-line file
- No separation of concerns (UI, state, audio, transpilation)
- Difficult to test individual components
- **Planned Resolution**: Modular architecture with separate files for panel manager, snippet manager, theme manager, API server

**3. Inline CSS in `index.html`**:
- 160+ lines of CSS embedded in HTML
- Hard to maintain and theme
- No CSS variables for theming
- **Planned Resolution**: Extract to external CSS with CSS variables, support WinAmp-style skin folders

**4. No Panel Persistence**:
- Card states (code, playing status) lost on page reload
- No localStorage or file-based state management
- **Planned Resolution**: Serialize panel state to localStorage or JSON file

**5. Slider UI Generation Limitations**:
- Sliders labeled generically "Slider 1", "Slider 2"
- No custom labels from pattern code
- Slider widgets cleared and re-rendered on every pattern change (potential flicker)
- **Consideration**: Enhance transpiler to support slider labels: `slider("cutoff", 800, 100, 5000)`

**6. Sample Loading UX**:
- 3-second blocking delay on initialization (src/main.js:105)
- "Loading..." button state but no progress indicator
- Console warnings for sample errors are not user-friendly
- **Improvement**: Add visual progress bar, better error messages in UI

**7. No Error Handling for Pattern Evaluation**:
- Pattern errors shown in browser console only
- Basic `alert()` used for errors (src/main.js:248)
- No syntax highlighting or error markers in textarea
- **Consideration**: Integrate CodeMirror for syntax highlighting and inline error display

### Workarounds and Gotchas

**Browser Autoplay Policy** (src/main.js:204):
- Web Audio requires user interaction before playing audio
- WORKAROUND: `ctx.resume()` called on every "Play" button click
- First click on any card initializes audio context for all cards

**Sample Loading Race Condition** (src/main.js:98-113):
- Samples load asynchronously in background
- First play may show errors if sample not yet loaded
- WORKAROUND: 3-second pre-load delay, console warnings to user
- NOTE: This is expected Strudel behavior, not a bug

**Transpiler Output Semicolon** (src/main.js:218-219):
- escodegen (used by transpiler) adds trailing semicolons
- WORKAROUND: `.replace(/;$/, '')` to strip semicolon before evaluation
- Required because `.p()` is a method call, not a statement

**Slider ID Generation** (src/main.js:141):
- Slider IDs based on `from` location in code (line/column)
- Changing code structure changes slider IDs, losing slider state
- CONSIDERATION: Stable slider IDs needed for state persistence

## Integration Points and External Dependencies

### Strudel Package Dependencies

All Strudel functionality imported from npm packages (locked to v1.2.x):

| Package                  | Purpose                                    | Key Imports                              |
| ------------------------ | ------------------------------------------ | ---------------------------------------- |
| @strudel/core            | Pattern primitives, repl, scheduler        | `repl`, `evalScope`, `ref`               |
| @strudel/mini            | Mini notation parser                       | Loaded via `evalScope()` in patterns     |
| @strudel/transpiler      | Code transpilation, widget extraction      | `transpiler`                             |
| @strudel/webaudio        | Web Audio output, synth registration       | `getAudioContext`, `webaudioOutput`, `initAudioOnFirstClick`, `registerSynthSounds` |
| @strudel/tonal           | Music theory (scales, chords)              | Loaded via `evalScope()` in patterns     |
| @strudel/soundfonts      | SoundFont loading, sample support          | `registerSoundfonts`                     |
| @strudel/codemirror      | Slider widgets, reactive refs              | `sliderWithID`, `sliderValues`           |

**Strudel Evaluation Scope** (src/main.js:61-69):
- All Strudel modules loaded into `evalScope()` for pattern code access
- Patterns evaluated in global scope with all Strudel functions available
- Custom functions (like `sliderValues`, `sliderWithID`) exposed via `Promise.resolve({ ... })`

### External Service Integration

**OSC Support** (Strudel Built-in):
- Use `.osc()` output in patterns
- Requires backend OSC server (e.g., SuperCollider, Max/MSP)
- NOT YET TESTED in r0astr - Strudel pattern language supports it
- Reference: [strudel.cc/learn/outputs/#osc](https://strudel.cc/learn/outputs/#osc)

**MIDI Support** (Strudel Built-in):
- Use `.midi()` output in patterns
- Uses browser Web MIDI API
- NOT YET TESTED in r0astr - Strudel pattern language supports it
- Reference: [strudel.cc/learn/outputs/#midi](https://strudel.cc/learn/outputs/#midi)

**Sample Libraries** (Strudel Built-in):
- dirt-samples: `samples('github:tidalcycles/dirt-samples')` (pre-loaded in src/main.js:101)
- Custom samples: `samples('https://example.com/samples.json')`
- SoundFonts: `soundfont('piano')`, etc.
- Reference: [strudel.cc/learn/samples](https://strudel.cc/learn/samples)

### Internal Integration Points

**Global State Sharing**:
- `window.sliderValues` (src/main.js:11) - Shared between UI and pattern evaluation
- Single `AudioContext` instance - Shared by all Strudel outputs
- Single `scheduler` instance - Manages timing for all patterns

**Pattern-to-UI Communication**:
- Transpiler emits widget metadata → `renderSliders()` generates UI
- Pattern code defines sliders via `slider()` calls
- UI slider changes update `sliderValues` → patterns react in real-time

## Development and Deployment

### Local Development Setup

**Prerequisites**:
- Node.js v16+ (for Vite)
- Modern browser with Web Audio support (Chrome, Firefox, Safari)
- npm or compatible package manager

**Setup Steps**:
1. Clone repository: `git clone git@gitlab.com:piatra_eng/r0astr.git`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Open browser: http://localhost:5173

**First Run Notes**:
- Vite dev server starts immediately
- Sample library begins loading on first page load
- Initial "Play" click initializes Web Audio context
- Expect 3-second delay before samples available

### Build and Deployment Process

**Build Command**: `npm run build`
- Uses Vite to bundle `src/main.js` and dependencies
- Output directory: `dist/`
- Bundles AudioWorklet processors via `vite-plugin-bundle-audioworklet`

**Preview Production Build**: `npm run preview`
- Serves `dist/` directory locally for testing
- Uses Vite preview server (not for production hosting)

**Deployment**:
- Deploy `dist/` folder to static hosting (Netlify, Vercel, GitHub Pages, etc.)
- No server-side rendering required
- Requires HTTPS for Web Audio autoplay policies

**Environment Configuration**:
- No environment variables currently used
- All configuration hardcoded in source

## Enhancement Roadmap

### Planned Enhancements (In Priority Order)

**1. Dynamic Panel System** (High Priority):
- Remove hardcoded 4-card HTML structure
- Implement programmatic panel creation/deletion
- Panel state management: positions, sizes, z-index, playing state
- Panel persistence to localStorage
- UI: "New Panel" button, close button per panel

**Architecture Changes**:
- New: `src/panelManager.js` - CRUD operations for panels
- New: Panel state schema: `{ id, title, code, playing, position: { x, y }, size: { w, h }, zIndex }`
- Refactor: `src/main.js` - Extract panel logic from monolith

**2. Draggable/Resizable Modal Panels** (High Priority):
- Convert card layout to modal/floating panel system
- Drag panel by header
- Resize via drag handles
- Z-index management (click to bring to front)

**Implementation Options**:
- Library: [interact.js](https://interactjs.io/) or [Muuri](https://muuri.dev/)
- Custom: CSS `position: absolute`, mouse event handlers

**3. JSON-Based Snippet Library** (Medium Priority):
- Settings panel with snippet file path input (local or GitHub URL)
- Load JSON file with hierarchical structure:
  ```json
  {
    "Bass Patterns": [
      { "name": "Simple Bass", "code": "note('c2 ~ c2 ~').s('sawtooth')" },
      { "name": "Walking Bass", "code": "..." }
    ],
    "Drum Patterns": { ... }
  }
  ```
- UI: Dropdown/tree menu to browse snippets
- Click snippet → load into panel textarea

**Architecture**:
- New: `src/snippetManager.js` - Fetch JSON, parse hierarchy, render UI
- New: Settings panel HTML/CSS
- Integration: Settings icon per panel, global settings button

**4. WinAmp-Style Theming** (Medium Priority):
- CSS variable-based theming (colors, fonts, borders)
- Skin folder structure:
  ```
  skins/
    my-theme/
      theme.json       # CSS variable mappings
      background.png
      button-play.png
      button-pause.png
  ```
- Settings panel: Theme selector, load theme from folder
- Theme switcher updates CSS variables dynamically

**Architecture**:
- New: `src/themeManager.js` - Load theme.json, apply CSS variables
- Refactor: Extract inline CSS to external file with CSS variables
- New: Default themes bundled in `public/skins/`

**5. Button Widget (Boolean Slider)** (Low Priority):
- Pattern code: `button("trigger", false)` → transpiles to `buttonWithID("button_<id>", false)`
- UI: Checkbox or toggle button
- Similar reactive architecture to sliders

**6. Webhook API for MCP Integration** (Extension Goal):
- HTTP server for external control
- Endpoints: create panel, push code, play/pause, delete
- CORS support for browser access
- WebSocket or polling for state sync between API and UI

**Architecture**:
- New: `src/api/server.js` - Express.js or similar
- New: `src/api/routes/` - Panel CRUD endpoints
- Integration: `src/panelManager.js` - API calls same manager functions as UI

**7. Additional Future Considerations** (Out of Scope):
- 3rd party DAW effects per panel (VST/AU via WASM or native)
- Visualization (waveforms, spectrograms) - explicitly NOT current focus
- Code editor upgrade to CodeMirror with syntax highlighting
- Pattern recording/export to audio file
- MIDI/OSC testing and debugging UI

## Testing Reality

### Current Test Coverage

- **Unit Tests**: None
- **Integration Tests**: None
- **E2E Tests**: None
- **Manual Testing**: Primary QA method

### Testing Strategy (Recommended)

**Future Testing Approach**:
1. Manual browser testing for audio playback
2. Automated unit tests for `panelManager.js`, `snippetManager.js`, `themeManager.js`
3. Integration tests for API endpoints (if webhook API implemented)
4. Visual regression tests for theming (Percy, Chromatic)

**Testing Challenges**:
- Web Audio API difficult to unit test (requires browser environment)
- Pattern evaluation depends on Strudel runtime (integration test only)
- Slider reactivity requires DOM and timing (use Playwright or Cypress)

## Code Style and Conventions

### Current Code Style

- **Modern JavaScript**: ES2020+ with ES modules
- **No Framework**: Vanilla JavaScript, direct DOM manipulation
- **No TypeScript**: Plain `.js` files
- **Functional Patterns**: Functions over classes
- **Descriptive Variables**: `cardStates`, `defaultPatterns`, `renderSliders`
- **Comments**: Present but minimal, focus on complex logic

### Coding Standards (Recommended)

**For Future Development**:
- Use ESLint with Airbnb or Standard config
- Use Prettier for formatting (`.prettierrc` exists but not configured)
- Separate concerns: UI, state, business logic, API
- Prefer pure functions for testability
- Document complex Strudel patterns with comments

**File Organization** (for refactored architecture):
```
src/
├── main.js              # Entry point, initialization
├── panelManager.js      # Panel CRUD, state management
├── snippetManager.js    # Snippet loading, UI
├── themeManager.js      # Theme loading, CSS variable management
├── api/
│   ├── server.js        # HTTP server initialization
│   └── routes/
│       └── panels.js    # Panel API endpoints
└── utils/
    └── storage.js       # localStorage/file persistence
```

## Appendix - Useful Commands and Scripts

### Development Commands

```bash
# Install dependencies
npm install

# Start development server (Vite HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Debugging and Troubleshooting

**Browser Console**:
- Check for Strudel initialization: "Piatra REPL initialized..."
- Sample loading: "✓ Sample library loading initiated..."
- Pattern evaluation: "Card card-X: Pattern playing"
- Slider updates: "Slider slider_X updated: Y"

**Common Issues**:

1. **No audio playback**:
   - Check browser console for autoplay policy errors
   - Ensure user clicked "Play" button (required for audio context initialization)
   - Verify Web Audio API support in browser

2. **Sample errors on first play**:
   - Expected behavior - samples load async
   - Wait 3-5 seconds for dirt-samples to download
   - Less common samples may load on-demand

3. **Pattern evaluation errors**:
   - Check console for transpiler errors
   - Verify Strudel syntax (see [strudel.cc/learn](https://strudel.cc/learn))
   - Alert dialog shows error message with line number

4. **Sliders not appearing**:
   - Ensure pattern uses `slider()` function
   - Check transpiler output in console: "Transpiled code for card-X: ..."
   - Verify `sliderValues` is globally accessible: `console.log(window.sliderValues)`

### Vite Configuration

**`vite.config.mjs`**:
```javascript
import { defineConfig } from 'vite';
import bundleAudioWorkletPlugin from 'vite-plugin-bundle-audioworklet';

export default defineConfig({
  plugins: [bundleAudioWorkletPlugin()],
});
```

**AudioWorklet Plugin**:
- Bundles Web Audio AudioWorklet processors
- Required for Strudel's custom audio nodes
- Handles worker script bundling during build

### Version Management

**Current Version**: 0.1.0 (stored in `VERSION` file)

**Update Process**:
1. Update `VERSION` file
2. Update `CHANGELOG.md` with changes
3. Commit: `git commit -m "chore: bump version to X.Y.Z"`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push && git push --tags`

## Summary for AI Development Agents

### Current State (v0.1.0)

r0astr is a **minimal wrapper** around Strudel (stable fork) providing a 4-card multi-instrument live coding interface. Core functionality works but architecture is **monolithic and static**.

**What Works**:
- ✅ Independent pattern playback across 4 cards with shared audio clock
- ✅ Dynamic slider generation from pattern code
- ✅ Sample library pre-loading (dirt-samples)
- ✅ Pattern transpilation with `slider()` → `sliderWithID()` conversion
- ✅ Basic play/pause controls per card

**What Needs Enhancement**:
- ❌ Static HTML card structure (hardcoded 4 cards)
- ❌ Monolithic `src/main.js` (256 lines, no separation of concerns)
- ❌ No panel persistence (state lost on reload)
- ❌ No theming system (inline CSS only)
- ❌ No snippet library
- ❌ No API for external control

### Development Focus Areas

**For BMAD Senior Dev Agents**:

1. **Refactor to Modular Architecture**:
   - Extract panel management, snippet loading, theme management to separate modules
   - Implement dependency injection for testability
   - Separate UI rendering from business logic

2. **Implement Dynamic Panel System**:
   - Replace static HTML with programmatic panel creation
   - Panel state schema with positions, sizes, z-index
   - Drag/resize library integration or custom implementation
   - localStorage persistence

3. **Build Snippet Library**:
   - JSON file loading (local + GitHub URLs)
   - Hierarchical navigation UI
   - Integration with panel textareas

4. **Add Theming System**:
   - CSS variable extraction
   - Theme file format (JSON + asset folder)
   - Theme switcher UI in settings panel

5. **Prepare for API Integration**:
   - Design webhook API schema for MCP
   - State synchronization strategy (WebSocket vs polling)
   - CORS and authentication considerations

### Key Constraints

- **Maintain Strudel Compatibility**: OSC, MIDI, sound libraries must continue working
- **Expert-Level Code**: Senior developer patterns, no hand-holding comments
- **Vanilla JavaScript**: No frameworks (React, Vue, etc.) - keep it lightweight
- **Stable Fork**: Do NOT upgrade Strudel packages unless critical bug fix

### Next Steps

Recommended implementation order:
1. Extract `panelManager.js` from `src/main.js`
2. Implement dynamic panel creation/deletion
3. Add localStorage persistence
4. Integrate drag/resize library
5. Build snippet manager with JSON loading
6. Extract CSS and implement theming system
7. Design and implement webhook API (extension goal)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-15
**Maintained By**: BMad Master (AI Agent)
**Target Audience**: Senior BMAD Development Agents
