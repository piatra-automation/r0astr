# Story docs-2.2: Pattern Syntax Basics

## Status

Done

## Story

**As a** user learning patterns,
**I want** a reference for mini notation and common functions,
**so that** I can write my own patterns.

## Acceptance Criteria

1. Mini notation basics: sequences, rests, multiplication, subdivision
2. Common sound sources: `s()` for samples, `note()` for synths
3. Common modifiers: `gain()`, `lpf()`, `fast()`, `slow()`
4. Slider usage: `slider(default, min, max)` syntax and behavior
5. At least 10 copy-paste examples organized by category (drums, bass, melody, ambient)
6. Link to full Strudel documentation for advanced usage

## Tasks / Subtasks

- [ ] Task 1: Write Mini Notation section (AC: 1)
  - [ ] Sequences: `s("bd sd bd sd")`
  - [ ] Rests: `s("bd ~ sd ~")`
  - [ ] Multiplication: `s("bd*4")`
  - [ ] Subdivision: `s("bd [hh hh]")`
  - [ ] Provide example for each

- [ ] Task 2: Write Sound Sources section (AC: 2)
  - [ ] Samples with `s()`: built-in sounds
  - [ ] Synths with `note()`: generated tones
  - [ ] Common sample names (bd, sd, hh, cp)
  - [ ] Common synth types (sawtooth, triangle, square)

- [ ] Task 3: Write Modifiers section (AC: 3)
  - [ ] Create table of common modifiers
  - [ ] `.gain()` with range explanation
  - [ ] `.lpf()` and `.hpf()` filters
  - [ ] `.fast()` and `.slow()` tempo changes
  - [ ] `.room()` for reverb
  - [ ] Examples for each

- [ ] Task 4: Write Sliders section (AC: 4)
  - [ ] Basic syntax: `slider(default, min, max)`
  - [ ] How sliders appear in UI
  - [ ] Chaining with other functions
  - [ ] Example: `note("c2").lpf(slider(800, 100, 5000))`

- [ ] Task 5: Create 10+ examples (AC: 5)
  - [ ] 3 drum patterns (simple, rock, breakbeat)
  - [ ] 2 bass patterns (sub, walking)
  - [ ] 3 melody patterns (arp, chord stabs, lead)
  - [ ] 2 ambient patterns (pad, shimmer)

- [ ] Task 6: Add Strudel link (AC: 6)
  - [ ] Link to strudel.cc/learn
  - [ ] Brief note about advanced features

## Dev Notes

### Target File
- `docs-source/learn/patterns.md`

### Current State
Stub exists with basic structure. Needs comprehensive content expansion.

### Modifier Reference Table

| Function | Description | Example |
|----------|-------------|---------|
| `.gain(n)` | Volume (0-1) | `.gain(0.5)` |
| `.lpf(hz)` | Low-pass filter | `.lpf(800)` |
| `.hpf(hz)` | High-pass filter | `.hpf(200)` |
| `.fast(n)` | Speed up n times | `.fast(2)` |
| `.slow(n)` | Slow down n times | `.slow(2)` |
| `.room(n)` | Reverb amount | `.room(0.5)` |
| `.delay(n)` | Delay amount | `.delay(0.25)` |

### Example Patterns

**Drums:**
```javascript
s("bd*4")                           // Four-on-floor
s("bd*4, ~ sd ~ sd, hh*8")          // Rock beat
s("bd sd:1 [~ bd] sd:2").fast(2)    // Breakbeat
```

**Bass:**
```javascript
note("c2 ~ c2 ~").s("sawtooth").lpf(200)
note("c2 e2 g2 e2").s("sawtooth").lpf(400)
```

### Testing

- Verify all code examples are valid Strudel patterns
- Test copy-paste functionality
- Check syntax highlighting

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
- Comprehensive mini notation section (sequences, rests, multiplication, subdivision, stacking, alternation)
- Sound sources section with samples and synths tables
- Scales with n() function explained
- Complete modifier reference table with ranges
- Sliders section with syntax and examples
- 11 copy-paste example patterns (drums, bass, melody, ambient)
- Combining techniques section
- Link to full Strudel documentation

### File List
- docs-source/learn/patterns.md (modified)

## QA Results
_To be filled after QA review_
