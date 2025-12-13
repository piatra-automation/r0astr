# Master Panel Guide

Learn to control global tempo and create shared parameters across all cards.

---

## What is the Master Panel?

The **master panel** sits above the four cards and provides controls that affect **everything at once**:

- **TEMPO**: Controls the speed of all patterns
- **Global Sliders**: Variables that any card can reference
- **Stop All**: Stops all cards simultaneously

Think of the master panel as the conductor - it sets the tempo and overall tone, while each card (musician) plays their own part.

---

## TEMPO Control

### What TEMPO Does

TEMPO controls how fast patterns play across all cards. When you adjust TEMPO, every playing pattern speeds up or slows down together.

### Default Setup

The master panel includes a TEMPO slider:

```javascript
let TEMPO = slider(30, 15, 45);
```

| Parameter | Value | Meaning |
|-----------|-------|---------|
| Default | 30 | Starting speed |
| Min | 15 | Slowest setting |
| Max | 45 | Fastest setting |

### How Speed Works

r0astr uses **CPS (Cycles Per Second)** internally. You don't need to understand the math - just know that:

- Higher TEMPO = faster patterns
- Lower TEMPO = slower patterns
- All cards follow the same tempo

### Practical Use

1. Start with the default tempo
2. Use the slider to find a comfortable speed
3. All patterns automatically adjust

!!! tip "Performance Tip"
    Subtle tempo changes during a performance can add dynamics. Try slowly increasing tempo to build energy.

---

## Global Effect Sliders

Create sliders in the master panel that control parameters across all cards.

### Why Use Global Sliders?

Instead of adding separate filter sliders to each card, create one in the master panel:

- Single control affects everything
- Consistent effect across all instruments
- Great for sweeps and buildups

### Creating a Global Slider

In the master panel code:

```javascript
let SLIDER_LPF = slider(800, 100, 5000);
```

This creates:
- A slider named `SLIDER_LPF`
- Starting at 800 Hz
- Range from 100 Hz to 5000 Hz

### Using in Cards

Reference the variable name in any card:

```javascript
// Card 1
s("bd*4").lpf(SLIDER_LPF)

// Card 2
note("c2 ~ c2 e2").s("sawtooth").lpf(SLIDER_LPF)

// Card 3
n("0 2 4").scale("C4:minor").s("triangle").lpf(SLIDER_LPF)
```

Now one slider controls the filter on all three cards.

### Multiple Global Sliders

Add as many as you need:

```javascript
// Master Panel
let SLIDER_LPF = slider(800, 100, 5000);
let REVERB = slider(0.3, 0, 1);
let MASTER_GAIN = slider(0.8, 0, 1);
```

Use them in cards:

```javascript
note("c2").lpf(SLIDER_LPF).room(REVERB).gain(MASTER_GAIN)
```

---

## Variable Reference Workflow

### Step 1: Define in Master Panel

Write your slider definitions in the master panel:

```javascript
let FILTER = slider(1000, 200, 4000);
let SPACE = slider(0.5, 0, 1);
```

### Step 2: Use in Card Patterns

Reference the variable names (exactly as written) in any card:

```javascript
// This card uses both global sliders
note("c2 e2 g2")
  .s("sawtooth")
  .lpf(FILTER)
  .room(SPACE)
  .gain(0.6)
```

### Step 3: Control in Real-Time

Adjust the sliders while patterns play. All cards using those variables update instantly.

### Naming Conventions

Use clear, descriptive names:

| Good | Why |
|------|-----|
| `SLIDER_LPF` | Clear it's a slider, controls low-pass |
| `MASTER_GAIN` | Indicates global volume |
| `REVERB` | Simple and obvious |
| `TEMPO` | Special - controls global speed |

---

## Creating Custom Sliders

### Basic Syntax

```javascript
let NAME = slider(default, min, max);
```

| Part | Description |
|------|-------------|
| `let NAME` | Variable name to use in cards |
| `slider()` | Creates a slider control |
| `default` | Starting value |
| `min` | Minimum value |
| `max` | Maximum value |

### Examples

**Filter Control (Hz):**
```javascript
let FILTER_CUTOFF = slider(800, 100, 8000);
```

**Volume Control (0-1):**
```javascript
let VOLUME = slider(0.7, 0, 1);
```

**Reverb Amount (0-1):**
```javascript
let ROOM_SIZE = slider(0.4, 0, 1);
```

**Speed Modifier:**
```javascript
let SPEED = slider(1, 0.5, 4);
```

### Complete Example

Master Panel:
```javascript
let TEMPO = slider(30, 15, 45);
let LPF = slider(1200, 100, 4000);
let REVERB = slider(0.3, 0, 0.9);
let MASTER = slider(0.8, 0, 1);
```

Card using globals:
```javascript
note("c2 e2 g2 e2")
  .s("sawtooth")
  .lpf(LPF)
  .room(REVERB)
  .gain(MASTER)
```

---

## Stop All

### What It Does

The **Stop All** button immediately stops every playing pattern across all cards.

### When to Use

- **End of performance**: Clean stop
- **Reset**: Start fresh
- **Emergency**: Something sounds wrong

### Behavior

When you click Stop All:

1. All cards stop immediately
2. Cards remain paused (not reset)
3. Code in each card is preserved
4. Click Play on individual cards to restart

---

## Advanced: How Master Panel Works

!!! abstract "For Advanced Users"
    This section explains the technical implementation. You don't need to understand this to use r0astr effectively.

### Parsing Differences

The master panel works differently from cards:

| Feature | Cards | Master Panel |
|---------|-------|--------------|
| Code evaluation | Strudel transpiler | Regex parsing |
| Pattern execution | Yes | No |
| Slider detection | Automatic | Manual parsing |

### Why Regex?

The Strudel transpiler can block when used in the master panel context. To avoid this, r0astr parses master panel code with regex to extract slider definitions.

### TEMPO Special Handling

TEMPO isn't just a variable - it controls the scheduler:

1. Master panel code defines: `let TEMPO = slider(...);`
2. r0astr detects the TEMPO variable
3. Changes are converted to CPS (cycles per second)
4. The scheduler's speed is updated: `scheduler.setCps(value)`

### Slider Detection Pattern

Master panel sliders must follow this exact format:

```javascript
let VARIABLE_NAME = slider(default, min, max);
```

The parser looks for:
- `let` keyword
- Variable name (letters, numbers, underscores)
- `= slider(`
- Three numeric values

For detailed technical information, see the [Architecture documentation](../developers/architecture.md).

---

## Quick Reference

### Master Panel Syntax

```javascript
// Required for tempo control
let TEMPO = slider(30, 15, 45);

// Optional global sliders
let SLIDER_LPF = slider(800, 100, 5000);
let REVERB = slider(0.3, 0, 1);
let GAIN = slider(0.7, 0, 1);
```

### Card Usage

```javascript
// Reference global sliders by name
note("c2").lpf(SLIDER_LPF).room(REVERB).gain(GAIN)
```

---

## Next Steps

<div class="grid cards" markdown>

-   :material-content-copy:{ .lg .middle } **Pattern Library**

    ---

    Ready-to-use patterns that work with global sliders.

    [:octicons-arrow-right-24: Pattern Library](pattern-library.md)

-   :material-cog:{ .lg .middle } **Architecture**

    ---

    Deep technical details for developers.

    [:octicons-arrow-right-24: Architecture](../developers/architecture.md)

</div>
