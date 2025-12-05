# r0astr

Multi-instrument live coding interface built on [Strudel](https://strudel.cc) - A powerful algorithmic music composition environment for the web.

## What is r0astr?

r0astr is a custom web application that provides a multi-card interface for live coding music. Each card represents an independent instrument that can be controlled separately while sharing a common synchronized audio clock.

Built on top of the Strudel pattern language (a JavaScript port of TidalCycles), r0astr makes it easy to:
- Control multiple instruments independently
- Live code patterns with interactive sliders
- Mix and layer sounds in real-time
- Experiment with algorithmic composition

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open http://localhost:5173 in your browser.

## How to Use

1. **Click "Play"** on any card to start that instrument
2. **Click "Pause"** to mute just that instrument (others keep playing)
3. **Edit the pattern code** in the textarea
4. **Click Play again** to update the pattern
5. All instruments stay perfectly synchronized

## Remote Control (iPad/Phone)

r0astr supports real-time remote control via WebSocket:

1. **Start the server:** `npm run dev`
2. **Note the network address:** e.g., `http://192.168.3.102:5173/`
3. **Main interface (laptop):** Open the network URL
4. **Remote control (iPad):** Open `http://192.168.3.102:5173/remote.html`

The remote control provides:
- Touch-optimized panel buttons
- Real-time state synchronization
- Stop All functionality
- Auto-reconnection

Perfect for live performances where you want the main interface for coding and an iPad as a control surface.

See [docs/remote-control.md](./docs/remote-control.md) for detailed setup and protocol documentation.

## Architecture

r0astr demonstrates key patterns for building custom Strudel UIs:

### Shared Audio Context
- Single Web Audio context for all instruments (browser requirement)
- Single scheduler ensures perfect synchronization
- All patterns share the same audio clock

### Independent Pattern Control
- Each card has a unique pattern ID
- Patterns can be started/stopped individually
- Live updates without affecting other instruments

### Interactive Controls
- Slider widgets for real-time parameter control
- Transpiler support for reactive programming
- Dynamic UI generation from code

## Technology Stack

- **Frontend**: Vanilla JavaScript + Vite
- **Pattern Engine**: Strudel (@strudel/core, @strudel/mini)
- **Audio**: Web Audio API (@strudel/webaudio)
- **Synthesis**: Built-in synths + sample library
- **Editor Features**: @strudel/codemirror for advanced editing
- **Music Theory**: @strudel/tonal for scales, chords, note conversions
- **Remote Control**: WebSocket (ws) for real-time remote control

## Project Structure

```
r0astr/
├── index.html          # Main HTML interface
├── src/
│   └── main.js         # Application logic & Strudel setup
├── package.json        # Dependencies & scripts
├── vite.config.mjs     # Vite configuration
├── .claude/            # Claude Code integration
└── delete_me/          # Legacy Strudel monorepo (can be deleted)
```

## Example Patterns

### Bass Line
```javascript
note("c2 ~ c2 ~").s("sawtooth").lpf(slider(800, 100, 5000))
```

### Drums
```javascript
s("bd*4, ~ sd ~ sd").gain(0.8)
```

### Melody
```javascript
n("0 2 3 5").scale("C4:minor").s("triangle").lpf(600).fast(2)
```

### Ambient Pads
```javascript
n("0 3 7").scale("C3:minor").s("sawtooth").lpf(600).room(0.9).slow(4)
```

## Development

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## About Strudel

Strudel is a live coding environment that brings the power of TidalCycles to the browser. It uses a mini notation language for describing patterns and provides:

- Powerful pattern composition primitives
- Web Audio synthesis and sampling
- MIDI and OSC output
- Extensive music theory utilities
- Real-time code evaluation

Learn more at [strudel.cc](https://strudel.cc)

## License

GNU Affero General Public License v3.0 (AGPL-3.0-or-later)

## Credits

Built with [Strudel](https://strudel.cc) by Alex McLean and contributors.

r0astr interface by Peter Kalt (Piatra Engineering).
