# Usage Guide

Learn how to use r0astr effectively for live coding and music composition.

## Interface Overview

The r0astr interface consists of:

- **4 Instrument Cards** - Each card is an independent instrument
- **Master Panel** - Global controls (if configured)
- **Code Editors** - Write your pattern code in each card
- **Play/Pause Buttons** - Control each instrument individually

## Basic Controls

### Starting a Pattern

1. Write or edit pattern code in a card's textarea
2. Click the **Play** button for that card
3. The pattern starts playing immediately

### Updating a Pattern

1. Edit the code while the pattern is playing
2. Click **Play** again to apply changes
3. The update happens on the next cycle boundary

### Pausing a Pattern

- Click **Pause** to mute that specific instrument
- Other instruments continue playing
- The pattern stays synchronized but produces no sound

### Stopping a Pattern

- Click **Stop** (if available) to completely stop and reset the pattern
- Or use **Pause** to mute without stopping

## Pattern Basics

### Sounds and Samples

```javascript
// Play a sample
s("bd")

// Play multiple samples in sequence
s("bd hh sd hh")

// Layer patterns
s("bd*4, ~ sd ~ sd")
```

### Notes and Melodies

```javascript
// Specific notes
note("c3 e3 g3")

// Scale degrees
n("0 2 4").scale("C:minor")

// Chords
note("<c3'maj7 f3'maj7>")
```

### Timing and Rhythm

```javascript
// Multiply pattern (4 kicks per cycle)
s("bd*4")

// Subdivide (hi-hats twice as fast)
s("bd [hh hh]")

// Speed up pattern
s("bd hh sd hh").fast(2)

// Slow down pattern
s("bd hh sd hh").slow(2)
```

## Sliders for Interactive Control

Use `slider()` to create interactive controls:

```javascript
// Basic slider: slider(default, min, max)
note("c2").lpf(slider(800, 100, 5000))
```

This creates a slider widget in the UI that you can adjust in real-time!

### Slider Examples

```javascript
// Volume control
s("bd*4").gain(slider(0.8, 0, 1))

// Filter sweep
note("c2").lpf(slider(800, 100, 5000))

// Room size (reverb)
s("bd hh sd hh").room(slider(0.5, 0, 1))

// Delay time
s("hh*8").delay(slider(0.25, 0, 0.5))
```

## Audio Effects

### Filters

```javascript
// Low-pass filter
.lpf(800)

// High-pass filter
.hpf(200)

// Band-pass filter
.bpf(1000)
```

### Time-Based Effects

```javascript
// Reverb (room size)
.room(0.5)

// Delay
.delay(0.25)

// Delay with feedback
.delay(0.25).delayfeedback(0.6)
```

### Dynamics

```javascript
// Volume
.gain(0.8)

// Velocity (for note-based patterns)
.velocity(0.7)
```

## Synchronization

All patterns share a common clock:

- Patterns stay in sync automatically
- You can start/stop cards independently
- Timing relationships are maintained

## Tips for Live Performance

1. **Prepare patterns** - Write variations before performing
2. **Use sliders** - Control parameters in real-time
3. **Layer gradually** - Start with drums, add bass, then melody
4. **Mute strategically** - Use Pause to create breaks and builds
5. **Remote control** - Use an iPad for hands-on control (see [Remote Control](remote-control.md))

## Common Patterns

### Build and Release

```javascript
// Start simple
s("bd*4")

// Add complexity
s("bd*4, hh*8")

// Add variation
s("bd*4, hh*8, ~ sd ~ sd")
```

### Call and Response

Use two cards for melodic conversation:

**Card 1:**
```javascript
note("c4 d4 e4").slow(2)
```

**Card 2:**
```javascript
note("g3 a3 b3").slow(2).late(1)
```

### Drone and Melody

**Card 1 (Drone):**
```javascript
note("c2").s("sawtooth").lpf(300).room(0.9).slow(4)
```

**Card 2 (Melody):**
```javascript
n("0 2 3 5 7").scale("C4:minor").s("triangle").fast(2)
```

## Next Steps

- Explore [Pattern Examples](examples.md) for more ideas
- Learn about [Remote Control](remote-control.md) for performance setups
- Check the [Strudel documentation](https://strudel.cc/learn/) for advanced techniques
