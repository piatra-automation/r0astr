/**
 * Settings Modal Manager
 * Handles settings modal UI interactions and persistence
 */

import { getSettings, saveSettings, updateSetting } from '../managers/settingsManager.js';
import { startAutoSaveTimer } from '../managers/panelManager.js';
import { applyFontSize, applyActivePanelOpacity, applyBackgroundPanelOpacity, applyLineWrapping, updatePanelOpacities } from '../managers/themeManager.js';
import { validateURL, validatePath } from '../utils/validation.js';
import { loadSnippets, clearSnippets } from '../managers/snippetManager.js';
import { importSkinFromZip, downloadSkin } from '../managers/skinImporter.js';
import { getAllSkins, deleteSkin } from '../managers/skinStorage.js';
import { skinManager } from '../managers/skinManager.js';

// Track if settings have been modified (dirty flag)
let settingsDirty = false;

/**
 * Populate skin selector with bundled + custom skins
 */
async function populateSkinSelector() {
  const skinSelect = document.getElementById('skin-select');
  if (!skinSelect) return;

  const allSkins = await skinManager.listAllSkins();
  const settings = getSettings();
  const currentSkin = settings.skin || 'default';

  skinSelect.innerHTML = '';
  allSkins.forEach(skin => {
    const option = document.createElement('option');
    option.value = skin.name;
    option.textContent = `${skin.name}${skin.source === 'custom' ? ' (Custom)' : ''}`;
    skinSelect.appendChild(option);
  });

  // Select current skin
  skinSelect.value = currentSkin;
}

/**
 * Render custom skins list with export/delete buttons
 */
async function renderCustomSkinsList() {
  const container = document.getElementById('custom-skins-list');
  if (!container) return;

  const allSkins = await getAllSkins();

  container.innerHTML = '';

  if (allSkins.length === 0) {
    container.innerHTML = '<div class="no-custom-skins">No custom skins imported yet</div>';
    return;
  }

  allSkins.forEach(skinData => {
    const item = document.createElement('div');
    item.className = 'custom-skin-item';
    item.innerHTML = `
      <div class="custom-skin-info">
        <div class="custom-skin-name">${skinData.name}</div>
        <div class="custom-skin-meta">${skinData.manifest.description || 'No description'}</div>
      </div>
      <div class="custom-skin-actions">
        <button class="btn-export" data-skin="${skinData.name}">Export</button>
        <button class="btn-delete" data-skin="${skinData.name}">Delete</button>
      </div>
    `;

    // Export handler
    item.querySelector('.btn-export').addEventListener('click', async () => {
      await downloadSkin(skinData.name, skinData.manifest, skinData.files);
      showSettingsNotification(`Exported "${skinData.name}"`, 'success');
    });

    // Delete handler
    item.querySelector('.btn-delete').addEventListener('click', async () => {
      const settings = getSettings();
      const currentSkin = settings.skin || 'default';

      // Prevent deleting currently active skin
      if (skinData.name === currentSkin) {
        showSettingsNotification(`Cannot delete active skin "${skinData.name}". Switch to another skin first.`, 'error');
        return;
      }

      if (confirm(`Delete custom skin "${skinData.name}"?`)) {
        await deleteSkin(skinData.name);
        await populateSkinSelector();
        await renderCustomSkinsList();
        showSettingsNotification(`Deleted "${skinData.name}"`, 'info');
      }
    });

    container.appendChild(item);
  });
}

/**
 * Open settings modal
 * Loads current settings and displays modal
 */
export async function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (!modal) {
    console.error('Settings modal not found');
    return;
  }

  // Load current settings into form
  await loadSettingsIntoForm();

  // Show modal
  modal.style.display = 'flex';

  // Reset dirty flag
  settingsDirty = false;

  // Focus first input for accessibility
  const firstInput = modal.querySelector('input, select');
  firstInput?.focus();
}

/**
 * Close settings modal
 * Hides modal and clears temporary state
 */
export function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;

  modal.style.display = 'none';
}

/**
 * Load current settings into form controls
 * Populates form with values from localStorage
 */
