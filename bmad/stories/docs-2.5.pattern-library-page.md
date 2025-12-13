# Story docs-2.5: Pattern Library Page

## Status

Draft

## Story

**As a** user seeking inspiration,
**I want** a collection of ready-to-use patterns,
**so that** I can copy-paste and learn by example.

## Acceptance Criteria

1. Organized by category: Drums, Bass, Melody, Ambient, FX
2. Each pattern has: name, description, copy-paste code, audio preview (optional/future)
3. Minimum 20 patterns total across categories
4. Difficulty indicators (beginner/intermediate/advanced)
5. "Contribute a pattern" link to contributing guide

## Tasks / Subtasks

- [ ] Task 1: Structure the page (AC: 1)
  - [ ] Create Drums section with header
  - [ ] Create Bass section with header
  - [ ] Create Melody section with header
  - [ ] Create Ambient section with header
  - [ ] Create FX section with header

- [ ] Task 2: Create pattern format (AC: 2, 4)
  - [ ] Pattern name as h3
  - [ ] Code block with pattern
  - [ ] Brief description
  - [ ] Difficulty tag (italics)

- [ ] Task 3: Write Drums patterns (AC: 3)
  - [ ] Basic Four-on-the-Floor (beginner)
  - [ ] Rock Beat (beginner)
  - [ ] Breakbeat (intermediate)
  - [ ] Minimal Techno (beginner)
  - [ ] Complex Polyrhythm (advanced)

- [ ] Task 4: Write Bass patterns (AC: 3)
  - [ ] Simple Sub (beginner)
  - [ ] Walking Bass (beginner)
  - [ ] Acid Bass with slider (intermediate)
  - [ ] Syncopated Bass (intermediate)

- [ ] Task 5: Write Melody patterns (AC: 3)
  - [ ] Simple Arpeggio (beginner)
  - [ ] Fast Arp (beginner)
  - [ ] Chord Stabs (intermediate)
  - [ ] Scale Runner (intermediate)
  - [ ] Generative Melody (advanced)

- [ ] Task 6: Write Ambient patterns (AC: 3)
  - [ ] Pad Drone (beginner)
  - [ ] Shimmer (intermediate)
  - [ ] Evolving Texture (advanced)

- [ ] Task 7: Write FX patterns (AC: 3)
  - [ ] Noise Sweep (beginner)
  - [ ] Glitch Hits (intermediate)

- [ ] Task 8: Add Full Arrangement section
  - [ ] Complete 4-card arrangement
  - [ ] Instructions for combining patterns

- [ ] Task 9: Add contribution link (AC: 5)
  - [ ] "Contribute a pattern" callout
  - [ ] Link to contributing.md

## Dev Notes

### Target File
- `docs-source/learn/pattern-library.md`

### Current State
Stub exists with ~15 patterns. Needs expansion to 20+ and better organization.

### Pattern Template
```markdown
### Pattern Name
```javascript
pattern("code here")
```
*Difficulty* - Brief description.
```

### Patterns to Add (supplement existing)
- Complex Polyrhythm (drums, advanced)
- Syncopated Bass (bass, intermediate)
- Scale Runner (melody, intermediate)
- Generative Melody (melody, advanced)
- Evolving Texture (ambient, advanced)

### Full Arrangement Section
Provide patterns for all 4 cards that work together as a cohesive track.

### Testing

- Verify all 20+ patterns are valid Strudel code
- Test patterns in actual r0astr
- Check difficulty ratings are appropriate
- Verify copy buttons work

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
