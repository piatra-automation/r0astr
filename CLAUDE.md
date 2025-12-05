# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: Read This First

**Before working with Strudel integration, YOU MUST read:**
- **[docs/architecture/strudel-integration-gotchas.md](docs/architecture/strudel-integration-gotchas.md)**

This document contains critical lessons learned through significant debugging effort:
- **Transpiler blocking issue** - `transpiler()` HANGS in master panel context
- **CPS vs CPM confusion** - Strudel uses `scheduler.setCps()` NOT `setCpm()`
- **Master panel pattern** - Use regex parsing, NOT transpiler
- **Slider reactivity** - Use `ref(() => sliderValues[id])` pattern
- **TEMPO special handling** - Requires CPS conversion and scheduler.setCps()

**Ignoring these gotchas will cost hours of debugging time.** The patterns documented there were validated through trial and error and are the ONLY known working approaches.

---

## Project Overview

r0astr is a multi-instrument live coding interface built on top of the Strudel pattern language. It provides an intuitive card-based UI for controlling multiple independent musical instruments that share a synchronized audio clock.

**Technology:** Vanilla JavaScript + Vite + Strudel npm packages

## Development Commands

### Setup
```bash
npm install     # Install all dependencies
```

### Running the Application
```bash
npm run dev     # Start development server at localhost:5173
npm run build   # Build for production
npm run preview # Preview production build
```

## Project Architecture

### Core Files

- **index.html** - Main HTML interface with 4 instrument cards
- **src/main.js** - Application logic, Strudel initialization, pattern evaluation
- **package.json** - Dependencies (all Strudel packages from npm)
- **vite.config.mjs** - Vite configuration with AudioWorklet plugin

### Dependencies

All Strudel functionality is imported from published npm packages:

```json
{
  "@strudel/core": "^1.2.5",         // Pattern engine
  "@strudel/mini": "^1.2.5",         // Mini notation parser
  "@strudel/transpiler": "^1.2.5",   // Code transpiler
  "@strudel/webaudio": "^1.2.6",     // Web Audio integration
  "@strudel/tonal": "^1.2.5",        // Music theory
  "@strudel/soundfonts": "^1.2.6",   // SoundFont support
  "@strudel/codemirror": "^1.2.6"    // Editor integration
}
```

### Key Architectural Patterns

**Shared Audio Context:**
```javascript
const ctx = getAudioContext();
const { evaluate, scheduler } = repl({
  defaultOutput: webaudioOutput,
  getTime: () => ctx.currentTime,
  transpiler,
});
```

**Independent Pattern Control:**
```javascript
// Each card uses .p() method with unique ID
evaluate(`${patternCode}.p('card-1')`, true, false);

// Stop specific pattern
scheduler.stop('card-1');
```

**Master Panel Global Sliders:**
```javascript
// Master panel code (parsed with regex, NOT transpiler):
let SLIDER_LPF = slider(800, 100, 5000);
let TEMPO = slider(30, 15, 45);

// Creates global refs accessible in all cards:
note("c2").lpf(SLIDER_LPF).gain(0.6)

// ⚠️ See docs/architecture/strudel-integration-gotchas.md for details
```

**Card Sliders (Auto-generated):**
```javascript
// slider() in card pattern creates inline controls
note("c2").lpf(slider(800, 100, 5000))
// Transpiler converts to sliderWithID() calls
// UI automatically renders slider controls
```

## Code Style

- Modern JavaScript (ES modules)
- Vanilla JS (no framework)
- Functional patterns
- Descriptive variable names
- Comments for complex logic

## Common Tasks

### Adding a New Instrument Card

1. Add card HTML in `index.html`:
```html
<div class="card" id="card-5">
  <div class="card-header">
    <h3>Instrument 5</h3>
    <button class="control-btn" data-card="card-5">Play</button>
  </div>
  <textarea class="code-input" data-card="card-5"></textarea>
</div>
```

2. Add default pattern in `src/main.js`:
```javascript
const defaultPatterns = {
  'card-5': 'your pattern here',
};

const cardStates = {
  'card-5': { playing: false },
};
```

### Updating Strudel Versions

```bash
npm update @strudel/core @strudel/mini @strudel/transpiler @strudel/webaudio
```

### Debugging

- Check browser console for errors
- Sample loading may cause temporary errors (normal on first use)
- Pattern evaluation errors shown in console with line numbers
- Use `console.log()` in pattern code for debugging

## Project Structure

```
r0astr/
├── index.html              # Main interface (4 instrument cards + master panel)
├── src/
│   └── main.js            # App logic, Strudel integration
├── docs/
│   ├── brownfield-architecture.md           # Original architecture notes
│   └── architecture/
│       └── strudel-integration-gotchas.md  # ⚠️ CRITICAL: Integration pitfalls
├── package.json           # npm dependencies
├── vite.config.mjs        # Build configuration
├── .claude/
│   └── piatra.json        # Project metadata
├── .vscode/               # VSCode settings
├── LICENSE                # AGPL-3.0
├── README.md              # User documentation
├── CLAUDE.md              # This file
└── delete_me/             # Legacy Strudel monorepo (safe to delete)
```

## delete_me/ Folder

The `delete_me/` folder contains the original Strudel monorepo that this project was forked from. It's no longer needed since r0astr now uses published Strudel packages from npm. The folder can be safely deleted once confirmed the application works correctly.

## Strudel Pattern Language Basics

**Mini Notation:**
```javascript
s('bd hh sd hh')           // Sequence of sounds
s('bd*4')                  // Multiply pattern (4 kicks)
s('bd [hh hh]')            // Subdivide (hi-hats twice as fast)
s('bd, hh*8')              // Stack patterns (layering)
```

**Functions:**
```javascript
.gain(0.5)                 // Set volume
.lpf(800)                  // Low-pass filter
.fast(2)                   // Speed up 2x
.slow(2)                   // Slow down 2x
.room(0.5)                 // Add reverb
```

**Notes & Scales:**
```javascript
note("c3 e3 g3")           // Specific notes
n("0 2 4").scale("C:minor") // Scale degrees
```

## References

### Critical Documentation (READ FIRST)
- **[Strudel Integration Gotchas](docs/architecture/strudel-integration-gotchas.md)** - ⚠️ MUST READ before working with Strudel

### Project Documentation
- [Brownfield Architecture Notes](docs/brownfield-architecture.md) - Original architecture analysis
- [README.md](README.md) - User-facing documentation

### External References
- [Strudel Documentation](https://strudel.cc/learn/)
- [Strudel Pattern Reference](https://strudel.cc/learn/functions/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Vite Documentation](https://vitejs.dev/)

## License

GNU Affero General Public License v3.0 (AGPL-3.0-or-later)

## Repository

- **GitLab:** git@gitlab.com:piatra_eng/r0astr.git
- **Branch:** master (main development branch)
