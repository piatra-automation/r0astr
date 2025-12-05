# Pattern Examples

A collection of ready-to-use patterns for r0astr. Copy these into your cards and experiment!

## Drum Patterns

### Basic Four-on-the-Floor
```javascript
s("bd*4, ~ sd ~ sd, hh*8").gain(0.8)
```
Classic house/techno beat with kick, snare, and hi-hats.

### Breakbeat
```javascript
s("bd ~ bd ~, ~ sd ~ [sd sd], [~ hh]*4").fast(1.5)
```
A more complex breakbeat pattern with syncopation.

### Minimal Techno
```javascript
s("bd ~ ~ ~, ~ ~ sd ~, ~ hh ~ hh").delay(0.125).delayfeedback(0.4)
```
Sparse techno pattern with delay for movement.

## Bass Lines

### Deep Sub Bass
```javascript
note("c2 ~ c2 ~").s("sawtooth").lpf(slider(400, 100, 1000)).gain(0.6)
```
Simple but effective sub bass with controllable filter.

### Funky Bass
```javascript
note("c2 ~ eb2 f2").s("sawtooth").lpf(600).decay(0.1).fast(2)
```
More rhythmic bass line with movement.

### Acid Bass
```javascript
note("c2 ~ eb2 ~").s("sawtooth")
  .lpf(slider(800, 200, 4000))
  .resonance(10)
  .gain(0.5)
```
Classic acid sound with resonant filter sweep.

## Melodies

### Simple Arpeggio
```javascript
n("0 2 3 5").scale("C4:minor").s("triangle").lpf(600).fast(2)
```
Basic melodic arpeggio in C minor.

### Chord Progression
```javascript
note("<c3'maj7 f3'maj7 g3'7 a3'm7>")
  .s("sawtooth")
  .lpf(1000)
  .room(0.5)
  .slow(4)
```
Jazz-inspired chord progression with reverb.

### Euclidean Melody
```javascript
note("c4 d4 e4 g4 a4").euclidean(3, 8).scale("C:minor").s("sine")
```
Euclidean rhythm applied to melodic notes.

## Ambient & Atmospheric

### Pad
```javascript
note("c3 e3 g3")
  .s("sawtooth")
  .lpf(400)
  .room(0.9)
  .gain(slider(0.3, 0, 0.6))
  .slow(8)
```
Slow-moving ambient pad with heavy reverb.

### Drone
```javascript
note("c2 g2")
  .s("sawtooth")
  .lpf(300)
  .room(0.95)
  .delay(0.5)
  .delayfeedback(0.7)
  .gain(0.4)
```
Deep drone with delay and reverb.

### Texture
```javascript
s("~ ~ click ~")
  .speed(rand.range(0.5, 2))
  .room(1)
  .delay(slider(0.3, 0, 0.8))
  .gain(0.3)
```
Random textural clicks with effects.

## Complete Compositions

### Minimal Set (4 Cards)

**Card 1 - Kick:**
```javascript
s("bd*4").gain(0.9)
```

**Card 2 - Hi-hats:**
```javascript
s("~ hh ~ hh").delay(0.125).gain(0.6)
```

**Card 3 - Bass:**
```javascript
note("c2 ~ eb2 ~").s("sawtooth").lpf(slider(500, 200, 2000)).gain(0.6)
```

**Card 4 - Lead:**
```javascript
n("0 3 5 7").scale("C4:minor")
  .s("triangle")
  .lpf(800)
  .room(0.4)
  .fast(2)
  .gain(slider(0.4, 0, 0.7))
```

### Ambient Set (4 Cards)

**Card 1 - Low Drone:**
```javascript
note("c2").s("sawtooth").lpf(200).room(0.9).gain(0.3).slow(8)
```

**Card 2 - Mid Drone:**
```javascript
note("g2 c3").s("sawtooth").lpf(400).room(0.9).gain(0.25).slow(6)
```

**Card 3 - Texture:**
```javascript
s("~ ~ click ~")
  .speed(rand.range(0.3, 1.5))
  .room(1)
  .delay(0.5)
  .gain(0.2)
  .slow(2)
```

**Card 4 - Melody:**
```javascript
n("0 2 4 7").scale("C5:minor")
  .s("sine")
  .room(0.7)
  .gain(slider(0.3, 0, 0.5))
  .slow(4)
```

## Pattern Techniques

### Using Randomness
```javascript
note("c3 d3 e3 g3").sometimes(x => x.fast(2))
```
Randomly speeds up the pattern sometimes.

### Polyrhythms
```javascript
s("bd*3, hh*4, sd*5").slow(2)
```
Three different rhythmic patterns creating complex timing.

### Degrading
```javascript
s("hh*8").degrade(0.3)
```
Randomly removes 30% of events for variation.

### Chopping Patterns
```javascript
s("bd hh sd hh").chunk(4, (x, i) => i % 2 ? x.fast(2) : x)
```
Processes pattern chunks differently.

## Interactive Control Tips

Use sliders for live performance control:

```javascript
// Wet/dry mix
s("bd*4").room(slider(0.3, 0, 1))

// Tempo variation
s("hh*8").fast(slider(1, 0.5, 2))

// Filter cutoff
note("c2").lpf(slider(800, 100, 5000))

// Gain/volume
s("bd ~ sd ~").gain(slider(0.7, 0, 1))
```

## Next Steps

- Try combining these patterns in different ways
- Modify parameters to make them your own
- Check the [Strudel documentation](https://strudel.cc/learn/) for more functions
- Experiment with [Remote Control](remote-control.md) for live performance
