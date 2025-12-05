/**
 * Snippet Insertion Modal
 * Keyboard-navigable hierarchical snippet menu
 *
 * Keyboard shortcuts:
 * - Cmd+Option+N: Open modal
 * - ESC: Close modal
 * - Up/Down: Navigate items
 * - Right: Expand folder / Insert snippet
 * - Left: Collapse folder
 * - Enter: Insert snippet or toggle folder
 */

let currentPanelId = null;
let currentView = null;
let selectedIndex = 0;
let expandedFolders = new Set();
let flatMenuItems = []; // Flattened list for navigation

/**
 * Open snippet modal for a specific panel
 * @param {string} panelId - Panel ID to insert snippet into
 * @param {EditorView} view - CodeMirror EditorView instance
 */
export function openSnippetModal(panelId, view) {
  if (!window.snippetLibrary) {
    // Non-blocking notification instead of alert to prevent audio interruption
    console.warn('⚠️ No snippets loaded');
    console.info('💡 Set a snippet URL in Settings to enable snippet insertion');

    // Show toast notification
    showSnippetNotification('No snippets loaded. Set snippet URL in Settings.', 'warning');
    return;
  }

  currentPanelId = panelId;
  currentView = view;
  selectedIndex = 0;
  expandedFolders.clear();

  // Create modal (returns backdrop)
  const backdrop = createModalElement();
  document.body.appendChild(backdrop);

  // Render menu
  renderMenu();

  // Focus modal (not backdrop) for keyboard events
  const modal = document.getElementById('snippet-modal');
  if (modal) {
    modal.focus();
  }

  console.log('[Snippet Modal] Opened for panel:', panelId);
}

/**
 * Close snippet modal
 */
export function closeSnippetModal() {
  const backdrop = document.getElementById('snippet-modal-backdrop');
  if (backdrop) {
    backdrop.remove();
    currentPanelId = null;
    currentView = null;
    flatMenuItems = [];
    console.log('[Snippet Modal] Closed');
  }
}

/**
 * Create modal DOM element
 */
function createModalElement() {
  // Create backdrop overlay
  const backdrop = document.createElement('div');
  backdrop.id = 'snippet-modal-backdrop';
  backdrop.className = 'snippet-modal-backdrop';

  // Create modal content box
  const modal = document.createElement('div');
  modal.id = 'snippet-modal';
  modal.className = 'snippet-modal';
  modal.tabIndex = 0; // Make focusable for keyboard events

  modal.innerHTML = `
    <div class="snippet-modal-header">
      <h3>Insert Snippet</h3>
      <div class="snippet-modal-shortcuts">
        <span>↑↓ Navigate</span>
        <span>→ Expand/Insert</span>
        <span>← Collapse</span>
        <span>ESC Close</span>
      </div>
    </div>
    <div class="snippet-menu-container" id="snippet-menu-container"></div>
  `;

  // Keyboard navigation
  modal.addEventListener('keydown', handleKeyDown);

  // Append modal to backdrop
  backdrop.appendChild(modal);

  // Close on click outside modal (on backdrop)
  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) {
      e.preventDefault();
      e.stopPropagation();
      closeSnippetModal();
    }
  });

  return backdrop;
}

/**
 * Handle keyboard navigation
 */
function handleKeyDown(e) {
  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      closeSnippetModal();
      break;

    case 'ArrowDown':
      e.preventDefault();
      navigateDown();
      break;

    case 'ArrowUp':
      e.preventDefault();
      navigateUp();
      break;

    case 'ArrowRight':
      e.preventDefault();
      handleRight();
      break;

    case 'ArrowLeft':
      e.preventDefault();
      handleLeft();
      break;

    case 'Enter':
      e.preventDefault();
      handleEnter();
      break;
  }
}

/**
 * Navigate down in menu
 */
function navigateDown() {
  if (selectedIndex < flatMenuItems.length - 1) {
    selectedIndex++;
    updateSelection();
  }
}

/**
 * Navigate up in menu
 */
function navigateUp() {
  if (selectedIndex > 0) {
    selectedIndex--;
    updateSelection();
  }
}

/**
 * Handle right arrow (expand folder or insert snippet)
 */
function handleRight() {
  const item = flatMenuItems[selectedIndex];
  if (!item) return;

  if (item.type === 'folder') {
    // Expand folder
    const pathKey = item.path.join('/');
    if (!expandedFolders.has(pathKey)) {
      expandedFolders.add(pathKey);
      renderMenu();
    }
  } else if (item.type === 'snippet') {
    // Insert snippet with label (snippet name)
    insertSnippet(item.text, item.label);
  }
}

/**
 * Handle left arrow (collapse folder)
 */
function handleLeft() {
  const item = flatMenuItems[selectedIndex];
  if (!item) return;

  if (item.type === 'folder') {
    // Collapse folder
    const pathKey = item.path.join('/');
    if (expandedFolders.has(pathKey)) {
      expandedFolders.delete(pathKey);
      renderMenu();
    }
  }
}

