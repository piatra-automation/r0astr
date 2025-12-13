# Pattern Syntax

Learn the mini notation language for writing patterns in r0astr.

---

## Mini Notation Basics

r0astr uses Strudel's **mini notation** - a concise language for describing musical sequences.

### Sequences

Space-separated sounds play one after another within a cycle:

```javascript
s("bd sd bd sd")  // Four sounds spread across one cycle
```

### Rests (Silence)

Use `~` to create silence:

```javascript
s("bd ~ sd ~")  // Sound, silence, sound, silence
```

### Multiplication

Repeat a sound multiple times with `*`:

```javascript
s("bd*4")     // Bass drum 4 times per cycle
s("hh*8")     // Hi-hat 8 times per cycle
s("bd*2 sd")  // Two kicks, then one snare
```

### Subdivision

Use `[]` to subdivide time - items inside share the parent's time slot:

```javascript
s("bd [hh hh]")      // bd gets half, two hh share the other half
s("bd [sd sd sd]")   // bd gets half, three snares share the other half
s("[[bd bd] hh] sd") // Nested subdivision
```

### Stacking (Layering)

Use `,` to play sounds simultaneously:

```javascript
s("bd*4, ~ sd ~ sd")           // Kick pattern + snare pattern together
s("bd*4, ~ sd ~ sd, hh*8")     // Full drum kit layered
```

### Alternation

Use `<>` to alternate between options each cycle:

```javascript
s("<bd sd>")           // bd first cycle, sd second cycle
s("<bd sd cp>")        // Cycles through three sounds
note("<c3 e3 g3>")     // Cycles through three notes
```

---

## Sound Sources

### Samples with `s()`

Play built-in samples using `s()`:

```javascript
s("bd hh sd hh")       // Use sample names
s("bd:0 bd:1 bd:2")    // Different variations with :n
```

**Common Sample Names:**

| Name | Sound |
|------|-------|
| `bd` | Bass drum / Kick |
| `sd` | Snare drum |
| `hh` | Hi-hat |
| `oh` | Open hi-hat |
| `cp` | Clap |
| `rim` | Rimshot |
| `tom` | Tom |
| `ride` | Ride cymbal |

### Synths with `note()`

Generate tones using `note()` with note names:

```javascript
note("c3 e3 g3")                    // Play notes
note("c3 e3 g3").s("sawtooth")      // Choose synth type
note("c3 e3 g3").s("triangle")      // Different synth
```

**Synth Types:**

| Type | Sound |
|------|-------|
| `sawtooth` | Bright, buzzy (good for bass) |
| `triangle` | Soft, flute-like |
| `square` | Hollow, video-game style |
| `sine` | Pure tone, smooth |

### Scales with `n()`

Use scale degrees instead of note names:

```javascript
n("0 2 4 5").scale("C:major")       // C D E F
n("0 1 2 3").scale("C:minor")       // C D Eb F
n("0 2 4").scale("A3:minor")        // Am chord
```

---

## Common Modifiers

Chain modifiers after your pattern to shape the sound:

### Quick Reference

| Modifier | Description | Range | Example |
|----------|-------------|-------|---------|
| `.gain(n)` | Volume level | 0-1 | `.gain(0.5)` |
| `.lpf(hz)` | Low-pass filter cutoff | 20-20000 | `.lpf(800)` |
| `.hpf(hz)` | High-pass filter cutoff | 20-20000 | `.hpf(200)` |
| `.fast(n)` | Speed up pattern | 0.5-8 | `.fast(2)` |
| `.slow(n)` | Slow down pattern | 0.5-8 | `.slow(2)` |
| `.room(n)` | Reverb amount | 0-1 | `.room(0.5)` |
| `.delay(n)` | Delay amount | 0-1 | `.delay(0.25)` |
| `.pan(n)` | Stereo position | -1 to 1 | `.pan(-0.5)` |

### Volume with `.gain()`

Control volume from 0 (silent) to 1 (full):

```javascript
s("bd*4").gain(0.8)                // 80% volume
s("hh*8").gain(0.3)                // Quieter hi-hats
```

### Filters with `.lpf()` and `.hpf()`

Low-pass filter removes high frequencies (makes sound duller):

