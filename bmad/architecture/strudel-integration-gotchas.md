# Strudel Integration: Critical Gotchas and Solutions

**Last Updated**: 2025-11-16
**Status**: Validated through implementation

## Overview

This document captures critical lessons learned during the r0astr implementation, specifically around Strudel.cc integration pitfalls that caused significant debugging effort. **Future developers must read this before working with Strudel integration.**

---

## 🚨 CRITICAL: Transpiler Blocking Issue

### The Problem

**The `transpiler()` function from `@strudel/transpiler` BLOCKS/HANGS when called outside of a REPL context.**

```javascript
// ❌ THIS WILL HANG THE BROWSER
import { transpiler } from '@strudel/transpiler';

function evaluateMasterCode(code) {
  const { output, widgets } = transpiler(code, { addReturn: false }); // HANGS HERE
  // Never returns...
}
```

### Symptoms

- Event listener fires (confirmed with console.log)
- Code reaches `transpiler()` call
- **Browser freezes** - no error, no return, just infinite blocking
- No error in console
- `console.log()` after transpiler call never executes

### Why It Happens

The transpiler appears to be designed for use within Strudel's REPL context and has internal dependencies or async expectations that cause it to block when called standalone in event handlers.

### The Solution

**DO NOT use `transpiler()` for master panel code.** Instead, parse slider definitions with regex:

```javascript
// ✅ CORRECT APPROACH
function evaluateMasterCode(code) {
  // Parse slider calls from code using regex
  const sliderRegex = /(\w+)\s*=\s*slider\s*\(\s*([^,)]+)(?:\s*,\s*([^,)]+))?(?:\s*,\s*([^,)]+))?\s*\)/g;
  const widgets = [];
  let match;

  while ((match = sliderRegex.exec(code)) !== null) {
    const varName = match[1];
    const value = parseFloat(match[2]);
    const min = match[3] ? parseFloat(match[3]) : 0;
    const max = match[4] ? parseFloat(match[4]) : 1;

    widgets.push({ varName, value, min, max });

    // Create global ref directly
    window[varName] = ref(() => sliderValues[sliderId]);
  }
}
```

### Where Transpiler IS Safe

The transpiler works correctly when:
1. Used in card pattern evaluation via `toggleCard()` (lines 447-484 in src/main.js)
2. Called within the REPL instance created by `repl()`
3. Used for pattern code that will be evaluated by `evaluate()`

```javascript
// ✅ Safe usage in card context
async function toggleCard(cardId) {
  const patternCode = textarea.value.trim();

  // This works because it's for pattern evaluation
  let { output, widgets } = transpiler(patternCode, { addReturn: false });

  renderSliders(cardId, widgets);
  evaluate(`${output}.p('${cardId}')`, true, false);
}
```

---

## 🚨 CRITICAL: CPS vs CPM Confusion

### The Problem

**Strudel's scheduler uses `setCps()` (cycles per second), NOT `setCpm()` (cycles per minute).**

```javascript
// ❌ THIS WILL FAIL
scheduler.setCpm(120); // TypeError: scheduler.setCpm is not a function

// ✅ CORRECT
scheduler.setCps(2); // 2 cycles per second = 120 BPM
```

### Understanding the Units

| Unit | Full Name | Relation | Example |
|------|-----------|----------|---------|
| **CPS** | Cycles Per Second | Native Strudel unit | `0.5 CPS` |
| **CPM** | Cycles Per Minute | User-friendly (60 × CPS) | `30 CPM` |
| **BPM** | Beats Per Minute | Musical tempo (4 × CPM) | `120 BPM` |

### Conversion Formulas

```javascript
// CPM to CPS (for scheduler)
const cps = cpm / 60;
scheduler.setCps(cps);

// CPS to CPM (for display)
const cpm = cps * 60;

// CPM to BPM (for display)
const bpm = cpm * 4;

// Example: 30 CPM slider
const cpm = 30;              // User sets this
const cps = 30 / 60;         // = 0.5 CPS (what Strudel uses)
const bpm = 30 * 4;          // = 120 BPM (musical tempo)
```

### Implementation Pattern

```javascript
// TEMPO slider initialization
if (varName === 'TEMPO' && scheduler) {
  window.TEMPO_SLIDER_ID = sliderId;
  const cps = sliderValues[sliderId] / 60; // Convert CPM to CPS
  scheduler.setCps(cps);
  console.log(`🎵 Tempo: ${sliderValues[sliderId]} CPM (${cps} CPS)`);
}

// TEMPO slider input handler
if (window.TEMPO_SLIDER_ID === sliderId && scheduler) {
  const cps = newValue / 60; // Convert CPM to CPS
  scheduler.setCps(cps);
  console.log(`🎵 Tempo: ${newValue} CPM (${cps} CPS, ${newValue * 4} BPM)`);
}
```

