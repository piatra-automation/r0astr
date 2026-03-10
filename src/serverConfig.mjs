/**
 * Server-side configuration for r0astr
 *
 * Manages server.config.json — stores CORS and API key settings.
 * This runs in Node.js (Vite plugin context), not in the browser.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, '..', 'server.config.json');

const DEFAULT_CONFIG = {
  cors: {
    allowedOrigins: ['*'],
  },
  auth: {
    apiKey: '',
  },
};

let config = null;

function loadConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      const raw = readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      // Merge with defaults to fill any missing keys
      config = {
        cors: { ...DEFAULT_CONFIG.cors, ...parsed.cors },
        auth: { ...DEFAULT_CONFIG.auth, ...parsed.auth },
      };
    } else {
      config = structuredClone(DEFAULT_CONFIG);
    }
  } catch (err) {
    console.error('[ServerConfig] Failed to load config, using defaults:', err.message);
    config = structuredClone(DEFAULT_CONFIG);
  }
  return config;
}

// Load on module init
loadConfig();

export function getServerConfig() {
  return config;
}

export function saveServerConfig(newConfig) {
  // Validate and sanitize
  const sanitized = {
    cors: {
      allowedOrigins: Array.isArray(newConfig?.cors?.allowedOrigins)
        ? newConfig.cors.allowedOrigins.filter((o) => typeof o === 'string' && o.length > 0)
        : ['*'],
    },
    auth: {
      // __KEEP__ sentinel = preserve existing key
      apiKey:
        newConfig?.auth?.apiKey === '__KEEP__'
          ? config?.auth?.apiKey || ''
          : typeof newConfig?.auth?.apiKey === 'string'
            ? newConfig.auth.apiKey
            : '',
    },
  };

  // Ensure at least ['*'] if empty
  if (sanitized.cors.allowedOrigins.length === 0) {
    sanitized.cors.allowedOrigins = ['*'];
  }

  writeFileSync(CONFIG_PATH, JSON.stringify(sanitized, null, 2) + '\n', 'utf-8');
  config = sanitized;
  console.log('[ServerConfig] Config saved to', CONFIG_PATH);
  return config;
}

export function isAuthRequired() {
  return !!config?.auth?.apiKey;
}

export function validateApiKey(key) {
  if (!isAuthRequired()) return true;
  return key === config.auth.apiKey;
}

export function isLocalhost(req) {
  const addr = req.socket?.remoteAddress || req.connection?.remoteAddress || '';
  return addr === '127.0.0.1' || addr === '::1' || addr === '::ffff:127.0.0.1';
}
