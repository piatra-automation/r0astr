/**
 * Plugin Validator
 *
 * Validates plugin packages before import:
 * - Checks manifest schema (plugin.json)
 * - Verifies required files exist
 * - Validates permissions and dependencies
 * - Ensures version compatibility
 */

/**
 * Semver regex pattern for version validation
 */
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Semver range pattern for compatibility validation
 */
const SEMVER_RANGE_PATTERN = /^(\^|~|>=?|<=?|=)?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Valid permissions that plugins can request
 */
export const VALID_PERMISSIONS = [
  'panels:read',       // Read panel state and patterns
  'panels:write',      // Update panel patterns
  'panels:control',    // Start/stop panels
  'playback:read',     // Read playback state (tempo, transport)
  'playback:control',  // Control playback (tempo, stop-all)
  'state:read',        // Read full application state
  'sliders:read',      // Read slider values
  'sliders:write',     // Update slider values
  'events:subscribe',  // Subscribe to real-time events
  'storage:read',      // Read plugin storage
  'storage:write'      // Write to plugin storage
];

/**
 * Required manifest fields and their types
 */
const MANIFEST_SCHEMA = {
  // Required metadata
  name: { type: 'string', required: true },
  version: { type: 'string', required: true },
  author: { type: 'string', required: true },
  description: { type: 'string', required: true },

  // Entry points
  main: { type: 'string', required: true },

  // Optional metadata
  homepage: { type: 'string', required: false },
  repository: { type: 'string', required: false },
  license: { type: 'string', required: false },
  keywords: { type: 'array', required: false },

  // Plugin configuration
  permissions: { type: 'array', required: false },
  dependencies: { type: 'object', required: false },
  entryPoints: { type: 'object', required: false },

  // Compatibility
  r0astrVersion: { type: 'string', required: false },
  engines: { type: 'object', required: false }
};

/**
 * Current manifest schema version for versioning support
 */
export const MANIFEST_SCHEMA_VERSION = '1.0.0';

/**
 * Validate a semver version string
 * @param {string} version - Version string to validate
 * @returns {boolean} Whether the version is valid
 */
export function isValidSemver(version) {
  return SEMVER_PATTERN.test(version);
}

/**
 * Validate a semver range string (e.g., "^1.0.0", ">=2.0.0")
 * @param {string} range - Version range to validate
 * @returns {boolean} Whether the range is valid
 */
