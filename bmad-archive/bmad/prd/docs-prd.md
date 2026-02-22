# r0astr Documentation PRD

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-13 | 1.0 | Initial PRD created | John (PM Agent) |

---

## Goals

1. **Enable zero-friction onboarding** - New users understand what r0astr is and can create their first pattern within 5 minutes
2. **Provide comprehensive usage guides** - Cover all features from basic patterns to advanced multi-instrument techniques
3. **Reduce support burden** - FAQ and troubleshooting address common issues before users need to ask
4. **Enable community contribution** - Clear guidelines for code, skins, and plugin contributions
5. **Integrate with distribution** - Downloads page serves as primary distribution channel with platform-specific guidance
6. **Support marketing goals** - Landing page and showcase demonstrate value proposition
7. **Document extensibility ecosystem** - Skins system, plugin architecture, and API endpoints for third-party integration
8. **Ensure content quality** - Schema validation for code snippets and configuration files

## Background Context

r0astr is an open-source multi-instrument live coding interface built on Strudel. It provides a card-based UI for controlling independent musical instruments with a synchronized audio clock.

The project has ambitions beyond the core app: a skins system for community-contributed visual themes, and a plugin marketplace (potentially with paid offerings) that integrates with API endpoints. The documentation site at r0astr.org must support this ecosystem - serving musicians trying live coding, developers building extensions, and designers creating skins.

**Current State:**

| Asset | Status |
|-------|--------|
| `mkdocs.yml` | Configured with Material theme, dark/light mode |
| `index.md` | Minimal - links to app and getting started |
| `downloads.md` | Well done - OS detection, platform cards |
| `getting-started.md` | Stub - just npm commands |
| `remote-control.md` | Exists, needs review |
| `README.md` | Good content that could be leveraged |
| Site URL | `https://r0astr.org` |

---

## Requirements

### Functional Requirements

| ID | Requirement |
|----|-------------|
| **FR1** | Landing page explains r0astr value proposition in under 30 seconds of reading |
| **FR2** | Quick start guide enables first working pattern within 5 minutes |
| **FR3** | Downloads page provides OS-detected recommendations with all platform options |
| **FR4** | Pattern syntax guide covers mini notation, functions, and sliders with working examples |
| **FR5** | Multi-instrument guide explains cards, master panel, and synchronization |
| **FR6** | Remote control documentation covers setup, protocol, and troubleshooting |
| **FR7** | API reference documents WebSocket endpoints for plugin developers |
| **FR8** | Skins documentation explains theming system, contribution process, and gallery |
| **FR9** | Plugin development guide covers architecture, API integration, and marketplace submission |
| **FR10** | Contributing guide covers code standards, PR process, and community guidelines |
| **FR11** | Pattern library provides copy-paste examples organized by category |
| **FR12** | Showcase/gallery displays community creations and performances |
| **FR13** | FAQ addresses common questions and issues |
| **FR14** | Changelog tracks releases with user-facing summaries |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| **NFR1** | All code examples must be validated via CI (schema/syntax check) |
| **NFR2** | Documentation must support dark/light mode (already configured) |
| **NFR3** | Site must be mobile-responsive for remote control users |
| **NFR4** | Search must return relevant results within top 3 hits |
| **NFR5** | Pages must load within 2 seconds on average connection |
| **NFR6** | Documentation versioning via mike for major releases |
| **NFR7** | External links must be validated in CI |

---

## User Interface Design Goals

### Overall UX Vision

Clean, dark-mode-first documentation that feels native to the live coding aesthetic. Prioritize scannability and copy-paste workflows. Musicians work at night - respect that.

### Key Interaction Paradigms

- **Copy-paste code blocks** - One-click copy on all examples
- **Progressive disclosure** - Beginners see basics first, advanced content expandable
- **Platform tabs** - OS-specific instructions in tabbed containers
- **Search-first navigation** - Many users search rather than browse

### Core Screens/Views

| View | Purpose |
|------|---------|
| Landing | Hook + CTA (Try It / Download) |
| Quick Start | 5-min first success |
| Downloads | Platform-specific binaries |
| Learn section | Concepts → Patterns → Multi-instrument → Master Panel |
| Guides section | Samples, Soundfonts, Performance, Troubleshooting |
| Developers section | API, Plugins, Skins, Contributing |
| Community section | Showcase, Changelog, FAQ |

