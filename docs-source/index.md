# r0astr

## Multi-instrument live coding for the web

Create music with code. Control four independent instruments with a synchronized clock. Tweak parameters in real-time with sliders. Perfect for live performances and creative exploration.

<div class="grid cards" markdown>

-   :material-play-circle:{ .lg .middle } **Try It Now**

    ---

    Launch r0astr directly in your browser. No installation required.

    [:octicons-arrow-right-24: Launch App](app/index.html){ .md-button .md-button--primary }

-   :material-download:{ .lg .middle } **Download**

    ---

    Get the desktop app with remote control and offline features.

    [:octicons-arrow-right-24: Download](downloads.md){ .md-button }

</div>

---

## What is r0astr?

r0astr is a **multi-instrument live coding interface** built on [Strudel](https://strudel.cc). Write patterns in code, hear them instantly, and perform live.

<div class="grid cards" markdown>

-   :material-music-note-multiple: **Multiple Instruments**

    ---

    Four independent cards, each running its own pattern. Drums, bass, melody, ambient – layer them all.

-   :material-sync: **Perfect Sync**

    ---

    All instruments share a clock. Start and stop cards freely – they always stay in time.

-   :material-tune-vertical: **Live Sliders**

    ---

    Add `slider()` to any parameter. Tweak filters, tempo, and effects in real-time.

-   :material-code-braces: **Code as Music**

    ---

    Write patterns using Strudel's mini notation. Powerful yet beginner-friendly.

</div>

---

## See It In Action

<!-- Placeholder for demo video/GIF -->
<div style="background: var(--md-code-bg-color); border-radius: 8px; padding: 2rem; text-align: center; margin: 1rem 0;">
    <p style="margin: 0; opacity: 0.7;">Demo video coming soon</p>
    <p style="margin: 0.5rem 0 0 0;"><a href="app/index.html">Try the live app instead →</a></p>
</div>

---

## Features

<div class="grid cards" markdown>

-   :material-view-grid:{ .lg .middle } **Cards Interface**

    ---

    Each card is an independent instrument with its own pattern editor and controls.

    [:octicons-arrow-right-24: Learn about Cards](learn/concepts.md)

-   :material-tune:{ .lg .middle } **Master Panel**

    ---

    Global controls for tempo and effects that apply across all instruments.

    [:octicons-arrow-right-24: Master Panel Guide](learn/master-panel.md)

-   :material-cellphone-link:{ .lg .middle } **Remote Control**

    ---

    Control r0astr from your iPad or phone. Perfect for live performances.

    [:octicons-arrow-right-24: Remote Setup](remote-control.md)

-   :material-music:{ .lg .middle } **Powered by Strudel**

    ---

    Built on the powerful Strudel pattern language, a JavaScript port of TidalCycles.

    [:octicons-arrow-right-24: Strudel Docs](https://strudel.cc){ target="_blank" }

</div>

---

## Quick Example

Paste this into Card 1 and hit Play:

```javascript
s("bd*4, ~ sd ~ sd, hh*8").gain(0.8)
```

Add this to Card 2 for bass:

```javascript
note("c2 ~ c2 e2").s("sawtooth").lpf(400).gain(0.6)
```

Both patterns play in perfect sync. [:octicons-arrow-right-24: More patterns](learn/pattern-library.md)

---

## Get Started

<div class="grid cards" markdown>

-   :material-rocket-launch:{ .lg .middle } **Quick Start**

    ---

    Create your first pattern in 5 minutes.

    [:octicons-arrow-right-24: Getting Started](getting-started.md)

-   :material-book-open-variant:{ .lg .middle } **Learn**

    ---

    Understand concepts, patterns, and features.

    [:octicons-arrow-right-24: Learning Path](learn/index.md)

-   :material-download:{ .lg .middle } **Download**

    ---

    Get the desktop app for macOS, Windows, or Linux.

    [:octicons-arrow-right-24: Downloads](downloads.md)

</div>

---

## Open Source

r0astr is open source under the AGPL-3.0 license.

[:fontawesome-brands-github: View on GitHub](https://github.com/piatra-automation/r0astr){ .md-button }
[:octicons-heart-16: Contribute](developers/contributing.md){ .md-button }
