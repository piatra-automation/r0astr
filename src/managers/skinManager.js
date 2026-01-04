/**
 * Skin Manager
 *
 * Manages UI skins (themes + templates) for r0astr.
 * Skins are loaded from /skins/ directory (bundled) or IndexedDB (custom).
 *
 * Architecture:
 * - Skins bundle CSS + HTML templates
 * - Templates use {{placeholder}} syntax (Mustache-like)
 * - Dual-source loading: Check IndexedDB first, then fall back to bundled
 * - User preference stored in localStorage via settingsManager
 */

import { getSkin, listSkins, getAllSkins } from './skinStorage.js';

/**
 * Simple template compiler (Mustache-style)
 * Supports:
 * - {{variable}} - Simple substitution
 * - {{#condition}}...{{/condition}} - Conditional blocks (truthy check)
 *
 * @param {string} template - HTML template with {{placeholders}}
 * @returns {Function} Compiled template function
 */
function compileTemplate(template) {
  return (data) => {
    let result = template;

    // Handle conditional blocks: {{#key}}...{{/key}}
    result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
      return data[key] ? content : '';
    });

    // Handle simple variable substitution: {{key}}
    result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = data[key];
      return value !== undefined && value !== null ? value : '';
    });

    return result;
  };
}

/**
 * SkinManager class - Singleton pattern
 */
class SkinManager {
  constructor() {
    this.currentSkin = null;
    this.templates = new Map();
    this.cssLoaded = null;
  }

  /**
   * Load a custom skin from IndexedDB
   * @param {string} skinName - Skin name
   * @returns {Promise<Object|null>} Skin manifest or null if not found
   */
  async loadCustomSkin(skinName) {
    try {
      const skinData = await getSkin(skinName);
      if (!skinData) {
        return null;
      }

      console.log(`[SkinManager] Loading custom skin '${skinName}' from IndexedDB...`);

      const { manifest, files } = skinData;

      // Clear old hover targets
      this.clearHoverTargets();

      // Load CSS from stored file
      if (files['theme.css']) {
        // Remove old skin CSS
        const oldLink = document.getElementById('skin-css');
        if (oldLink) {
          oldLink.remove();
        }

        // Create blob URL from CSS content
        const cssBlob = new Blob([files['theme.css']], { type: 'text/css' });
        const cssUrl = URL.createObjectURL(cssBlob);

        await new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.id = 'skin-css';
          link.rel = 'stylesheet';
          link.href = cssUrl;

          link.onload = () => {
            console.log(`[SkinManager] Custom CSS loaded from IndexedDB`);
            setTimeout(resolve, 50);
          };

          link.onerror = () => reject(new Error('Failed to load custom CSS'));

          document.head.appendChild(link);
        });

        this.cssLoaded = skinName;
      }

      // Apply CSS variable overrides
      if (manifest.cssVariables) {
        Object.entries(manifest.cssVariables).forEach(([key, value]) => {
          document.documentElement.style.setProperty(key, value);
        });
      }

      // Compile templates from stored files
      this.templates.clear();
      for (const [templateName, templateFilename] of Object.entries(manifest.templates || {})) {
        // Try both with and without 'templates/' prefix
        const templatePath = templateFilename.startsWith('templates/')
          ? templateFilename
          : `templates/${templateFilename}`;

        const templateContent = files[templatePath] || files[templateFilename];
        if (templateContent) {
          const compiled = compileTemplate(templateContent);
          this.templates.set(templateName, compiled);
        } else {
          console.warn(`[SkinManager] Template file not found: ${templateFilename}`);
        }
      }

      // Inject hover targets
      this.injectHoverTargets(manifest.hoverTargets || []);

      this.currentSkin = manifest;

      console.log(`✓ Custom skin '${skinName}' loaded:`, {
        templates: Array.from(this.templates.keys()),
        cssVariables: Object.keys(manifest.cssVariables || {}).length,
        hoverTargets: (manifest.hoverTargets || []).length,
        source: 'IndexedDB'
      });

