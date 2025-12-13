# Pattern Library

A collection of ready-to-use patterns. Copy and paste into any card.

**Difficulty Levels:**

- **Beginner** - Simple, single-concept patterns
- **Intermediate** - Combines multiple techniques
- **Advanced** - Complex rhythms or generative elements

---

## Drums

### Basic Four-on-the-Floor

```javascript
s("bd*4")
```

*Beginner* - The foundation of house, techno, and disco.

### Rock Beat

```javascript
s("bd*4, ~ sd ~ sd, hh*8")
```

*Beginner* - Classic rock/pop drum pattern with kick, snare, and hi-hats.

### Breakbeat

```javascript
s("bd sd:1 [~ bd] sd:2").fast(2)
```

*Intermediate* - Syncopated breakbeat with ghost notes.

### Minimal Techno

```javascript
s("bd bd, ~ cp ~ ~, hh*16").gain(0.8)
```

*Beginner* - Driving minimal techno beat with clap.

### Hip Hop

```javascript
s("bd ~ ~ bd, ~ sd ~ sd, [~ hh]*8").slow(1.5)
```

*Intermediate* - Laid-back hip hop groove.

### Complex Polyrhythm

```javascript
s("bd*4, sd*3, hh*5, cp*7").gain(0.7)
```

*Advanced* - Overlapping time signatures create evolving patterns.

### Drum & Bass

```javascript
s("[bd ~ bd ~] [~ sd ~ ~], hh*8").fast(2)
```

*Intermediate* - Fast breakbeat foundation.

---

## Bass

### Simple Sub

```javascript
note("c2 ~ c2 ~").s("sawtooth").lpf(200).gain(0.6)
```

*Beginner* - Deep sub bass with rhythmic gaps.

### Walking Bass

```javascript
note("c2 e2 g2 e2").s("sawtooth").lpf(400)
```

*Beginner* - Simple walking bass line.

### Acid Bass

```javascript
note("c2 c2 c3 c2").s("sawtooth").lpf(slider(400, 100, 2000)).resonance(15)
```

*Intermediate* - Classic acid bass with filter slider. Sweep for that 303 sound.

### Syncopated Bass

```javascript
note("c2 ~ [c2 eb2] ~, ~ g2 ~ ~").s("square").lpf(350).gain(0.5)
```

*Intermediate* - Off-beat accents create groove.

### Octave Jump

```javascript
note("c2 c3 c2 c3").s("sawtooth").lpf(slider(300, 100, 1000)).gain(0.6)
```

*Beginner* - Simple octave pattern with filter control.

---

## Melody

### Simple Arpeggio

```javascript
n("0 2 4 7").scale("C4:minor").s("triangle")
```

*Beginner* - Basic minor arpeggio.

### Fast Arp

```javascript
n("0 2 4 7 4 2").scale("C4:minor").s("triangle").fast(2)
```

*Beginner* - Faster arpeggio pattern with direction change.

### Chord Stabs

```javascript
n("[0,3,7]").scale("C4:minor").s("sawtooth").lpf(1200).slow(2)
```

*Intermediate* - Minor chord stabs on half notes.

### Scale Runner

```javascript
n("0 1 2 3 4 5 6 7").scale("C4:minor").s("triangle").fast(2).gain(0.5)
```

*Intermediate* - Runs up the scale quickly.

### Call and Response

```javascript
n("<[0 2 4] [7 5 3]>").scale("C4:minor").s("triangle").gain(0.5)
```

*Intermediate* - Alternates between ascending and descending phrases.

### Generative Melody

```javascript
n("<0 2 3 5 7>*4").scale("C4:minor").s("triangle").room(0.3).gain(0.5)
```

*Advanced* - Slow cycle through scale degrees creates evolving melody.

---

## Ambient

### Pad Drone

```javascript
n("0 3 7").scale("C3:minor").s("sawtooth").lpf(600).room(0.9).slow(4)
```

*Beginner* - Slow evolving pad chord.

### Shimmer

```javascript
n("0 4 7 11").scale("C5:major").s("triangle").room(0.95).gain(0.3).fast(0.5)
```

