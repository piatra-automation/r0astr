# Epic 2: Forest Green Glassmorphism Default Skin

## Status
Approved

## Epic Goal
Redesign the default skin to a dark-mode-only, forest-green glassmorphism aesthetic using oklch color space exclusively. Dense, translucent, and achromatic except for a single green brand hue (oklch hue 150). The result should feel like a professional developer tool -- optimized for information density, not whitespace.

## Design Principles
1. **oklch color space, always** -- no hex, no hsl
2. **One brand color: forest green (hue 150)** -- everything structural is green or achromatic
3. **White-at-low-opacity borders** -- never solid white, never gray
4. **Surfaces are opacity layers** -- background gradient bleeds through
5. **Glass blur only on floating elements** -- earned by modals and sticky headers
6. **Near-zero elevation** -- green glow on hover, not drop shadows
7. **Information density over whitespace** -- 10-14px text, tight padding
8. **Transitions on color/opacity only** -- never layout (one modal scale exception)
9. **Narrow semantic accents** -- green/amber/red/blue/purple for status only
10. **Consistent icon sizing** -- 12/14-16/18-20px by context

## Stories

| # | Title | Dependencies | Complexity |
|---|-------|-------------|------------|
| [2.1](./2.1.design-token-overhaul.md) | Design Token Overhaul -- oklch Color System | None | Medium |
| [2.2](./2.2.default-skin-theme-rewrite.md) | Default Skin Theme Rewrite | 2.1 | High |
| [2.3](./2.3.panel-and-component-refresh.md) | Panel Template and Component Refresh | 2.1, 2.2 | High |
| [2.4](./2.4.settings-modal-and-secondary-ui.md) | Settings Modal and Secondary UI | 2.1, 2.2 | Medium |
| [2.5](./2.5.remote-control-and-responsive-polish.md) | Remote Control and Responsive Polish | 2.1, 2.2, 2.3 | Medium |

## Dependency Graph
```
2.1 (tokens) --> 2.2 (theme) --> 2.3 (components) --> 2.5 (remote/responsive)
                            |
                            +--> 2.4 (settings/secondary)
```

Story 2.1 (tokens) must land first -- everything else consumes those variables. Story 2.2 (theme) establishes the visual foundation. Stories 2.3 and 2.4 can be developed in parallel after 2.2. Story 2.5 is the final polish pass.

## Definition of Done
- Default skin renders the forest-green glassmorphism aesthetic consistently across all UI elements
- Zero hex or hsl color values in variables.css, theme.css, components.css, panels.css, base.css, or remote.css
- Glass skin still loads and functions (may look different but must not break)
- `prefers-reduced-motion` and `prefers-contrast` media queries respected
- Remote control view matches the new design language
- All existing JavaScript functionality preserved (no functional regressions)

## What NOT to Do
- Don't use solid background colors -- always use opacity
- Don't add box shadows for depth -- use border opacity and background transparency
- Don't animate dimensions or position -- only color and opacity
- Don't introduce new hue families -- stay achromatic + green with narrow semantic exceptions
- Don't use large text or generous whitespace -- this is a dense tool UI