export function isValidSemverRange(range) {
  // Handle special cases
  if (range === '*' || range === 'latest') return true;

  // Handle || ranges (e.g., ">=1.0.0 <2.0.0 || >=3.0.0")
  const parts = range.split(/\s*\|\|\s*/);
  return parts.every(part => {
    // Handle space-separated ranges (e.g., ">=1.0.0 <2.0.0")
    const subParts = part.trim().split(/\s+/);
    return subParts.every(subPart => SEMVER_RANGE_PATTERN.test(subPart.trim()));
  });
}

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

  // Check required and optional fields
  for (const [field, schema] of Object.entries(MANIFEST_SCHEMA)) {
    const value = manifest[field];

    // Check required fields
    if (schema.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    // Skip validation if field is not present and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Check type
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== schema.type) {
      errors.push(`Field '${field}' should be ${schema.type}, got ${actualType}`);
    }
  }

  // Validate name format (npm-style naming)
  if (manifest.name) {
    if (!/^[a-z0-9]([a-z0-9-._]*[a-z0-9])?$/.test(manifest.name)) {
      errors.push(`Invalid plugin name: '${manifest.name}' (must be lowercase, start/end with alphanumeric, may contain - . _)`);
    }
    if (manifest.name.length > 214) {
      errors.push(`Plugin name too long: ${manifest.name.length} characters (max 214)`);
    }
  }

  // Validate version format (semver)
  if (manifest.version && !isValidSemver(manifest.version)) {
    errors.push(`Invalid version format: '${manifest.version}' (must be valid semver, e.g., '1.0.0')`);
  }

  // Validate main entry point
  if (manifest.main) {
    if (manifest.main.includes('..') || manifest.main.startsWith('/')) {
      errors.push(`Invalid main entry point: '${manifest.main}' (no directory traversal or absolute paths allowed)`);
    }
    if (!manifest.main.endsWith('.js') && !manifest.main.endsWith('.mjs')) {
      warnings.push(`Main entry point '${manifest.main}' should end with .js or .mjs`);
    }
  }

  // Validate permissions
  if (manifest.permissions) {
    if (!Array.isArray(manifest.permissions)) {
      errors.push('Permissions must be an array');
    } else {
      manifest.permissions.forEach((permission, index) => {
        if (typeof permission !== 'string') {
          errors.push(`Permission at index ${index} must be a string`);
        } else if (!VALID_PERMISSIONS.includes(permission)) {
          errors.push(`Invalid permission: '${permission}'. Valid permissions: ${VALID_PERMISSIONS.join(', ')}`);
        }
      });

      // Check for duplicate permissions
      const uniquePermissions = new Set(manifest.permissions);
      if (uniquePermissions.size !== manifest.permissions.length) {
        warnings.push('Duplicate permissions detected');
      }
    }
  }

  // Validate dependencies
  if (manifest.dependencies) {
    if (typeof manifest.dependencies !== 'object' || Array.isArray(manifest.dependencies)) {
      errors.push('Dependencies must be an object');
    } else {
      for (const [depName, depVersion] of Object.entries(manifest.dependencies)) {
        if (typeof depVersion !== 'string') {
          errors.push(`Dependency '${depName}' version must be a string`);
        } else if (!isValidSemverRange(depVersion)) {
          errors.push(`Invalid version range for dependency '${depName}': '${depVersion}'`);
        }
      }
    }
  }

  // Validate entryPoints
  if (manifest.entryPoints) {
    if (typeof manifest.entryPoints !== 'object' || Array.isArray(manifest.entryPoints)) {
      errors.push('Entry points must be an object');
    } else {
      const validEntryPointTypes = ['main', 'cli', 'worker', 'browser'];
      for (const [entryType, entryPath] of Object.entries(manifest.entryPoints)) {
        if (!validEntryPointTypes.includes(entryType)) {
          warnings.push(`Unknown entry point type: '${entryType}'`);
        }
        if (typeof entryPath !== 'string') {
          errors.push(`Entry point '${entryType}' must be a string path`);
        } else if (entryPath.includes('..') || entryPath.startsWith('/')) {
          errors.push(`Invalid entry point path: '${entryPath}' (no directory traversal or absolute paths allowed)`);
        }
      }
    }
  }

  // Validate r0astrVersion compatibility
  if (manifest.r0astrVersion) {
    if (!isValidSemverRange(manifest.r0astrVersion)) {
      errors.push(`Invalid r0astrVersion range: '${manifest.r0astrVersion}'`);
    }
  }

  // Validate engines
  if (manifest.engines) {
    if (typeof manifest.engines !== 'object' || Array.isArray(manifest.engines)) {
      errors.push('Engines must be an object');
    } else {
      for (const [engine, version] of Object.entries(manifest.engines)) {
        if (typeof version !== 'string') {
          errors.push(`Engine '${engine}' version must be a string`);
        } else if (!isValidSemverRange(version)) {
          errors.push(`Invalid version range for engine '${engine}': '${version}'`);
        }
      }
    }
  }

  // Validate homepage URL if present
  if (manifest.homepage) {
    try {
      new URL(manifest.homepage);
    } catch {
      errors.push(`Invalid homepage URL: '${manifest.homepage}'`);
    }
  }

  // Validate repository URL if present
  if (manifest.repository) {
    if (typeof manifest.repository === 'string') {
      // Allow shorthand formats like "github:user/repo"
      if (!manifest.repository.startsWith('github:') &&
          !manifest.repository.startsWith('gitlab:') &&
          !manifest.repository.startsWith('bitbucket:')) {
        try {
          new URL(manifest.repository);
        } catch {
          errors.push(`Invalid repository URL: '${manifest.repository}'`);
        }
      }
    }
  }

  // Validate keywords
  if (manifest.keywords) {
    if (!Array.isArray(manifest.keywords)) {
      errors.push('Keywords must be an array');
    } else {
      manifest.keywords.forEach((keyword, index) => {
        if (typeof keyword !== 'string') {
          errors.push(`Keyword at index ${index} must be a string`);
        }
      });
    }
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

  // Check main entry point exists
  if (manifest.main && !files[manifest.main]) {
    errors.push(`Missing main entry point file: ${manifest.main}`);
  }

  // Check additional entry points exist
  if (manifest.entryPoints) {
    for (const [entryType, entryPath] of Object.entries(manifest.entryPoints)) {
      if (!files[entryPath]) {
        errors.push(`Missing entry point file for '${entryType}': ${entryPath}`);
      }
    }
  }

  // Check for README
  const hasReadme = Object.keys(files).some(path =>
    path.toLowerCase() === 'readme.md' || path.toLowerCase() === 'readme.txt'
  );
  if (!hasReadme) {
    warnings.push('Plugin should include a README.md file');
  }

  // Check for LICENSE
  const hasLicense = Object.keys(files).some(path =>
    path.toLowerCase() === 'license' ||
    path.toLowerCase() === 'license.md' ||
    path.toLowerCase() === 'license.txt'
  );
  if (!hasLicense) {
    warnings.push('Plugin should include a LICENSE file');
  }

  // Validate file sizes (prevent bloat)
  const MAX_FILE_SIZE = 1024 * 1024; // 1MB per file
  for (const [path, content] of Object.entries(files)) {
    const size = typeof content === 'string' ? content.length : content.byteLength || 0;
    if (size > MAX_FILE_SIZE) {
      errors.push(`File too large: ${path} (${(size / 1024).toFixed(0)}KB > 1MB)`);
    }
  }

  // Check total package size
  const totalSize = Object.values(files).reduce((sum, content) => {
    const size = typeof content === 'string' ? content.length : content.byteLength || 0;
    return sum + size;
  }, 0);
  const MAX_PACKAGE_SIZE = 10 * 1024 * 1024; // 10MB total
  if (totalSize > MAX_PACKAGE_SIZE) {
    errors.push(`Package too large: ${(totalSize / 1024 / 1024).toFixed(1)}MB > 10MB`);
  }

  // Check for potentially dangerous files
  const dangerousPatterns = ['.env', 'credentials', 'secrets', '.pem', '.key'];
  for (const path of Object.keys(files)) {
    const lowerPath = path.toLowerCase();
    if (dangerousPatterns.some(pattern => lowerPath.includes(pattern))) {
      warnings.push(`Potentially sensitive file detected: ${path}`);
    }
  }

  // Prevent directory traversal in file paths
  for (const path of Object.keys(files)) {
    if (path.includes('..') || path.startsWith('/')) {
      errors.push(`Invalid file path: ${path} (no directory traversal or absolute paths allowed)`);
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
  const filesValidation = validateFiles(files, manifest);

  return {
    valid: manifestValidation.valid && filesValidation.valid,
    errors: [...manifestValidation.errors, ...filesValidation.errors],
    warnings: [...manifestValidation.warnings, ...filesValidation.warnings]
  };
}

/**
 * Generate a plugin.json template
 * @param {Object} options - Template options
 * @returns {Object} Plugin manifest template
 */
export function generateManifestTemplate(options = {}) {
  return {
    name: options.name || 'my-r0astr-plugin',
    version: options.version || '1.0.0',
    author: options.author || '',
    description: options.description || 'A r0astr plugin',
    main: options.main || 'src/index.js',
    homepage: options.homepage || '',
    repository: options.repository || '',
    license: options.license || 'MIT',
    keywords: options.keywords || ['r0astr', 'plugin'],
    permissions: options.permissions || ['panels:read', 'events:subscribe'],
    dependencies: options.dependencies || {},
    entryPoints: {
      main: options.main || 'src/index.js',
      ...options.entryPoints
    },
    r0astrVersion: options.r0astrVersion || '^0.10.0',
    engines: {
      node: '>=18.0.0',
      ...options.engines
    }
  };
}

/**
 * Get the schema definition for documentation/introspection
 * @returns {Object} Schema definition with descriptions
 */
export function getSchemaDefinition() {
  return {
    version: MANIFEST_SCHEMA_VERSION,
    fields: {
      name: {
        type: 'string',
        required: true,
        description: 'Plugin name (lowercase, npm-style naming)'
      },
      version: {
        type: 'string',
        required: true,
        description: 'Semantic version (e.g., "1.0.0")'
      },
      author: {
        type: 'string',
        required: true,
        description: 'Plugin author name or email'
      },
      description: {
        type: 'string',
        required: true,
        description: 'Brief description of what the plugin does'
      },
      main: {
        type: 'string',
        required: true,
        description: 'Path to the main entry point file'
      },
      homepage: {
        type: 'string',
        required: false,
        description: 'URL to plugin homepage or documentation'
      },
      repository: {
        type: 'string',
        required: false,
        description: 'URL to source code repository'
      },
      license: {
        type: 'string',
        required: false,
        description: 'SPDX license identifier'
      },
      keywords: {
        type: 'array',
        required: false,
        description: 'Keywords for discoverability'
      },
      permissions: {
        type: 'array',
        required: false,
        description: 'Required permissions for the plugin',
        validValues: VALID_PERMISSIONS
      },
      dependencies: {
        type: 'object',
        required: false,
        description: 'npm dependencies required by the plugin'
      },
      entryPoints: {
        type: 'object',
        required: false,
        description: 'Additional entry points (cli, worker, browser)',
        validKeys: ['main', 'cli', 'worker', 'browser']
      },
      r0astrVersion: {
        type: 'string',
        required: false,
        description: 'Compatible r0astr version range'
      },
      engines: {
        type: 'object',
        required: false,
        description: 'Required runtime versions (e.g., node: ">=18.0.0")'
      }
    },
    validPermissions: VALID_PERMISSIONS
  };
}
