# Story docs-1.3: Enhance Downloads Page

## Status

Done

## Story

**As a** user ready to install,
**I want** clear platform-specific instructions and troubleshooting,
**so that** I can install without confusion.

## Acceptance Criteria

1. Existing OS detection and platform cards preserved
2. Add "Installation Instructions" section with platform-specific tabs (macOS, Windows, Linux)
3. macOS: Note about Gatekeeper/unsigned app if applicable
4. Windows: Note about SmartScreen if applicable
5. Linux: AppImage permissions instructions
6. "Verifying Installation" section with expected first-launch behavior
7. Link to troubleshooting section for common install issues

## Tasks / Subtasks

- [ ] Task 1: Review and preserve existing content (AC: 1)
  - [ ] Keep OS detection JavaScript
  - [ ] Keep platform grid cards
  - [ ] Keep system requirements table

- [ ] Task 2: Add Installation Instructions section (AC: 2)
  - [ ] Create tabbed content for macOS/Windows/Linux
  - [ ] Write step-by-step for each platform

- [ ] Task 3: Add macOS instructions (AC: 3)
  - [ ] DMG mounting and drag-to-Applications
  - [ ] Gatekeeper warning and how to bypass
  - [ ] xattr command for "damaged" message

- [ ] Task 4: Add Windows instructions (AC: 4)
  - [ ] Installer vs portable options
  - [ ] SmartScreen warning bypass
  - [ ] Installation location

- [ ] Task 5: Add Linux instructions (AC: 5)
  - [ ] AppImage chmod +x command
  - [ ] .deb installation with dpkg
  - [ ] Desktop integration notes

- [ ] Task 6: Add Verifying Installation section (AC: 6)
  - [ ] Expected first-launch behavior
  - [ ] Audio permission prompts
  - [ ] What success looks like

- [ ] Task 7: Add troubleshooting link (AC: 7)
  - [ ] Link to guides/troubleshooting.md
  - [ ] Brief mention of common issues

## Dev Notes

### Target File
- `docs-source/downloads.md`

### Current State
The downloads page is already well-designed with OS detection and platform cards. This story adds installation instructions without breaking existing functionality.

### Platform-Specific Notes

**macOS:**
```bash
# If "App is damaged" error:
xattr -cr /Applications/r0astr.app
```

**Windows:**
- SmartScreen: Click "More info" → "Run anyway"

**Linux:**
```bash
chmod +x r0astr-*.AppImage
./r0astr-*.AppImage
```

### MkDocs Features
- `pymdownx.tabbed` for platform tabs
- Code blocks for commands
- Admonitions for warnings

### Testing

- Verify existing OS detection still works
- Check all platform tabs render correctly
- Test on actual platforms if possible

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
- Preserved existing OS detection and platform cards
- Added tabbed "Installation Instructions" section (macOS, Windows, Linux)
- macOS: Added Gatekeeper bypass instructions with xattr command
- Windows: Added SmartScreen bypass instructions
- Linux: Added AppImage chmod and .deb installation commands
- Added "Verifying Installation" section with expected behavior
- Added audio troubleshooting quick checks
- Added link to full troubleshooting guide
- Used warning admonitions for security messages

### File List
- docs-source/downloads.md (modified)

## QA Results
_To be filled after QA review_
