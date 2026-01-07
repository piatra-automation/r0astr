/**
 * Audio Cache Manager
 *
 * Provides IndexedDB-based caching for audio samples and soundfonts.
 * Wraps window.fetch() to intercept audio requests and serve from cache when available.
 *
 * This significantly improves startup and playback performance on slow connections
 * by caching downloaded audio files between app restarts.
 */

const DB_NAME = 'r0astr-audio-cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio-files';

// Audio file extensions and MIME types to cache
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aif', '.aiff', '.webm'];
const AUDIO_DOMAINS = [
  'strudel.b-cdn.net',
  'raw.githubusercontent.com',
  'felixroos.github.io',
  'cdn.jsdelivr.net',
  'freepats.zenvoid.org',
  'gleitz.github.io'
];

let db = null;
let cacheEnabled = true;
let cacheStats = { hits: 0, misses: 0, stored: 0 };

/**
 * Initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
async function initDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('[AudioCache] Failed to open IndexedDB:', request.error);
      cacheEnabled = false;
      resolve(null);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('[AudioCache] IndexedDB initialized');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create object store for audio files
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
        store.createIndex('size', 'size', { unique: false });
        console.log('[AudioCache] Object store created');
      }
    };
  });
}

/**
 * Check if a URL should be cached
 * @param {string} url - URL to check
 * @returns {boolean}
 */
function shouldCacheUrl(url) {
  if (!cacheEnabled) return false;

  try {
    const parsedUrl = new URL(url);

    // Check if it's from a known audio domain
    const isAudioDomain = AUDIO_DOMAINS.some(domain => parsedUrl.hostname.includes(domain));

    // Check if it has an audio extension
    const hasAudioExtension = AUDIO_EXTENSIONS.some(ext =>
      parsedUrl.pathname.toLowerCase().endsWith(ext)
    );

    // Also cache .js files from soundfont domains (they contain audio data)
    const isSoundfontJs = parsedUrl.pathname.endsWith('.js') &&
      (parsedUrl.hostname.includes('felixroos.github.io') ||
        parsedUrl.hostname.includes('gleitz.github.io'));

    return isAudioDomain && (hasAudioExtension || isSoundfontJs);
  } catch (e) {
    return false;
  }
}

/**
 * Get cached audio data
 * @param {string} url - URL to look up
 * @returns {Promise<ArrayBuffer|null>}
 */
async function getCached(url) {
  if (!db || !cacheEnabled) return null;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        if (request.result) {
          cacheStats.hits++;
          resolve(request.result.data);
        } else {
          cacheStats.misses++;
          resolve(null);
        }
      };

      request.onerror = () => {
        cacheStats.misses++;
        resolve(null);
      };
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Store audio data in cache
 * @param {string} url - URL key
 * @param {ArrayBuffer} data - Audio data
 * @returns {Promise<void>}
 */
async function setCached(url, data) {
  if (!db || !cacheEnabled) return;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record = {
        url,
        data,
        size: data.byteLength,
        cachedAt: Date.now()
      };

      const request = store.put(record);

      request.onsuccess = () => {
        cacheStats.stored++;
        resolve();
      };

      request.onerror = () => {
        console.warn('[AudioCache] Failed to store:', url);
        resolve();
      };
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Wrap fetch to add caching for audio files
 * Call this once at app startup to enable audio caching
 */
export async function enableAudioCaching() {
  await initDB();

  if (!cacheEnabled) {
    console.warn('[AudioCache] Caching disabled (IndexedDB not available)');
    return;
  }

  // Store original fetch
  const originalFetch = window.fetch;

  // Replace with caching wrapper
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input.url;

    // Only cache audio URLs
    if (!shouldCacheUrl(url)) {
      return originalFetch(input, init);
    }

    // Check cache first
    const cached = await getCached(url);
    if (cached) {
      // Return cached response
      return new Response(cached, {
        status: 200,
        statusText: 'OK (cached)',
        headers: {
          'Content-Type': 'audio/*',
          'X-Cache': 'HIT'
        }
      });
    }

    // Fetch from network
    const response = await originalFetch(input, init);

    // Clone response before reading (response body can only be read once)
    const clonedResponse = response.clone();

    // Store in cache asynchronously (don't block)
    clonedResponse.arrayBuffer().then(data => {
      setCached(url, data);
    }).catch(() => {
      // Ignore cache storage errors
    });

    return response;
  };

  console.log('[AudioCache] Audio caching enabled');
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  return { ...cacheStats };
}

/**
 * Clear the audio cache
 * @returns {Promise<void>}
 */
export async function clearAudioCache() {
  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      cacheStats = { hits: 0, misses: 0, stored: 0 };
      console.log('[AudioCache] Cache cleared');
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Get cache size information
 * @returns {Promise<Object>} Size info { count, totalBytes }
 */
export async function getCacheSize() {
  if (!db) return { count: 0, totalBytes: 0 };

  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    let count = 0;
    let totalBytes = 0;

    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        count++;
        totalBytes += cursor.value.size || 0;
        cursor.continue();
      } else {
        resolve({ count, totalBytes });
      }
    };

    request.onerror = () => {
      resolve({ count: 0, totalBytes: 0 });
    };
  });
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
