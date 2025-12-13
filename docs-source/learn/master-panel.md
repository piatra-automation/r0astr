# Master Panel

!!! note "Coming Soon"
    This page is under development. Check back soon for comprehensive documentation.

## Overview

The **master panel** provides global controls that affect all cards simultaneously.

## TEMPO Control

The TEMPO slider controls the speed of all patterns. Internally, this adjusts the **cycles per second (CPS)**.

```javascript
// In the master panel:
let TEMPO = slider(30, 15, 45);  // BPM-like control
```

## Global Effect Sliders

Create sliders in the master panel that can be referenced in any card:

### Master Panel Code
```javascript
let SLIDER_LPF = slider(800, 100, 5000);
let TEMPO = slider(30, 15, 45);
```

### Using in Cards
```javascript
note("c2").lpf(SLIDER_LPF).gain(0.6)
```

## Stop All

The **Stop All** button immediately stops all playing patterns.

## Creating Custom Sliders

Add your own global controls by defining slider variables in the master panel:

```javascript
let REVERB = slider(0.3, 0, 1);
let GAIN = slider(0.7, 0, 1);
```

Then reference them in any card pattern.

---

*Full documentation coming soon. See [Concepts](concepts.md) for an overview of how r0astr works.*