async function loadSettingsIntoForm() {
  const settings = getSettings();

  console.log('Loading settings into form:', settings);

  // Populate skin selector and custom skins list
  await populateSkinSelector();
  await renderCustomSkinsList();

  // Story 4.5: Appearance Settings Controls
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeValue = document.getElementById('font-size-value');
  const activePanelOpacitySlider = document.getElementById('active-panel-opacity-slider');
  const activePanelOpacityValue = document.getElementById('active-panel-opacity-value');
  const backgroundPanelOpacitySlider = document.getElementById('background-panel-opacity-slider');
  const backgroundPanelOpacityValue = document.getElementById('background-panel-opacity-value');

  if (fontSizeSlider) {
    const fontSize = settings.fontSize || 14;
    fontSizeSlider.value = fontSize;
    if (fontSizeValue) {
      fontSizeValue.textContent = `${fontSize}px`;
    }
  }

  if (activePanelOpacitySlider) {
    const opacity = settings.activePanelOpacity || settings.panelOpacity || 95;
    activePanelOpacitySlider.value = opacity;
    if (activePanelOpacityValue) {
      activePanelOpacityValue.textContent = `${opacity}%`;
    }
  }

  if (backgroundPanelOpacitySlider) {
    const opacity = settings.backgroundPanelOpacity || 60;
    backgroundPanelOpacitySlider.value = opacity;
    if (backgroundPanelOpacityValue) {
      backgroundPanelOpacityValue.textContent = `${opacity}%`;
    }
  }


  // Collapse on Blur Toggle
  const collapseOnBlurToggle = document.getElementById('collapse-on-blur-toggle');
  if (collapseOnBlurToggle) {
    collapseOnBlurToggle.checked = settings.collapseOnBlur || false;
  }

  // Show Controls When Collapsed Toggle
  const showControlsCollapsedToggle = document.getElementById('show-controls-collapsed-toggle');
  if (showControlsCollapsedToggle) {
    showControlsCollapsedToggle.checked = settings.showControlsWhenCollapsed !== false;
  }

  // Story 7.1: Wrap Lines Toggle
  const wrapLinesToggle = document.getElementById('wrap-lines-toggle');
  if (wrapLinesToggle) {
    wrapLinesToggle.checked = settings.wrap_lines || false;
  }

  // Story 7.4: Auto-Format Toggle
  const autoFormatToggle = document.getElementById('auto-format-toggle');
  if (autoFormatToggle) {
    autoFormatToggle.checked = settings.auto_format !== false;
  }

  // Story 7.6: Syntax Highlighting Toggle
  const syntaxHighlightToggle = document.getElementById('syntax-highlight-toggle');
  if (syntaxHighlightToggle) {
    syntaxHighlightToggle.checked = settings.syntax_highlight !== false;
  }

  // Pattern Highlighting Toggle
  const patternHighlightToggle = document.getElementById('pattern-highlighting-toggle');
  if (patternHighlightToggle) {
    patternHighlightToggle.checked = settings.pattern_highlighting !== false;
  }

  // Story 7.6: Editor Theme Selection
  const editorThemeSelect = document.getElementById('editor-theme-select');
  if (editorThemeSelect) {
    editorThemeSelect.value = settings.editor_theme || 'atomone';
  }

  // UI Skin Selection - populated by populateSkinSelector() above

  // Story 4.4: Behavior Settings Controls
  const yoloToggle = document.getElementById('yolo-toggle');
  const autoSaveSelect = document.getElementById('autosave-interval-select');
  const restoreSessionToggle = document.getElementById('restore-session-toggle');

  if (yoloToggle) {
    yoloToggle.checked = settings.yolo || false;
  }

  if (autoSaveSelect) {
    autoSaveSelect.value = settings.behavior?.autoSaveInterval || 'manual';
  }

  if (restoreSessionToggle) {
    restoreSessionToggle.checked = settings.behavior?.restoreSession !== false;
  }

  // Story 4.6: Integration Settings Controls
  const snippetLocationInput = document.getElementById('snippet-location-input');
  const skinPackInput = document.getElementById('skin-pack-input');

  if (snippetLocationInput) {
    snippetLocationInput.value = settings.snippetLocation || '';
  }

  if (skinPackInput) {
    skinPackInput.value = settings.skinPack || '';
  }

  // Projection Tweaks Settings
  const projectionMarginTop = document.getElementById('projection-margin-top');
  const projectionMarginTopValue = document.getElementById('projection-margin-top-value');
  const projectionMarginRight = document.getElementById('projection-margin-right');
  const projectionMarginRightValue = document.getElementById('projection-margin-right-value');
  const projectionMarginBottom = document.getElementById('projection-margin-bottom');
  const projectionMarginBottomValue = document.getElementById('projection-margin-bottom-value');
  const projectionMarginLeft = document.getElementById('projection-margin-left');
  const projectionMarginLeftValue = document.getElementById('projection-margin-left-value');

  if (projectionMarginTop && settings.projection) {
    projectionMarginTop.value = settings.projection.marginTop || 0;
    if (projectionMarginTopValue) {
      projectionMarginTopValue.textContent = `${projectionMarginTop.value}px`;
    }
  }

  if (projectionMarginRight && settings.projection) {
    projectionMarginRight.value = settings.projection.marginRight || 0;
    if (projectionMarginRightValue) {
      projectionMarginRightValue.textContent = `${projectionMarginRight.value}px`;
    }
  }

  if (projectionMarginBottom && settings.projection) {
    projectionMarginBottom.value = settings.projection.marginBottom || 0;
    if (projectionMarginBottomValue) {
      projectionMarginBottomValue.textContent = `${projectionMarginBottom.value}px`;
    }
  }

  if (projectionMarginLeft && settings.projection) {
    projectionMarginLeft.value = settings.projection.marginLeft || 0;
    if (projectionMarginLeftValue) {
      projectionMarginLeftValue.textContent = `${projectionMarginLeft.value}px`;
    }
  }

  // Advanced settings
  const showTempoKnobToggle = document.getElementById('show-tempo-knob');
  const showCpmToggle = document.getElementById('show-cpm');

  if (showTempoKnobToggle && settings.advanced) {
    showTempoKnobToggle.checked = settings.advanced.show_tempo_knob !== false;
  }

  if (showCpmToggle && settings.advanced) {
    showCpmToggle.checked = settings.advanced.show_cpm || false;
  }
}

