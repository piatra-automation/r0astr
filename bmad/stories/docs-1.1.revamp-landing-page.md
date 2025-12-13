# Story docs-1.1: Revamp Landing Page

## Status

Done

## Story

**As a** first-time visitor,
**I want** to immediately understand what r0astr is and how to try it,
**so that** I can decide if it's worth my time within 30 seconds.

## Acceptance Criteria

1. Hero section with tagline, animated GIF/screenshot, and two CTAs: "Try It Now" and "Download"
2. "What is r0astr?" section with 3-4 bullet value props (multi-instrument, live coding, synchronized, sliders)
3. Quick feature cards highlighting: Cards UI, Master Panel, Remote Control, Strudel-powered
4. Embedded video or GIF showing the app in action (placeholder acceptable for MVP)
5. Links to Getting Started, Downloads, and GitHub
6. Page renders correctly in both dark and light modes

## Tasks / Subtasks

- [ ] Task 1: Create hero section (AC: 1)
  - [ ] Write compelling tagline (e.g., "Multi-instrument live coding for the web")
  - [ ] Capture animated GIF or screenshot of r0astr in action
  - [ ] Add "Try It Now" button linking to app/index.html
  - [ ] Add "Download" button linking to downloads.md
  - [ ] Style hero with MkDocs Material grid cards

- [ ] Task 2: Create "What is r0astr?" section (AC: 2)
  - [ ] Write 3-4 concise value propositions
  - [ ] Use bullet list or icon cards format
  - [ ] Ensure copy is beginner-friendly

- [ ] Task 3: Create feature cards section (AC: 3)
  - [ ] Cards UI feature card with icon
  - [ ] Master Panel feature card with icon
  - [ ] Remote Control feature card with icon
  - [ ] Strudel-powered feature card with icon
  - [ ] Link each card to relevant documentation

- [ ] Task 4: Add media embed (AC: 4)
  - [ ] Create placeholder for video/GIF
  - [ ] If available, embed actual demo video
  - [ ] Ensure media is responsive

- [ ] Task 5: Add navigation links (AC: 5)
  - [ ] Link to Getting Started
  - [ ] Link to Downloads
  - [ ] Link to GitHub repository

- [ ] Task 6: Test dark/light mode (AC: 6)
  - [ ] Verify all elements render in dark mode
  - [ ] Verify all elements render in light mode
  - [ ] Check contrast and readability

## Dev Notes

### Target File
- `docs-source/index.md`

### Current State
The existing index.md is minimal with basic grid cards. Needs significant expansion.

### MkDocs Material Features to Use
- Grid cards: `<div class="grid cards" markdown>`
- Icons: `:material-icon-name:{ .lg .middle }`
- Buttons: `[:octicons-arrow-right-24: Text](link)`
- Admonitions for callouts if needed

### Content Guidelines
- Keep language simple and jargon-free
- Focus on "what can I do with this?" not technical details
- Target audience: musicians curious about live coding

### Testing

- Visual review in both dark and light modes
- Check all links work
- Verify responsive layout on mobile
- Test "Try It Now" button launches app correctly

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
- Created compelling hero section with tagline and dual CTAs
- Added "What is r0astr?" section with 4 value proposition cards
- Created feature cards for Cards UI, Master Panel, Remote Control, Strudel
- Added demo video placeholder with link to live app
- Included quick example patterns
- Added "Get Started" section with 3 navigation cards
- Added Open Source section with GitHub and contribute buttons
- All sections use MkDocs Material grid cards and icons

### File List
- docs-source/index.md (modified)

## QA Results
_To be filled after QA review_
