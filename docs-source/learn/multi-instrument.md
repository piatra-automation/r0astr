# Multi-Instrument Guide

Learn to use multiple cards together for layered compositions.

---

## The Four-Card Setup

r0astr gives you four independent cards. Think of them as four musicians in a band - each plays their own part, but they all follow the same beat.

| Card | Typical Role |
|------|--------------|
| Card 1 | Drums / Percussion |
| Card 2 | Bass |
| Card 3 | Melody / Lead |
| Card 4 | Ambient / Texture |

This is a common setup, but you can use cards however you like.

---

## Starting and Stopping Cards

### Individual Control

Each card has its own Play/Pause button:

- **Play**: Starts the pattern in that card
- **Pause**: Stops only that card (others keep playing)

### What Happens to Other Cards?

Nothing. When you start or stop a card, all other cards continue unchanged. This is the key to live performance - you can bring instruments in and out dynamically.

### Stop All

The master panel has a **Stop All** button that stops every card at once. Use this when you want complete silence or to reset your performance.

---

## Synchronization

All cards share a **single audio clock**. This is fundamental to how r0astr works.

### How It Works

1. The master panel sets the global tempo
2. Every card receives timing from this shared clock
3. When you press Play on a card, it waits for the next cycle boundary
4. The pattern joins in perfect sync with anything already playing

### Why This Matters

- **No drift**: Cards never slowly go out of sync
- **Musical timing**: New patterns start at musically sensible moments
- **Confidence**: You can add/remove instruments knowing they'll stay in time

### Example Scenario

1. Press Play on Card 1 (drums) - it starts immediately
2. Press Play on Card 2 (bass) - it waits for the next cycle, then joins in sync
3. Both patterns now play together, locked to the same beat
4. Press Pause on Card 1 - drums stop, bass continues
5. Press Play on Card 1 - drums rejoin on the next cycle

---

## Complementary Pattern Design

Design patterns that work together, not against each other.

### Role of Drums (Card 1)

Drums provide the **rhythmic foundation**:

- Establish the groove
- Define the pulse
- Use samples: `bd`, `sd`, `hh`, `cp`

```javascript
// Simple four-on-floor
s("bd*4, ~ sd ~ sd, hh*8").gain(0.8)
```

### Role of Bass (Card 2)

Bass provides the **harmonic foundation**:

- Lock with the kick drum
- Establish the key/root
- Use low frequencies (lpf keeps it warm)

```javascript
// Sub bass matching the drums
note("c2 ~ c2 e2").s("sawtooth").lpf(300).gain(0.6)
```

### Role of Melody (Card 3)

Melody provides **interest and movement**:

- Sit in the mid-to-high frequency range
- Use scales to stay in key
- Add motion and variation

```javascript
// Minor scale melody
n("0 2 3 5 3 2").scale("C4:minor").s("triangle").gain(0.5)
```

### Role of Ambient (Card 4)

Ambient provides **texture and space**:

- Fill in the background
- Use reverb and slow patterns
- Keep volume low to not overwhelm

```javascript
// Slow evolving pad
n("0 3 7").scale("C3:minor").s("sawtooth").lpf(600).room(0.9).slow(4).gain(0.4)
```

---

## Different Instruments Per Card

### Samples vs Synths

| Type | Best For | Example |
|------|----------|---------|
| Samples (`s()`) | Drums, percussion, realistic sounds | `s("bd sd hh")` |
| Synths (`note()`) | Bass, melody, pads | `note("c3 e3")` |

### Frequency Separation

Keep your mix clear by separating frequencies:

| Role | Frequency Range | How |
|------|-----------------|-----|
| Bass | Low (60-300 Hz) | Use `.lpf(300)` |
| Drums | Wide | Samples are pre-EQ'd |
| Melody | Mid (300-3000 Hz) | Use higher octaves (C4, C5) |
| Ambient | Variable | Use reverb (`.room()`) |

### Matching Sounds to Roles

- **Bass**: `sawtooth` or `square` with low-pass filter
- **Melody**: `triangle` or `sawtooth` with mid-range filter
- **Pads**: `sawtooth` with heavy reverb and slow patterns

---

## Cross-Panel Pattern References

Cards can reference patterns from other cards by their title. This enables powerful orchestration where one card controls multiple patterns.

### How It Works