      return manifest;

    } catch (error) {
      console.error(`[SkinManager] Failed to load custom skin '${skinName}':`, error);
      return null;
    }
  }

  /**
   * Load a bundled skin from /skins/ directory
   * @param {string} skinName - Name of skin folder (e.g., 'default', 'glass')
   * @returns {Promise<Object>} Skin manifest
   */
  async loadBundledSkin(skinName) {
    // Use Vite's BASE_URL to support subdirectory deployments (e.g., /app/ for lite)
    const base = import.meta.env.BASE_URL || '/';
    const skinPath = `${base}skins/${skinName}`;

    try {
      // 1. Load manifest
      const manifestResponse = await fetch(`${skinPath}/skin.json`);
      if (!manifestResponse.ok) {
        throw new Error(`Failed to load skin manifest: ${manifestResponse.status}`);
      }
      const manifest = await manifestResponse.json();

      console.log(`[SkinManager] Loading bundled skin '${skinName}'...`);

      // 2. Clear old hover targets
      this.clearHoverTargets();

      // 2. Load CSS (if not already loaded)
      if (this.cssLoaded !== skinName) {
        // Remove old skin CSS
        const oldLink = document.getElementById('skin-css');
        if (oldLink) {
          oldLink.remove();
        }

        // Add new skin CSS and wait for it to load
        await new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.id = 'skin-css';
          link.rel = 'stylesheet';
          // Add cache-busting timestamp
          link.href = `${skinPath}/theme.css?v=${Date.now()}`;

          link.onload = () => {
            console.log(`[SkinManager] CSS loaded: ${skinPath}/theme.css`);
            // Small delay to ensure browser applies styles
            setTimeout(resolve, 50);
          };

          link.onerror = () => {
            console.error(`[SkinManager] Failed to load CSS: ${skinPath}/theme.css`);
            reject(new Error(`Failed to load CSS file`));
          };

          document.head.appendChild(link);
        });

        this.cssLoaded = skinName;
      }

      // 3. Apply CSS variable overrides from manifest
      if (manifest.cssVariables) {
        Object.entries(manifest.cssVariables).forEach(([key, value]) => {
          document.documentElement.style.setProperty(key, value);
        });
      }

      // 4. Load and compile HTML templates
      const templatePromises = Object.entries(manifest.templates || {}).map(
        async ([name, filename]) => {
          const response = await fetch(`${skinPath}/templates/${filename}`);
          if (!response.ok) {
            throw new Error(`Failed to load template '${name}': ${response.status}`);
          }
          const html = await response.text();
          const compiled = compileTemplate(html);
          this.templates.set(name, compiled);
          return name;
        }
      );

      await Promise.all(templatePromises);

      // 5. Inject hover targets into DOM
      this.injectHoverTargets(manifest.hoverTargets || []);

      this.currentSkin = manifest;

      console.log(`✓ Bundled skin '${skinName}' loaded:`, {
        templates: Array.from(this.templates.keys()),
        cssVariables: Object.keys(manifest.cssVariables || {}).length,
        hoverTargets: (manifest.hoverTargets || []).length,
        source: 'bundled'
      });

      return manifest;

    } catch (error) {
      console.error(`[SkinManager] Failed to load bundled skin '${skinName}':`, error);
      throw error;
    }
  }

  /**
   * Load a skin by name (checks custom skins first, then bundled)
   * @param {string} skinName - Skin name
   * @returns {Promise<Object>} Skin manifest
   */
  async loadSkin(skinName) {
    // Try loading from IndexedDB first (custom skins)
    const customSkin = await this.loadCustomSkin(skinName);
    if (customSkin) {
      return customSkin;
    }

    // Fall back to bundled skin
    console.log(`[SkinManager] No custom skin '${skinName}', loading bundled...`);
    return await this.loadBundledSkin(skinName);
  }

  /**
   * Render a template with data
   * @param {string} templateName - Name of template (e.g., 'panel', 'slider')
   * @param {Object} data - Data to interpolate into template
   * @returns {string} Rendered HTML
   */
  render(templateName, data) {
    const template = this.templates.get(templateName);

    if (!template) {
      console.error(`[SkinManager] Template '${templateName}' not found. Available:`, Array.from(this.templates.keys()));
      // Fallback to basic structure
      return this.getFallbackTemplate(templateName, data);
    }

    return template(data);
  }

  /**
   * Check if a template exists
   * @param {string} templateName - Template name
   * @returns {boolean}
   */
  hasTemplate(templateName) {
    return this.templates.has(templateName);
  }

  /**
   * Get current skin info
   * @returns {Object|null} Current skin manifest
   */
  getCurrentSkin() {
    return this.currentSkin;
  }

  /**
   * Hot-reload skin without page refresh
   * Re-renders all panels with new templates while preserving state
   * @param {string} skinName - Name of skin to load
   * @returns {Promise<void>}
   */
  async hotReloadSkin(skinName) {
    console.log(`[SkinManager] Hot-reloading skin: ${skinName}`);

    // Load new skin
    await this.loadSkin(skinName);

    // Dispatch event for components to re-render
    window.dispatchEvent(new CustomEvent('skin-changed', {
      detail: { skinName, manifest: this.currentSkin }
    }));

    console.log(`✓ Skin hot-reloaded: ${skinName}`);
  }

  /**
   * Clear existing hover targets from DOM
   */
  clearHoverTargets() {
    const existingTargets = document.querySelectorAll('.skin-hover-target');
    existingTargets.forEach(target => target.remove());
  }

  /**
   * Inject hover targets into DOM based on skin manifest
   * @param {Array} hoverTargets - Array of hover target configs from manifest
   */
  injectHoverTargets(hoverTargets) {
    if (!hoverTargets || hoverTargets.length === 0) {
      console.log('[SkinManager] No hover targets defined for this skin');
      return;
    }

    // Inject each hover target as direct body child (for CSS sibling selectors to work)
    hoverTargets.forEach(target => {
      const div = document.createElement('div');
      div.className = 'skin-hover-target';
      div.setAttribute('data-hover-id', target.id);
      div.setAttribute('data-hint', target.hint || 'none');
      div.setAttribute('aria-hidden', 'true');

      // Store controlled selectors as data attribute
      const controls = Array.isArray(target.controls) ? target.controls : [target.controls];
      div.setAttribute('data-controls', controls.join(','));

      // Insert at start of body (before other elements) so sibling selectors work
      document.body.insertBefore(div, document.body.firstChild);

      console.log(`[SkinManager] Hover target '${target.id}' controls: ${controls.join(', ')}`);
    });
  }

  /**
   * List all available skins (bundled + custom)
   * @returns {Promise<Array>} Array of skin info objects { name, source: 'bundled'|'custom', manifest }
   */
  async listAllSkins() {
    const allSkins = [];

    // Get bundled skins (hardcoded for now)
    const bundledSkins = ['default', 'glass'];
    for (const name of bundledSkins) {
      allSkins.push({
        name,
        source: 'bundled',
        manifest: null // Could fetch manifest if needed
      });
    }

    // Get custom skins from IndexedDB
    const customSkins = await getAllSkins();
    for (const skinData of customSkins) {
      allSkins.push({
        name: skinData.name,
        source: 'custom',
        manifest: skinData.manifest,
        importedAt: skinData.importedAt
      });
    }

    return allSkins;
  }

  /**
   * Fallback templates when skin templates fail to load
   * @param {string} templateName - Template name
   * @param {Object} data - Template data
   * @returns {string} Minimal fallback HTML
   */
  getFallbackTemplate(templateName, data) {
    const fallbacks = {
      panel: `
        <details>
          <summary>
            <span class="panel-number-badge">${data.panelNumber || '?'}</span>
            <span class="panel-title">${data.title || 'Untitled'}</span>
          </summary>
          <div class="panel-editor-container">
            <div class="code-editor" id="editor-${data.panelId}"></div>
          </div>
        </details>
        <div class="panel-controls-container"></div>
      `,
      slider: `
        <label>${data.label || 'Slider'}</label>
        <input type="range" min="${data.min}" max="${data.max}" value="${data.value}">
        <span class="slider-value">${data.valueFormatted || data.value}</span>
      `,
      sliderCollapsed: `
        <input type="range" min="${data.min}" max="${data.max}" value="${data.value}">
      `
    };

    return fallbacks[templateName] || `<div>Template '${templateName}' not found</div>`;
  }
}

// Export singleton instance
export const skinManager = new SkinManager();