/**
 * Collect settings from form controls
 * Reads values from form and constructs settings object
 * @returns {Object} Settings object
 */
function collectSettingsFromForm() {
  const settings = getSettings();

  console.log('Collecting settings from form');

  // Story 4.5: Appearance Settings Controls
  const fontSizeSlider = document.getElementById('font-size-slider');
  const panelOpacitySlider = document.getElementById('panel-opacity-slider');

  if (fontSizeSlider) {
    settings.fontSize = parseInt(fontSizeSlider.value, 10);
  }

  if (panelOpacitySlider) {
    settings.panelOpacity = parseInt(panelOpacitySlider.value, 10);
  }

  // Story 7.1: Wrap Lines Toggle
  const wrapLinesToggle = document.getElementById('wrap-lines-toggle');
  if (wrapLinesToggle) {
    settings.wrap_lines = wrapLinesToggle.checked;
  }

  // Story 7.4: Auto-Format Toggle
  const autoFormatToggle = document.getElementById('auto-format-toggle');
  if (autoFormatToggle) {
    settings.auto_format = autoFormatToggle.checked;
  }

  // Story 7.6: Syntax Highlighting
  const syntaxHighlightToggle = document.getElementById('syntax-highlight-toggle');
  if (syntaxHighlightToggle) {
    settings.syntax_highlight = syntaxHighlightToggle.checked;
  }

  // Pattern Highlighting
  const patternHighlightToggle = document.getElementById('pattern-highlighting-toggle');
  if (patternHighlightToggle) {
    settings.pattern_highlighting = patternHighlightToggle.checked;
  }

  const editorThemeSelect = document.getElementById('editor-theme-select');
  if (editorThemeSelect) {
    settings.editor_theme = editorThemeSelect.value;
  }

  // UI Skin Selection
  const skinSelect = document.getElementById('skin-select');
  if (skinSelect) {
    const newSkin = skinSelect.value;
    const oldSkin = settings.skin || 'default';
    settings.skin = newSkin;

    // If skin changed, notify user that reload is required
    if (newSkin !== oldSkin) {
      console.log(`[Settings] Skin changed from '${oldSkin}' to '${newSkin}' - reload required`);
    }
  }

  // Story 4.4: Behavior Settings Controls
  const yoloToggle = document.getElementById('yolo-toggle');
  const autoSaveSelect = document.getElementById('autosave-interval-select');
  const restoreSessionToggle = document.getElementById('restore-session-toggle');

  if (yoloToggle) {
    settings.yolo = yoloToggle.checked;
  }

  if (autoSaveSelect) {
    if (!settings.behavior) {
      settings.behavior = {};
    }
    settings.behavior.autoSaveInterval = autoSaveSelect.value;
  }

  if (restoreSessionToggle) {
    if (!settings.behavior) {
      settings.behavior = {};
    }
    settings.behavior.restoreSession = restoreSessionToggle.checked;
  }

  // Story 4.6: Integration Settings Controls
  const snippetLocationInput = document.getElementById('snippet-location-input');
  const skinPackInput = document.getElementById('skin-pack-input');

  if (snippetLocationInput) {
    settings.snippetLocation = snippetLocationInput.value.trim();
  }

  if (skinPackInput) {
    settings.skinPack = skinPackInput.value.trim();
  }

  // Projection Tweaks Settings
  const projectionMarginTop = document.getElementById('projection-margin-top');
  const projectionMarginRight = document.getElementById('projection-margin-right');
  const projectionMarginBottom = document.getElementById('projection-margin-bottom');
  const projectionMarginLeft = document.getElementById('projection-margin-left');

  if (projectionMarginTop || projectionMarginRight || projectionMarginBottom || projectionMarginLeft) {
    if (!settings.projection) {
      settings.projection = {};
    }

    if (projectionMarginTop) {
      settings.projection.marginTop = parseInt(projectionMarginTop.value, 10) || 0;
    }

    if (projectionMarginRight) {
      settings.projection.marginRight = parseInt(projectionMarginRight.value, 10) || 0;
    }

    if (projectionMarginBottom) {
      settings.projection.marginBottom = parseInt(projectionMarginBottom.value, 10) || 0;
    }

    if (projectionMarginLeft) {
      settings.projection.marginLeft = parseInt(projectionMarginLeft.value, 10) || 0;
    }
  }

  // Advanced Settings
  const showTempoKnobToggle = document.getElementById('show-tempo-knob');
  const showCpmToggle = document.getElementById('show-cpm');

  if (showTempoKnobToggle || showCpmToggle) {
    if (!settings.advanced) {
      settings.advanced = {};
    }

    if (showTempoKnobToggle) {
      settings.advanced.show_tempo_knob = showTempoKnobToggle.checked;
    }

    if (showCpmToggle) {
      settings.advanced.show_cpm = showCpmToggle.checked;
    }
  }

  return settings;
}

