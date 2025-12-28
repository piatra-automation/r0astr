# Audio Parity Issues Found - Test Results

**Date**: 2025-12-28
**Tester**: User
**Version**: r0astr v8.4.0

## Test Results Summary

| Category | Passing | Failing | Pass Rate |
|----------|---------|---------|-----------|
| Basic Audio Rendering | 4/4 | 0/4 | 100% ✅ |
| Pattern Functions | 4/4 | 0/4 | 100% ✅ |
| Multi-Pattern Control | 2/4 | 2/4 | 50% ⚠️ |
| Advanced Features | 0/3 | 3/3 | 0% ❌ |
| **TOTAL** | **10/15** | **5/15** | **67%** |

## Resolution Status (2025-12-28)

| Issue | Status | Resolution |
|-------|--------|------------|
| #1: each(gain(0.5)) | ✅ DOCUMENTED | Use lambda: `each((p) => p.gain(0.5))` |
| #2: cpm(120) | ✅ DOCUMENTED | User error - use `setCpm(120)` |
| #3: orbit(slider()) | ✅ WORKAROUND | Use integer step: `slider(5, 0, 7, 1)` |
| #4: Named patterns | ✅ FIXED | Pattern ID tracking in main.js |
| #5: Multiple sliders | ✅ WORKS | Tested and confirmed working |

---

## ✅ PASSING Tests (10/15)

### Basic Audio Rendering (4/4)
- ✅ `s("bd sd bd sd")` - Drum pattern plays correctly
- ✅ `note("c e g c5").s("sawtooth")` - Note playback works
- ✅ `s("piano:0 piano:4 piano:7")` - Sample playback works
- ✅ `s("bd").gain(slider(0.5, 0, 1))` - Slider control works

### Pattern Functions (4/4)
- ✅ `.fast(2)`, `.slow(2)` - Tempo manipulation works
- ✅ `.lpf(slider(800, 100, 5000))` - Filter control works
- ✅ `.room(0.9)` - Reverb works
- ✅ `.every(4, fast(2))` - Conditional transforms work

### Multi-Pattern Control (2/4)
- ✅ `all(fast(2))` - Global speed change works
- ✅ `hush()` - Silence all works

---

## ❌ FAILING Tests (5/15)

### Issue 1: `each(gain(0.5))` - SYNTAX ERROR

**Error**: `V is not a function (line unknown)`

**Root Cause**: `each()` expects a transform function, but `gain(0.5)` is a pattern method call, not a standalone transform.

**Correct Usage**:
```javascript
// ❌ WRONG (what was tested):
each(gain(0.5))

// ✅ CORRECT Option 1 - Use lambda:
each((pat) => pat.gain(0.5))

// ✅ CORRECT Option 2 - Use curried control function:
each(gain(0.5))  // Should work IF gain() is exposed as standalone function
```

**Investigation Needed**:
1. Check if control functions (gain, lpf, etc.) are exposed as standalone functions in evalScope
2. In Strudel, `gain(0.5)` should return a curried function: `(pat) => pat.gain(0.5)`
3. If not exposed, this is a gap in how controls.mjs exports are handled

**File Reference**: `/Users/pkalt/Git/Misc/strudel/packages/core/controls.mjs:46-73`

**Strudel Behavior**:
```javascript
// controls.mjs creates BOTH:
Pattern.prototype[name] = function (value) { ... }  // Method
return func;  // Standalone function (should be in evalScope)
```

**Severity**: MEDIUM - Workaround exists (use lambda), but syntax differs from Strudel REPL

---

### Issue 2: `cpm(120)` - METHOD MISUSE

**Error**: `Method '.p()' is not a function (line unknown)`

**Root Cause**: `cpm()` is a **pattern control method**, not a global tempo setter.

**Correct Usage**:
```javascript
// ❌ WRONG (what was tested):
cpm(120)  // Creates a pattern with cpm control, but can't be used standalone

// ✅ CORRECT - Use as pattern method:
s("bd sd").cpm(120)

// ✅ CORRECT - Use global tempo setter:
setCpm(120)  // Available in r0astr (main.js:2365)
```

**Expected Behavior in Strudel REPL**:
Looking at repl.mjs:185-187:
```javascript
const cpm = register('cpm', function (cpm, pat) {
  return pat._fast(cpm / 60 / scheduler.cps);
});
```

