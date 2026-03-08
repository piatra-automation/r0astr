/**
 * Escape a string for safe insertion into HTML.
 * Replaces &, <, >, ", and ' with their HTML entity equivalents.
 * @param {string} str - Untrusted string
 * @returns {string} Escaped string safe for innerHTML
 */
export function escapeHtml(str) {
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
