/**
 * Non-blocking Confirmation Modal
 * Replaces blocking confirm() dialogs to prevent audio interruption
 */

/**
 * Show confirmation modal with custom message
 * @param {string} message - Confirmation message
 * @param {Object} options - Modal options
 * @param {string} [options.confirmText='Delete'] - Confirm button text
 * @param {string} [options.cancelText='Cancel'] - Cancel button text
 * @param {string} [options.type='danger'] - Modal type (danger, warning, info)
 * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
 */
export function showConfirmModal(message, options = {}) {
  return new Promise((resolve) => {
    const {
      confirmText = 'Delete',
      cancelText = 'Cancel',
      type = 'danger'
    } = options;

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'confirm-modal-backdrop';
    backdrop.className = 'confirm-modal-backdrop';

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'confirm-modal';
    modal.className = `confirm-modal confirm-modal-${type}`;

    modal.innerHTML = `
      <div class="confirm-modal-content">
        <p class="confirm-modal-message">${message}</p>
        <div class="confirm-modal-buttons">
          <button class="confirm-modal-btn confirm-modal-cancel">${cancelText}</button>
          <button class="confirm-modal-btn confirm-modal-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Focus confirm button by default
    const confirmBtn = modal.querySelector('.confirm-modal-confirm');
    const cancelBtn = modal.querySelector('.confirm-modal-cancel');

    setTimeout(() => {
      confirmBtn.focus();
    }, 10);

    // Cleanup function
    const cleanup = () => {
      backdrop.remove();
    };

    // Confirm handler
    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    // Cancel handler
    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    // Event listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        handleCancel();
      }
    });

    // Keyboard shortcuts
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    });
  });
}
