# Epic 3: Splash/Hero Screen

## Overview

Create a branded splash screen that displays on first page load, showing progress while samples load and providing a polished first impression. The splash enforces a minimum display time to prevent jarring flashes.

## Business Value

- **Branding**: Professional first impression with logo/branding
- **User Feedback**: Progress bar shows system is loading, not frozen
- **UX Polish**: Smooth transition from splash to main interface
- **Load Management**: Masks sample loading latency

## User Stories

### Story 3.1: Splash Modal with Branding

**As a** user,
**I want** to see a branded splash screen when the page loads,
**so that** I know the application is initializing and feel confident in the product

**Acceptance Criteria:**
1. Splash modal appears immediately on page load (before Strudel init)
2. Modal is centered, full-screen overlay with semi-transparent backdrop
3. Displays r0astr branding (logo, title, tagline)
4. Modal is non-dismissible (no close button) until loading completes
5. Clean, professional design consistent with overall UI theme

---

### Story 3.2: Sample Loading Progress Bar

**As a** user,
**I want** to see a progress bar showing sample loading status,
**so that** I understand what the system is doing and how long it will take

**Acceptance Criteria:**
1. Progress bar displays below branding in splash modal
2. Progress updates based on actual sample loading progress (if detectable)
3. If progress not detectable, animated indeterminate progress bar
4. Text label shows status: "Loading samples..." or similar
5. Progress bar visually indicates completion before splash dismisses

---

### Story 3.3: Minimum Splash Display Time

**As a** UX designer,
**I want** the splash to display for at least 1.2 seconds,
**so that** fast-loading scenarios don't cause jarring flashes

**Acceptance Criteria:**
1. Splash remains visible for minimum 1.2 seconds, even if samples load faster
2. If samples take longer than 1.2s, splash remains until loading completes
3. Smooth fade-out transition when dismissing splash (e.g., 300ms fade)
4. Main interface only becomes interactive after splash fully dismissed
5. No race conditions between timer and sample loading completion

---

## Technical Notes

- Current sample loading: `src/main.js:98-113` with 3s delay
- Hook into Strudel sample loading events if available
- Fallback: Use timer-based progress animation
- Splash HTML/CSS: Modal overlay with backdrop-filter or solid background
- Timing: `Promise.all([sampleLoadingPromise, minTimerPromise])` pattern
- Accessibility: Ensure splash doesn't block screen readers indefinitely

## Dependencies

- None (standalone feature)

## Related Epics

- Epic 4: Settings System (could allow splash to be disabled in settings)

## Out of Scope

- Skip splash option for returning users (future enhancement)
- Custom branding configuration (future enhancement)
- Error handling if samples fail to load (separate error handling epic needed)
