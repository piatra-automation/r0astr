# Multi-Instrument Guide

!!! note "Coming Soon"
    This page is under development. Check back soon for comprehensive documentation.

## Using Multiple Cards

r0astr provides multiple cards, each representing an independent instrument. This guide explains how to use them together effectively.

## Starting and Stopping

- Click **Play** on a card to start its pattern
- Click **Pause** to stop just that card
- Other cards continue playing uninterrupted

## Synchronization

All cards share the same clock. When you start a new card, it automatically syncs with patterns already running.

## Complementary Patterns

Design patterns that work together:

### Card 1: Drums
```javascript
s("bd*4, ~ sd ~ sd")
```

### Card 2: Bass
```javascript
note("c2 ~ c2 ~").s("sawtooth").lpf(400)
```

### Card 3: Melody
```javascript
n("0 2 3 5").scale("C4:minor").s("triangle")
```

### Card 4: Ambient
```javascript
n("0 3 7").scale("C3:minor").s("sawtooth").room(0.9).slow(4)
```

## Performance Tips

- Start with drums to establish the groove
- Add bass next to lock in the foundation
- Layer melody and ambient elements
- Use the master panel to control overall dynamics

---

*Full documentation coming soon.*
