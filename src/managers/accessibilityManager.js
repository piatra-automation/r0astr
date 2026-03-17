/**
 * Accessibility Manager
 * Handles accessibility features including:
 * - High contrast mode
 * - Reduced motion preferences
 * - Screen reader announcements
 * - Focus management
 * - Keyboard navigation enhancements
 */

import { getSettings, saveSettings, updateSetting } from './settingsManager.js';

/**
 * Announce a message to screen readers
 * @param {string} message - The message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announce(message, priority = 'polite') {
  const settings = getSettings();

  // Check if screen reader announcements are enabled
  if (settings.accessibility?.screenReaderAnnouncements === false) {
    return;
  }

  const container = priority === 'assertive'
    ? document.getElementById('sr-status')
    : document.getElementById('sr-announcements');

  if (container) {
    // Clear and set the message
    container.textContent = '';
    // Use setTimeout to ensure the change is detected by screen readers
    setTimeout(() => {
      container.textContent = message;
    }, 100);
  }
}

/**
 * Announce panel state changes
 * @param {string} panelId - The panel ID
 * @param {string} state - The new state ('playing', 'stopped', 'error', 'stale')
 * @param {string} panelName - Optional panel name
 */
export function announcePanelState(panelId, state, panelName = '') {
  const name = panelName || panelId.replace('panel-', 'Panel ');

  const messages = {
    playing: `${name} is now playing`,
    stopped: `${name} stopped`,
    error: `${name} has an error`,
    stale: `${name} has pending changes`,
    updated: `${name} updated successfully`,
    created: `New panel created: ${name}`,
    deleted: `${name} deleted`
  };

  const message = messages[state];
  if (message) {
    announce(message, state === 'error' ? 'assertive' : 'polite');
  }
}

/**
 * Apply high contrast mode
 * @param {boolean} enabled - Whether to enable high contrast mode
 */
export function applyHighContrast(enabled) {
  if (enabled) {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }
  console.log(`High contrast mode ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Apply reduced motion preference
 * @param {boolean} enabled - Whether to enable reduced motion
 */
export function applyReducedMotion(enabled) {
  if (enabled) {
    document.body.classList.add('reduced-motion');
  } else {
    document.body.classList.remove('reduced-motion');
  }
  console.log(`Reduced motion ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Apply focus indicator style
 * @param {string} style - 'default', 'enhanced', or 'outline-only'
 */
export function applyFocusStyle(style) {
  document.body.classList.remove('focus-enhanced', 'focus-outline-only');

  if (style === 'enhanced') {
    document.body.classList.add('focus-enhanced');
  } else if (style === 'outline-only') {
    document.body.classList.add('focus-outline-only');
  }
  console.log(`Focus indicator style set to: ${style}`);
}

/**
 * Create a focus trap within a container
 * @param {HTMLElement} container - The container to trap focus within
 * @returns {Function} Cleanup function to remove the trap
 */
export function createFocusTrap(container) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  // Handle Escape key to close modal
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      const event = new CustomEvent('focustrap:escape', { bubbles: true });
      container.dispatchEvent(event);
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  container.addEventListener('keydown', handleEscape);

  // Focus the first element
  if (firstElement) {
    firstElement.focus();
  }

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    container.removeEventListener('keydown', handleEscape);
  };
}

/**
 * Check system preferences for accessibility settings
 * @returns {Object} System preferences
 */
export function getSystemPreferences() {
  return {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersHighContrast: window.matchMedia('(prefers-contrast: more)').matches,
    prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
  };
}

/**
 * Apply all accessibility settings
 * @param {Object} settings - Settings object
 */
export function applyAllAccessibilitySettings(settings) {
  const systemPrefs = getSystemPreferences();
  const accessibility = settings.accessibility || {};

  // High contrast - use setting if explicitly set, otherwise use system preference
  const highContrast = accessibility.highContrast !== undefined
    ? accessibility.highContrast
    : systemPrefs.prefersHighContrast;
  applyHighContrast(highContrast);

  // Reduced motion - use setting if explicitly set, otherwise use system preference
  const reducedMotion = accessibility.reducedMotion !== undefined
    ? accessibility.reducedMotion
    : systemPrefs.prefersReducedMotion;
  applyReducedMotion(reducedMotion);

  // Focus style
  const focusStyle = accessibility.focusStyle || 'default';
  applyFocusStyle(focusStyle);

  console.log('Accessibility settings applied');
}

