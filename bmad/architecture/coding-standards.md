# Coding Standards

**Version:** v4
**Last Updated:** 2025-11-16
**Enforcement:** Manual code review (future: ESLint automation)

## Overview

r0astr follows modern JavaScript best practices with emphasis on simplicity, readability, and maintainability. Code should be expert-level but not overly clever - prioritize clarity over cleverness.

## Language and Style

### JavaScript Version
- **ES2020+** syntax (async/await, optional chaining, nullish coalescing)
- **ES Modules** - Use `import`/`export`, not CommonJS
- **No TypeScript** - Keep it vanilla JavaScript for simplicity

### Code Formatting

#### Indentation
- **2 spaces** (not tabs)
- Consistent across all files

#### Line Length
- **80-100 characters** preferred
- Break long lines at logical points (after operators, commas)

#### Semicolons
- **Required** - Always use semicolons (no ASI reliance)

#### Quotes
- **Single quotes** for strings: `'hello'`
- **Backticks** for template literals: `` `Hello ${name}` ``
- **Double quotes** only in JSON or HTML attributes

#### Spacing
```javascript
// Good
function toggleCard(cardId) {
  const textarea = document.querySelector(`[data-card="${cardId}"]`);
  if (cardStates[cardId].playing) {
    scheduler.stop(cardId);
  }
}

// Bad - inconsistent spacing
function toggleCard(cardId){
  const textarea=document.querySelector(`[data-card="${cardId}"]`);
  if(cardStates[cardId].playing){
    scheduler.stop(cardId);
  }
}
```

## Naming Conventions

### Variables and Functions
- **camelCase** for variables and functions: `cardStates`, `toggleCard`, `renderSliders`
- **Descriptive names** - avoid abbreviations unless widely understood
  - ✅ `panelManager`, `settingsData`, `sliderValues`
  - ❌ `pm`, `sd`, `sv`

### Constants
- **UPPER_SNAKE_CASE** for true constants: `DEFAULT_PATTERN`, `MAX_PANELS`
- **camelCase** for configuration objects: `defaultPatterns`

### Files and Modules
- **camelCase** for JavaScript files: `panelManager.js`, `settingsManager.js`
- **kebab-case** for HTML/CSS: `index.html`, `main.css` (future)

### DOM IDs and Classes
- **kebab-case** for IDs: `card-1`, `master-panel`, `settings-modal`
- **kebab-case** for classes: `.control-btn`, `.code-input`, `.slider-container`

## Code Structure

### File Organization
```javascript
// 1. Imports
import { repl, evalScope } from '@strudel/core';
import { transpiler } from '@strudel/transpiler';

// 2. Constants and configuration
const DEFAULT_SAMPLE_DELAY = 3000;
const defaultPatterns = { ... };

// 3. Global state
const cardStates = { ... };
window.sliderValues = {};

// 4. Helper functions (pure, no side effects)
function generatePanelId() { ... }

// 5. UI rendering functions
function renderSliders(cardId, widgets) { ... }

// 6. Event handlers
function toggleCard(cardId) { ... }

// 7. Initialization
async function initializeStrudel() { ... }
initializeCards();
```

### Function Size
- **Keep functions small** - Under 50 lines preferred
- **Single Responsibility** - One function, one job
- **Extract complex logic** - If function needs comments to explain, extract to separate function

### Commenting

#### When to Comment
```javascript
// ✅ Good: Explain WHY, not WHAT
// Trailing semicolon breaks .p() method chaining
const cleanedOutput = output.replace(/;$/, '');

// ✅ Good: Document gotchas and workarounds
// CRITICAL: transpiler() HANGS in master panel context
// Use regex parsing instead (see strudel-integration-gotchas.md)
const masterSliders = parseSlidersWithRegex(masterCode);

// ❌ Bad: Stating the obvious
// Set the playing state to false
cardStates[cardId].playing = false;
```

#### Comment Style
- **Single-line comments** for brief explanations: `// Explanation here`
- **Multi-line comments** for complex logic:
```javascript
/**
 * Transpiles pattern code and extracts slider widgets.
 *
 * IMPORTANT: Do NOT use in master panel context - causes hang.
 * See docs/architecture/strudel-integration-gotchas.md
 *
 * @param {string} code - Pattern code to transpile
 * @returns {{ output: string, widgets: Array }}
 */
function transpilePattern(code) { ... }
```

## Best Practices

### Error Handling
```javascript
// ✅ Good: Graceful degradation
try {
  const transpiled = transpiler(patternCode, { addReturn: false });
  evaluate(`${transpiled.output}.p('${cardId}')`);
} catch (error) {
  console.error(`Pattern evaluation failed for ${cardId}:`, error);
  alert(`Error in pattern: ${error.message}`);
  return;
}

// ❌ Bad: Swallowing errors silently
try {
  evaluate(code);
} catch (e) {
  // Ignore
}
```

### Async/Await
```javascript
// ✅ Good: Clean async flow
async function initializeStrudel() {
  await import('@strudel/webaudio');
  await registerSynthSounds();
  console.log('Strudel initialized');
}

// ❌ Bad: Promise chaining
function initializeStrudel() {
  return import('@strudel/webaudio')
    .then(() => registerSynthSounds())
    .then(() => console.log('Strudel initialized'));
}
```

