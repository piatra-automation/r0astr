/**
 * Theme Manager
 * Handles application appearance settings and theme switching
 * Story 4.5: Appearance Settings Controls
 */

/**
 * Apply color scheme by setting body class
 * @param {string} scheme - 'dark' or 'light'
 */
export function applyColorScheme(scheme) {
  // Remove existing theme classes
  document.body.classList.remove('theme-dark', 'theme-light');

  // Apply new theme class (dark theme uses default CSS variables, so no class needed)
  if (scheme !== 'dark') {
    document.body.classList.add(`theme-${scheme}`);
  }

  console.log('Color scheme applied:', scheme);
}

/**
 * Apply code editor font size
 * @param {number} size - Font size in pixels (10-24)
 */
export function applyFontSize(size) {
  document.documentElement.style.setProperty('--code-font-size', `${size}px`);
  console.log('Font size applied:', size + 'px');
}

/**
 * Apply active (focused) panel background opacity
 * @param {number} opacity - Opacity percentage (50-100)
 */
export function applyActivePanelOpacity(opacity) {
  // Convert percentage to decimal (95 → 0.95)
  const opacityValue = opacity / 100;
  document.documentElement.style.setProperty('--active-panel-opacity', opacityValue);

  // Update all currently active panels
  updatePanelOpacities();

  console.log('Active panel opacity applied:', opacity + '%');
}

/**
 * Apply background (unfocused) panel cumulative opacity
 * Affects entire panel including text, borders, everything
 * @param {number} opacity - Opacity percentage (20-100)
 */
export function applyBackgroundPanelOpacity(opacity) {
  // Convert percentage to decimal (60 → 0.6)
  const opacityValue = opacity / 100;
  document.documentElement.style.setProperty('--background-panel-opacity', opacityValue);

  // Update all currently background panels
  updatePanelOpacities();

  console.log('Background panel opacity applied:', opacity + '%');
}

/**
 * Update opacity for all panels based on focus state
 * Called when opacity settings change or focus changes
 * EXPORTED for use in main.js panel focus handlers
 */
export function updatePanelOpacities() {
  const activePanelOpacity = getComputedStyle(document.documentElement)
    .getPropertyValue('--active-panel-opacity').trim() || '0.95';
  const backgroundPanelOpacity = getComputedStyle(document.documentElement)
    .getPropertyValue('--background-panel-opacity').trim() || '0.6';

  // Get collapse setting synchronously (settings already loaded at this point)
  const collapseOnBlur = document.body.dataset.collapseOnBlur === 'true';

  //   console.log('[Opacity DEBUG] CSS vars:', {
  //   active: activePanelOpacity,
  //     background: backgroundPanelOpacity,
  //       collapseOnBlur
  // });

  // Tree layout: use native <details> for expand/collapse (CSS handles animation)
  const panels = document.querySelectorAll('.level-panel');

  panels.forEach(panel => {
    const isFocused = panel.classList.contains('focused') || panel.classList.contains('active');
    const targetOpacity = isFocused ? activePanelOpacity : backgroundPanelOpacity;
    panel.style.opacity = targetOpacity;

    // Collapse/expand via details element (tree layout only)
    if (collapseOnBlur) {
      const details = panel.querySelector('details');
      if (details) {
        // Collapse unfocused panels, expand focused ones
        details.open = isFocused;
      }
    }
  });

  // Master panel - ALWAYS use active opacity
  const masterPanel = document.getElementById('panel-0');
  if (masterPanel) {
    masterPanel.style.opacity = activePanelOpacity;
  }
}

/**
 * DEPRECATED: Use applyActivePanelOpacity instead
 * @param {number} opacity - Opacity percentage (50-100)
 */
export function applyPanelOpacity(opacity) {
  applyActivePanelOpacity(opacity);
}

/**
 * Apply line wrapping setting to all textareas
 * Story 7.1: Line Wrapping Settings
 * @param {boolean} wrap - true = wrap lines (pre-wrap), false = horizontal scroll (pre)
 */
export function applyLineWrapping(wrap) {
  const whiteSpace = wrap ? 'pre-wrap' : 'pre';

  // Apply to all textareas (instrument panels + master panel)
  document.querySelectorAll('.code-input, #master-code').forEach(textarea => {
    textarea.style.whiteSpace = whiteSpace;
  });

  console.log('Line wrapping applied:', wrap ? 'enabled (wrap)' : 'disabled (scroll)');
}

/**
 * Apply all appearance settings at once
 * @param {Object} settings - Settings object containing appearance values
 */
export function applyAllAppearanceSettings(settings) {
  if (settings.colorScheme) {
    applyColorScheme(settings.colorScheme);
  }

  if (settings.fontSize) {
    applyFontSize(settings.fontSize);
  }

  // Support both old and new opacity settings
  if (settings.activePanelOpacity) {
    applyActivePanelOpacity(settings.activePanelOpacity);
  } else if (settings.panelOpacity) {
    applyActivePanelOpacity(settings.panelOpacity);
  }

  if (settings.backgroundPanelOpacity) {
    applyBackgroundPanelOpacity(settings.backgroundPanelOpacity);
  }

  if (settings.wrap_lines !== undefined) {
    applyLineWrapping(settings.wrap_lines);
  }

  // Set collapseOnBlur data attribute for synchronous access
  if (settings.collapseOnBlur !== undefined) {
    document.body.dataset.collapseOnBlur = settings.collapseOnBlur;
  }

  // Apply projection margins
  if (settings.projection) {
    applyProjectionMargins(settings.projection);
  }

  console.log('✓ All appearance settings applied');
}

/**
 * Apply projection margins to body element
 * Used for screen sharing/projection adjustments
 * @param {Object} projection - Projection settings {marginTop, marginRight, marginBottom, marginLeft}
 */
export function applyProjectionMargins(projection) {
  const body = document.body;
  if (!body) return;

  const top = projection.marginTop || 0;
  const right = projection.marginRight || 0;
  const bottom = projection.marginBottom || 0;
  const left = projection.marginLeft || 0;

  body.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;

  // Set CSS variables for fixed elements to use
  const root = document.documentElement;
  root.style.setProperty('--projection-margin-top', `${top}px`);
  root.style.setProperty('--projection-margin-right', `${right}px`);
  root.style.setProperty('--projection-margin-bottom', `${bottom}px`);
  root.style.setProperty('--projection-margin-left', `${left}px`);

  console.log(`Projection margins applied: T${top} R${right} B${bottom} L${left}`);
}