/**
 * Save settings from form
 * Collects form values, saves to localStorage, and closes modal
 */
async function handleSaveSettings() {
  const oldSettings = getSettings();
  const newSettings = collectSettingsFromForm();

  // Check if skin changed
  const skinChanged = oldSettings.skin !== newSettings.skin;

  // Save to localStorage
  const success = saveSettings(newSettings);

  if (success) {
    // Reset dirty flag
    settingsDirty = false;

    // Story 4.4: Restart auto-save timer with new interval
    if (newSettings.behavior?.autoSaveInterval) {
      startAutoSaveTimer(newSettings.behavior.autoSaveInterval);
    }

    // Hot-reload skin if changed (no page reload needed)
    if (skinChanged) {
      const skinName = newSettings.skin || 'default';
      console.log(`[Settings] Skin changed to '${skinName}' - hot-reloading...`);

      try {
        const { skinManager } = await import('../managers/skinManager.js');
        await skinManager.hotReloadSkin(skinName);
        console.log('✓ Skin hot-reloaded successfully');
      } catch (error) {
        console.error('Failed to hot-reload skin:', error);
        alert(`Failed to load skin '${skinName}'. Please reload the page.`);
      }
    }

    // Dispatch settings changed event for components to react
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: newSettings }));

    // Close modal
    closeSettingsModal();

    console.log('✓ Settings saved successfully');
  } else {
    console.error('Failed to save settings');
  }
}

