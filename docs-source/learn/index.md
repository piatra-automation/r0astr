# What does `r0astr` add?

`r0astr` is built on top of [Strudel](https://strudel.cc){ target="_blank" } — the brilliant JavaScript port of Tidal Cycles by Felix Roos. Everything Strudel can do, `r0astr` can do. The question is: what does `r0astr` bring to the table?

---

## Multiple Connected Panels

The core design decision in `r0astr` is breaking the single-editor paradigm into **multiple independent panels**, each representing an instrument or voice.

- **Atomised instruments** — By splitting the workspace into individual panels, each element of the sound becomes configurable and reusable — like a track in a DAW.
- **Separation of concerns** — Each panel is its own context. A bass panel, a drum panel, a melody panel. Clean conceptual boundaries.
- **Cleaner navigation** — Jump between code sections without scrolling through a single monolithic editor. Each panel is focused and self-contained.
- **Audience-friendly** — For people watching a live-coding performance, individual panels make it easy to follow what's happening. They can see which instrument is being edited and how it changes.
- **Syntax highlighting per panel** — Each panel has its own editor with full syntax highlighting.
- **Isolated errors** — An error in one panel doesn't interrupt the rest of the performance. Other panels continue playing. This is critical for live performance continuity.

---

## Snippets

The ability to load snippets into panels shouldn't be underestimated in a live-coding context. Snippets offer a middle position between fully coding from scratch and quickly building out panels with pre-configured instruments.

- Load **complete, configured instruments** from your library into any panel instantly.
- Or load **code scaffolding** — a starting point to complete and customise live.
- Snippets are loaded from file and available in any panel via **hotkey insertion**.
- Organise snippets by **genre or instrument type** for fast retrieval during performance.

It's up to you how much you prepare versus how much you improvise. Snippets give you that choice.

---

## Hotkeys

`r0astr` was built from a coder's perspective. The ability to use hotkeys to perform functions allows for fast navigation, editing, updating, and playing panels without reaching for the mouse.

- Hotkeys cover **all functions available in the API**.
- **Playback controls** — start, stop, and toggle panels by key.
- **Snippet insertion** — load snippets into the active panel with a keystroke.
- Navigate between panels, reorder, show/hide — all from the keyboard.

---

## Built for Live Performance

`r0astr` is designed with the stage in mind.

- **Custom skinning** — Match the presented interface to your own visual style.
- **Projection margins** — Configure margins for easy integration with venue projection systems.
- **Panel layout and behaviour** — Panels can be configured for maximum clarity on stage.
- **Syntax and pattern highlighting** — Visual clarity for both performer and audience.
- **Parse on play** — Immediate error and warning feedback within a panel. Know what's wrong before it reaches the speakers.

---

## Orchestration

Tie panels together into arrangements and control the overall structure of a performance.

- **Arrangements** — Define sequences of panels, referred to by panel name.
- **Drag to reorder** — Rearrange panels quickly on the fly. Hide code that's not relevant to the audience.
- **Global panel** — Define controls, functions, and variables available to every panel.
- **Live tempo controls** — Adjust tempo on the fly from the global control panel.

---

## API and WebSockets

This is the secret sauce.

`r0astr` exposes a full **API and WebSocket interface**, allowing external applications to integrate with it. This opens up a world of possibilities:

- Build **additional tooling** and **third-party plugins** that interact with `r0astr`.
- Control `r0astr` from an **LLM, MCP server**, or any external application.
- Use `r0astr` as your **sound engine** and build your own apps and interfaces on top of it.
- Full API specs available for developers to build tools against.

A powerful extension point for developers who want to go beyond what the UI offers.

---

## Standing on the Shoulders of Giants

For pattern syntax, mini notation, samples, scales, and effects — go straight to the source:

<div class="grid cards" markdown>

-   <span style="font-size:1.5em">꩜</span> **[Strudel](https://strudel.cc){ target="_blank" }** by Felix Roos

    ---

    Tidal Cycles ported to JavaScript — the engine under `r0astr`'s hood.

    [꩜ Strudel Learn](https://strudel.cc/learn/){ .md-button target="_blank" }
    [꩜ Pattern Reference](https://strudel.cc/learn/functions/){ .md-button target="_blank" }

-   ![Tidal Cycles](../assets/images/tidal.png){ style="width:1.5em;vertical-align:middle" } **[Tidal Cycles](https://tidalcycles.org){ target="_blank" }** by Alex McLean

    ---

    The pattern language that started it all.

    [:octicons-arrow-right-24: Tidal Cycles Docs](https://tidalcycles.org/docs/){ .md-button target="_blank" }

</div>

---

## Dive Deeper

<div class="grid cards" markdown>

-   :material-lightbulb:{ .lg .middle } **Concepts**

    ---

    Understand the mental model: panels, patterns, and synchronization.

    [:octicons-arrow-right-24: Read Concepts](concepts.md)

-   :material-view-grid:{ .lg .middle } **Multi-Instrument**

    ---

    Use multiple panels together for layered compositions.

    [:octicons-arrow-right-24: Multi-Instrument Guide](multi-instrument.md)

-   :material-tune:{ .lg .middle } **Master Panel**

    ---

    Control global tempo and effects across all panels.

    [:octicons-arrow-right-24: Master Panel Guide](master-panel.md)

-   :material-remote:{ .lg .middle } **Remote Control**

    ---

    Control `r0astr` from a tablet, phone, or any device on your network.

    [:octicons-arrow-right-24: Remote Control](../remote-control.md)

-   :material-content-copy:{ .lg .middle } **Example Arrangements**

    ---

    Complete multi-panel tracks you can copy and paste.

    [:octicons-arrow-right-24: Example Arrangements](example-arrangements.md)

-   :material-wrench:{ .lg .middle } **Troubleshooting**

    ---

    Common issues and solutions.

    [:octicons-arrow-right-24: Troubleshooting](../guides/troubleshooting.md)

</div>
