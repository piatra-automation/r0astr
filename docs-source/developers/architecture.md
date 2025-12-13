# Architecture Overview

Technical overview of r0astr's system design.

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │                  r0astr UI                       │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │    │
│  │  │ Panel 1 │ │ Panel 2 │ │ Panel 3 │ │Panel 4│ │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └───┬───┘ │    │
│  │       │           │           │          │      │    │
│  │       └───────────┼───────────┼──────────┘      │    │
│  │                   ▼                              │    │
│  │          ┌────────────────┐                     │    │
│  │          │ Strudel Engine │                     │    │
│  │          │  (Scheduler)   │                     │    │
│  │          └───────┬────────┘                     │    │
│  │                  │                              │    │
│  │                  ▼                              │    │
│  │          ┌────────────────┐                     │    │
│  │          │  Web Audio API │                     │    │
│  │          └────────────────┘                     │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         │ WebSocket                      │
│                         ▼                                │
│              ┌─────────────────────┐                    │
│              │   Remote Control    │                    │
│              │   (iPad/Phone)      │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### UI Layer (`src/main.js`)

- Panel management (create, update, delete)
- Pattern editor with CodeMirror
- Slider controls (auto-generated from patterns)
- Master panel for global controls

### Strudel Integration

```javascript
const { evaluate, scheduler } = repl({
  defaultOutput: webaudioOutput,
  getTime: () => ctx.currentTime,
  transpiler,
});
```

Key integration points:

- **repl()** - Creates the pattern evaluation environment
- **evaluate()** - Compiles and runs pattern code
- **scheduler** - Manages pattern timing and synchronization
- **transpiler** - Converts pattern code to executable JavaScript

### Audio Engine

- Single shared `AudioContext` (browser requirement)
- All patterns share the same audio clock
- Web Audio nodes for synthesis and effects

### WebSocket Server

- Runs on the Vite dev server
- Handles remote control connections
- Broadcasts state changes to all clients

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main HTML structure |
| `src/main.js` | Application logic |
| `src/panels.js` | Panel management |
| `src/websocket.js` | Real-time communication |
| `vite.config.mjs` | Build configuration |

## Data Flow

1. User edits pattern in panel
2. Pattern sent to Strudel transpiler
3. Transpiler generates executable code
4. Scheduler evaluates pattern each cycle
5. Audio output sent to Web Audio API
6. State changes broadcast via WebSocket

## Strudel Packages Used

| Package | Purpose |
|---------|---------|
| `@strudel/core` | Pattern engine |
| `@strudel/mini` | Mini notation parser |
| `@strudel/transpiler` | Code transpiler |
| `@strudel/webaudio` | Audio output |
| `@strudel/tonal` | Music theory |
| `@strudel/soundfonts` | SoundFont support |

## Build Pipeline

```
Source Files
     │
     ▼
Vite Development Server ──► Hot Module Replacement
     │
     ▼
Vite Build
     │
     ├──► dist/          (Electron app)
     │
     └──► dist-lite/     (Web-only, no server)
              │
              ▼
         GitHub Pages
```

---

*See [Contributing](contributing.md) for development setup.*
