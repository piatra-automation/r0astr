# Story docs-2.4: Master Panel Guide

## Status

Done

## Story

**As a** user controlling global parameters,
**I want** to understand the master panel,
**so that** I can control tempo and global effects.

## Acceptance Criteria

1. TEMPO slider behavior (CPS conversion explained simply)
2. Global effect sliders (LPF, etc.)
3. How master panel variables are referenced in card patterns
4. Creating custom master panel sliders
5. Stop All functionality
6. Note about master panel code parsing (for advanced users)

## Tasks / Subtasks

- [ ] Task 1: Write TEMPO section (AC: 1)
  - [ ] What TEMPO controls
  - [ ] Range and typical values
  - [ ] Relationship to CPS (simple explanation)
  - [ ] How tempo affects all cards

- [ ] Task 2: Write Global Effects section (AC: 2)
  - [ ] Default global sliders (if any)
  - [ ] How to add global effect sliders
  - [ ] Example: global LPF slider

- [ ] Task 3: Write Variable Reference section (AC: 3)
  - [ ] How to define variables in master panel
  - [ ] How to use them in card patterns
  - [ ] Example workflow

- [ ] Task 4: Write Custom Sliders section (AC: 4)
  - [ ] Syntax for creating sliders
  - [ ] Naming conventions
  - [ ] Multiple sliders example

- [ ] Task 5: Write Stop All section (AC: 5)
  - [ ] What Stop All does
  - [ ] When to use it
  - [ ] Keyboard shortcut (if available)

- [ ] Task 6: Write Advanced Note (AC: 6)
  - [ ] How master panel code is parsed
  - [ ] Difference from card pattern evaluation
  - [ ] Why regex parsing is used
  - [ ] Link to architecture docs for details

## Dev Notes

### Target File
- `docs-source/learn/master-panel.md`

### Current State
Stub exists. Needs full content.

### Critical Technical Context
From `docs/architecture/strudel-integration-gotchas.md`:
- Master panel uses regex parsing, NOT transpiler
- TEMPO requires CPS conversion and scheduler.setCps()
- Slider pattern: `let NAME = slider(default, min, max);`

### Master Panel Example
```javascript
// Master Panel Code
let SLIDER_LPF = slider(800, 100, 5000);
let TEMPO = slider(30, 15, 45);
let REVERB = slider(0.3, 0, 1);
```

### Using in Cards
```javascript
// In any card:
note("c2").lpf(SLIDER_LPF).room(REVERB).gain(0.6)
```

### CPS Explanation (Keep Simple)
- CPS = Cycles Per Second
- TEMPO slider value is converted to CPS internally
- Users don't need to understand the math

### Testing

- Verify examples work in actual r0astr
- Check advanced section doesn't overwhelm beginners
- Test all links

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-13 | 1.0 | Story created | Bob (SM Agent) |

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (James - Dev Agent)

### Debug Log References
N/A - Documentation task

### Completion Notes List
- Comprehensive TEMPO section explaining CPS in simple terms
- Global effect sliders with creation and usage examples
- Variable reference workflow (3-step process)
- Naming conventions table
- Creating custom sliders with syntax and examples
- Stop All behavior section
- Advanced section explaining regex parsing vs transpiler
- TEMPO special handling with scheduler.setCps()
- Quick reference section for copy-paste
- Navigation to Pattern Library and Architecture docs

### File List
- docs-source/learn/master-panel.md (modified)

## QA Results
_To be filled after QA review_
