/**
 * Skin Validator
 *
 * Validates skin packages before import:
 * - Checks manifest schema (skin.json)
 * - Verifies required files exist
 * - Validates template references
 */

/**
 * Required manifest fields and their types
 */
const MANIFEST_SCHEMA = {
  name: 'string',
  version: 'string',
  author: 'string',
  description: 'string',
  layoutType: 'string', // 'tree' or 'legacy'
  templates: 'object',
  cssVariables: 'object', // optional
  hoverTargets: 'array'    // optional
};

/**
 * Required template files based on layoutType
 */
const REQUIRED_TEMPLATES = {
  tree: ['panel.html', 'slider.html', 'sliderCollapsed.html'],
  legacy: ['panel.html'] // Minimal for legacy layouts
};

/**
 * Validate skin manifest schema
 * @param {Object} manifest - Parsed skin.json
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest is not a valid object'] };
  }

  // Check required fields
  for (const [field, expectedType] of Object.entries(MANIFEST_SCHEMA)) {
    const value = manifest[field];

    // Skip optional fields
    if ((field === 'cssVariables' || field === 'hoverTargets') && value === undefined) {
      continue;
    }

    // Check field exists
    if (value === undefined || value === null) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    // Check type
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== expectedType) {
      errors.push(`Field '${field}' should be ${expectedType}, got ${actualType}`);
    }
  }

  // Validate layoutType value
  if (manifest.layoutType && !['tree', 'legacy'].includes(manifest.layoutType)) {
    errors.push(`Invalid layoutType: ${manifest.layoutType} (must be 'tree' or 'legacy')`);
  }

  // Validate templates object
  if (manifest.templates && typeof manifest.templates === 'object') {
    if (Object.keys(manifest.templates).length === 0) {
      errors.push('Templates object is empty');
    }

    // Check for invalid template paths (prevent directory traversal)
    for (const [key, path] of Object.entries(manifest.templates)) {
      if (path.includes('..') || path.startsWith('/')) {
        errors.push(`Invalid template path: ${path} (no directory traversal allowed)`);
      }
    }
  }

  // Validate hoverTargets if present
  if (manifest.hoverTargets) {
    if (!Array.isArray(manifest.hoverTargets)) {
      errors.push('hoverTargets must be an array');
    } else {
      manifest.hoverTargets.forEach((target, index) => {
        if (!target.id || typeof target.id !== 'string') {
          errors.push(`hoverTarget[${index}] missing required field 'id'`);
        }
        if (!target.controls) {
          errors.push(`hoverTarget[${index}] missing required field 'controls'`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate skin file structure
 * @param {Object} files - Map of file paths to content
 * @param {Object} manifest - Parsed skin.json
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateFiles(files, manifest) {
  const errors = [];

  // Check required CSS file
  if (!files['theme.css']) {
    errors.push('Missing required file: theme.css');
  }

  // Check template files based on manifest
  if (manifest.templates) {
    const layoutType = manifest.layoutType || 'tree';
    const requiredTemplates = REQUIRED_TEMPLATES[layoutType] || [];

    for (const [templateKey, templatePath] of Object.entries(manifest.templates)) {
      const fullPath = templatePath.startsWith('templates/') ? templatePath : `templates/${templatePath}`;

      if (!files[fullPath] && !files[templatePath]) {
        errors.push(`Missing template file: ${templatePath}`);
      }
    }

    // Ensure at least required templates exist
    requiredTemplates.forEach(template => {
      const fullPath = `templates/${template}`;
      if (!files[fullPath]) {
        errors.push(`Missing required template: ${template}`);
      }
    });
  }

  // Validate file sizes (prevent bloat)
  const MAX_FILE_SIZE = 500 * 1024; // 500KB per file
  for (const [path, content] of Object.entries(files)) {
    if (content.length > MAX_FILE_SIZE) {
      errors.push(`File too large: ${path} (${(content.length / 1024).toFixed(0)}KB > 500KB)`);
    }
  }

  // Check total package size
  const totalSize = Object.values(files).reduce((sum, content) => sum + content.length, 0);
  const MAX_PACKAGE_SIZE = 2 * 1024 * 1024; // 2MB total
  if (totalSize > MAX_PACKAGE_SIZE) {
    errors.push(`Package too large: ${(totalSize / 1024 / 1024).toFixed(1)}MB > 2MB`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate complete skin package
 * @param {Object} manifest - Parsed skin.json
 * @param {Object} files - Map of file paths to content
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateSkin(manifest, files) {
  const manifestValidation = validateManifest(manifest);
  const filesValidation = validateFiles(files, manifest);

  return {
    valid: manifestValidation.valid && filesValidation.valid,
    errors: [...manifestValidation.errors, ...filesValidation.errors]
  };
}
