# Concepts

!!! note "Coming Soon"
    This page is under development. Check back soon for comprehensive documentation.

## Overview

r0astr is built around a few core concepts that make multi-instrument live coding intuitive.

## Cards

Each **card** is an independent instrument. You can:

- Write different patterns in each card
- Start and stop cards independently
- All cards share the same synchronized clock

## Patterns

Patterns are written using Strudel's **mini notation** - a concise language for describing musical sequences.

```javascript
s("bd sd bd sd")  // A simple drum pattern
```

## Synchronization

All cards share a single audio clock. When you start a new card, it joins in sync with patterns already playing.

## Master Panel

The **master panel** provides global controls:

- **TEMPO** - Controls the speed of all patterns
- **Global effects** - Apply filters and effects to everything

---

*Full documentation coming soon. See [Getting Started](../getting-started.md) to try r0astr now.*
