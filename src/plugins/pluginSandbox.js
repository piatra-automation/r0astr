/**
 * Plugin Sandbox
 *
 * Provides sandboxing primitives for secure third-party code execution.
 * Creates isolated execution contexts with controlled access to APIs.
 *
 * Security features:
 * - Permission-based API access
 * - Proxy-based property access control
 * - Timeout protection for runaway code
 * - Error containment and reporting
 */

import { eventBus } from '../utils/eventBus.js';
import { VALID_PERMISSIONS } from './pluginValidator.js';

/**
 * Default timeout for plugin code execution (milliseconds)
 * @type {number}
 */
const DEFAULT_TIMEOUT = 5000;

/**
 * Maximum timeout allowed (30 seconds)
 * @type {number}
 */
const MAX_TIMEOUT = 30000;

/**
 * Safe subset of global objects available to all plugins
 * @type {string[]}
 */
const SAFE_GLOBALS = [
  // Standard built-ins
  'Array', 'ArrayBuffer', 'Boolean', 'DataView', 'Date', 'Error',
  'Float32Array', 'Float64Array', 'Int8Array', 'Int16Array', 'Int32Array',
  'JSON', 'Map', 'Math', 'Number', 'Object', 'Promise', 'Proxy',
  'Reflect', 'RegExp', 'Set', 'String', 'Symbol', 'Uint8Array',
  'Uint16Array', 'Uint32Array', 'Uint8ClampedArray', 'WeakMap', 'WeakSet',

  // Standard functions
  'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'decodeURI',
  'decodeURIComponent', 'encodeURI', 'encodeURIComponent',

  // Console (read-only)
  'console',

  // Async utilities
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame'
];

/**
 * Create a frozen read-only console for plugins
 * @returns {Object} Read-only console object
 */
function createPluginConsole(pluginName) {
  const prefix = `[Plugin:${pluginName}]`;

  return Object.freeze({
    log: (...args) => console.log(prefix, ...args),
    info: (...args) => console.info(prefix, ...args),
    warn: (...args) => console.warn(prefix, ...args),
    error: (...args) => console.error(prefix, ...args),
    debug: (...args) => console.debug(prefix, ...args),
    trace: (...args) => console.trace(prefix, ...args),
    group: (...args) => console.group(prefix, ...args),
    groupCollapsed: (...args) => console.groupCollapsed(prefix, ...args),
    groupEnd: () => console.groupEnd(),
    time: (label) => console.time(`${prefix} ${label}`),
    timeEnd: (label) => console.timeEnd(`${prefix} ${label}`),
    count: (label) => console.count(`${prefix} ${label}`),
    countReset: (label) => console.countReset(`${prefix} ${label}`),
    clear: () => {} // No-op to prevent clearing main console
  });
}

/**
 * Create a sandboxed storage API
 * @param {string} pluginName - Plugin identifier for namespace
 * @returns {Object} Sandboxed storage interface
 */
function createPluginStorage(pluginName) {
  const storageKey = `r0astr_plugin_${pluginName}`;

  return Object.freeze({
    get(key) {
      try {
        const data = localStorage.getItem(storageKey);
        if (!data) return undefined;
        const parsed = JSON.parse(data);
        return parsed[key];
      } catch (e) {
        console.warn(`[Plugin:${pluginName}] Storage get error:`, e);
        return undefined;
      }
    },

    set(key, value) {
      try {
        const data = localStorage.getItem(storageKey);
        const parsed = data ? JSON.parse(data) : {};
        parsed[key] = value;
        localStorage.setItem(storageKey, JSON.stringify(parsed));
        return true;
      } catch (e) {
        console.warn(`[Plugin:${pluginName}] Storage set error:`, e);
        return false;
      }
    },

    remove(key) {
      try {
        const data = localStorage.getItem(storageKey);
        if (!data) return false;
        const parsed = JSON.parse(data);
        delete parsed[key];
        localStorage.setItem(storageKey, JSON.stringify(parsed));
        return true;
      } catch (e) {
        console.warn(`[Plugin:${pluginName}] Storage remove error:`, e);
        return false;
      }
    },

    clear() {
      try {
        localStorage.removeItem(storageKey);
        return true;
      } catch (e) {
        console.warn(`[Plugin:${pluginName}] Storage clear error:`, e);
        return false;
      }
    },

    keys() {
      try {
        const data = localStorage.getItem(storageKey);
        if (!data) return [];
        return Object.keys(JSON.parse(data));
      } catch (e) {
        console.warn(`[Plugin:${pluginName}] Storage keys error:`, e);
        return [];
      }
    }
  });
}

