# Epic 7: Text Panel Improvements

## Overview

Enhance the code editing experience in panel textareas with quality-of-life improvements: line wrapping, default dimensions, live transpilation validation, auto-formatting, and syntax highlighting. These improvements make code editing more pleasant and reduce errors.

## Business Value

- **Better Coding Experience**: Syntax highlighting and formatting improve code readability
- **Error Prevention**: Live validation catches errors before playing
- **User Preferences**: Configurable settings for wrap/dimensions/colors
- **Professional Feel**: Editor features expected in modern coding tools

## User Stories

### Story 7.1: Line Wrapping Settings

**As a** live coder,
**I want** to configure whether long lines wrap or scroll horizontally,
**so that** I can choose my preferred code viewing style

**Acceptance Criteria:**
1. Settings includes `settings.wrap_lines` boolean (default: false)
2. When `wrap_lines === true`, textarea uses `white-space: pre-wrap`
3. When `wrap_lines === false`, textarea uses `white-space: pre` with horizontal scrollbar
4. Setting applies to all panels (existing and new)
5. Changes take effect immediately (live preview)
6. Setting persists in localStorage

---

### Story 7.2: Default Panel Dimensions

**As a** live coder,
**I want** to configure default panel width and height,
**so that** new panels start at my preferred size

**Acceptance Criteria:**
1. Settings includes `settings.default_w` (default: 600) and `settings.default_h` (default: 400)
2. New panels created after setting change use configured dimensions
3. Existing panels retain their current size (not retroactively resized)
4. Valid range: width 300-2000px, height 200-1500px
5. Settings UI includes number inputs with validation
6. Settings persist in localStorage

---

### Story 7.3: Live Transpilation Validation

**As a** live coder,
**I want** to see if my code transpiles correctly before playing,
**so that** I catch syntax errors early

**Acceptance Criteria:**
1. Transpilation validation runs 500ms after typing stops (debounced)
2. Valid code: PLAY/UPDATE button enabled (normal state)
3. Invalid code: PLAY/UPDATE button disabled (grayed out)
4. Transpilation errors displayed below textarea after 1s debounce
5. Error message format: "Error: [message] (line [N])" in red text
6. Error message clears when code becomes valid
7. Validation does not prevent PAUSE button (always available)

---

### Story 7.4: Auto-Formatting on Play/Update

**As a** live coder,
**I want** code to auto-format when I press PLAY/UPDATE,
**so that** my code stays clean and readable

**Acceptance Criteria:**
1. Settings includes `settings.auto_format` boolean (default: true)
2. When enabled, pressing PLAY/UPDATE formats code before evaluation
3. Formatting uses transpiler output (escodegen formatting)
4. Formatted code replaces textarea content before playing
5. Formatting does not change code behavior (only whitespace/indentation)
6. If formatting fails, use original code (graceful degradation)
7. Setting configurable in Settings UI

---

### Story 7.5: Syntax Highlighting

**As a** live coder,
**I want** syntax highlighting for Strudel code,
**so that** I can read code more easily

**Acceptance Criteria:**
1. Lightweight syntax highlighter (not CodeMirror) highlights textarea
2. Highlighted elements:
   - Functions: `s()`, `note()`, `.lpf()`, `.gain()` (one color)
   - Strings: `'bd hh sd'`, `"c2 e3"` (one color)
   - Numbers: `800`, `0.5` (one color)
   - Comments: `// comment` (one color)
   - Mini notation operators: `*`, `[]`, `,` (one color)
   - Pattern blocks: `.p('card-1')` (one color)
3. Settings includes `settings.text.colors` object:
   - `functions`: default `#61afef` (blue)
   - `strings`: default `#98c379` (green)
   - `numbers`: default `#d19a66` (orange)
   - `comments`: default `#5c6370` (gray)
   - `operators`: default `#c678dd` (purple)
4. Color pickers in Settings UI for each category (future enhancement - Story 7.5 uses defaults)
5. Highlighting updates on textarea change (debounced 200ms)

---

## Technical Notes

- Use lightweight library: [Prism.js](https://prismjs.com/) or [highlight.js](https://highlightjs.org/)
- Alternative: Custom regex-based highlighter (lighter weight)
- Transpilation validation: Catch errors from `transpiler(code)` call
- Auto-formatting: Use `transpiler(code).output` for formatted version
- Syntax highlighting: Overlay div or contenteditable replacement

## Dependencies

- Epic 4: Settings System (settings.wrap_lines, settings.default_w/h, settings.auto_format, settings.text.colors)
- Epic 6: Staleness Detection (PLAY/UPDATE button state management)

## Related Epics

- Epic 1: Dynamic Panel Management (new panel dimensions)
- Epic 2: Enhanced Panel UI (panel resize integration)

## Out of Scope

- Full CodeMirror integration (too heavy, deferred)
- Color picker UI for syntax colors (Story 7.5 uses hardcoded defaults, pickers in future)
- Auto-complete/IntelliSense (future enhancement)
- Multi-cursor editing (future enhancement)

---

**Total Stories:** 5 (7.1 through 7.5)
