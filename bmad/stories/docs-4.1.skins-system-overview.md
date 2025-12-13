# Story docs-4.1: Skins System Overview

## Status

Draft

## Story

**As a** designer interested in themes,
**I want** to understand the skins system,
**so that** I can create custom themes.

## Acceptance Criteria

1. What skins can customize (colors, fonts, layout elements)
2. Current implementation status noted (partial, full in v1.0)
3. CSS variable system documentation
4. Preview/testing a skin locally
5. "Coming soon" notes for incomplete features

## Tasks / Subtasks

- [ ] Task 1: Write Customization Scope section (AC: 1)
  - [ ] What can be customized now
  - [ ] What will be customizable in v1.0
  - [ ] Limitations and constraints

- [ ] Task 2: Add Implementation Status notice (AC: 2)
  - [ ] Add warning admonition
  - [ ] List currently working features
  - [ ] List planned features

- [ ] Task 3: Document CSS Variables (AC: 3)
  - [ ] List all available CSS variables
  - [ ] Group by category (colors, spacing, etc.)
  - [ ] Default values for each
  - [ ] Example usage

- [ ] Task 4: Write Preview/Testing section (AC: 4)
  - [ ] How to load a custom skin locally
  - [ ] Browser dev tools approach
  - [ ] Persistent testing approach

- [ ] Task 5: Add Coming Soon notes (AC: 5)
  - [ ] Font customization
  - [ ] Layout variations
  - [ ] Animation settings
  - [ ] Component-level theming

- [ ] Task 6: Add navigation links
  - [ ] Link to Creating Skins guide
  - [ ] Link to Skin Gallery

## Dev Notes

### Target File
- `docs-source/extend/skins.md`

### Current State
Stub exists. Needs expansion based on actual skin implementation.

### CSS Variables Reference (Verify against implementation)
```css
:root {
  /* Background colors */
  --r0astr-bg-primary: #1a1a2e;
  --r0astr-bg-secondary: #16213e;

  /* Text colors */
  --r0astr-text-primary: #eee;
  --r0astr-text-secondary: #aaa;

  /* Accent colors */
  --r0astr-accent: #6366f1;
  --r0astr-accent-hover: #818cf8;

  /* Panel styling */
  --r0astr-panel-bg: #0f0f23;
  --r0astr-border: #333;

  /* Buttons */
  --r0astr-button-bg: #333;
}
```

### Implementation Status
- **Working:** Color customization, basic styling
- **Partial:** Font changes, spacing
- **Planned (v1.0):** Full theming, layout variations

### Testing

- Verify CSS variable list matches actual implementation
- Test skin loading process
- Check all links

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
