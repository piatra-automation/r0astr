# Contributing to r0astr

Thank you for your interest in contributing to r0astr!

## Ways to Contribute

- **Code** - Bug fixes, features, improvements
- **Documentation** - Tutorials, guides, corrections
- **Patterns** - Add to the [Pattern Library](../learn/pattern-library.md)
- **Skins** - Create themes (see [Skins](../extend/skins.md))
- **Bug Reports** - Help us identify issues
- **Ideas** - Feature requests and suggestions

## Development Setup

### Prerequisites

- Node.js 20+
- npm 9+
- Git

### Clone and Install

```bash
git clone https://github.com/piatra-automation/r0astr.git
cd r0astr
npm install
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

### Run Tests

```bash
npm test
```

### Build

```bash
npm run build          # Full Electron build
npm run build:lite     # Web-only build
```

## Code Style

- **ES Modules** - Use `import`/`export`
- **Vanilla JS** - No framework dependencies
- **Descriptive names** - Clear variable and function names
- **Comments** - For complex logic only

### Linting

```bash
npm run lint
```

## Pull Request Process

1. **Fork** the repository
2. **Create a branch** from `main`
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Make changes** with clear commits
4. **Test** your changes locally
5. **Push** to your fork
6. **Open a PR** against `main`

### Commit Messages

Use conventional commits:

```
feat: add MIDI input support
fix: resolve audio glitch on Safari
docs: update pattern syntax guide
refactor: simplify panel state management
```

### PR Checklist

- [ ] Code follows project style
- [ ] Tests pass locally
- [ ] Documentation updated if needed
- [ ] No console errors or warnings
- [ ] Tested in Chrome and Firefox

## Issue Guidelines

### Bug Reports

Include:
- Browser and OS
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)

### Feature Requests

Include:
- Use case / problem being solved
- Proposed solution
- Alternatives considered

## Code of Conduct

Be respectful and constructive. We're all here to make music.

## Questions?

- Open a [Discussion](https://github.com/piatra-automation/r0astr/discussions)
- Check existing [Issues](https://github.com/piatra-automation/r0astr/issues)

---

*Thank you for contributing!*
