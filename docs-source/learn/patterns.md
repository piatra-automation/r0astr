# Pattern Syntax

!!! note "Coming Soon"
    This page is under development. Check back soon for comprehensive documentation.

## Mini Notation Basics

r0astr uses Strudel's mini notation for writing patterns.

### Sequences

```javascript
s("bd sd bd sd")  // Play sounds in sequence
```

### Rests

```javascript
s("bd ~ sd ~")  // ~ creates silence
```

### Multiplication

```javascript
s("bd*4")  // Repeat 4 times in one cycle
```

### Subdivision

```javascript
s("bd [hh hh]")  // Subdivide: hi-hats play twice as fast
```

## Sound Sources

### Samples

```javascript
s("bd hh sd hh")  // Use built-in samples
```

### Synths

```javascript
note("c3 e3 g3").s("sawtooth")  // Use synthesizers
```

## Common Modifiers

| Function | Description | Example |
|----------|-------------|---------|
| `.gain()` | Volume (0-1) | `.gain(0.5)` |
| `.lpf()` | Low-pass filter | `.lpf(800)` |
| `.fast()` | Speed up | `.fast(2)` |
| `.slow()` | Slow down | `.slow(2)` |
| `.room()` | Reverb | `.room(0.5)` |

## Sliders

Add interactive sliders to control values in real-time:

```javascript
note("c2").lpf(slider(800, 100, 5000))
```

---

*For the complete Strudel reference, see [strudel.cc/learn](https://strudel.cc/learn/)*
