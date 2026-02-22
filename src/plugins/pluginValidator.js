/**
 * Plugin Validator
 *
 * Validates plugin packages before loading:
 * - Checks manifest schema (plugin.json)
 * - Verifies required files exist
 * - Validates hook definitions
 * - Checks for security concerns
 */

/**
 * Plugin manifest schema definition
 * @type {Object}
 */
const MANIFEST_SCHEMA = {
  // Required fields
  name: { type: 'string', required: true },
  version: { type: 'string', required: true },
  description: { type: 'string', required: true },
  author: { type: 'string', required: true },

  // Optional fields with defaults
  main: { type: 'string', required: false, default: 'index.js' },
  hooks: { type: 'array', required: false, default: [] },
  dependencies: { type: 'array', required: false, default: [] },
  permissions: { type: 'array', required: false, default: [] },
  settings: { type: 'object', required: false, default: null },
  minAppVersion: { type: 'string', required: false, default: null },
  maxAppVersion: { type: 'string', required: false, default: null }
};

/**
 * Valid hook types that plugins can register
 * @type {string[]}
 */
export const VALID_HOOKS = [
  // Panel lifecycle hooks
  'panel:beforeCreate',
  'panel:afterCreate',
  'panel:beforeDelete',
  'panel:afterDelete',
  'panel:codeChange',
  'panel:playStart',
  'panel:playStop',

  // Application lifecycle hooks
  'app:init',
  'app:ready',
  'app:beforeUnload',

  // UI extension hooks
  'ui:registerMenu',
  'ui:registerToolbar',
  'ui:registerContextMenu',
  'ui:registerSettings',

  // Audio hooks
  'audio:beforeEvaluate',
  'audio:afterEvaluate',
  'audio:onError',

  // WebSocket hooks (for remote control extensions)
  'websocket:onMessage',
  'websocket:onConnect',
  'websocket:onDisconnect'
];

/**
 * Valid permissions that plugins can request
 * @type {string[]}
 */
export const VALID_PERMISSIONS = [
  'storage',        // Access to localStorage/IndexedDB
  'network',        // Ability to make fetch/XHR requests
  'audio',          // Access to Web Audio API
  'dom',            // Direct DOM manipulation
  'eval',           // Ability to evaluate code (dangerous)
  'filesystem',     // Access to File API (read-only)
  'clipboard',      // Clipboard read/write
  'notifications'   // Browser notifications
];

/**
 * Dangerous patterns to check for in plugin code
 * @type {RegExp[]}
 */