### DOM Manipulation
```javascript
// ✅ Good: Cache selectors, use data attributes
const textarea = document.querySelector(`[data-card="${cardId}"]`);
const button = document.querySelector(`.control-btn[data-card="${cardId}"]`);

// ❌ Bad: Repeated queries, fragile selectors
document.querySelector('#card-1 textarea').value;
document.querySelector('button:nth-child(2)').textContent;
```

### Event Listeners
```javascript
// ✅ Good: Delegate events, clean callbacks
document.addEventListener('click', (e) => {
  const button = e.target.closest('.control-btn');
  if (button) {
    const cardId = button.dataset.card;
    toggleCard(cardId);
  }
});

// ❌ Bad: Multiple listeners, inline logic
buttons.forEach(button => {
  button.addEventListener('click', () => {
    // 50 lines of logic inline...
  });
});
```

### State Management
```javascript
// ✅ Good: Centralized state, immutable updates
const cardStates = {
  'card-1': { playing: false, code: '', stale: false },
};

function updateCardState(cardId, updates) {
  cardStates[cardId] = { ...cardStates[cardId], ...updates };
}

// ❌ Bad: Scattered state, direct mutation
let card1Playing = false;
let card1Code = '';
// State spread across multiple variables
```

## Strudel-Specific Patterns

### Pattern Evaluation
```javascript
// ✅ Good: Use .p(id) for independent control
evaluate(`${patternCode}.p('${cardId}')`, false, false);

// ❌ Bad: Evaluate without ID (overwrites all patterns)
evaluate(patternCode);
```

### Slider Implementation
```javascript
// ✅ Good: Use sliderWithID with reactive ref
import { sliderWithID, ref } from '@strudel/codemirror';

window.sliderValues = {};
const slider = (init, min, max, id) => {
  if (!window.sliderValues[id]) {
    window.sliderValues[id] = init;
  }
  return ref(() => window.sliderValues[id]);
};

// ❌ Bad: Non-reactive sliders
const slider = (value) => value; // Static, no UI updates
```

### TEMPO Handling (Master Panel)
```javascript
// ✅ Good: Convert BPM to CPS for Strudel scheduler
const tempoBPM = 120;
const tempoCPS = tempoBPM / 60;
scheduler.setCps(tempoCPS);

// ❌ Bad: Confusing BPM with CPM or using setCpm()
scheduler.setCpm(120); // setCpm() doesn't exist!
```

## Testing Standards (Future)

### Unit Tests
- **Test pure functions** - Functions without side effects
- **Use descriptive test names** - `it('should return unique panel ID')`
- **Arrange-Act-Assert** pattern

### Integration Tests
- **Test Strudel integration** - Pattern evaluation, scheduler
- **Test WebSocket API** - Panel control endpoints
- **Use real browser** - Playwright or Cypress for Web Audio tests

### Manual Testing Checklist
- ✅ Audio plays after clicking Play button
- ✅ Sliders update audio in real-time
- ✅ Patterns sync across multiple cards
- ✅ No browser console errors
- ✅ Sample loading completes successfully

## Code Review Checklist

### Before Committing
- [ ] No console.log statements (use console.error/warn for debugging)
- [ ] No commented-out code (delete or move to documentation)
- [ ] All functions have single responsibility
- [ ] No hardcoded magic numbers (use named constants)
- [ ] Error handling for async operations
- [ ] Consistent naming conventions
- [ ] No unnecessary comments (code is self-documenting)

### Performance
- [ ] No unnecessary DOM queries in loops
- [ ] Slider updates debounced if needed
- [ ] Pattern evaluation not triggered excessively
- [ ] Sample loading optimized (pre-load common samples)

### Security
- [ ] No eval() or Function() with user input (Strudel handles this)
- [ ] Input validation for settings
- [ ] XSS prevention in dynamic HTML generation

## Git Commit Standards

### Commit Message Format
```
type(scope): brief description

Longer explanation if needed.

- Bullet points for details
- Reference issues: Closes #123
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **refactor**: Code restructuring (no behavior change)
- **docs**: Documentation only
- **style**: Formatting, whitespace
- **test**: Adding tests
- **chore**: Build, dependencies, tooling

### Examples
```
feat(panels): add dynamic panel creation button

- Implement [+] button in main UI
- Generate unique panel IDs
- Initialize new panels with default pattern

Closes #42
```

```
fix(sliders): prevent slider state loss on pattern change

Previously, changing pattern code would reset all sliders
to default values. Now preserves slider state in sliderValues.

Fixes #56
```

## Documentation Standards

### Code Documentation
- **JSDoc comments** for exported functions (future)
- **Inline comments** for complex logic or gotchas
- **README updates** for user-facing features

### Architecture Documentation
- **Update when refactoring** - Keep docs in sync with code
- **Cite sources** - Link to Strudel docs, Stack Overflow answers
- **Document gotchas** - Add to strudel-integration-gotchas.md

---

**Maintained By:** Development Team
**Enforcement:** Manual code review (future: ESLint with Airbnb config)
**Review Cycle:** Update with new patterns or conventions discovered
