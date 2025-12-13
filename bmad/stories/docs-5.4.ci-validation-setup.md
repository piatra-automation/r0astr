# Story docs-5.4: CI Validation Setup

## Status

Draft

## Story

**As a** documentation maintainer,
**I want** automated validation of code examples,
**so that** examples don't break silently.

## Acceptance Criteria

1. GitHub Action that runs on PR and push to main
2. MkDocs build validation (site must build)
3. Internal link checking
4. JavaScript syntax validation for code blocks (basic)
5. External link checking (can be periodic, not blocking)
6. Clear error messages on failure

## Tasks / Subtasks

- [ ] Task 1: Review Existing CI (AC: 1)
  - [ ] Check deploy-pages.yml
  - [ ] Identify what validation exists
  - [ ] Plan additions without breaking deployment

- [ ] Task 2: Add Build Validation (AC: 2)
  - [ ] Use `mkdocs build --strict` flag
  - [ ] Fail on any build warnings
  - [ ] Clear error output

- [ ] Task 3: Add Link Checking (AC: 3)
  - [ ] Install linkchecker or similar
  - [ ] Check internal links
  - [ ] Report broken links

- [ ] Task 4: Add JavaScript Validation (AC: 4)
  - [ ] Create validation script
  - [ ] Extract code blocks from markdown
  - [ ] Validate JavaScript syntax
  - [ ] Report errors with file/line info

- [ ] Task 5: Configure External Link Checking (AC: 5)
  - [ ] Schedule periodic check (weekly)
  - [ ] Non-blocking (don't fail builds)
  - [ ] Report via issue or notification

- [ ] Task 6: Improve Error Messages (AC: 6)
  - [ ] Clear failure reasons
  - [ ] File and line references
  - [ ] Suggestions for fixes

## Dev Notes

### Target File
- `.github/workflows/deploy-pages.yml` (modify existing)
- `.github/workflows/validate-docs.yml` (optional separate workflow)
- `scripts/validate-snippets.js` (new validation script)

### Current CI State
```yaml
# Existing workflow builds and deploys
# Need to add validation step before deploy
```

### Validation Script Approach (Basic)
```javascript
// scripts/validate-snippets.js
const fs = require('fs');
const path = require('path');

// 1. Find all .md files in docs-source
// 2. Extract ```javascript code blocks
// 3. Try to parse with acorn or similar
// 4. Report syntax errors
```

### Link Checking Options
- `linkchecker` (Python)
- `lychee` (Rust, faster)
- `markdown-link-check` (npm)

### Considerations
- Don't break existing deploy workflow
- Keep validation fast (<5 minutes)
- External link checking should not block PRs

### Testing

- Create PR with intentional broken link
- Create PR with syntax error in code block
- Verify failures are caught and reported clearly

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
