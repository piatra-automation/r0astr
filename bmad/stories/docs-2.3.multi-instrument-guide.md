# Story docs-2.3: Multi-Instrument Guide

## Status

Done

## Story

**As a** user with multiple cards,
**I want** to understand how to use cards together effectively,
**so that** I can create layered compositions.

## Acceptance Criteria

1. Starting and stopping individual cards
2. How synchronization works (shared clock)
3. Complementary pattern design (drums + bass + melody)
4. Using different instruments per card
5. Performance tips: which cards to start/stop when
6. Example "full arrangement" with patterns for all 4 cards

## Tasks / Subtasks

- [ ] Task 1: Write Start/Stop section (AC: 1)
  - [ ] How to start a single card
  - [ ] How to stop a single card
  - [ ] What happens to other cards
  - [ ] Stop All button behavior

- [ ] Task 2: Write Synchronization section (AC: 2)
  - [ ] Explain shared clock concept
  - [ ] New cards join in sync
  - [ ] Why this matters for live performance

- [ ] Task 3: Write Complementary Patterns section (AC: 3)
  - [ ] Role of drums (rhythm foundation)
  - [ ] Role of bass (harmonic foundation)
  - [ ] Role of melody (interest/movement)
  - [ ] Role of ambient (texture/space)

- [ ] Task 4: Write Different Instruments section (AC: 4)
  - [ ] Using samples vs synths
  - [ ] Matching sounds to roles
  - [ ] Frequency separation tips

- [ ] Task 5: Write Performance Tips section (AC: 5)
  - [ ] Start with drums to establish groove
  - [ ] Layer in bass next
  - [ ] Add melody and ambient
  - [ ] Use stops for dynamics

- [ ] Task 6: Create Full Arrangement example (AC: 6)
  - [ ] Card 1: Drums pattern
  - [ ] Card 2: Bass pattern
  - [ ] Card 3: Melody pattern
  - [ ] Card 4: Ambient pattern
  - [ ] Explain how they work together

## Dev Notes

### Target File
- `docs-source/learn/multi-instrument.md`

### Current State
Stub exists. Needs full content.

### Full Arrangement Example

**Card 1 - Drums:**
```javascript
s("bd*4, ~ sd ~ sd, hh*8").gain(0.8)
```

**Card 2 - Bass:**
```javascript
note("c2 ~ c2 e2").s("sawtooth").lpf(300).gain(0.6)
```

**Card 3 - Melody:**
```javascript
n("0 2 3 5 3 2").scale("C4:minor").s("triangle").lpf(1200).fast(2)
```

**Card 4 - Ambient:**
```javascript
n("0 3 7").scale("C3:minor").s("sawtooth").lpf(600).room(0.9).slow(4).gain(0.4)
```

### Key Points to Emphasize
- Each card is independent but synchronized
- Design patterns to complement, not clash
- Use frequency separation (bass low, melody mid-high)
- Dynamic performance through selective starts/stops

### Testing

- Verify all patterns work together
- Test copy-paste into actual r0astr
- Check readability and flow

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
- Four-card setup overview with typical roles table
- Starting/stopping cards section with Stop All explanation
- Synchronization section with how it works and why it matters
- Complementary pattern design for drums, bass, melody, ambient
- Different instruments section with samples vs synths comparison
- Frequency separation tips table
- Performance tips for building up and creating dynamics
- Complete full arrangement example with all 4 cards
- Performance walkthrough sequence
- Navigation to Master Panel and Pattern Library

### File List
- docs-source/learn/multi-instrument.md (modified)

## QA Results
_To be filled after QA review_
