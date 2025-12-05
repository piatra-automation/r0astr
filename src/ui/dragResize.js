/**
 * Drag and Resize Module
 * Wrapper for interact.js to handle panel drag and resize functionality
 */

import interact from 'interactjs';
import { updatePanel, bringPanelToFront } from '../managers/panelManager.js';

// Minimum panel dimensions
const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;

/**
 * Initialize resize functionality for a panel element
 * @param {HTMLElement} panelElement - Panel DOM element
 */
export function initializeResizable(panelElement) {
  interact(panelElement)
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      listeners: {
        start(event) {
          const target = event.target;
          // Disable transitions during resize for immediate feedback
          target.style.transition = 'none';
        },
        move(event) {
          const { width, height } = event.rect;
          const target = event.target;
          let { x, y } = target.dataset;

          // Parse existing position
          x = parseFloat(x) || 0;
          y = parseFloat(y) || 0;

          // Update position if edges moved
          x += event.deltaRect.left;
          y += event.deltaRect.top;

          // Update element size and position
          target.style.width = `${width}px`;
          target.style.height = `${height}px`;
          target.style.transform = `translate(${x}px, ${y}px)`;

          // Store position in dataset
          target.dataset.x = x;
          target.dataset.y = y;

          // Update panel state
          const panelId = target.id;
          updatePanel(panelId, {
            size: { w: width, h: height },
            position: { x, y }
          });
        },
        end(event) {
          const target = event.target;
          const panelId = target.id;

          // Re-enable transitions
          target.style.transition = '';

          // Save expanded position/size (resizing only happens on expanded panels)
          import('../managers/panelManager.js').then(({ saveExpandedPosition }) => {
            saveExpandedPosition(panelId);
          });
        }
      },
      modifiers: [
        interact.modifiers.restrictSize({
          min: { width: MIN_WIDTH, height: MIN_HEIGHT }
        })
      ]
    });
}

/**
 * Initialize drag functionality for a panel element
 * @param {HTMLElement} panelElement - Panel DOM element
 */
export function initializeDraggable(panelElement) {
  let draggedWhileCollapsed = false;
  let justDragged = false;

  // Prevent click events immediately after drag
  panelElement.addEventListener('click', (e) => {
    if (justDragged) {
      e.stopImmediatePropagation();
      e.preventDefault();
      justDragged = false;
    }
  }, true); // Use capture phase to intercept before other handlers

  interact(panelElement)
    .draggable({
      // Only allow dragging from panel number badge
      allowFrom: '.panel-number-badge',
      ignoreFrom: '',
      listeners: {
        start(event) {
          const target = event.target;
          const panelId = target.id;

          // Disable transitions during drag for immediate feedback
          target.style.transition = 'none';

          // Track if panel was collapsed when drag started
          const isCollapsed = target.classList.contains('panel-collapsed');
          draggedWhileCollapsed = isCollapsed;

          // Only bring to front if NOT collapsed (avoid giving focus to collapsed panels)
          if (!isCollapsed) {
            bringPanelToFront(panelId);
          }
        },
        move(event) {
          const target = event.target;
          let { x, y } = target.dataset;

          // Parse existing position
          x = parseFloat(x) || 0;
          y = parseFloat(y) || 0;

          // Update position
          x += event.dx;
          y += event.dy;

          // Apply transform
          target.style.transform = `translate(${x}px, ${y}px)`;

          // Store position in dataset
          target.dataset.x = x;
          target.dataset.y = y;

          // Update panel state
          const panelId = target.id;
          updatePanel(panelId, {
            position: { x, y }
          });
        },
        end(event) {
          const target = event.target;
          const panelId = target.id;

          // Re-enable transitions after drag
          target.style.transition = '';

          // Save position ONLY if dragged while expanded
          // Collapsed panels use algorithmic positioning, don't save drag position
          if (!draggedWhileCollapsed) {
            import('../managers/panelManager.js').then(({ saveExpandedPosition }) => {
              saveExpandedPosition(panelId);
            });
          }

          // Mark that we just dragged to suppress click event
          justDragged = true;

          // Clear the flag after a short delay (to catch the click event)
          setTimeout(() => {
            justDragged = false;
          }, 100);

          // Reset collapsed drag flag
          draggedWhileCollapsed = false;
        }
      },
      modifiers: [
        // Prevent dragging over hero section (banner bar)
        interact.modifiers.restrictRect({
          restriction: () => {
            const heroTop = 24; // Hero section starts 24px from top
            const heroHeight = 140; // Hero section height
            const heroBottom = heroTop + heroHeight;

            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            return {
              top: heroBottom, // Don't allow dragging above hero bottom
              left: 0,
              right: viewportWidth,
              bottom: viewportHeight
            };
          },
          endOnly: false
        })
      ]
    });
}

/**
 * Initialize both drag and resize for a panel
 * @param {HTMLElement} panelElement - Panel DOM element
 */
export function initializeDragAndResize(panelElement) {
  initializeResizable(panelElement);
  initializeDraggable(panelElement);
}
