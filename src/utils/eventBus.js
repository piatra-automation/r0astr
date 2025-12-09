/**
 * Event Bus for decoupled cross-component communication
 *
 * Provides a centralized publish-subscribe pattern for components to communicate
 * without direct dependencies. Uses namespaced event names (e.g., 'panel:created').
 *
 * @example
 * import { eventBus } from './utils/eventBus.js';
 *
 * // Listen for events
 * eventBus.on('panel:created', (panel) => {
 *   console.log('Panel created:', panel.id);
 * });
 *
 * // Emit events
 * eventBus.emit('panel:created', { id: 'panel-1', code: 'note("c2")' });
 *
 * // Remove listener
 * const handler = (data) => console.log(data);
 * eventBus.on('panel:updated', handler);
 * eventBus.off('panel:updated', handler);
 */

/**
 * EventBus class for managing event listeners and emissions
 *
 * @class
 */
class EventBus {
  constructor() {
    /**
     * Map of event names to arrays of callback functions
     * @type {Map<string, Function[]>}
     */
    this.listeners = new Map();
  }

  /**
   * Register an event listener
   *
   * @param {string} event - Event name (use namespaced format: 'component:action')
   * @param {Function} callback - Callback function to invoke when event is emitted
   * @returns {void}
   *
   * @example
   * eventBus.on('panel:created', (panel) => {
   *   console.log('New panel:', panel.id);
   * });
   *
   * @example
   * eventBus.on('slider:changed', ({ id, value }) => {
   *   console.log(`Slider ${id} changed to ${value}`);
   * });
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emit an event with optional data
   *
   * Calls all registered listeners for the event with the provided data.
   * If no listeners are registered, the emission is silently ignored.
   *
   * @param {string} event - Event name to emit
   * @param {*} data - Data to pass to all listeners (can be any type)
   * @returns {void}
   *
   * @example
   * eventBus.emit('panel:created', {
   *   id: 'panel-1',
   *   code: 'note("c2 e2 g2")',
   *   playing: false
   * });
   *
   * @example
   * eventBus.emit('settings:saved', { theme: 'dark', fontSize: 14 });
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  /**
   * Remove a specific event listener
   *
   * Removes the callback from the event's listener array. The callback reference
   * must be identical to the one passed to `on()` for successful removal.
   *
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove (must be same reference)
   * @returns {void}
   *
   * @example
   * const handler = (panel) => console.log(panel.id);
   * eventBus.on('panel:deleted', handler);
   * eventBus.off('panel:deleted', handler);
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event) || [];
    this.listeners.set(event, callbacks.filter(cb => cb !== callback));
  }
}

/**
 * Singleton event bus instance
 *
 * Use this singleton for all event bus operations to ensure
 * consistent communication across the application.
 *
 * @type {EventBus}
 */
export const eventBus = new EventBus();

/**
 * Export EventBus class for testing and custom instances
 *
 * @type {typeof EventBus}
 */
export { EventBus };
