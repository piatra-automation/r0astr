# Story docs-5.1: Showcase Page

## Status

Draft

## Story

**As a** visitor exploring r0astr,
**I want** to see what others have created,
**so that** I'm inspired to try it.

## Acceptance Criteria

1. Static markdown page with community creations
2. Format: embedded videos, SoundCloud links, or screenshots with descriptions
3. 3-5 initial showcases (can be creator's own work)
4. "Submit your creation" instructions
5. Categories or tags if content warrants

## Tasks / Subtasks

- [ ] Task 1: Create Page Structure (AC: 1)
  - [ ] Page title and introduction
  - [ ] Featured Creations section
  - [ ] Community Submissions section

- [ ] Task 2: Define Entry Format (AC: 2)
  - [ ] Title and creator
  - [ ] Description
  - [ ] Embed or link
  - [ ] Patterns used (optional)

- [ ] Task 3: Create Initial Showcases (AC: 3)
  - [ ] Showcase 1: Ambient Textures demo
  - [ ] Showcase 2: Techno Jam demo
  - [ ] Showcase 3: Live performance example
  - [ ] Placeholder for community submissions

- [ ] Task 4: Write Submission Instructions (AC: 4)
  - [ ] What to include
  - [ ] How to submit (GitHub PR or Issue)
  - [ ] Content guidelines
  - [ ] Media requirements

- [ ] Task 5: Add Categories (AC: 5)
  - [ ] Consider: Live Performances, Studio Sessions, Tutorials
  - [ ] Only add if enough content
  - [ ] Note: Can expand later

## Dev Notes

### Target File
- `docs-source/community/showcase.md`

### Current State
Stub exists with structure. Needs initial content.

### Entry Format Template
```markdown
### Creation Title

*By Creator Name*

Brief description of the creation and approach.

<!-- Video/Audio embed here -->
[Watch on YouTube](link) | [Listen on SoundCloud](link)

**Patterns used:**
- Card 1: `s("bd*4")`
- Card 2: `note("c2").lpf(400)`
```

### Initial Showcases to Create
1. **Ambient Textures Session** - Demonstration of layered ambient patterns
2. **Techno Jam** - Minimal techno with master panel filter sweeps
3. **r0astr Demo** - General walkthrough (video)

### Submission Guidelines
- Title and description required
- Video, audio, or screenshots accepted
- Include patterns if willing to share
- Family-friendly content only

### Testing

- Verify all embeds render
- Check submission links work
- Review for clarity

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
