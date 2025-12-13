# Story docs-3.4: Architecture Overview

## Status

Draft

## Story

**As a** developer exploring the codebase,
**I want** a high-level architecture guide,
**so that** I can understand how components fit together.

## Acceptance Criteria

1. System diagram: frontend, audio engine, WebSocket server
2. Key files and their responsibilities
3. Strudel integration points
4. State management approach
5. Build and deployment pipeline
6. Links to relevant source files

## Tasks / Subtasks

- [ ] Task 1: Create System Diagram (AC: 1)
  - [ ] ASCII or Mermaid diagram
  - [ ] Show Browser, UI, Strudel, Web Audio, WebSocket
  - [ ] Show Remote Control connection
  - [ ] Clear labels and relationships

- [ ] Task 2: Document Key Files (AC: 2)
  - [ ] index.html - Main HTML structure
  - [ ] src/main.js - Application logic
  - [ ] src/panels.js - Panel management
  - [ ] src/websocket.js - WebSocket handling
  - [ ] vite.config.mjs - Build configuration

- [ ] Task 3: Document Strudel Integration (AC: 3)
  - [ ] repl() setup and configuration
  - [ ] evaluate() for pattern execution
  - [ ] scheduler for timing
  - [ ] transpiler usage
  - [ ] Reference strudel-integration-gotchas.md

- [ ] Task 4: Document State Management (AC: 4)
  - [ ] How panel state is tracked
  - [ ] How patterns are stored
  - [ ] WebSocket state synchronization

- [ ] Task 5: Document Build Pipeline (AC: 5)
  - [ ] Source files
  - [ ] Vite dev server
  - [ ] Production build (dist/)
  - [ ] Lite build (dist-lite/)
  - [ ] GitHub Pages deployment

- [ ] Task 6: Add Source Links (AC: 6)
  - [ ] Link to key files in GitHub
  - [ ] Link to Strudel packages used

## Dev Notes

### Target File
- `docs-source/developers/architecture.md`

### Current State
Stub exists with system diagram. Needs expansion and verification.

### System Diagram (ASCII)
```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │                  r0astr UI                       │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │    │
│  │  │ Panel 1 │ │ Panel 2 │ │ Panel 3 │ │Panel 4│ │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └───┬───┘ │    │
│  │       └───────────┼───────────┼──────────┘      │    │
│  │                   ▼                              │    │
│  │          ┌────────────────┐                     │    │
│  │          │ Strudel Engine │                     │    │
│  │          └───────┬────────┘                     │    │
│  │                  ▼                              │    │
│  │          ┌────────────────┐                     │    │
│  │          │  Web Audio API │                     │    │
│  │          └────────────────┘                     │    │
│  └─────────────────────────────────────────────────┘    │
│                         │ WebSocket                      │
│                         ▼                                │
│              ┌─────────────────────┐                    │
│              │   Remote Control    │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Strudel Packages Used
| Package | Purpose |
|---------|---------|
| @strudel/core | Pattern engine |
| @strudel/mini | Mini notation parser |
| @strudel/transpiler | Code transpiler |
| @strudel/webaudio | Audio output |
| @strudel/tonal | Music theory |
| @strudel/soundfonts | SoundFont support |

### Testing

- Verify diagram matches actual architecture
- Check all file references are correct
- Test links to source files

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-13 | 1.0 | Story created | Bob (SM Agent) |

## Dev Agent Record

### Agent Model Used
_To be filled during implementation_

### Debug Log References
_To be filled during implementation_

### Completion Notes List
_To be filled during implementation_

### File List
_To be filled during implementation_

## QA Results
_To be filled after QA review_