This creates `cpm()` as a pattern method, not a global setter. The global setter is `setCpm()`.

**Severity**: LOW - User error, not a bug. `setCpm(120)` is the correct global tempo setter.

---

### Issue 3: `s("bd").orbit(slider(0, 0, 7))` - SLIDER INCOMPATIBILITY

**Error**: `V is not a function (line unknown)`

**Root Cause**: Likely an interaction issue between `slider()` and `orbit()`. The `orbit()` control may not properly handle reactive refs returned by `slider()`.

**Investigation Needed**:
1. Test if `orbit()` works with static values: `s("bd").orbit(2)`
2. Test if issue is specific to `slider()` or all reactive refs
3. Check how `orbit()` processes its arguments in controls.mjs

**Workaround**:
```javascript
// Test these:
s("bd").orbit(2)  // Static value
s("bd").orbit(slider(0, 0, 7).valueOf())  // Force evaluation (may not work)
```

**Severity**: MEDIUM - `orbit()` is important for multi-channel routing

---

### Issue 4: `d1`, `.p1`, `$:`, `_pattern` - CRITICAL PANEL CONTROL BUG

**Error**: Panel PAUSE button doesn't stop named patterns. Only STOP ALL/HUSH works.

**Symptoms**:
```javascript
// In panel "card-1":
s("bd sd").d1  // Pattern plays

// Click panel PAUSE button → Pattern keeps playing
// Click STOP ALL → Pattern stops
```

**Root Cause**: **Pattern ID mismatch between user code and panel control system**

When user writes `.d1`, the pattern is registered with ID `1`:
```javascript
s("bd sd").d1  // Equivalent to: s("bd sd").p(1)
// Registers pattern in: pPatterns['1']
```

But when user clicks PAUSE in panel "card-1", r0astr tries to silence:
```javascript
silence.p('card-1')  // Silences pattern ID 'card-1', not '1'
```

**Why This Happens**:

1. **r0astr's automatic `.p(panelId)` injection** (main.js:1857):
   ```javascript
   // r0astr automatically appends .p(panelId) to user code:
   evalResult = await strudelCore.evaluate(`${patternCode}.p('${panelId}')`, true, false);
   ```

2. **User's manual `.d1` overrides this**:
   ```javascript
   // User code:
   s("bd sd").d1

   // After r0astr injection:
   s("bd sd").d1.p('card-1')

   // Result: Pattern registered TWICE:
   // - pPatterns['1'] from .d1
   // - pPatterns['card-1'] from .p('card-1')
   // But .d1 returns the pattern, so .p('card-1') applies to same pattern
   // Actually, .d1 is a getter that calls .p(1), so the final result is just .p(1)
   ```

   Wait, let me reconsider. Looking at Pattern.prototype.d1:
   ```javascript
   Object.defineProperty(Pattern.prototype, `d1`, {
     get() {
       return this.p(1);
     },
   });
   ```

   So `pattern.d1` is equivalent to `pattern.p(1)`. The getter returns the result of `.p(1)`.

   When r0astr does:
   ```javascript
   `${patternCode}.p('${panelId}')`
   ```

   And user code is `s("bd sd").d1`, it becomes:
   ```javascript
   s("bd sd").d1.p('card-1')
   ```

   Since `.d1` is a getter that calls `.p(1)`, this is equivalent to:
   ```javascript
   s("bd sd").p(1).p('card-1')
   ```

   The second `.p()` call overwrites the first! Looking at repl.mjs:150-162:
   ```javascript
   Pattern.prototype.p = function (id) {
     // ...
     pPatterns[id] = this;
     return this;
   };
   ```

   Each `.p()` call stores the pattern in `pPatterns[id]` and returns `this`. So:
   ```javascript
   s("bd sd").p(1).p('card-1')
   // Step 1: s("bd sd").p(1)
   //   - Stores pattern in pPatterns['1']
   //   - Returns pattern
   // Step 2: [pattern].p('card-1')
   //   - Stores SAME pattern in pPatterns['card-1']
   //   - Returns pattern
   ```

   So the pattern is registered in BOTH locations! But when patterns are stacked in evaluate() (repl.mjs:216-225):
   ```javascript
   if (Object.keys(pPatterns).length) {
     let patterns = [];
     for (const [key, value] of Object.entries(pPatterns)) {
       patterns.push(value.withState((state) => state.setControls({ id: key })));
     }
     pattern = stack(...patterns);
   }
   ```

   This creates TWO stacked patterns from the same source! One with id='1', one with id='card-1'.

   When pausePanel() calls:
   ```javascript
   silence.p('card-1')
   ```

   This silences the 'card-1' entry, but NOT the '1' entry. So the pattern continues playing from the '1' registration.