---

## ✅ Correct Global Panel Pattern

### Architecture

Global panel (formerly "Master panel") code goes through two stages:

1. **Slider extraction** - Regex parses `slider()` calls to create UI widgets
2. **Code evaluation** - Non-slider code (like `register()`, `samples()`) is evaluated WITHOUT transpilation

```javascript
// Global panel input (user types this):
let SLIDER_LPF = slider(800, 100, 5000);
let TEMPO = slider(30, 15, 45);

// Custom function registration (evaluated globally):
register('trancegate', (density, seed, length, x) => {
  return x.struct(rand.mul(density).round().seg(32).rib(seed, length)).fill().clip(.8)
})

// Card pattern (references global variables and custom functions):
note("c2 ~ c2 ~").s("sawtooth").lpf(SLIDER_LPF).trancegate(1.5, 45, 2)
```

### How Evaluation Works

```javascript
// From main.js evaluateMasterCode():

// 1. Sliders extracted with regex (NOT transpiler - calling transpiler() directly blocks!)
const sliderRegex = /(\w+)\s*=\s*slider\s*\(...\)/g;

// 2. Non-slider code IS evaluated via repl's evaluate()
const hasNonSliderCode = cleanCode.replace(/slider regex/, '').trim();
if (hasNonSliderCode) {
  // evaluate(code, autostart, shouldHush)
  // false, false = no autostart, no hush
  // NOTE: Transpiler IS still used internally by the repl!
  await strudelCore.evaluate(cleanCode, false, false);
}
```

**Important clarification**: The `evaluate(code, false, false)` call DOES use the transpiler internally - the `false` parameters control autostart and hush behavior, NOT transpilation. The transpiler is passed to `repl()` during initialization and used for all evaluations.

### Implementation Steps

1. **Parse slider definitions** with regex (avoid transpiler - it blocks!)
2. **Create slider value storage** in `sliderValues` object
3. **Create reactive refs** on window object
4. **Render UI controls** for each slider
5. **Evaluate non-slider code** WITHOUT transpilation for `register()`, `samples()`, etc.
6. **Special handling for TEMPO** variable

### Complete Implementation

```javascript
function evaluateMasterCode(reRenderSliders = true) {
  if (masterCodeEvaluating) return;

  const code = document.getElementById('master-code').value.trim();
  if (!code) return;

  try {
    masterCodeEvaluating = true;

    // 1. Parse slider definitions
    const sliderRegex = /(\w+)\s*=\s*slider\s*\(\s*([^,)]+)(?:\s*,\s*([^,)]+))?(?:\s*,\s*([^,)]+))?\s*\)/g;
    const widgets = [];
    let match;

    while ((match = sliderRegex.exec(code)) !== null) {
      const varName = match[1];
      const value = parseFloat(match[2]);
      const min = match[3] ? parseFloat(match[3]) : 0;
      const max = match[4] ? parseFloat(match[4]) : 1;
      const sliderId = `master_${varName.toLowerCase()}`;

      widgets.push({ varName, value, min, max, sliderId });

      // 2. Store slider value
      sliderValues[sliderId] = value;
    }

    // 3. Render UI
    if (reRenderSliders) {
      renderMasterSliders(widgets);
    }

    // 4. Create global refs
    widgets.forEach(({ varName, sliderId }) => {
      // Create reactive reference
      window[varName] = ref(() => sliderValues[sliderId]);

      // 5. Special TEMPO handling
      if (varName === 'TEMPO' && scheduler) {
        window.TEMPO_SLIDER_ID = sliderId;
        const cps = sliderValues[sliderId] / 60; // CPM to CPS
        scheduler.setCps(cps);
      }
    });

  } catch (error) {
    console.error('[Master] Error:', error);
  } finally {
    masterCodeEvaluating = false;
  }
}
```

---

## ✅ Slider Creation Pattern

### Using `ref()` for Reactivity

Master panel sliders must use **reactive refs** so pattern code reads the current slider value:

```javascript
// ❌ WRONG - Static value
window.SLIDER_LPF = 800; // Patterns get 800, slider changes ignored

// ✅ CORRECT - Reactive ref
window.SLIDER_LPF = ref(() => sliderValues['master_slider_lpf']);
// Patterns read current value every cycle
```

### Slider ID Naming

Use consistent naming to avoid collisions:

