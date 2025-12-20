/**
 * Skin Storage Manager
 *
 * Handles persistent storage of custom (user-imported) skins using IndexedDB.
 * Works in both web browsers and Electron.
 *
 * Storage structure:
 * - Database: r0astr_skins
 * - Object Store: skins
 * - Key: skin name (string)
 * - Value: { name, manifest, files: { 'theme.css': string, 'templates/panel.html': string, ... } }
 */

const DB_NAME = 'r0astr_skins';
const STORE_NAME = 'skins';
const DB_VERSION = 1;

/**
 * Open IndexedDB connection
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'name' });
        console.log('[SkinStorage] Created object store:', STORE_NAME);
      }
    };
  });
}

/**
 * Save a custom skin to IndexedDB
 * @param {string} name - Skin name (used as key)
 * @param {Object} manifest - skin.json manifest
 * @param {Object} files - Map of file paths to content { 'theme.css': '...', 'templates/panel.html': '...' }
 * @returns {Promise<void>}
 */
export async function saveSkin(name, manifest, files) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const skinData = {
      name,
      manifest,
      files,
      importedAt: Date.now()
    };

    const request = store.put(skinData);

    request.onsuccess = () => {
      console.log(`[SkinStorage] Saved skin: ${name}`);
      resolve();
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get a custom skin from IndexedDB
 * @param {string} name - Skin name
 * @returns {Promise<Object|null>} Skin data or null if not found
 */
export async function getSkin(name) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(name);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * List all custom skins
 * @returns {Promise<Array>} Array of skin names
 */
export async function listSkins() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Delete a custom skin from IndexedDB
 * @param {string} name - Skin name
 * @returns {Promise<void>}
 */
export async function deleteSkin(name) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(name);

    request.onsuccess = () => {
      console.log(`[SkinStorage] Deleted skin: ${name}`);
      resolve();
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Check if a skin exists in storage
 * @param {string} name - Skin name
 * @returns {Promise<boolean>}
 */
export async function skinExists(name) {
  const skin = await getSkin(name);
  return skin !== null;
}

/**
 * Get all custom skins with full data
 * @returns {Promise<Array>} Array of skin objects
 */
export async function getAllSkins() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}