**The Fix**:

r0astr needs to detect when user code already contains a `.p()`, `.d1`-`.d9`, or `.p1`-`.p9` call, and NOT append `.p(panelId)`.

**Detection Strategy**:
```javascript
// Check if code already has pattern registration
const hasPatternRegistration = /\.(p|d|q)\d*\s*$|\.(p|q)\s*\(/.test(output);

if (hasPatternRegistration) {
  // Don't append .p(panelId)
  evalResult = await strudelCore.evaluate(output, true, false);
} else {
  // Append .p(panelId) as usual
  evalResult = await strudelCore.evaluate(`${output}.p('${panelId}')`, true, false);
}
```

But this is fragile! Better approach: **Always let user code control pattern registration**

**Better Fix**: Modify r0astr's architecture:

1. **Remove automatic `.p(panelId)` injection**
2. **Detect which pattern IDs are used in the code**
3. **Map panel controls to the detected IDs**

This requires more significant refactoring.

**Immediate Workaround for Users**:
```javascript
// ❌ DON'T USE named patterns in r0astr:
s("bd sd").d1

// ✅ USE r0astr's automatic injection:
s("bd sd")  // r0astr auto-adds .p('card-1')

// ✅ OR use explicit panel ID:
s("bd sd").p('card-1')
```

**Severity**: CRITICAL - This breaks a fundamental Strudel pattern feature and creates a confusing UX

---

### Issue 5: Multiple Sliders in One Pattern - NOT TESTED

**Status**: Not tested by user

**Test Case**:
```javascript
s("bd").gain(slider(0.5, 0, 1)).lpf(slider(800, 100, 5000))
```

**Expected**: Two sliders render in UI, both functional

**Needs Testing**: Please test this and report results

---

## Priority Classification

### CRITICAL (Must Fix)
1. **Issue 4: Named patterns break panel controls** - Fundamental architectural issue
   - Impact: Users can't use `.d1`-`.d9` shortcuts without breaking pause functionality
   - Workaround: Document that users should not use named patterns
   - Fix: Detect pattern registration in user code and skip `.p(panelId)` injection

### HIGH (Should Fix)
2. **Issue 3: `orbit()` with `slider()` fails** - Important for multi-channel routing
   - Impact: Can't use reactive orbit selection
   - Workaround: Use static orbit values
   - Fix: Investigate orbit control implementation

3. **Issue 1: `each()` control syntax unclear** - Confusing UX
   - Impact: Different syntax from Strudel REPL
   - Workaround: Use lambda syntax `each((pat) => pat.gain(0.5))`
   - Fix: Ensure control functions are exposed as standalone curried functions

### LOW (Document)
4. **Issue 2: `cpm()` misunderstood as global setter** - User education
   - Impact: None (user error)
   - Fix: Document that `setCpm()` is the global tempo setter

---

## Recommended Actions

### Immediate (Can Do Now)

1. **Document workarounds** in CLAUDE.md:
   ```markdown
   ## ⚠️ Known Limitations

   **Named Pattern Shortcuts**: Do NOT use `.d1`-`.d9`, `.p1`-`.p9`, or `$:` notation.
   These will break the panel PAUSE button. Instead, let r0astr automatically
   register patterns, or use explicit panel IDs: `.p('card-1')`

   **Global Tempo**: Use `setCpm(120)`, not `cpm(120)`

   **each() Syntax**: Use lambda syntax: `each((pat) => pat.gain(0.5))`
   ```

2. **Add warning detection** in activatePanel():
   ```javascript
   // Detect problematic patterns
   const code = view.state.doc.toString();
   if (/\.(d|p|q)\d|\.(p|q)\s*\(/.test(code)) {
     console.warn('[r0astr] Pattern uses named registration (.d1, .p1, etc.). Panel PAUSE may not work. Use plain patterns instead.');
     // Optional: Show warning in UI
   }
   ```

### Short-term (Next Sprint)