```javascript
note("c2").s("sawtooth").lpf(400)  // Dark bass
note("c2").s("sawtooth").lpf(2000) // Brighter bass
```

High-pass filter removes low frequencies (makes sound thinner):

```javascript
s("bd*4").hpf(200)                 // Thin kick
```

### Speed with `.fast()` and `.slow()`

Change pattern speed:

```javascript
s("bd sd bd sd").fast(2)           // 2x speed (8 hits per cycle)
s("bd sd bd sd").slow(2)           // Half speed (takes 2 cycles)
```

### Reverb with `.room()`

Add space and ambience:

```javascript
note("c3 e3 g3").room(0.5)         // Medium reverb
note("c3 e3 g3").room(0.9)         // Large hall reverb
```

---

## Sliders

Add interactive sliders to control values in real-time.

### Basic Syntax

```javascript
slider(default, min, max)
```

- `default`: Starting value
- `min`: Minimum value
- `max`: Maximum value

### Usage Example

```javascript
note("c2 ~ c2 e2").s("sawtooth").lpf(slider(800, 100, 5000))
```

This creates a slider that:
- Starts at 800 Hz
- Can be adjusted from 100 Hz to 5000 Hz
- Updates the filter in real-time as you drag

### Multiple Sliders

Each slider appears in the card's control area:

```javascript
note("c2 ~ c2 e2")
  .s("sawtooth")
  .lpf(slider(800, 100, 5000))
  .gain(slider(0.6, 0, 1))
```

---

## Example Patterns

Copy-paste these into r0astr to try them.

### Drums

**Four on the Floor**
```javascript
s("bd*4, ~ sd ~ sd, hh*8").gain(0.8)
```

**Rock Beat**
```javascript
s("bd ~ bd ~, ~ sd ~ sd, hh*8").gain(0.8)
```

**Breakbeat**
```javascript
s("bd sd:1 [~ bd] sd:2, hh*8").fast(1).gain(0.7)
```

### Bass

**Sub Bass**
```javascript
note("c2 ~ c2 ~").s("sawtooth").lpf(200).gain(0.6)
```

**Walking Bass**
```javascript
note("c2 e2 g2 e2").s("sawtooth").lpf(400).gain(0.5)
```

**Synth Bass**
```javascript
note("c2 ~ c2 eb2, ~ ~ g2 ~").s("square").lpf(slider(300, 100, 1000)).gain(0.5)
```

### Melody

**Arpeggiated Chord**
```javascript
n("0 2 4 7").scale("C4:minor").s("triangle").gain(0.5)
```

**Chord Stabs**
```javascript
n("[0,2,4] ~ [0,2,4] ~").scale("C4:minor").s("sawtooth").lpf(1200).gain(0.4)
```

**Lead Line**
```javascript
n("0 2 3 5 3 2").scale("C5:minor").s("triangle").room(0.3).gain(0.5)
```

### Ambient

**Soft Pad**
```javascript
n("0 3 7").scale("C3:minor").s("sawtooth").lpf(600).room(0.8).slow(4).gain(0.4)
```

**Shimmer**
```javascript
n("<0 2 4 5>").scale("C5:major").s("triangle").room(0.9).delay(0.3).slow(2).gain(0.3)
```

---

## Combining Techniques

Build complex patterns by combining these techniques:

```javascript
// Evolving bass with slider control
note("c2 ~ [c2 c2] eb2")
  .s("sawtooth")
  .lpf(slider(400, 100, 2000))
  .gain(0.6)
  .room(0.2)
```

```javascript
// Layered percussion
s("bd*4, [~ sd]*2, [hh hh hh ~]*2")
  .gain(slider(0.7, 0, 1))
```

---

## Next Steps

- **Practice**: Copy patterns above and modify them
- **Experiment**: Change numbers, add modifiers, break things
- **Explore**: See [Multi-Instrument Guide](multi-instrument.md) for using multiple cards

---

## Full Reference

This guide covers the essentials. For the complete Strudel reference including all functions, patterns, and advanced techniques:

[:octicons-arrow-right-24: strudel.cc/learn](https://strudel.cc/learn/){ .md-button target="_blank" }
