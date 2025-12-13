# Story docs-3.3: Contributing Guide

## Status

Draft

## Story

**As a** potential contributor,
**I want** clear contribution guidelines,
**so that** I can submit quality PRs.

## Acceptance Criteria

1. Development environment setup
2. Code style and linting requirements
3. PR process and review expectations
4. Issue reporting guidelines
5. Code of conduct reference
6. Testing requirements before PR
7. Commit message conventions

## Tasks / Subtasks

- [ ] Task 1: Write Development Setup section (AC: 1)
  - [ ] Prerequisites (Node.js version, npm)
  - [ ] Clone instructions
  - [ ] npm install
  - [ ] npm run dev
  - [ ] Verify setup works

- [ ] Task 2: Write Code Style section (AC: 2)
  - [ ] ES Modules usage
  - [ ] Vanilla JS (no frameworks)
  - [ ] Naming conventions
  - [ ] Comment guidelines
  - [ ] Linting commands

- [ ] Task 3: Write PR Process section (AC: 3)
  - [ ] Fork repository
  - [ ] Create feature branch
  - [ ] Make changes with clear commits
  - [ ] Test locally
  - [ ] Push and open PR
  - [ ] Review expectations

- [ ] Task 4: Write Issue Guidelines section (AC: 4)
  - [ ] Bug report template
  - [ ] Feature request template
  - [ ] What to include in reports

- [ ] Task 5: Add Code of Conduct section (AC: 5)
  - [ ] Brief conduct statement
  - [ ] Link to full CoC if exists
  - [ ] Or create simple conduct guidelines

- [ ] Task 6: Write Testing section (AC: 6)
  - [ ] What to test before PR
  - [ ] Browser testing (Chrome, Firefox)
  - [ ] Console errors check
  - [ ] Linting pass

- [ ] Task 7: Write Commit Messages section (AC: 7)
  - [ ] Conventional commits format
  - [ ] Examples (feat, fix, docs, refactor)
  - [ ] Why this matters

- [ ] Task 8: Add PR Checklist
  - [ ] Markdown checklist for contributors
  - [ ] Code style, tests, docs, etc.

## Dev Notes

### Target File
- `docs-source/developers/contributing.md`

### Current State
Stub exists with good structure. Needs refinement and completeness check.

### Conventional Commits Format
```
feat: add MIDI input support
fix: resolve audio glitch on Safari
docs: update pattern syntax guide
refactor: simplify panel state management
chore: update dependencies
```

### PR Checklist Template
```markdown
- [ ] Code follows project style
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)
- [ ] No console errors or warnings
- [ ] Tested in Chrome and Firefox
```

### Development Setup Commands
```bash
git clone https://github.com/piatra-automation/r0astr.git
cd r0astr
npm install
npm run dev
```

### Testing

- Follow setup instructions on fresh environment
- Verify all commands work
- Check links to GitHub

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
