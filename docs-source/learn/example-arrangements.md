# Example Arrangements

Multi-panel compositions that show how `r0astr`'s panels work together. Copy each pattern into the corresponding panel.

---

## Minimal Setup

A simple, cohesive arrangement.

**Panel 1 (Drums):**
```javascript
s("bd*4, ~ sd ~ sd, hh*8").gain(0.8)
```

**Panel 2 (Bass):**
```javascript
note("c2 ~ c2 e2").s("sawtooth").lpf(300).gain(0.6)
```

**Panel 3 (Lead):**
```javascript
n("0 2 3 5 3 2").scale("C4:minor").s("triangle").gain(0.5)
```

**Panel 4 (Pad):**
```javascript
n("0 3 7").scale("C3:minor").s("sawtooth").lpf(600).room(0.8).slow(4).gain(0.4)
```

## Dark Techno

Heavy, driving techno arrangement.

**Panel 1 (Drums):**
```javascript
s("bd*4, ~ cp ~ ~, hh*16").gain(0.85)
```

**Panel 2 (Bass):**
```javascript
note("c1 ~ c1 c1").s("sawtooth").lpf(slider(250, 100, 800)).gain(0.7)
```

**Panel 3 (Stab):**
```javascript
n("[0,3,7] ~ ~ ~").scale("C3:minor").s("sawtooth").lpf(1500).room(0.3).gain(0.4)
```

**Panel 4 (Texture):**
```javascript
s("noise").lpf(slider(300, 50, 2000)).gain(0.1)
```

## Ambient Chill

Relaxed, atmospheric arrangement.

**Panel 1 (Light Percussion):**
```javascript
s("~ hh ~ hh, ~ ~ rim ~").gain(0.4)
```

**Panel 2 (Bass):**
```javascript
note("c2 ~ ~ e2").s("sine").lpf(400).gain(0.5).slow(2)
```

**Panel 3 (Melody):**
```javascript
n("0 ~ 4 ~, ~ 7 ~ 5").scale("C4:minor").s("triangle").room(0.7).gain(0.4).slow(2)
```

**Panel 4 (Pad):**
```javascript
n("0 3 7 10").scale("C3:minor").s("sawtooth").lpf(500).room(0.95).slow(8).gain(0.3)
```

---

## Tips

### Building a Multi-Panel Composition

- **Stay in key**: Use the same scale (e.g., `C:minor`) across all panels
- **Frequency separation**: Keep bass low, melody in the mid range, pads spread wide
- **Dynamics**: Use `.gain()` sliders on each panel for real-time mix control
- **Start sparse**: Begin with one or two panels, then bring others in gradually

### Experimenting

- Change `.fast(2)` to `.fast(4)` for double speed
- Swap scales: `C:minor` → `C:major`
- Add effects: `.room(0.5)` or `.delay(0.25)`
- Add sliders: `.lpf(slider(800, 100, 4000))`
- Use the [Master Panel](master-panel.md) for global tempo and effects
