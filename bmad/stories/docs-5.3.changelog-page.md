# Story docs-5.3: Changelog Page

## Status

Draft

## Story

**As a** user tracking updates,
**I want** a changelog with release notes,
**so that** I know what's new in each version.

## Acceptance Criteria

1. Changelog page with semantic versioning
2. Current version (v0.8.0) documented
3. Format: version, date, summary, detailed changes
4. Links to GitHub releases for full details
5. "Unreleased" section for upcoming changes

## Tasks / Subtasks

- [ ] Task 1: Create Changelog Structure (AC: 1, 3)
  - [ ] Page title and format note
  - [ ] Keep a Changelog format reference
  - [ ] Unreleased section at top
  - [ ] Version sections with dates

- [ ] Task 2: Document Current Version (AC: 2)
  - [ ] v0.8.0 entry
  - [ ] Date of release
  - [ ] Added/Changed/Fixed sections
  - [ ] Key highlights

- [ ] Task 3: Document Previous Versions (AC: 3)
  - [ ] v0.7.0 - Electron builds
  - [ ] v0.6.0 - Remote control
  - [ ] v0.5.0 - Master panel
  - [ ] Earlier versions (brief)

- [ ] Task 4: Add Unreleased Section (AC: 5)
  - [ ] "Unreleased" header
  - [ ] Documentation improvements
  - [ ] Placeholder for future changes

- [ ] Task 5: Add GitHub Link (AC: 4)
  - [ ] Link to releases page
  - [ ] Note about full commit history

- [ ] Task 6: Review and Verify
  - [ ] Confirm version numbers
  - [ ] Verify dates are accurate
  - [ ] Check all links work

## Dev Notes

### Target File
- `docs-source/community/changelog.md`

### Current State
Stub exists with version outline. Needs accurate dates and details.

### Keep a Changelog Format
```markdown
## [Version] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Removed
- Removed features
```

### Version History to Document
- **v0.8.0** - Major UI update (current)
- **v0.7.0** - Electron builds, CI/CD
- **v0.6.0** - Remote control, WebSocket
- **v0.5.0** - Master panel, global controls
- **v0.4.0** - Slider controls
- **v0.3.0** - Multi-panel interface
- **v0.2.0** - Basic Strudel integration
- **v0.1.0** - Initial project

### Source of Truth
- Check git log for accurate dates
- Review GitHub releases page
- Cross-reference commit messages

### Testing

- Verify all version entries are accurate
- Check GitHub release link works
- Confirm dates match actual releases

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