/**
 * Initialize accessibility manager
 * Sets up event listeners and applies initial settings
 */
export function initializeAccessibility() {
  const settings = getSettings();

  // Apply initial settings
  applyAllAccessibilitySettings(settings);

  // Listen for system preference changes
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotionQuery.addEventListener('change', (e) => {
    const settings = getSettings();
    // Only apply if user hasn't explicitly set a preference
    if (settings.accessibility?.reducedMotion === undefined) {
      applyReducedMotion(e.matches);
    }
  });

  const contrastQuery = window.matchMedia('(prefers-contrast: more)');
  contrastQuery.addEventListener('change', (e) => {
    const settings = getSettings();
    // Only apply if user hasn't explicitly set a preference
    if (settings.accessibility?.highContrast === undefined) {
      applyHighContrast(e.matches);
    }
  });

  // Listen for settings changes
  window.addEventListener('settings-changed', (e) => {
    if (e.detail?.accessibility) {
      applyAllAccessibilitySettings(e.detail);
    }
  });

  // Setup skip links
  setupSkipLinks();

  // Setup keyboard navigation enhancements
  setupKeyboardNavigation();

  console.log('Accessibility manager initialized');
}

/**
 * Setup skip link functionality
 */
function setupSkipLinks() {
  const skipLinks = document.querySelectorAll('.skip-link');

  skipLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const target = document.getElementById(targetId);

      if (target) {
        // Make target focusable if it isn't already
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus();

        // Announce the navigation
        announce(`Skipped to ${target.getAttribute('aria-label') || targetId}`);
      }
    });
  });
}

/**
 * Setup enhanced keyboard navigation
 */
function setupKeyboardNavigation() {
  // Arrow key navigation for panel list
  const panelTree = document.getElementById('panel-tree');

  if (panelTree) {
    panelTree.addEventListener('keydown', (e) => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;

      // Don't intercept arrow keys when a CodeMirror editor has focus —
      // they're needed for cursor movement while coding
      if (document.activeElement.closest('.cm-editor')) return;

      const panels = Array.from(panelTree.querySelectorAll('.level-panel'));
      const currentPanel = document.activeElement.closest('.level-panel');
      const currentIndex = panels.indexOf(currentPanel);

      if (currentIndex === -1) return;

      e.preventDefault();
      let newIndex;

      switch (e.key) {
        case 'ArrowUp':
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case 'ArrowDown':
          newIndex = Math.min(panels.length - 1, currentIndex + 1);
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = panels.length - 1;
          break;
      }

      const targetPanel = panels[newIndex];
      if (targetPanel) {
        const summary = targetPanel.querySelector('summary');
        if (summary) {
          summary.focus();
        }
      }
    });
  }

  // Escape key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const settingsModal = document.getElementById('settings-modal');
      if (settingsModal && settingsModal.style.display !== 'none') {
        const cancelBtn = document.getElementById('settings-cancel-btn');
        if (cancelBtn) {
          cancelBtn.click();
        }
      }
    }
  });
}

/**
 * Update aria-expanded state for collapsible sections
 * @param {HTMLElement} header - The section header element
 * @param {boolean} expanded - Whether the section is expanded
 */
export function updateAriaExpanded(header, expanded) {
  header.setAttribute('aria-expanded', expanded.toString());
}

/**
 * Get accessible name for a panel
 * @param {HTMLElement} panel - The panel element
 * @returns {string} The accessible name
 */
export function getPanelAccessibleName(panel) {
  const title = panel.querySelector('.panel-title');
  const number = panel.dataset.panelNumber;
  const titleText = title?.textContent?.trim() || `Panel ${number}`;

  const isPlaying = panel.classList.contains('playing');
  const isStale = panel.classList.contains('stale');
  const hasError = panel.classList.contains('error');

  let status = '';
  if (isPlaying) status = ' (playing)';
  else if (isStale) status = ' (has changes)';
  else if (hasError) status = ' (error)';

  return `${titleText}${status}`;
}