### Accessibility

**WCAG AA** - Sufficient contrast, keyboard navigation, alt text for images/diagrams

### Branding

- Dark theme as default (slate palette already configured)
- Indigo accent (already configured)
- Monospace fonts for code
- Minimal imagery - let code speak

### Target Platforms

**Web Responsive** - Desktop primary, mobile for reference during performances

---

## Technical Assumptions

### Repository Structure

**Monorepo** - Documentation lives in `docs-source/` within main r0astr repo

### Service Architecture

**Static Site** - MkDocs generates static HTML, deployed to GitHub Pages at r0astr.org

### Testing Requirements

| Type | Scope |
|------|-------|
| **Snippet validation** | CI validates JavaScript/Strudel syntax in code blocks |
| **Config validation** | JSON/YAML config examples validated against schemas |
| **Link checking** | CI validates internal and external links |
| **Build verification** | MkDocs build must succeed on PR |

### Additional Technical Assumptions

- MkDocs Material theme (already configured)
- GitHub Actions for CI/CD
- mike for documentation versioning (future)
- Custom JavaScript for OS detection on downloads page (already implemented)
- Potential future: embedded Strudel REPL for interactive examples

---

## Epic List

| # | Epic | Goal |
|---|------|------|
| **E1** | Foundation & Landing | Establish complete landing page, quick start, and fix getting-started stub |
| **E2** | Core Learning Path | Create concepts, pattern syntax, multi-instrument, and master panel guides |
| **E3** | Developer Documentation | Document API endpoints, plugin architecture, and contribution guidelines |
| **E4** | Skins & Extensibility | Document theming system, skin creation, and gallery stub |
| **E5** | Community & Polish | Showcase, FAQ, pattern library, and CI validation setup |

---

## Epic 1: Foundation & Landing

**Goal:** Establish a compelling landing page that communicates r0astr's value proposition and enables users to get started immediately. Fix the sparse getting-started page to deliver a complete 5-minute onboarding experience.

### Story 1.1: Revamp Landing Page

**As a** first-time visitor,
**I want** to immediately understand what r0astr is and how to try it,
**so that** I can decide if it's worth my time within 30 seconds.

**Acceptance Criteria:**

1. Hero section with tagline, animated GIF/screenshot, and two CTAs: "Try It Now" and "Download"
2. "What is r0astr?" section with 3-4 bullet value props (multi-instrument, live coding, synchronized, sliders)
3. Quick feature cards highlighting: Cards UI, Master Panel, Remote Control, Strudel-powered
4. Embedded video or GIF showing the app in action (placeholder acceptable for MVP)
5. Links to Getting Started, Downloads, and GitHub
6. Page renders correctly in both dark and light modes

### Story 1.2: Complete Getting Started Guide

**As a** new user,
**I want** step-by-step instructions to create my first pattern,
**so that** I can experience success within 5 minutes.

**Acceptance Criteria:**

1. Two paths documented: "Try in Browser" (instant) and "Run Locally" (npm)
2. "Your First Pattern" section with copy-paste drum pattern example
3. Explanation of Play/Pause button behavior
4. "Add a Second Instrument" section showing multi-card usage
5. "Next Steps" links to full pattern guide and downloads
6. All code examples have copy buttons and are syntax-highlighted
7. Tested on fresh browser to confirm 5-minute completion is realistic

### Story 1.3: Enhance Downloads Page

**As a** user ready to install,
**I want** clear platform-specific instructions and troubleshooting,
**so that** I can install without confusion.

**Acceptance Criteria:**

1. Existing OS detection and platform cards preserved
2. Add "Installation Instructions" section with platform-specific tabs (macOS, Windows, Linux)
3. macOS: Note about Gatekeeper/unsigned app if applicable
4. Windows: Note about SmartScreen if applicable
5. Linux: AppImage permissions instructions
6. "Verifying Installation" section with expected first-launch behavior
7. Link to troubleshooting section for common install issues

### Story 1.4: Update Navigation Structure

**As a** documentation user,
**I want** logical navigation that matches the content structure,
**so that** I can find what I need quickly.

**Acceptance Criteria:**

1. mkdocs.yml nav updated to reflect new structure
2. Stub pages created for future sections with "Coming Soon" content
3. Navigation renders correctly on mobile
4. All internal links validated

---

## Epic 2: Core Learning Path