```javascript
// Master panel sliders
const sliderId = `master_${varName.toLowerCase()}`;
// Examples: 'master_slider_lpf', 'master_tempo'

// Card panel sliders (auto-generated by transpiler)
const sliderId = `slider_${from}`;
// Examples: 'slider_43', 'slider_72'
```

### Slider Metadata Structure

```javascript
const widget = {
  type: 'slider',
  varName: 'SLIDER_LPF',    // User-facing variable name
  value: 800,                // Initial value
  min: 100,                  // Minimum value
  max: 5000,                 // Maximum value
  sliderId: 'master_slider_lpf' // Internal storage key
};
```

---

## ✅ TEMPO Slider Special Handling

### Why TEMPO Is Special

TEMPO slider controls the global playback speed via `scheduler.setCps()`, unlike other sliders which just provide values to patterns.

### Detection Pattern

```javascript
// Detect TEMPO variable by name
if (varName === 'TEMPO' && scheduler) {
  window.TEMPO_SLIDER_ID = sliderId;
  // Initialize scheduler
  const cps = sliderValues[sliderId] / 60;
  scheduler.setCps(cps);
}
```

### Input Handler

```javascript
// In slider input event handler
input.addEventListener('input', (e) => {
  const newValue = parseFloat(e.target.value);
  sliderValues[sliderId] = newValue;

  // Update display
  sliderControl.querySelector('.slider-value').textContent = newValue.toFixed(2);

  // Special TEMPO handling
  if (window.TEMPO_SLIDER_ID === sliderId && scheduler) {
    const cps = newValue / 60; // Convert CPM to CPS
    scheduler.setCps(cps);
    console.log(`🎵 Tempo: ${newValue} CPM (${cps.toFixed(3)} CPS)`);
  }
});
```

---

## 🔍 Debugging Tips

### If Master Panel Sliders Don't Render

1. Check console for `[Master] evaluateMasterCode called`
2. Check for transpiler hanging (code stops mid-execution)
3. Verify regex is matching slider definitions
4. Check `renderMasterSliders()` is being called

### If Global Variables Not Accessible

1. Verify variables are on `window` object: `console.log(window.SLIDER_LPF)`
2. Check they're refs: `console.log(typeof window.SLIDER_LPF)` should be 'function'
3. Test ref call: `console.log(window.SLIDER_LPF())` should return number

### If TEMPO Slider Has No Effect

1. Verify scheduler exists: `console.log(scheduler)`
2. Check CPS conversion: log the CPS value being set
3. Verify `scheduler.setCps()` is called (not `setCpm()`)
4. Check `window.TEMPO_SLIDER_ID` matches slider being moved

### If Transpiler Hangs

1. **Remove transpiler call** - use regex parsing instead
2. Only use transpiler for card pattern code
3. Never use transpiler in event handlers outside REPL context

---

## 📚 Reference Implementation

See `src/main.js`:
- `evaluateMasterCode()`: Lines 126-194
- `renderMasterSliders()`: Lines 197-235
- `initializeStrudel()`: Lines 314-365
- `toggleCard()`: Lines 415-498

---

## ⚠️ Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct | Why |
|---------|-----------|-----|
| `transpiler(code)` in master panel | Regex parsing | Transpiler blocks |
| `scheduler.setCpm(120)` | `scheduler.setCps(2)` | No setCpm() method |
| `window.X = 800` | `window.X = ref(() => sliderValues[id])` | Static vs reactive |
| Evaluating master code as pattern | Direct regex parsing | Wrong execution context |
| Assuming transpiler is async | Know it blocks sync | Causes browser freeze |

---

## 🎯 Success Checklist

Before declaring master panel implementation complete:

- [ ] Master code uses regex parsing (NOT transpiler)
- [ ] Sliders render with correct labels (variable names)
- [ ] Slider values update in `sliderValues` object
- [ ] Global refs created with `ref(() => sliderValues[id])`
- [ ] TEMPO slider calls `scheduler.setCps(cpm / 60)`
- [ ] Pattern code can reference master variables (e.g., `lpf(SLIDER_LPF)`)
- [ ] Moving sliders updates patterns in real-time
- [ ] Moving TEMPO slider changes playback speed
- [ ] No browser freezing/hanging
- [ ] Console shows clear error messages (not silent failures)

---

## 📖 Related Documentation

- Official Strudel REPL: `/Users/pkalt/Git/Misc/strudel/website/src/repl/useReplContext.jsx`
- Strudel util.mjs: `/Users/pkalt/Git/Misc/strudel/website/src/repl/util.mjs`
- r0astr implementation: `src/main.js`
- Project architecture: `docs/brownfield-architecture.md`

---

**This document was created after significant debugging effort. Please update it if you discover additional gotchas or better patterns.**