1. **Name your cards**: Double-click the card title to rename (e.g., "BASS", "LEAD")
2. **Write patterns**: Each card's pattern is automatically registered under its title
3. **Reference in other cards**: Use the title name to access the pattern

### Example Setup

**Card titled "BASS":**
```javascript
n("0 2 0 5").scale("E:minor").s("sawtooth").lpf(400)
```

**Card titled "LEAD":**
```javascript
n("0 4 7 11").scale("E:minor").s("triangle")
```

**Card titled "COMBO":**
```javascript
stack(BASS, LEAD.fast(2))
```

The COMBO card now plays both patterns stacked together, with LEAD playing twice as fast.

### Evaluation Order

Cards evaluate **top to bottom** based on their position in the panel list. This means:

- A card can only reference patterns from cards **above** it
- Drag cards to reorder if needed
- The master panel always evaluates first

### Dynamic Updates

When you update a card's pattern:

1. The pattern re-registers under its title
2. Any playing cards below that reference it automatically re-evaluate
3. Changes cascade through your arrangement

### Pattern Manipulation

Once referenced, you can transform patterns:

```javascript
// In a card titled "MIX"
stack(
  BASS.gain(0.7),
  LEAD.fast(2),
  DRUMS.slow(2)
)
```

### Reactive Cross-References

Use `ref()` for values that update continuously:

```javascript
stack(
  BASS.gain(ref(() => WHICH_PHASE() === 0 ? 1 : 0)),
  LEAD.gain(ref(() => WHICH_PHASE() === 1 ? 1 : 0))
)
```

This creates patterns that fade in/out based on a function defined in the master panel.

---

## Performance Tips

### Building Up

A classic performance technique:

1. **Start with drums** - Establish the groove
2. **Add bass** - Lock in the harmonic foundation
3. **Layer melody** - Add interest
4. **Finish with ambient** - Fill out the sound

### Creating Dynamics

Use stops for contrast:

- **Drop the bass**: Pause Card 2 for 8 bars, then bring it back
- **Drums only**: Stop everything except drums for a breakdown
- **Ambient interlude**: Stop drums and bass, let ambient breathe

### Live Variation

While patterns are playing:

- Edit the pattern code for instant changes
- Adjust sliders for real-time parameter tweaks
- Swap out patterns entirely for different sections

---

## Full Arrangement Example

Here's a complete four-card arrangement. Copy each pattern into its respective card.

### Card 1: Drums

```javascript
s("bd*4, ~ sd ~ sd, hh*8")
  .gain(0.8)
```

Establishes the beat with kick, snare, and hi-hats.

### Card 2: Bass

```javascript
note("c2 ~ c2 e2")
  .s("sawtooth")
  .lpf(slider(300, 100, 800))
  .gain(0.6)
```

Sub bass locked to the kick, with a slider for filter sweeps.

### Card 3: Melody

```javascript
n("0 2 3 5 3 2")
  .scale("C4:minor")
  .s("triangle")
  .lpf(1200)
  .gain(slider(0.5, 0, 1))
```

Minor scale melody with volume control.

### Card 4: Ambient

```javascript
n("0 3 7")
  .scale("C3:minor")
  .s("sawtooth")
  .lpf(600)
  .room(0.9)
  .slow(4)
  .gain(0.4)
```

Slow chord pad with heavy reverb for atmosphere.

### How They Work Together

- **Key**: All patterns use C minor
- **Tempo**: All locked to the master panel tempo
- **Frequency**: Bass low, melody mid, ambient spread
- **Dynamics**: Sliders allow real-time adjustment

---

## Performance Walkthrough

Try this sequence:

1. **Start drums** (Card 1) - Let it groove for 4 bars
2. **Add bass** (Card 2) - Foundation locked in
3. **Add melody** (Card 3) - Music takes shape
4. **Add ambient** (Card 4) - Full arrangement
5. **Drop melody** - Pause Card 3 for tension
6. **Bring melody back** - Release
7. **Stop all except ambient** - Breakdown
8. **Restart drums** - Build back up

---

## Next Steps

<div class="grid cards" markdown>

-   :material-tune:{ .lg .middle } **Master Panel**

    ---

    Control global tempo and create shared sliders.

    [:octicons-arrow-right-24: Master Panel Guide](master-panel.md)

-   :material-content-copy:{ .lg .middle } **Pattern Library**

    ---

    More ready-to-use patterns for each role.

    [:octicons-arrow-right-24: Pattern Library](pattern-library.md)

</div>