**Goal:** Create comprehensive guides that take users from understanding basic concepts through mastering multi-instrument live coding with the master panel.

### Story 2.1: Concepts Overview

**As a** new user,
**I want** to understand r0astr's mental model,
**so that** the interface makes sense before I start coding.

**Acceptance Criteria:**

1. Explains the "card" concept - independent instruments
2. Explains shared audio clock / synchronization
3. Explains master panel purpose (global controls, tempo)
4. Explains pattern lifecycle (edit → play → live update)
5. Diagram or visual showing cards + master panel relationship
6. Links to detailed guides for each concept

### Story 2.2: Pattern Syntax Basics

**As a** user learning patterns,
**I want** a reference for mini notation and common functions,
**so that** I can write my own patterns.

**Acceptance Criteria:**

1. Mini notation basics: sequences, rests, multiplication, subdivision
2. Common sound sources: `s()` for samples, `note()` for synths
3. Common modifiers: `gain()`, `lpf()`, `fast()`, `slow()`
4. Slider usage: `slider(default, min, max)` syntax and behavior
5. At least 10 copy-paste examples organized by category (drums, bass, melody, ambient)
6. Link to full Strudel documentation for advanced usage

### Story 2.3: Multi-Instrument Guide

**As a** user with multiple cards,
**I want** to understand how to use cards together effectively,
**so that** I can create layered compositions.

**Acceptance Criteria:**

1. Starting and stopping individual cards
2. How synchronization works (shared clock)
3. Complementary pattern design (drums + bass + melody)
4. Using different instruments per card
5. Performance tips: which cards to start/stop when
6. Example "full arrangement" with patterns for all 4 cards

### Story 2.4: Master Panel Guide

**As a** user controlling global parameters,
**I want** to understand the master panel,
**so that** I can control tempo and global effects.

**Acceptance Criteria:**

1. TEMPO slider behavior (CPS conversion explained simply)
2. Global effect sliders (LPF, etc.)
3. How master panel variables are referenced in card patterns
4. Creating custom master panel sliders
5. Stop All functionality
6. Note about master panel code parsing (for advanced users)

### Story 2.5: Pattern Library Page

**As a** user seeking inspiration,
**I want** a collection of ready-to-use patterns,
**so that** I can copy-paste and learn by example.

**Acceptance Criteria:**

1. Organized by category: Drums, Bass, Melody, Ambient, FX
2. Each pattern has: name, description, copy-paste code, audio preview (optional/future)
3. Minimum 20 patterns total across categories
4. Difficulty indicators (beginner/intermediate/advanced)
5. "Contribute a pattern" link to contributing guide

---

## Epic 3: Developer Documentation

**Goal:** Enable developers to build plugins, contribute code, and integrate with r0astr's API.

### Story 3.1: API Reference

**As a** plugin developer,
**I want** documentation of WebSocket/HTTP endpoints,
**so that** I can build integrations.

**Acceptance Criteria:**

1. Overview of API architecture (WebSocket for real-time, HTTP for state)
2. Panel control endpoints: start, stop, update pattern
3. Playback control: stop all, tempo
4. State query endpoints: current patterns, playing status
5. Message format specifications with examples
6. Authentication/security notes if applicable
7. Rate limiting or connection limits documented

### Story 3.2: Plugin Development Guide

**As a** developer building a plugin,
**I want** a guide to the plugin architecture,
**so that** I can create and distribute plugins.

**Acceptance Criteria:**

1. Plugin concept and use cases explained
2. Plugin structure/boilerplate
3. Hooking into r0astr lifecycle events
4. Using the API from a plugin
5. Testing plugins locally
6. Packaging and distribution (future marketplace notes)
7. Example "hello world" plugin

### Story 3.3: Contributing Guide

**As a** potential contributor,
**I want** clear contribution guidelines,
**so that** I can submit quality PRs.

**Acceptance Criteria:**

1. Development environment setup
2. Code style and linting requirements
3. PR process and review expectations
4. Issue reporting guidelines
5. Code of conduct reference
6. Testing requirements before PR
7. Commit message conventions

### Story 3.4: Architecture Overview

**As a** developer exploring the codebase,
**I want** a high-level architecture guide,
**so that** I can understand how components fit together.

**Acceptance Criteria:**

1. System diagram: frontend, audio engine, WebSocket server
2. Key files and their responsibilities
3. Strudel integration points
4. State management approach
5. Build and deployment pipeline
6. Links to relevant source files

