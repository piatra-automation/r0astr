# Story docs-3.2: Plugin Development Guide

## Status

Draft

## Story

**As a** developer building a plugin,
**I want** a guide to the plugin architecture,
**so that** I can create and distribute plugins.

## Acceptance Criteria

1. Plugin concept and use cases explained
2. Plugin structure/boilerplate
3. Hooking into r0astr lifecycle events
4. Using the API from a plugin
5. Testing plugins locally
6. Packaging and distribution (future marketplace notes)
7. Example "hello world" plugin

## Tasks / Subtasks

- [ ] Task 1: Write Plugin Concepts section (AC: 1)
  - [ ] What is a plugin?
  - [ ] Use cases (MIDI, OSC, sequencer, visualizer)
  - [ ] Plugin capabilities and limitations

- [ ] Task 2: Write Plugin Structure section (AC: 2)
  - [ ] Recommended file structure
  - [ ] package.json requirements
  - [ ] Entry point conventions

- [ ] Task 3: Write Lifecycle Events section (AC: 3)
  - [ ] Available events to hook into
  - [ ] Event subscription patterns
  - [ ] Example event handlers

- [ ] Task 4: Write API Integration section (AC: 4)
  - [ ] Connecting to WebSocket
  - [ ] Sending commands
  - [ ] Receiving state updates
  - [ ] Error handling

- [ ] Task 5: Write Testing section (AC: 5)
  - [ ] Running r0astr locally
  - [ ] Connecting plugin to local instance
  - [ ] Debugging tips

- [ ] Task 6: Write Distribution section (AC: 6)
  - [ ] Current: Share via GitHub/npm
  - [ ] Future: Marketplace (coming soon)
  - [ ] Packaging guidelines

- [ ] Task 7: Create Hello World example (AC: 7)
  - [ ] Complete working plugin code
  - [ ] Step-by-step explanation
  - [ ] Expected behavior

## Dev Notes

### Target File
- `docs-source/developers/plugins.md`

### Current State
Stub exists with basic outline. Needs comprehensive expansion.

### Hello World Plugin Example
```javascript
// r0astr-hello-plugin/src/index.js
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5173/ws');

ws.on('open', () => {
  console.log('Connected to r0astr');

  // Start panel 1 on connect
  ws.send(JSON.stringify({
    type: 'panel:start',
    payload: { panelId: 'panel-1' }
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Event:', message.type);
});

ws.on('error', (err) => {
  console.error('Connection error:', err);
});
```

### Plugin Ideas to Mention
- MIDI Controller integration
- OSC Bridge (SuperCollider, Max/MSP)
- Pattern Sequencer
- Audio Visualizer
- Lighting control (DMX)

### Testing

- Verify hello world plugin works
- Check API references are accurate
- Test all code examples

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
