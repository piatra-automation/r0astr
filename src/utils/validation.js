/**
 * Validation Utilities
 * Story 4.6: Integration Settings Controls
 */

/**
 * Validate URL format
 * @param {string} url - URL string to validate
 * @returns {boolean} True if valid URL or empty, false otherwise
 */
export function validateURL(url) {
  if (!url || url.trim() === '') {
    return true; // Empty is valid (clear setting)
  }

  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate file path
 * @param {string} path - File path to validate
 * @returns {boolean} True if valid path or empty, false otherwise
 */
export function validatePath(path) {
  if (!path || path.trim() === '') {
    return true; // Empty is valid (clear setting)
  }

  // Basic path validation (non-empty string)
  // Cannot check file existence in browser
  return typeof path === 'string' && path.length > 0;
}