---

## Epic 4: Skins & Extensibility

**Goal:** Document the theming system for community skin contributions.

**Note:** Skins system is partially implemented. Documentation will note "coming in v1.0" where features are incomplete.

### Story 4.1: Skins System Overview

**As a** designer interested in themes,
**I want** to understand the skins system,
**so that** I can create custom themes.

**Acceptance Criteria:**

1. What skins can customize (colors, fonts, layout elements)
2. Current implementation status noted (partial, full in v1.0)
3. CSS variable system documentation
4. Preview/testing a skin locally
5. "Coming soon" notes for incomplete features

### Story 4.2: Creating a Skin Guide

**As a** skin creator,
**I want** step-by-step skin creation instructions,
**so that** I can build and share skins.

**Acceptance Criteria:**

1. Skin file structure
2. Required vs optional customizations
3. CSS variables reference table
4. Creating a skin from template
5. Testing across dark/light base modes
6. Submitting to community gallery

### Story 4.3: Skins Gallery Stub

**As a** user browsing themes,
**I want** a gallery of community skins,
**so that** I can find and apply themes I like.

**Acceptance Criteria:**

1. Gallery page structure established
2. 1-2 example/default skins documented as templates
3. "Submit your skin" call to action
4. Placeholder for future skins
5. Preview screenshot requirements noted

---

## Epic 5: Community & Polish

**Goal:** Add community features, validation infrastructure, and polish the documentation.

### Story 5.1: Showcase Page

**As a** visitor exploring r0astr,
**I want** to see what others have created,
**so that** I'm inspired to try it.

**Acceptance Criteria:**

1. Static markdown page with community creations
2. Format: embedded videos, SoundCloud links, or screenshots with descriptions
3. 3-5 initial showcases (can be creator's own work)
4. "Submit your creation" instructions
5. Categories or tags if content warrants

### Story 5.2: FAQ Page

**As a** user with questions,
**I want** answers to common questions,
**so that** I can self-serve before asking for help.

**Acceptance Criteria:**

1. Minimum 10 FAQ entries covering:
   - Installation issues
   - Audio not working
   - Patterns not updating
   - Remote control setup
   - Browser compatibility
   - Sample loading
2. Organized by category
3. Links to detailed docs where applicable

### Story 5.3: Changelog Page

**As a** user tracking updates,
**I want** a changelog with release notes,
**so that** I know what's new in each version.

**Acceptance Criteria:**

1. Changelog page with semantic versioning
2. Current version (v0.8.0) documented
3. Format: version, date, summary, detailed changes
4. Links to GitHub releases for full details
5. "Unreleased" section for upcoming changes

### Story 5.4: CI Validation Setup

**As a** documentation maintainer,
**I want** automated validation of code examples,
**so that** examples don't break silently.

**Acceptance Criteria:**

1. GitHub Action that runs on PR and push to main
2. MkDocs build validation (site must build)
3. Internal link checking
4. JavaScript syntax validation for code blocks (basic)
5. External link checking (can be periodic, not blocking)
6. Clear error messages on failure

### Story 5.5: Remote Control Documentation

**As a** user setting up remote control,
**I want** complete setup and troubleshooting docs,
**so that** I can use my iPad as a control surface.

**Acceptance Criteria:**

1. Network setup requirements (same WiFi)
2. Finding the correct URL
3. Remote interface features walkthrough
4. Troubleshooting connection issues
5. WebSocket protocol overview for advanced users
6. Security considerations

---

## Summary

| Epic | Stories | Priority |
|------|---------|----------|
| E1: Foundation & Landing | 4 stories | Highest |
| E2: Core Learning Path | 5 stories | High |
| E3: Developer Documentation | 4 stories | Medium |
| E4: Skins & Extensibility | 3 stories | Medium |
| E5: Community & Polish | 5 stories | Lower |

**Total: 21 stories**

---

## Next Steps

### UX Expert Prompt

Review this PRD and create front-end specifications for the documentation site, focusing on the landing page hero design, navigation patterns, and code example presentation. Reference the existing MkDocs Material configuration.

### Architect Prompt

Review this PRD and design the technical implementation for CI validation of code snippets, documentation versioning with mike, and the directory structure for the expanded documentation. Consider integration with existing GitHub Actions workflows.