*Intermediate* - High register shimmer texture.

### Evolving Texture

```javascript
n("<0 2 4> <3 5 7>").scale("C3:minor").s("sawtooth").lpf(slider(500, 200, 2000)).room(0.9).slow(4).gain(0.3)
```

*Advanced* - Slowly shifting chord voicings with filter control.

### Deep Space

```javascript
n("0 ~ 7 ~").scale("C2:minor").s("sine").room(0.99).delay(0.4).slow(8).gain(0.4)
```

*Intermediate* - Sparse, reverberant bass tones.

---

## FX

### Noise Sweep

```javascript
s("noise").lpf(slider(200, 50, 5000)).gain(0.2)
```

*Beginner* - Filtered noise with sweep control. Great for builds.

### Glitch Hits

```javascript
s("glitch:0 ~ glitch:2 ~").fast(2).gain(0.5)
```

*Intermediate* - Random glitch textures.

### Riser

```javascript
s("noise*4").lpf(slider(200, 50, 8000)).hpf(slider(50, 20, 2000)).gain(0.15)
```

*Intermediate* - Two sliders for creating tension builds.

---

## Full Arrangements

Copy these patterns to their respective cards for complete tracks.

### Minimal Setup

A simple, cohesive arrangement.

**Card 1 (Drums):**
```javascript
s("bd*4, ~ sd ~ sd, hh*8").gain(0.8)
```

**Card 2 (Bass):**
```javascript
note("c2 ~ c2 e2").s("sawtooth").lpf(300).gain(0.6)
```

**Card 3 (Lead):**
```javascript
n("0 2 3 5 3 2").scale("C4:minor").s("triangle").gain(0.5)
```

**Card 4 (Pad):**
```javascript
n("0 3 7").scale("C3:minor").s("sawtooth").lpf(600).room(0.8).slow(4).gain(0.4)
```

### Dark Techno

Heavy, driving techno arrangement.

**Card 1 (Drums):**
```javascript
s("bd*4, ~ cp ~ ~, hh*16").gain(0.85)
```

**Card 2 (Bass):**
```javascript
note("c1 ~ c1 c1").s("sawtooth").lpf(slider(250, 100, 800)).gain(0.7)
```

**Card 3 (Stab):**
```javascript
n("[0,3,7] ~ ~ ~").scale("C3:minor").s("sawtooth").lpf(1500).room(0.3).gain(0.4)
```

**Card 4 (Texture):**
```javascript
s("noise").lpf(slider(300, 50, 2000)).gain(0.1)
```

### Ambient Chill

Relaxed, atmospheric arrangement.

**Card 1 (Light Percussion):**
```javascript
s("~ hh ~ hh, ~ ~ rim ~").gain(0.4)
```

**Card 2 (Bass):**
```javascript
note("c2 ~ ~ e2").s("sine").lpf(400).gain(0.5).slow(2)
```

**Card 3 (Melody):**
```javascript
n("0 ~ 4 ~, ~ 7 ~ 5").scale("C4:minor").s("triangle").room(0.7).gain(0.4).slow(2)
```

**Card 4 (Pad):**
```javascript
n("0 3 7 10").scale("C3:minor").s("sawtooth").lpf(500).room(0.95).slow(8).gain(0.3)
```

---

## Tips

### Combining Patterns

- **Stay in key**: Use the same scale (e.g., C:minor) across cards
- **Frequency separation**: Bass low, melody mid, ambient spread
- **Dynamics**: Use `.gain()` sliders for real-time mix control

### Modifying Patterns

Start with a pattern and experiment:

- Change `.fast(2)` to `.fast(4)` for double speed
- Swap scales: `C:minor` to `C:major`
- Add effects: `.room(0.5)` or `.delay(0.25)`
- Add sliders: `.lpf(slider(800, 100, 4000))`

---

!!! tip "Contribute a Pattern"
    Have a great pattern? We'd love to add it! See the [Contributing Guide](../developers/contributing.md) for instructions on submitting patterns to this library.
