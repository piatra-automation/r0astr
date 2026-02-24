# Concepts

Understand the mental model behind r0astr to make the interface intuitive.



## The Big Picture

r0astr is a multi-instrument live coding environment. Think of it as having multiple independent instruments on stage, all connected to the same metronome. You write code to control each instrument, and they all play together in perfect sync. You can create as many panels as you need.

```mermaid
graph TB
 subgraph r0astr["r0astr Interface"]
 MP[" Master Panel<br/>TEMPO, Global Effects"]
 C1[" Panel 1<br/>Drums"]
 C2[" Panel 2<br/>Bass"]
 C3[" Panel 3<br/>Melody"]
 CN[" Panel N<br/>..."]
 end
 CLOCK((" Shared Clock"))
 MP --> CLOCK
 CLOCK --> C1
 CLOCK --> C2
 CLOCK --> C3
 CLOCK --> CN
```



## Cards

Each **panel** is an independent instrument in r0astr.

### What is a Panel?

A panel is a self-contained unit that includes:

- A **code editor** where you write patterns
- A **Play/Pause button** to control playback
- **Slider controls** for real-time parameter adjustments

### Independence

Panels operate independently:

- **Different patterns**: Each panel can play completely different music
- **Separate controls**: Start, stop, and modify each panel without affecting others
- **Own parameters**: Each panel can have its own sliders and settings

### Typical Setup

A common starting point:

| Panel | Common Use |
|-------|------------|
| Panel 1 | Drums and percussion |
| Panel 2 | Bass line |
| Panel 3 | Melody or lead |
| Panel 4 | Ambient or effects |

This is just a suggestion — use panels however you like, and add more as needed.

[:octicons-arrow-right-24: Learn more in the Multi-Instrument Guide](multi-instrument.md)



## Synchronization

All panels share a **single audio clock**. This is the key to how r0astr works.

### Shared Clock

- Every panel receives timing from the same master clock
- When you start a new panel, it automatically syncs with already-playing patterns
- No drift or timing issues between instruments

### What This Means in Practice

1. **Start Panel 1** with a drum pattern
2. **Start Panel 2** with a bass line — it immediately locks to the beat
3. **Start Panel 3** with a melody — also perfectly in sync
4. All three play together as if they were designed as one piece

### Quantization

When you press Play on a panel:

- The pattern doesn't start immediately at a random point
- It waits for the next cycle boundary
- This ensures musical timing is always correct



## Master Panel

The **master panel** sits above all panels and provides global controls.

### Purpose

The master panel affects **everything at once**:

- **TEMPO**: Set the speed (in CPS - cycles per second)
- **Global Sliders**: Create variables like `SLIDER_LPF` that all panels can use
- **Master Effects**: Apply filters or effects to the entire mix

### TEMPO Control

The master panel is where you set the global tempo using a slider:

```javascript
// In Master Panel
let TEMPO = slider(30, 15, 45); // 30 CPS, range 15-45
```

All panels automatically follow this tempo.

### Global Sliders

Define sliders in the master panel that any panel can reference:

```javascript
// Master Panel
let SLIDER_LPF = slider(800, 100, 5000);

// Any panel can use it:
s("bd*4").lpf(SLIDER_LPF)
```

This lets you control parameters across all instruments with a single slider.

[:octicons-arrow-right-24: Learn more in the Master Panel Guide](master-panel.md)



## Pattern Lifecycle

Understanding how patterns work as you edit and play them.

### The Flow

```mermaid
flowchart LR
  Write["✏️ Write\nPattern"] --> Play["▶️ Play"]
  Play --> Sound["🔊 Hear\nSound"]
  Play --> Edit["✏️ Edit\nLive"]
  Edit --> Update["🔄 Changes\nApplied"]
  Update --> Sound
```

### Step by Step

1. **Write**: Type or paste a pattern into a panel's editor
2. **Play**: Click the Play button to start the pattern
3. **Listen**: Audio plays immediately through your speakers
4. **Edit (optional)**: Modify the pattern while it's playing
5. **Update**: Changes take effect on the next cycle
6. **Pause**: Click Pause to stop only that panel

### Live Coding

The magic of r0astr is **live coding**:

- Edit patterns while they play
- Hear changes almost instantly
- No need to stop and restart
- Experiment in real-time

!!! tip "Pro Tip"
 Make small changes and listen. This is the essence of live coding - evolving your music incrementally as you play.



## How They Connect

Let's tie all the concepts together:

1. **You write patterns** in each panel using Strudel's mini notation
2. **Panels are independent** — each runs its own pattern
3. **The master panel** provides global controls like TEMPO
4. **A shared clock** keeps everything synchronized
5. **Live updates** let you evolve your music in real-time



## Next Steps

<div class="grid cards" markdown>

- :material-music-note:{ .lg .middle } **Pattern Syntax**



 Learn the mini notation language for writing patterns.

 [:octicons-arrow-right-24: Strudel Learn](https://strudel.cc/learn/){ target="_blank" }

- :material-view-grid:{ .lg .middle } **Multi-Instrument**



 Advanced techniques for using multiple cards together.

 [:octicons-arrow-right-24: Multi-Instrument Guide](multi-instrument.md)

- :material-tune:{ .lg .middle } **Master Panel**



 Deep dive into global controls and sliders.

 [:octicons-arrow-right-24: Master Panel Guide](master-panel.md)

</div>
