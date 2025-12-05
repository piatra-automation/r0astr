/**
 * Snippet Manager
 * Handles loading and managing external snippet libraries
 * Story 4.6: Integration Settings Controls
 *
 * Expected JSON Schema:
 * {
 *   "snippets": {
 *     "CategoryName": {
 *       "type": "folder",
 *       "children": {
 *         "SubCategory": {
 *           "type": "folder",
 *           "children": { ... }
 *         },
 *         "SnippetName": {
 *           "type": "snippet",
 *           "name": "Display Name",
 *           "text": "code content here"
 *         }
 *       }
 *     }
 *   }
 * }
 */

/**
 * Snippet Library Parser
 * Handles hierarchical snippet structure with folders and snippets
 */
class SnippetLibrary {
  constructor(jsonData) {
    this.data = jsonData;
    this.flatSnippets = this.flattenSnippets();
  }

  // Parse the hierarchical structure into a flat map for quick access
  flattenSnippets(obj = this.data.snippets, path = [], result = {}) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key];

      if (value.type === 'snippet') {
        result[currentPath.join('/')] = {
          name: value.name,
          text: value.text,
          path: currentPath
        };
      } else if (value.type === 'folder' && value.children) {
        this.flattenSnippets(value.children, currentPath, result);
      }
    }
    return result;
  }

  // Generate menu structure for rendering
  generateMenuStructure(obj = this.data.snippets, path = []) {
    const menu = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value.type === 'folder') {
        menu.push({
          type: 'folder',
          label: key,
          path: [...path, key],
          children: this.generateMenuStructure(value.children, [...path, key])
        });
      } else if (value.type === 'snippet') {
        menu.push({
          type: 'snippet',
          label: value.name,
          path: [...path, key],
          text: value.text
        });
      }
    }

    return menu;
  }

  // Search snippets by name or path
  searchSnippets(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const [path, snippet] of Object.entries(this.flatSnippets)) {
      if (snippet.name.toLowerCase().includes(lowerQuery) ||
          path.toLowerCase().includes(lowerQuery)) {
        results.push({
          ...snippet,
          fullPath: path
        });
      }
    }

    return results;
  }

  // Get snippet by path
  getSnippet(path) {
    return this.flatSnippets[path];
  }

  // Get all snippets in a folder
  getSnippetsInFolder(folderPath) {
    const results = [];
    const folderPrefix = folderPath + '/';

    for (const [path, snippet] of Object.entries(this.flatSnippets)) {
      if (path.startsWith(folderPrefix)) {
        results.push({
          ...snippet,
          fullPath: path
        });
      }
    }

    return results;
  }

  // Get total snippet count
  getSnippetCount() {
    return Object.keys(this.flatSnippets).length;
  }
}

/**
 * Load snippets from external URL (GitHub raw, etc.)
 * @param {string} url - URL to snippet JSON file (HTTP/HTTPS only)
 * @returns {Promise<SnippetLibrary|null>} Loaded snippet library or null on error
 */
export async function loadSnippets(url) {
  if (!url) {
    console.log('No snippet URL provided');
    return null;
  }

  try {
    console.log('Loading snippets from URL:', url);

    // Try direct fetch first
    let response;
    let usedProxy = false;

    try {
      response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // If direct fetch fails (likely CORS), try with CORS proxy
      console.warn('Direct fetch failed, trying CORS proxy...', error.message);
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      console.log('Using CORS proxy:', proxyUrl);

      response = await fetch(proxyUrl);
      usedProxy = true;

      if (!response.ok) {
        throw new Error(`Proxy fetch failed: HTTP ${response.status}: ${response.statusText}`);
      }
    }

    if (usedProxy) {
      console.log('✓ Loaded via CORS proxy');
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
      console.warn('Response may not be JSON. Content-Type:', contentType);
    }

    const jsonData = await response.json();

    // Validate snippet format
    if (!jsonData.snippets || typeof jsonData.snippets !== 'object') {
      throw new Error('Invalid snippet format. Expected { "snippets": { ... } }');
    }

    // Create snippet library instance
    const library = new SnippetLibrary(jsonData);

    // Store in global state
    window.snippetLibrary = library;
    window.snippets = library.flatSnippets; // Backward compatibility

    console.log('✓ Snippets loaded successfully:', library.getSnippetCount(), 'items');
    console.log('  Menu structure:', library.generateMenuStructure());

    // Optional: Trigger UI update (snippet menu, autocomplete, etc.)
    if (typeof window.renderSnippetMenu === 'function') {
      window.renderSnippetMenu(library.generateMenuStructure());
    }

    return library;
  } catch (error) {
    console.error('Failed to load snippets:', error);
    // Non-blocking error notification instead of alert
    // Alert would stop audio playback in live coding environment
    console.warn(`❌ Snippet loading failed: ${error.message}`);
    console.warn(`   URL: ${url}`);
    console.warn(`   Make sure the URL points to a valid JSON file with the correct schema.`);

    // Show visual notification instead of blocking alert
    showSnippetErrorNotification(`Failed to load snippets: ${error.message}`);

    return null;
  }
}

/**
 * Show non-blocking error notification for snippet loading failures
 * Uses console warnings instead of blocking alert() to prevent audio interruption
 * @param {string} message - Error message to display
 */
function showSnippetErrorNotification(message) {
  // Create a temporary toast notification instead of blocking alert
  const toast = document.createElement('div');
  toast.className = 'snippet-error-toast';
  toast.textContent = `⚠️ ${message}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(239, 68, 68, 0.95);
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  `;

  // Add slide-in animation
  const style = document.createElement('style');
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

  document.body.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease-out';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 300);
  }, 5000);
}

/**
 * Clear currently loaded snippets
 */
export function clearSnippets() {
  window.snippets = [];
  console.log('Snippets cleared');
}
