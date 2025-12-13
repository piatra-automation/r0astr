# Getting Started

Get up and running with r0astr in under 5 minutes.

## Choose Your Path

=== "Try in Browser (Instant)"

    The fastest way to start. No installation needed.

    1. **Open the app:** [:octicons-arrow-right-24: Launch r0astr](app/index.html){ target="_blank" }
    2. **Click anywhere** on the page to enable audio (browser requirement)
    3. **You're ready!** Continue to [Your First Pattern](#your-first-pattern) below

=== "Run Locally (Development)"

    For development or offline use.

    **Prerequisites:** Node.js 18+ and npm

    ```bash
    # Clone the repository
    git clone https://github.com/piatra-automation/r0astr.git
    cd r0astr

    # Install dependencies
    npm install

    # Start development server
    npm run dev
    ```

    Open [http://localhost:5173](http://localhost:5173) in your browser.

=== "Desktop App"

    For the full experience with remote control.

    [:octicons-arrow-right-24: Download for your platform](downloads.md)

---

## Your First Pattern

Let's make some noise.

### Step 1: Find Card 1

You'll see four cards on screen. Each card is an independent instrument. Find **Card 1** (or **Panel 1**).

### Step 2: Enter a Pattern

Click in the text area and paste this drum pattern:

```javascript
s("bd*4, ~ sd ~ sd, hh*8").gain(0.8)
```

!!! info "What does this mean?"
    - `s("...")` plays **samples** (sounds)
    - `bd*4` = bass drum 4 times
    - `~ sd ~ sd` = snare on beats 2 and 4 (`~` is silence)
    - `hh*8` = hi-hat 8 times
    - `.gain(0.8)` = volume at 80%

### Step 3: Hit Play

Click the **Play** button on Card 1. You should hear a basic drum beat!

!!! success "Congratulations!"
    You just wrote your first live coding pattern.

---

## Add a Second Instrument

Now let's layer in some bass.

### Step 1: Find Card 2

Leave Card 1 playing. Find **Card 2**.

### Step 2: Enter a Bass Pattern

Paste this into Card 2:

```javascript
note("c2 ~ c2 e2").s("sawtooth").lpf(400).gain(0.6)
```

!!! info "What does this mean?"
    - `note("...")` plays **synth notes**
    - `c2`, `e2` = notes (C and E, octave 2)
    - `.s("sawtooth")` = sawtooth wave synth
    - `.lpf(400)` = low-pass filter at 400Hz
    - `.gain(0.6)` = volume at 60%

### Step 3: Hit Play on Card 2

Click Play. The bass joins the drums – perfectly in sync!

---

## Try More Patterns

Add these to Cards 3 and 4:

### Card 3: Melody

```javascript
n("0 2 3 5 3 2").scale("C4:minor").s("triangle").gain(0.5)
```

### Card 4: Ambient Pad

```javascript
n("0 3 7").scale("C3:minor").s("sawtooth").lpf(600).room(0.8).slow(4).gain(0.4)
```

Now you have a full arrangement with drums, bass, melody, and ambient texture!

---

## What You've Learned

- [x] Cards are independent instruments
- [x] `s()` plays samples, `note()` plays synths
- [x] All cards share the same clock (they stay in sync)
- [x] Play/Pause controls each card independently

---

## Next Steps

<div class="grid cards" markdown>

-   :material-music-note:{ .lg .middle } **Pattern Syntax**

    ---

    Learn mini notation and all the pattern functions.

    [:octicons-arrow-right-24: Pattern Guide](learn/patterns.md)

-   :material-view-grid:{ .lg .middle } **Concepts**

    ---

    Understand cards, the master panel, and synchronization.

    [:octicons-arrow-right-24: Concepts](learn/concepts.md)

-   :material-content-copy:{ .lg .middle } **Pattern Library**

    ---

    Ready-to-use patterns you can copy and paste.

    [:octicons-arrow-right-24: Pattern Library](learn/pattern-library.md)

-   :material-download:{ .lg .middle } **Desktop App**

    ---

    Download for offline use and remote control.

    [:octicons-arrow-right-24: Downloads](downloads.md)

</div>