3. **Fix Issue 4: Named pattern detection**

   Add to activatePanel() (main.js:1700-1900):
   ```javascript
   // Detect if user code already has pattern registration
   const hasPatternReg = /\.(p|d|q)\(|\.(?:p|d|q)\d+\s*$/.test(output);

   if (hasPatternReg) {
     // User is manually registering - don't add .p(panelId)
     // But we need to track which ID they're using for pause to work

     // Extract the ID from the code
     const idMatch = output.match(/\.(p|d|q)\((['"']?)([^'")]+)\2\)|\.([pdq])(\d+)/);
     const patternId = idMatch ? (idMatch[3] || idMatch[5]) : null;

     // Store the mapping
     cardStates[panelId].patternId = patternId;

     evalResult = await strudelCore.evaluate(output, true, false);
   } else {
     // Auto-register with panel ID
     cardStates[panelId].patternId = panelId;
     evalResult = await strudelCore.evaluate(`${output}.p('${panelId}')`, true, false);
   }
   ```

   Then update pausePanel():
   ```javascript
   async function pausePanel(panelId) {
     const state = cardStates[panelId];
     const patternId = state.patternId || panelId;  // Use tracked ID or fallback

     strudelCore.evaluate(`silence.p('${patternId}')`, true, false);
     // ...
   }
   ```

4. **Fix Issue 3: Investigate orbit + slider**

   Add test case to validate orbit control:
   ```javascript
   // Test in activatePanel validation
   const testOrbit = await strudelCore.evaluate('s("bd").orbit(2)', false, false);
   const testOrbitSlider = await strudelCore.evaluate('s("bd").orbit(slider(0,0,7))', false, false);
   ```

5. **Fix Issue 1: Expose control functions**

   Verify controls are in evalScope (main.js:169):
   ```javascript
   const scope = await evalScope(
     import('@strudel/core'),
     // ... other imports ...

     // VERIFY: Are control functions exposed?
     Promise.resolve({ gain, lpf, pan, /* etc */ })
   );
   ```

### Long-term (Future)

6. **Architectural redesign**: Fully support Strudel's pattern-centric model
   - Remove automatic `.p(panelId)` injection
   - Let users freely use `.d1`-`.d9` shortcuts
   - Map panel controls to pattern IDs dynamically
   - Support multiple patterns per panel (like Strudel REPL)

---

## Testing Protocol

### Regression Tests (Add to Test Suite)

```javascript
// Test 1: Named pattern with panel pause
describe('Named patterns', () => {
  it('should pause when using .d1 shortcut', async () => {
    // Activate panel with: s("bd sd").d1
    await activatePanel('card-1');

    // Click pause
    await pausePanel('card-1');

    // Verify pattern is silent
    expect(cardStates['card-1'].playing).toBe(false);
    // Pattern should actually be stopped, not just marked as paused
  });
});

// Test 2: each() with control
describe('each() transform', () => {
  it('should apply gain to all patterns', async () => {
    // Master panel: each((pat) => pat.gain(0.5))
    await evaluateMasterCode('each((pat) => pat.gain(0.5))');

    // Start two panels
    await activatePanel('card-1');
    await activatePanel('card-2');

    // Verify both have reduced gain
    // (This would require audio analysis - skip for now)
  });
});

// Test 3: orbit with slider
describe('orbit() control', () => {
  it('should work with static value', async () => {
    await evaluate('s("bd").orbit(2)');
    expect(/* no error */).toBe(true);
  });

  it('should work with slider', async () => {
    await evaluate('s("bd").orbit(slider(0, 0, 7))');
    expect(/* no error */).toBe(true);
  });
});
```

---

## Conclusion

**Audio rendering parity is HIGH (100% for basic audio)**, but **pattern control parity is MEDIUM (50% for multi-pattern control)**.

The most critical issue is **named pattern registration breaking panel controls**. This needs immediate attention as it affects a core Strudel feature.

The other issues are either syntax misunderstandings (cpm) or require investigation (orbit+slider, each+controls).

---

**Next Steps**:
1. Document workarounds immediately
2. Add warning detection for named patterns
3. Implement pattern ID tracking fix
4. Investigate orbit + slider interaction
5. Verify control function exposure in evalScope

**Estimated Effort**:
- Immediate fixes (documentation, warnings): 1 hour
- Short-term fixes (pattern ID tracking): 4 hours
- Investigation (orbit, controls): 2 hours
- Long-term refactor (pattern-centric model): 16+ hours