/**
 * Handle enter key (toggle folder or insert snippet)
 */
function handleEnter() {
  const item = flatMenuItems[selectedIndex];
  if (!item) return;

  if (item.type === 'folder') {
    // Toggle folder
    const pathKey = item.path.join('/');
    if (expandedFolders.has(pathKey)) {
      expandedFolders.delete(pathKey);
    } else {
      expandedFolders.add(pathKey);
    }
    renderMenu();
  } else if (item.type === 'snippet') {
    // Insert snippet with label (snippet name)
    insertSnippet(item.text, item.label);
  }
}

/**
 * Update selected item visual state
 */
function updateSelection() {
  const items = document.querySelectorAll('.snippet-menu-item');
  items.forEach((item, index) => {
    if (index === selectedIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      item.classList.remove('selected');
    }
  });
}

/**
 * Render menu with current expansion state
 */
function renderMenu() {
  const container = document.getElementById('snippet-menu-container');
  if (!container) return;

  // Clear container
  container.innerHTML = '';

  // Get menu structure
  const menuStructure = window.snippetLibrary.generateMenuStructure();

  // Flatten menu for keyboard navigation
  flatMenuItems = [];

  // Render items
  renderMenuItems(menuStructure, container, 0);

  // Update selection
  updateSelection();
}

/**
 * Recursively render menu items
 * @param {Array} items - Menu items to render
 * @param {HTMLElement} container - Container element
 * @param {number} depth - Current nesting depth
 */
function renderMenuItems(items, container, depth) {
  items.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'snippet-menu-item';
    itemEl.dataset.type = item.type;
    itemEl.style.paddingLeft = `${depth * 20 + 10}px`;

    const pathKey = item.path.join('/');
    const isExpanded = expandedFolders.has(pathKey);

    if (item.type === 'folder') {
      itemEl.innerHTML = `
        <span class="folder-icon">${isExpanded ? '▼' : '▶'}</span>
        <span class="folder-label">${item.label}</span>
        <span class="item-count">(${item.children.length})</span>
      `;
    } else {
      itemEl.innerHTML = `
        <span class="snippet-icon">📄</span>
        <span class="snippet-label">${item.label}</span>
      `;
    }

    // Add to flat list for navigation
    const itemIndex = flatMenuItems.length;
    flatMenuItems.push(item);

    // Mouse click handlers
    itemEl.addEventListener('click', () => {
      selectedIndex = itemIndex;
      updateSelection();

      if (item.type === 'folder') {
        // Toggle folder on click
        if (expandedFolders.has(pathKey)) {
          expandedFolders.delete(pathKey);
        } else {
          expandedFolders.add(pathKey);
        }
        renderMenu();
      } else {
        // Insert snippet on click
        insertSnippet(item.text);
      }
    });

    // Mouse hover handler
    itemEl.addEventListener('mouseenter', () => {
      selectedIndex = itemIndex;
      updateSelection();
    });

    container.appendChild(itemEl);

    // Render children if folder is expanded
    if (item.type === 'folder' && isExpanded && item.children) {
      renderMenuItems(item.children, container, depth + 1);
    }
  });
}

/**
 * Insert snippet - replaces entire panel content
 * @param {string} text - Snippet text to insert
 */
function insertSnippet(text, snippetName) {
  if (!currentView) {
    console.error('[Snippet Modal] No editor view available');
    return;
  }

  // Save view reference and panelId before closing modal (closeSnippetModal sets currentView = null)
  const view = currentView;
  const panelId = currentPanelId;

  // Replace entire content
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: text }
  });

  console.log('[Snippet Modal] Replaced panel content with snippet');

  // Update panel title with snippet name
  console.log(`[Snippet Modal DEBUG] panelId: ${panelId}, snippetName: ${snippetName}`);
  if (panelId && snippetName) {
    import('../managers/panelManager.js').then(({ updatePanelTitle }) => {
      const success = updatePanelTitle(panelId, snippetName);
      console.log(`[Snippet Modal] Updated panel ${panelId} title to: ${snippetName}, success: ${success}`);
    });
  } else {
    console.warn(`[Snippet Modal] Missing panelId or snippetName - cannot update title`);
  }

  // Close modal
  closeSnippetModal();

  // Focus editor (use saved reference)
  view.focus();
}

/**
 * Show non-blocking notification toast
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('info', 'warning', 'error', 'success')
 */
function showSnippetNotification(message, type = 'info') {
  // Color scheme based on type
  const colors = {
    info: 'rgba(59, 130, 246, 0.95)',     // Blue
    warning: 'rgba(245, 158, 11, 0.95)',  // Amber
    error: 'rgba(239, 68, 68, 0.95)',     // Red
    success: 'rgba(34, 197, 94, 0.95)'    // Green
  };

  const toast = document.createElement('div');
  toast.className = 'snippet-notification-toast';
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
    z-index: 10000;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  `;

  // Add slide-in animation if not already present
  if (!document.getElementById('snippet-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'snippet-toast-styles';
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

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease-out';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