/**
 * Create a sandboxed network API (fetch wrapper)
 * @param {string} pluginName - Plugin identifier
 * @param {string[]} allowedDomains - List of allowed domains (empty = all)
 * @returns {Object} Sandboxed fetch interface
 */
function createPluginNetwork(pluginName, allowedDomains = []) {
  return Object.freeze({
    async fetch(url, options = {}) {
      // Validate URL
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (e) {
        throw new Error(`Invalid URL: ${url}`);
      }

      // Check domain restrictions
      if (allowedDomains.length > 0) {
        const isAllowed = allowedDomains.some(domain => {
          return parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`);
        });
        if (!isAllowed) {
          throw new Error(`Domain not allowed: ${parsedUrl.hostname}`);
        }
      }

      // Prevent local file access
      if (parsedUrl.protocol === 'file:') {
        throw new Error('File protocol not allowed');
      }

      // Strip sensitive headers
      const safeOptions = { ...options };
      if (safeOptions.headers) {
        const safeHeaders = { ...safeOptions.headers };
        delete safeHeaders['Authorization'];
        delete safeHeaders['Cookie'];
        safeOptions.headers = safeHeaders;
      }

      // Log network request
      console.debug(`[Plugin:${pluginName}] Network request:`, parsedUrl.href);

      try {
        const response = await fetch(url, safeOptions);
        return response;
      } catch (e) {
        console.warn(`[Plugin:${pluginName}] Network error:`, e);
        throw e;
      }
    }
  });
}

/**
 * Create a read-only event bus interface for plugins
 * @param {string} pluginName - Plugin identifier
 * @returns {Object} Sandboxed event bus interface
 */
function createPluginEventBus(pluginName) {
  // Track plugin's listeners for cleanup
  const pluginListeners = new Map();

  return Object.freeze({
    on(event, callback) {
      // Wrap callback to catch errors
      const wrappedCallback = (data) => {
        try {
          callback(data);
        } catch (e) {
          console.error(`[Plugin:${pluginName}] Event handler error for '${event}':`, e);
        }
      };

      // Track for cleanup
      if (!pluginListeners.has(event)) {
        pluginListeners.set(event, []);
      }
      pluginListeners.get(event).push({ original: callback, wrapped: wrappedCallback });

      eventBus.on(event, wrappedCallback);
    },

    off(event, callback) {
      const listeners = pluginListeners.get(event);
      if (!listeners) return;

      const entry = listeners.find(l => l.original === callback);
      if (entry) {
        eventBus.off(event, entry.wrapped);
        const index = listeners.indexOf(entry);
        listeners.splice(index, 1);
      }
    },

    emit(event, data) {
      // Namespace plugin events
      const namespacedEvent = `plugin:${pluginName}:${event}`;
      eventBus.emit(namespacedEvent, data);
    },

    // Internal cleanup method
    _cleanup() {
      for (const [event, listeners] of pluginListeners) {
        for (const { wrapped } of listeners) {
          eventBus.off(event, wrapped);
        }
      }
      pluginListeners.clear();
    }
  });
}

/**
 * Create a sandboxed DOM API (limited access)
 * @param {string} pluginName - Plugin identifier
 * @param {HTMLElement} containerElement - Container element for plugin DOM
 * @returns {Object} Sandboxed DOM interface
 */
function createPluginDOM(pluginName, containerElement = null) {
  // Create a container for the plugin if not provided
  let container = containerElement;
  if (!container) {
    container = document.createElement('div');
    container.id = `plugin-container-${pluginName}`;
    container.className = 'plugin-container';
    container.style.display = 'none'; // Hidden by default
  }

  return Object.freeze({
    // Get plugin's container element
    getContainer() {
      return container;
    },

    // Create element within container
    createElement(tagName, options = {}) {
      const allowed = ['div', 'span', 'p', 'button', 'input', 'select', 'option',
        'label', 'form', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'canvas', 'svg'];

      if (!allowed.includes(tagName.toLowerCase())) {
        throw new Error(`Element type not allowed: ${tagName}`);
      }

      const element = document.createElement(tagName);

      // Set safe attributes
      if (options.className) element.className = options.className;
      if (options.id) element.id = `${pluginName}-${options.id}`;
      if (options.textContent) element.textContent = options.textContent;

      return element;
    },

    // Query within container only
    querySelector(selector) {
      return container.querySelector(selector);
    },

    querySelectorAll(selector) {
      return Array.from(container.querySelectorAll(selector));
    },

    // Append to container
    append(element) {
      if (element instanceof HTMLElement) {
        container.appendChild(element);
      }
    },

    // Remove from container
    remove(element) {
      if (element instanceof HTMLElement && container.contains(element)) {
        container.removeChild(element);
      }
    },

    // Show/hide container
    show() {
      container.style.display = '';
    },

    hide() {
      container.style.display = 'none';
    },

    // Clear container
    clear() {
      container.innerHTML = '';
    }
  });
}

/**
 * Plugin Sandbox class
 * Creates isolated execution context for plugin code
 */
export class PluginSandbox {
  /**
   * @param {string} pluginName - Unique plugin identifier
   * @param {string[]} permissions - List of granted permissions
   * @param {Object} options - Additional sandbox options
   */
  constructor(pluginName, permissions = [], options = {}) {
    this.pluginName = pluginName;
    this.permissions = new Set(permissions);
    this.options = options;
    this.context = null;
    this.cleanupHandlers = [];
    this.isDestroyed = false;
    this.timeouts = new Set();
    this.intervals = new Set();

    // Build sandbox context
    this._buildContext();
  }

  /**
   * Build the sandboxed execution context
   * @private
   */
  _buildContext() {
    const sandbox = this;
    const context = Object.create(null);

    // Add safe globals
    for (const name of SAFE_GLOBALS) {
      if (name === 'console') {
        context.console = createPluginConsole(this.pluginName);
      } else if (name === 'setTimeout') {
        context.setTimeout = (fn, delay, ...args) => {
          const id = setTimeout(() => {
            sandbox.timeouts.delete(id);
            try { fn(...args); } catch (e) {
              console.error(`[Plugin:${sandbox.pluginName}] setTimeout error:`, e);
            }
          }, Math.min(delay, MAX_TIMEOUT));
          sandbox.timeouts.add(id);
          return id;
        };
      } else if (name === 'clearTimeout') {
        context.clearTimeout = (id) => {
          sandbox.timeouts.delete(id);
          clearTimeout(id);
        };
      } else if (name === 'setInterval') {
        context.setInterval = (fn, delay, ...args) => {
          const id = setInterval(() => {
            try { fn(...args); } catch (e) {
              console.error(`[Plugin:${sandbox.pluginName}] setInterval error:`, e);
            }
          }, Math.max(delay, 100)); // Min 100ms interval
          sandbox.intervals.add(id);
          return id;
        };
      } else if (name === 'clearInterval') {
        context.clearInterval = (id) => {
          sandbox.intervals.delete(id);
          clearInterval(id);
        };
      } else if (typeof window !== 'undefined' && window[name] !== undefined) {
        // Copy reference to safe global
        context[name] = window[name];
      }
    }

    // Add permission-based APIs
    if (this.permissions.has('storage')) {
      context.storage = createPluginStorage(this.pluginName);
    }

    if (this.permissions.has('network')) {
      const allowedDomains = this.options.allowedDomains || [];
      context.network = createPluginNetwork(this.pluginName, allowedDomains);
    }

    if (this.permissions.has('dom')) {
      const containerElement = this.options.containerElement || null;
      context.dom = createPluginDOM(this.pluginName, containerElement);
    }

    // Always provide event bus (read-only access to app events)
    context.events = createPluginEventBus(this.pluginName);
    this.cleanupHandlers.push(() => context.events._cleanup());

    // Plugin API object
    context.plugin = Object.freeze({
      name: this.pluginName,
      permissions: Array.from(this.permissions),

      // Request additional permissions at runtime (user approval needed)
      async requestPermission(permission) {
        if (!VALID_PERMISSIONS.includes(permission)) {
          throw new Error(`Unknown permission: ${permission}`);
        }
        // Emit event for permission request (to be handled by plugin manager)
        eventBus.emit('plugin:requestPermission', {
          pluginName: sandbox.pluginName,
          permission
        });
        // Return promise that resolves when permission is granted/denied
        return new Promise((resolve) => {
          const handler = ({ pluginName, permission: perm, granted }) => {
            if (pluginName === sandbox.pluginName && perm === permission) {
              eventBus.off('plugin:permissionResponse', handler);
              if (granted) {
                sandbox.permissions.add(permission);
              }
              resolve(granted);
            }
          };
          eventBus.on('plugin:permissionResponse', handler);
        });
      }
    });

    // Freeze the context to prevent modifications
    this.context = Object.freeze(context);
  }

  /**
   * Execute code in the sandbox
   * @param {string} code - JavaScript code to execute
   * @param {Object} additionalContext - Extra variables to inject
   * @param {number} timeout - Execution timeout in ms
   * @returns {Promise<any>} Execution result
   */
  async execute(code, additionalContext = {}, timeout = DEFAULT_TIMEOUT) {
    if (this.isDestroyed) {
      throw new Error('Sandbox has been destroyed');
    }

    // Merge contexts
    const fullContext = { ...this.context, ...additionalContext };

    // Build function with context variables as parameters
    const contextKeys = Object.keys(fullContext);
    const contextValues = contextKeys.map(k => fullContext[k]);

    // Wrap code in async function to support await
    const wrappedCode = `
      'use strict';
      return (async () => {
        ${code}
      })();
    `;

    // Create function with sandboxed context
    let fn;
    try {
      fn = new Function(...contextKeys, wrappedCode);
    } catch (e) {
      throw new Error(`Plugin syntax error: ${e.message}`);
    }

    // Execute with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Plugin execution timed out after ${timeout}ms`));
      }, Math.min(timeout, MAX_TIMEOUT));
    });

    try {
      const result = await Promise.race([
        fn.apply(null, contextValues),
        timeoutPromise
      ]);
      return result;
    } catch (e) {
      console.error(`[Plugin:${this.pluginName}] Execution error:`, e);
      throw e;
    }
  }

  /**
   * Execute a module (ES module-like structure)
   * @param {string} code - Module code with exports
   * @param {Object} imports - Import bindings
   * @returns {Promise<Object>} Module exports
   */
  async executeModule(code, imports = {}) {
    if (this.isDestroyed) {
      throw new Error('Sandbox has been destroyed');
    }

    // Create exports object
    const exports = {};
    const module = { exports };

    // Execute with module/exports in context
    await this.execute(code, {
      module,
      exports,
      ...imports
    });

    // Return exports (handles both CommonJS and ES module patterns)
    return module.exports !== exports ? module.exports : exports;
  }

  /**
   * Destroy the sandbox and clean up resources
   */
  destroy() {
    if (this.isDestroyed) return;

    // Clear all timers
    for (const id of this.timeouts) {
      clearTimeout(id);
    }
    for (const id of this.intervals) {
      clearInterval(id);
    }
    this.timeouts.clear();
    this.intervals.clear();

    // Run cleanup handlers
    for (const handler of this.cleanupHandlers) {
      try {
        handler();
      } catch (e) {
        console.warn(`[Plugin:${this.pluginName}] Cleanup error:`, e);
      }
    }
    this.cleanupHandlers = [];

    this.context = null;
    this.isDestroyed = true;

    console.log(`[Plugin:${this.pluginName}] Sandbox destroyed`);
  }

  /**
   * Get the sandbox context (for inspection)
   * @returns {Object} Frozen context object
   */
  getContext() {
    return this.context;
  }
}

/**
 * Create a new plugin sandbox
 * @param {string} pluginName - Unique plugin identifier
 * @param {string[]} permissions - List of granted permissions
 * @param {Object} options - Additional options
 * @returns {PluginSandbox} New sandbox instance
 */
export function createSandbox(pluginName, permissions = [], options = {}) {
  return new PluginSandbox(pluginName, permissions, options);
}