const DANGEROUS_PATTERNS = [
  /\beval\s*\(/,                    // Direct eval calls
  /new\s+Function\s*\(/,            // Function constructor
  /document\.write\s*\(/,           // Document write
  /innerHTML\s*=/,                  // innerHTML assignment (XSS risk)
  /outerHTML\s*=/,                  // outerHTML assignment
  /\bwith\s*\(/,                    // with statement
  /\.constructor\s*\(/,             // Constructor access
  /__proto__/,                      // Prototype pollution
  /\bprototype\s*\[/,               // Prototype access
  /window\s*\[/,                    // Window bracket access
  /globalThis\s*\[/,                // globalThis bracket access
  /localStorage\.clear\s*\(/,       // Clear all storage
  /indexedDB\.deleteDatabase/       // Delete entire database
];

/**
 * Validate plugin manifest schema
 * @param {Object} manifest - Parsed plugin.json
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest is not a valid object'], warnings: [] };
  }

  // Check required fields and types
  for (const [field, schema] of Object.entries(MANIFEST_SCHEMA)) {
    const value = manifest[field];

    // Check required fields
    if (schema.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    // Skip type check if field is not present and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Check type
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== schema.type) {
      errors.push(`Field '${field}' should be ${schema.type}, got ${actualType}`);
    }
  }

  // Validate name format (alphanumeric, dashes, underscores)
  if (manifest.name && !/^[a-zA-Z0-9_-]+$/.test(manifest.name)) {
    errors.push(`Invalid plugin name: '${manifest.name}' (only alphanumeric, dashes, and underscores allowed)`);
  }

  // Validate version format (semver-like)
  if (manifest.version && !/^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.]+)?$/.test(manifest.version)) {
    warnings.push(`Version '${manifest.version}' does not follow semver format (x.y.z)`);
  }

  // Validate hooks
  if (manifest.hooks && Array.isArray(manifest.hooks)) {
    manifest.hooks.forEach((hook, index) => {
      if (typeof hook === 'string') {
        if (!VALID_HOOKS.includes(hook)) {
          warnings.push(`Unknown hook '${hook}' at index ${index}`);
        }
      } else if (typeof hook === 'object' && hook.event) {
        if (!VALID_HOOKS.includes(hook.event)) {
          warnings.push(`Unknown hook event '${hook.event}' at index ${index}`);
        }
      } else {
        errors.push(`Invalid hook definition at index ${index}`);
      }
    });
  }

  // Validate permissions
  if (manifest.permissions && Array.isArray(manifest.permissions)) {
    manifest.permissions.forEach((perm) => {
      if (!VALID_PERMISSIONS.includes(perm)) {
        errors.push(`Unknown permission: '${perm}'`);
      }
    });

    // Warn about dangerous permissions
    if (manifest.permissions.includes('eval')) {
      warnings.push("Plugin requests 'eval' permission - this is potentially dangerous");
    }
    if (manifest.permissions.includes('dom')) {
      warnings.push("Plugin requests 'dom' permission - direct DOM access may affect stability");
    }
  }

  // Validate main entry point
  if (manifest.main) {
    // Prevent directory traversal
    if (manifest.main.includes('..') || manifest.main.startsWith('/')) {
      errors.push(`Invalid main entry point: '${manifest.main}' (no directory traversal allowed)`);
    }
    // Must be a .js file
    if (!manifest.main.endsWith('.js') && !manifest.main.endsWith('.mjs')) {
      warnings.push(`Main entry point '${manifest.main}' should be a .js or .mjs file`);
    }
  }

  // Validate settings schema if present
  if (manifest.settings && typeof manifest.settings === 'object') {
    if (!manifest.settings.schema || typeof manifest.settings.schema !== 'object') {
      warnings.push('Settings object should have a schema property');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate plugin code for security issues
 * @param {string} code - Plugin source code
 * @param {string[]} permissions - Granted permissions
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateCode(code, permissions = []) {
  const errors = [];
  const warnings = [];

  if (!code || typeof code !== 'string') {
    return { valid: false, errors: ['Code is not a valid string'], warnings: [] };
  }

  // Check for dangerous patterns
  DANGEROUS_PATTERNS.forEach((pattern) => {
    if (pattern.test(code)) {
      // Some patterns are allowed with specific permissions
      const patternStr = pattern.source;

      if (patternStr.includes('eval') || patternStr.includes('Function')) {
        if (!permissions.includes('eval')) {
          errors.push(`Code contains eval-like pattern without 'eval' permission: ${patternStr}`);
        } else {
          warnings.push(`Code uses eval-like pattern: ${patternStr}`);
        }
      } else if (patternStr.includes('innerHTML') || patternStr.includes('outerHTML') || patternStr.includes('document.write')) {
        if (!permissions.includes('dom')) {
          errors.push(`Code contains DOM manipulation pattern without 'dom' permission: ${patternStr}`);
        } else {
          warnings.push(`Code uses DOM manipulation: ${patternStr}`);
        }
      } else if (patternStr.includes('localStorage') || patternStr.includes('indexedDB')) {
        if (!permissions.includes('storage')) {
          errors.push(`Code contains storage pattern without 'storage' permission: ${patternStr}`);
        }
      } else {
        // Dangerous patterns that are never allowed
        errors.push(`Code contains potentially dangerous pattern: ${patternStr}`);
      }
    }
  });

  // Check file size (max 500KB per file)
  const MAX_FILE_SIZE = 500 * 1024;
  if (code.length > MAX_FILE_SIZE) {
    errors.push(`Code file too large: ${(code.length / 1024).toFixed(0)}KB (max 500KB)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate plugin file structure
 * @param {Object} files - Map of file paths to content
 * @param {Object} manifest - Parsed plugin.json
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateFiles(files, manifest) {
  const errors = [];
  const warnings = [];

  if (!files || typeof files !== 'object') {
    return { valid: false, errors: ['Files object is not valid'], warnings: [] };
  }

  // Check main entry file exists
  const mainFile = manifest.main || 'index.js';
  if (!files[mainFile]) {
    errors.push(`Missing main entry file: ${mainFile}`);
  }

  // Validate total package size (max 2MB)
  const MAX_PACKAGE_SIZE = 2 * 1024 * 1024;
  const totalSize = Object.values(files).reduce((sum, content) => {
    return sum + (typeof content === 'string' ? content.length : 0);
  }, 0);

  if (totalSize > MAX_PACKAGE_SIZE) {
    errors.push(`Package too large: ${(totalSize / 1024 / 1024).toFixed(1)}MB (max 2MB)`);
  }

  // Validate each file
  for (const [path, content] of Object.entries(files)) {
    // Check for directory traversal
    if (path.includes('..') || path.startsWith('/')) {
      errors.push(`Invalid file path: ${path} (no directory traversal allowed)`);
    }

    // Validate code files
    if (path.endsWith('.js') || path.endsWith('.mjs')) {
      const codeValidation = validateCode(content, manifest.permissions || []);
      errors.push(...codeValidation.errors.map(e => `${path}: ${e}`));
      warnings.push(...codeValidation.warnings.map(w => `${path}: ${w}`));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate complete plugin package
 * @param {Object} manifest - Parsed plugin.json
 * @param {Object} files - Map of file paths to content
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export function validatePlugin(manifest, files) {
  const manifestValidation = validateManifest(manifest);

  // Only validate files if manifest is valid
  let filesValidation = { valid: true, errors: [], warnings: [] };
  if (manifestValidation.valid) {
    filesValidation = validateFiles(files, manifest);
  }

  return {
    valid: manifestValidation.valid && filesValidation.valid,
    errors: [...manifestValidation.errors, ...filesValidation.errors],
    warnings: [...manifestValidation.warnings, ...filesValidation.warnings]
  };
}

/**
 * Normalize manifest with defaults
 * @param {Object} manifest - Raw manifest object
 * @returns {Object} Manifest with all defaults applied
 */
export function normalizeManifest(manifest) {
  const normalized = { ...manifest };

  // Apply defaults from schema
  for (const [field, schema] of Object.entries(MANIFEST_SCHEMA)) {
    if (normalized[field] === undefined && schema.default !== undefined) {
      normalized[field] = schema.default;
    }
  }

  return normalized;
}
