# Showcase

See what people are creating with r0astr.

!!! info "Submit Your Work"
    Created something with r0astr? [Add it to the showcase](#submit-your-work)!

---

## Featured Creations

### Ambient Textures Session

*By the r0astr team*

A demonstration of layered ambient patterns using all four cards. This session shows how to build atmospheric soundscapes by combining slow pads, filtered noise, sparse melodies, and deep bass.

**Patterns used:**

=== "Card 1: Slow Pad"

    ```javascript
    n("0 3 7")
      .scale("C3:minor")
      .s("sawtooth")
      .lpf(slider(600, 200, 2000))
      .room(0.9)
      .slow(4)
      .gain(0.4)
    ```

=== "Card 2: Texture"

    ```javascript
    s("noise")
      .lpf(slider(400, 100, 3000))
      .hpf(200)
      .room(0.7)
      .gain(0.15)
    ```

=== "Card 3: Melody"

    ```javascript
    n("0 ~ 4 ~, ~ 7 ~ 3")
      .scale("C4:minor")
      .s("triangle")
      .room(0.6)
      .slow(2)
      .gain(0.35)
    ```

=== "Card 4: Sub Bass"

    ```javascript
    note("c2 ~ ~ e2")
      .s("sine")
      .lpf(200)
      .slow(2)
      .gain(0.5)
    ```

**Technique:** Start with just Card 1, then slowly layer in the other elements. Use the master panel filter to create sweeps across the entire mix.

---

### Minimal Techno Jam

*By the r0astr team*

Driving minimal techno demonstrating the master panel for live filter sweeps. Shows how to create tension and release using synchronized patterns.

**Patterns used:**

=== "Card 1: Kick + Clap"

    ```javascript
    s("bd*4, ~ cp ~ ~")
      .gain(0.85)
    ```

=== "Card 2: Bass"

    ```javascript
    note("c1 ~ c1 c1")
      .s("sawtooth")
      .lpf(slider(250, 100, 800))
      .gain(0.7)
    ```

=== "Card 3: Hi-Hats"

    ```javascript
    s("~ hh*16")
      .gain(slider(0.3, 0, 0.6))
    ```

=== "Card 4: Stab"

    ```javascript
    n("[0,3,7] ~ ~ ~")
      .scale("C3:minor")
      .s("sawtooth")
      .lpf(1500)
      .room(0.3)
      .gain(0.4)
    ```

**Technique:** Drop the bass (Card 2) for breakdowns. Bring in the stab (Card 4) for tension. Use the hi-hat volume slider for dynamic changes.

---

### Breakbeat Session

*By the r0astr team*

A faster-paced demonstration showing syncopated rhythms and how multiple cards can create complex textures through simple patterns.

**Patterns used:**

=== "Card 1: Breakbeat"

    ```javascript
    s("bd sd:1 [~ bd] sd:2, hh*8")
      .fast(1.5)
      .gain(0.8)
    ```

=== "Card 2: Sub"

    ```javascript
    note("c2 ~ [c2 c2] ~")
      .s("square")
      .lpf(300)
      .gain(0.6)
    ```

=== "Card 3: Stabs"

    ```javascript
    n("[0,4,7] ~ [0,4,7] ~")
      .scale("C4:minor")
      .s("sawtooth")
      .lpf(slider(1000, 400, 3000))
      .gain(0.4)
    ```

=== "Card 4: FX"

    ```javascript
    s("glitch:0 ~ glitch:2 ~")
      .fast(2)
      .room(0.5)
      .gain(slider(0.3, 0, 0.5))
    ```

---

## Community Submissions

*Your creations could be featured here!*

---

## Genre Ideas

Looking for inspiration? Here are some directions to explore:

### Lo-Fi Hip Hop

- Slow tempo (around 70-85 BPM equivalent)
- Dusty drum samples
- Simple chord progressions
- Room reverb for warmth

### House

- Four-on-the-floor kick
- Offbeat hi-hats
- Chord stabs
- Filtered bass lines

### Drone/Experimental

- Very slow patterns (`.slow(8)` or more)
- Layered sine waves
- Long reverb tails
- Minimal percussion

### Drum & Bass

- Fast patterns (`.fast(2)` or more)
- Syncopated breaks
- Rolling bass
- Sharp hi-hats

---

## Submit Your Work

Share your r0astr creations with the community!

### What to Include

| Required | Optional |
|----------|----------|
| Title | Video/audio link |
| Your name/handle | Screenshot |
| Description | Patterns used |
| How you used r0astr | Tips/techniques |

### How to Submit

**Option 1: GitHub Pull Request**

1. Fork the [r0astr repository](https://github.com/piatra-automation/r0astr)
2. Add your entry to `docs-source/community/showcase.md`
3. Include any media files in `docs-source/assets/`
4. Open a PR with title `[Showcase] Your Creation Title`

**Option 2: GitHub Issue**

1. Open a [new issue](https://github.com/piatra-automation/r0astr/issues/new)
2. Use title: `[Showcase] Your Creation Title`
3. Include:
   - Description of your creation
   - Link to video/audio (YouTube, SoundCloud, etc.)
   - Patterns if you want to share them
   - Any tips or techniques

### Guidelines

- **Be original** - Your own work only
- **Be respectful** - Family-friendly content
- **Credit samples** - Note any copyrighted material used
- **Share knowledge** - Tips and patterns help others learn

---

## Embed Formats

For maintainers adding submissions:

### YouTube

```html
<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
```

### SoundCloud

```html
<iframe width="100%" height="166" src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/USER/TRACK" frameborder="0"></iframe>
```

---

*We can't wait to hear what you create!*