/**
 * Handle cancel button click
 * Checks for unsaved changes and closes modal
 */
function handleCancelSettings() {
  if (settingsDirty) {
    // Non-blocking notification instead of blocking confirm()
    showSettingsNotification('Changes discarded. Click Save to keep changes.', 'warning');
  }

  // Reset dirty flag and close modal
  settingsDirty = false;
  closeSettingsModal();
}

/**
 * Initialize settings modal event listeners
 * Attaches click handlers to buttons and overlay
 */
export function initializeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const saveBtn = document.getElementById('settings-save-btn');
  const cancelBtn = document.getElementById('settings-cancel-btn');

  if (!modal) {
    console.warn('Settings modal not found in DOM');
    return;
  }

  // Save button - save and close
  saveBtn?.addEventListener('click', () => {
    handleSaveSettings();
  });

  // Cancel button - close without saving
  cancelBtn?.addEventListener('click', () => {
    handleCancelSettings();
  });

  // NON-MODAL: No backdrop click to close
  // NON-MODAL: No ESC key to close
  // User must explicitly choose Save or Cancel

  // Story 4.5: Wire appearance settings with live preview
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeValue = document.getElementById('font-size-value');
  const activePanelOpacitySlider = document.getElementById('active-panel-opacity-slider');
  const activePanelOpacityValue = document.getElementById('active-panel-opacity-value');
  const backgroundPanelOpacitySlider = document.getElementById('background-panel-opacity-slider');
  const backgroundPanelOpacityValue = document.getElementById('background-panel-opacity-value');

  // Font Size - live preview + save
  fontSizeSlider?.addEventListener('input', (e) => {
    const size = e.target.value;
    if (fontSizeValue) {
      fontSizeValue.textContent = `${size}px`;
    }
    applyFontSize(size);

    const settings = getSettings();
    settings.fontSize = parseInt(size, 10);
    saveSettings(settings);
  });

  // Active Panel Opacity - live preview + save
  activePanelOpacitySlider?.addEventListener('input', (e) => {
    const opacity = e.target.value;
    if (activePanelOpacityValue) {
      activePanelOpacityValue.textContent = `${opacity}%`;
    }
    applyActivePanelOpacity(opacity);

    const settings = getSettings();
    settings.activePanelOpacity = parseInt(opacity, 10);
    saveSettings(settings);
  });

  // Background Panel Opacity - live preview + save
  backgroundPanelOpacitySlider?.addEventListener('input', (e) => {
    const opacity = e.target.value;
    if (backgroundPanelOpacityValue) {
      backgroundPanelOpacityValue.textContent = `${opacity}%`;
    }
    applyBackgroundPanelOpacity(opacity);

    const settings = getSettings();
    settings.backgroundPanelOpacity = parseInt(opacity, 10);
    saveSettings(settings);
  });

  // Collapse on Blur - save and apply
  const collapseOnBlurToggle = document.getElementById('collapse-on-blur-toggle');
  collapseOnBlurToggle?.addEventListener('change', (e) => {
    const collapse = e.target.checked;

    const settings = getSettings();
    settings.collapseOnBlur = collapse;
    saveSettings(settings);

    // Update data attribute for synchronous access
    document.body.dataset.collapseOnBlur = collapse;

    // Trigger panel opacity update to apply/remove collapsed state
    updatePanelOpacities();

    console.log(`Collapse on blur ${collapse ? 'enabled' : 'disabled'}`);
  });

  // Show Controls When Collapsed - save and apply immediately
  const showControlsCollapsedToggle = document.getElementById('show-controls-collapsed-toggle');
  showControlsCollapsedToggle?.addEventListener('change', (e) => {
    const showControls = e.target.checked;

    const settings = getSettings();
    settings.showControlsWhenCollapsed = showControls;
    saveSettings(settings);

    // Apply/remove class on all playing panels
    document.querySelectorAll('.level-panel.playing').forEach(panel => {
      if (showControls) {
        panel.classList.add('show-controls-collapsed');
      } else {
        panel.classList.remove('show-controls-collapsed');
      }
    });

    console.log(`Show controls when collapsed ${showControls ? 'enabled' : 'disabled'}`);
  });

  // Story 7.1: Wrap Lines - live preview + save
  const wrapLinesToggle = document.getElementById('wrap-lines-toggle');
  wrapLinesToggle?.addEventListener('change', (e) => {
    const wrap = e.target.checked;
    applyLineWrapping(wrap);

    const settings = getSettings();
    settings.wrap_lines = wrap;
    saveSettings(settings);
  });

  // Story 7.4: Auto-Format - save on toggle
  const autoFormatToggle = document.getElementById('auto-format-toggle');
  autoFormatToggle?.addEventListener('change', (e) => {
    const autoFormat = e.target.checked;

    const settings = getSettings();
    settings.auto_format = autoFormat;
    saveSettings(settings);

    console.log(`Auto-format ${autoFormat ? 'enabled' : 'disabled'}`);
  });

  // Story 7.6: Syntax Highlighting Toggle - save and recreate editors
  const syntaxHighlightToggle = document.getElementById('syntax-highlight-toggle');
  syntaxHighlightToggle?.addEventListener('change', (e) => {
    const syntaxHighlight = e.target.checked;

    const settings = getSettings();
    settings.syntax_highlight = syntaxHighlight;
    saveSettings(settings);

    console.log(`Syntax highlighting ${syntaxHighlight ? 'enabled' : 'disabled'}`);

    // Recreate all editors to apply syntax highlighting change
    window.location.reload();
  });

  // Pattern Highlighting Toggle - save and update via settings-changed event
  const patternHighlightToggle = document.getElementById('pattern-highlighting-toggle');
  patternHighlightToggle?.addEventListener('change', (e) => {
    const patternHighlighting = e.target.checked;

    updateSetting('pattern_highlighting', patternHighlighting);

    console.log(`Pattern highlighting ${patternHighlighting ? 'enabled' : 'disabled'}`);
    // Animation loop will respond to 'settings-changed' event automatically
  });

  // Story 7.6: Editor Theme Selection - save and recreate editors
  const editorThemeSelect = document.getElementById('editor-theme-select');
  editorThemeSelect?.addEventListener('change', (e) => {
    const theme = e.target.value;

    const settings = getSettings();
    settings.editor_theme = theme;
    saveSettings(settings);

    console.log(`Editor theme changed to: ${theme}`);

    // Recreate all editors to apply theme change
    window.location.reload();
  });

  // Story 4.6: Integration Settings Event Handlers
  const snippetLocationInput = document.getElementById('snippet-location-input');
  const skinPackInput = document.getElementById('skin-pack-input');

  // Snippet Location - validate and load snippets on blur
  snippetLocationInput?.addEventListener('blur', async (e) => {
    const input = e.target;
    const url = input.value.trim();

    // Validate URL/path
    if (url && !validateURL(url) && !validatePath(url)) {
      input.classList.add('invalid');
      // Non-blocking notification - no alert to prevent playback interruption
      console.warn('Invalid snippet URL format:', url);
      showSettingsNotification('Invalid URL or path format', 'error');
      return;
    } else {
      input.classList.remove('invalid');
    }

    // Save to settings
    const settings = getSettings();
    settings.snippetLocation = url;
    saveSettings(settings);

    // Reload snippets if URL provided
    if (url) {
      // Show loading indicator
      showSettingsNotification('Loading snippets...', 'info');

      // Load snippets asynchronously (non-blocking)
      const result = await loadSnippets(url);

      if (result) {
        showSettingsNotification('Snippets loaded successfully', 'success');
      }
      // Errors are handled by loadSnippets() with toast notifications
    } else {
      clearSnippets();
      console.log('Snippet location cleared');
      showSettingsNotification('Snippet location cleared', 'info');
    }
  });

  // Projection margin sliders - live update with value display
  const projectionMarginTop = document.getElementById('projection-margin-top');
  const projectionMarginTopValue = document.getElementById('projection-margin-top-value');
  const projectionMarginRight = document.getElementById('projection-margin-right');
  const projectionMarginRightValue = document.getElementById('projection-margin-right-value');
  const projectionMarginBottom = document.getElementById('projection-margin-bottom');
  const projectionMarginBottomValue = document.getElementById('projection-margin-bottom-value');
  const projectionMarginLeft = document.getElementById('projection-margin-left');
  const projectionMarginLeftValue = document.getElementById('projection-margin-left-value');

  projectionMarginTop?.addEventListener('input', (e) => {
    if (projectionMarginTopValue) {
      projectionMarginTopValue.textContent = `${e.target.value}px`;
    }
  });

  projectionMarginRight?.addEventListener('input', (e) => {
    if (projectionMarginRightValue) {
      projectionMarginRightValue.textContent = `${e.target.value}px`;
    }
  });

  projectionMarginBottom?.addEventListener('input', (e) => {
    if (projectionMarginBottomValue) {
      projectionMarginBottomValue.textContent = `${e.target.value}px`;
    }
  });

  projectionMarginLeft?.addEventListener('input', (e) => {
    if (projectionMarginLeftValue) {
      projectionMarginLeftValue.textContent = `${e.target.value}px`;
    }
  });

  // Skin Pack Path - validate and save on blur
  skinPackInput?.addEventListener('blur', (e) => {
    const input = e.target;
    const path = input.value.trim();

    // Basic validation
    if (path && !validatePath(path)) {
      input.classList.add('invalid');
      alert('Invalid path format');
      return;
    } else {
      input.classList.remove('invalid');
    }

    // Save to settings
    const settings = getSettings();
    settings.skinPack = path;
    saveSettings(settings);

    if (path) {
      console.log('Skin pack path saved:', path);
      console.warn('Skin loading not yet implemented (Epic 2 future feature)');
    }
  });

  // Skin Import - ZIP file upload
  const importBtn = document.getElementById('skin-import-btn');
  const importFile = document.getElementById('skin-import-file');
  const importStatus = document.getElementById('skin-import-status');

  importBtn?.addEventListener('click', () => {
    importFile.click();
  });

  importFile?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    importStatus.style.display = 'block';
    importStatus.className = 'import-status';
    importStatus.textContent = 'Importing...';

    const result = await importSkinFromZip(file, { overwrite: false });

    if (result.success) {
      importStatus.className = 'import-status success';
      importStatus.textContent = `✓ Imported "${result.skinName}" successfully!`;
      await populateSkinSelector();
      await renderCustomSkinsList();

      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        importStatus.style.display = 'none';
      }, 3000);
    } else {
      importStatus.className = 'import-status error';
      importStatus.textContent = `✗ ${result.errors.join(', ')}`;
    }

    importFile.value = ''; // Reset file input
  });

  // Track changes to form inputs (dirty flag)
  const trackChanges = () => {
    settingsDirty = true;
  };

  // Story 4.4: Add change listeners for behavior controls
  modal.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('change', trackChanges);
    input.addEventListener('input', trackChanges);
  });

  // Collapsible settings sections
  modal.querySelectorAll('.settings-section h3').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.closest('.settings-section');
      section.classList.toggle('collapsed');
    });
  });

  console.log('✓ Settings modal initialized');
}

/**
 * Show non-blocking notification toast for settings operations
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('info', 'warning', 'error', 'success')
 */
function showSettingsNotification(message, type = 'info') {
  // Color scheme based on type
  const colors = {
    info: 'rgba(59, 130, 246, 0.95)',     // Blue
    warning: 'rgba(245, 158, 11, 0.95)',  // Amber
    error: 'rgba(239, 68, 68, 0.95)',     // Red
    success: 'rgba(34, 197, 94, 0.95)'    // Green
  };

  const toast = document.createElement('div');
  toast.className = 'settings-notification-toast';
  toast.textContent = `${type === 'warning' ? '⚠️' : type === 'error' ? '❌' : type === 'success' ? '✓' : 'ℹ️'} ${message}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10001;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  `;

  // Add slide-in animation if not already present
  if (!document.getElementById('settings-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'settings-toast-styles';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Auto-remove after 3 seconds (info/success) or 5 seconds (warning/error)
  const duration = type === 'error' || type === 'warning' ? 5000 : 3000;
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease-out';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}
