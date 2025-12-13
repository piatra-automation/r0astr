# Story docs-5.2: FAQ Page

## Status

Done

## Story

**As a** user with questions,
**I want** answers to common questions,
**so that** I can self-serve before asking for help.

## Acceptance Criteria

1. Minimum 10 FAQ entries covering:
   - Installation issues
   - Audio not working
   - Patterns not updating
   - Remote control setup
   - Browser compatibility
   - Sample loading
2. Organized by category
3. Links to detailed docs where applicable

## Tasks / Subtasks

- [ ] Task 1: Create FAQ Structure
  - [ ] General section
  - [ ] Audio & Patterns section
  - [ ] Remote Control section
  - [ ] Desktop App section
  - [ ] Development section

- [ ] Task 2: Write General FAQs (AC: 1)
  - [ ] What is r0astr?
  - [ ] Is r0astr free?
  - [ ] What browsers are supported?
  - [ ] Do I need to install anything?

- [ ] Task 3: Write Audio & Pattern FAQs (AC: 1)
  - [ ] Why is there no sound?
  - [ ] How do I stop all sounds?
  - [ ] Can I use my own samples?
  - [ ] Difference between s() and note()?
  - [ ] How do sliders work?

- [ ] Task 4: Write Remote Control FAQs (AC: 1)
  - [ ] How do I set up remote control?
  - [ ] Why won't my remote connect?

- [ ] Task 5: Write Desktop App FAQs (AC: 1)
  - [ ] Where can I download the app?
  - [ ] macOS "damaged" error fix
  - [ ] Windows SmartScreen bypass

- [ ] Task 6: Write Development FAQs (AC: 1)
  - [ ] How do I run r0astr locally?
  - [ ] How do I contribute?
  - [ ] Where's the source code?

- [ ] Task 7: Add Cross-References (AC: 3)
  - [ ] Link audio issues to troubleshooting
  - [ ] Link installation to downloads
  - [ ] Link remote to remote control guide

- [ ] Task 8: Organize by Category (AC: 2)
  - [ ] Use h2 for categories
  - [ ] Use h3 for questions
  - [ ] Consistent answer format

## Dev Notes

### Target File
- `docs-source/community/faq.md`

### Current State
Stub exists with ~15 FAQs. Review and ensure all AC topics covered.

### FAQ Format
```markdown
### Question here?

Answer here with clear, concise response.

See [Related Guide](link) for more details.
```

### Key Links to Include
- Troubleshooting: `../guides/troubleshooting.md`
- Downloads: `../downloads.md`
- Remote Control: `../guides/remote-control.md` or `../remote-control.md`
- Contributing: `../developers/contributing.md`
- Patterns: `../learn/patterns.md`

### Testing

- Count FAQs (minimum 10)
- Verify all links work
- Check answers are clear and accurate

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
- FAQ page already comprehensive with 15+ entries
- Categories: General, Audio & Patterns, Remote Control, Desktop App, Development
- All AC topics covered with cross-references
- Links to relevant guides (troubleshooting, remote control, contributing)
- Clear Q&A format with actionable answers

### File List
- docs-source/community/faq.md (verified complete)

## QA Results
_To be filled after QA review_
