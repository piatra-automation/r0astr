# Pattern Library

A collection of ready-to-use patterns. Copy and paste into any card.

## Drums

### Basic Four-on-the-Floor
```javascript
s("bd*4")
```
*Beginner* - Simple kick drum pattern.

### Rock Beat
```javascript
s("bd*4, ~ sd ~ sd, hh*8")
```
*Beginner* - Classic rock/pop drum pattern.

### Breakbeat
```javascript
s("bd sd:1 [~ bd] sd:2").fast(2)
```
*Intermediate* - Syncopated breakbeat pattern.

### Minimal Techno
```javascript
s("bd bd, ~ cp ~ ~, hh*16").gain(0.8)
```
*Beginner* - Driving minimal techno beat.

---

## Bass

### Simple Sub
```javascript
note("c2 ~ c2 ~").s("sawtooth").lpf(200).gain(0.6)
```
*Beginner* - Deep sub bass.

### Walking Bass
```javascript
note("c2 e2 g2 e2").s("sawtooth").lpf(400)
```
*Beginner* - Simple walking bass line.

### Acid Bass
```javascript
note("c2 c2 c3 c2").s("sawtooth").lpf(slider(400, 100, 2000)).resonance(15)
```
*Intermediate* - Classic acid bass with filter slider.

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
*Beginner* - Faster arpeggio pattern.

### Chord Stabs
```javascript
n("[0,3,7]").scale("C4:minor").s("sawtooth").lpf(1200).slow(2)
```
*Intermediate* - Chord stab pattern.

---

## Ambient

### Pad Drone
```javascript
n("0 3 7").scale("C3:minor").s("sawtooth").lpf(600).room(0.9).slow(4)
```
*Beginner* - Slow evolving pad.

### Shimmer
```javascript
n("0 4 7 11").scale("C5:major").s("triangle").room(0.95).gain(0.3).fast(0.5)
```
*Intermediate* - High shimmer texture.

---

## FX

### Noise Sweep
```javascript
s("noise").lpf(slider(200, 50, 5000)).gain(0.2)
```
*Beginner* - Filtered noise with sweep control.

### Glitch Hits
```javascript
s("glitch:0 ~ glitch:2 ~").fast(2).gain(0.5)
```
*Intermediate* - Random glitch textures.

---

## Full Arrangements

### Minimal Setup

**Card 1 (Drums):**
```javascript
s("bd*4, ~ sd ~ sd")
```

**Card 2 (Bass):**
```javascript
note("c2 ~ c2 ~").s("sawtooth").lpf(300)
```

**Card 3 (Lead):**
```javascript
n("0 2 3 5").scale("C4:minor").s("triangle").fast(2)
```

**Card 4 (Pad):**
```javascript
n("0 3 7").scale("C3:minor").s("sawtooth").room(0.8).slow(4).gain(0.4)
```

---

!!! tip "Contribute"
    Have a great pattern? See [Contributing](../developers/contributing.md) to add it to this library.
