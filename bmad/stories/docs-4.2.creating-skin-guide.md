# Story docs-4.2: Creating a Skin Guide

## Status

Done

## Story

**As a** skin creator,
**I want** step-by-step skin creation instructions,
**so that** I can build and share skins.

## Acceptance Criteria

1. Skin file structure
2. Required vs optional customizations
3. CSS variables reference table
4. Creating a skin from template
5. Testing across dark/light base modes
6. Submitting to community gallery

## Tasks / Subtasks

- [ ] Task 1: Document Skin File Structure (AC: 1)
  - [ ] skin.json metadata file
  - [ ] skin.css styles file
  - [ ] preview.png screenshot
  - [ ] README.md description
  - [ ] Example directory structure

- [ ] Task 2: Document Required vs Optional (AC: 2)
  - [ ] Required fields in skin.json
  - [ ] Required CSS overrides
  - [ ] Optional enhancements
  - [ ] What to skip for minimal skin

- [ ] Task 3: Create CSS Variables Table (AC: 3)
  - [ ] Full table of all variables
  - [ ] Description for each
  - [ ] Default values
  - [ ] Category grouping

- [ ] Task 4: Write From Template section (AC: 4)
  - [ ] Starter template code
  - [ ] Copy and modify instructions
  - [ ] Naming conventions

- [ ] Task 5: Write Testing section (AC: 5)
  - [ ] Test in dark mode
  - [ ] Test in light mode
  - [ ] Check contrast (accessibility)
  - [ ] Verify code syntax highlighting visible

- [ ] Task 6: Write Submission section (AC: 6)
  - [ ] Create GitHub repo
  - [ ] PR to skin gallery
  - [ ] Required assets (screenshot, etc.)
  - [ ] Review process

## Dev Notes

### Target File
- `docs-source/extend/creating-skins.md`

### Current State
Stub exists. Needs comprehensive step-by-step guide.

### skin.json Template
```json
{
  "name": "My Custom Skin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A brief description",
  "preview": "preview.png",
  "compatibility": "0.8.0"
}
```

### skin.css Template
```css
:root {
  /* Override only what you need */
  --r0astr-bg-primary: #0d1117;
  --r0astr-bg-secondary: #161b22;
  --r0astr-text-primary: #c9d1d9;
  --r0astr-accent: #58a6ff;
  --r0astr-panel-bg: #0d1117;
  --r0astr-border: #30363d;
}
```

### Preview Requirements
- 800x600 PNG
- Shows r0astr with skin applied
- Both playing and stopped states visible (optional)

### Testing

- Verify template code works
- Test submission process (if possible)
- Check all variable references

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
- Creating skins guide already comprehensive
- Skin file structure documented
- skin.json template with metadata
- skin.css template with variable overrides
- CSS variables reference table
- Testing locally instructions
- Best practices including accessibility
- Submission process to gallery

### File List
- docs-source/extend/creating-skins.md (verified complete)

## QA Results
_To be filled after QA review_
