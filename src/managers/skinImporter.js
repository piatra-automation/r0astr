/**
 * Skin Importer
 *
 * Handles importing skins from ZIP files:
 * - Extracts ZIP contents
 * - Validates manifest and files
 * - Stores in IndexedDB
 */

import JSZip from 'jszip';
import { validateSkin } from './skinValidator.js';
import { saveSkin, skinExists } from './skinStorage.js';

/**
 * Import a skin from a ZIP file
 * @param {File} file - ZIP file from file input
 * @param {Object} options - Import options
 * @param {boolean} options.overwrite - Allow overwriting existing skins
 * @returns {Promise<Object>} { success: boolean, skinName: string, errors: string[] }
 */
export async function importSkinFromZip(file, options = {}) {
  const { overwrite = false } = options;
  const errors = [];

  try {
    // 1. Load ZIP file
    const zip = await JSZip.loadAsync(file);
    console.log(`[SkinImporter] Loaded ZIP: ${file.name}`);

    // 2. Extract files
    const files = {};
    const filePromises = [];

    zip.forEach((relativePath, zipEntry) => {
      // Skip directories and hidden files
      if (zipEntry.dir || relativePath.startsWith('.') || relativePath.includes('__MACOSX')) {
        return;
      }

      // Extract file content as text
      filePromises.push(
        zipEntry.async('string').then(content => {
          files[relativePath] = content;
        })
      );
    });

    await Promise.all(filePromises);
    console.log(`[SkinImporter] Extracted ${Object.keys(files).length} files`);

    // 3. Find and parse manifest
    const manifestPath = Object.keys(files).find(path => path.endsWith('skin.json'));
    if (!manifestPath) {
      return {
        success: false,
        errors: ['No skin.json manifest found in ZIP']
      };
    }

    let manifest;
    try {
      manifest = JSON.parse(files[manifestPath]);
    } catch (err) {
      return {
        success: false,
        errors: [`Invalid JSON in skin.json: ${err.message}`]
      };
    }

    // Remove manifest from files (it's stored separately)
    delete files[manifestPath];

    // Normalize file paths (remove skin folder prefix if present)
    const normalizedFiles = {};
    const skinFolderName = manifestPath.replace('/skin.json', '');

    for (const [path, content] of Object.entries(files)) {
      // Remove skin folder prefix (e.g., "my-skin/theme.css" -> "theme.css")
      let normalizedPath = path;
      if (skinFolderName && path.startsWith(skinFolderName + '/')) {
        normalizedPath = path.substring(skinFolderName.length + 1);
      }
      normalizedFiles[normalizedPath] = content;
    }

    // 4. Validate skin
    const validation = validateSkin(manifest, normalizedFiles);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // 5. Check if skin already exists
    const skinName = manifest.name;
    if (!overwrite && await skinExists(skinName)) {
      return {
        success: false,
        errors: [`Skin '${skinName}' already exists. Enable overwrite to replace it.`]
      };
    }

    // 6. Save to IndexedDB
    await saveSkin(skinName, manifest, normalizedFiles);

    console.log(`[SkinImporter] Successfully imported skin: ${skinName}`);

    return {
      success: true,
      skinName,
      errors: []
    };

  } catch (err) {
    console.error('[SkinImporter] Import failed:', err);
    return {
      success: false,
      errors: [`Import failed: ${err.message}`]
    };
  }
}

/**
 * Export a skin to a ZIP file
 * @param {string} name - Skin name
 * @param {Object} manifest - Skin manifest
 * @param {Object} files - Skin files
 * @returns {Promise<Blob>} ZIP file as Blob
 */
export async function exportSkinToZip(name, manifest, files) {
  const zip = new JSZip();
  const skinFolder = zip.folder(name);

  // Add manifest
  skinFolder.file('skin.json', JSON.stringify(manifest, null, 2));

  // Add all files
  for (const [path, content] of Object.entries(files)) {
    skinFolder.file(path, content);
  }

  // Generate ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  console.log(`[SkinImporter] Exported skin: ${name}`);

  return blob;
}

/**
 * Download skin as ZIP file
 * @param {string} name - Skin name
 * @param {Object} manifest - Skin manifest
 * @param {Object} files - Skin files
 */
export async function downloadSkin(name, manifest, files) {
  const blob = await exportSkinToZip(name, manifest, files);

  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.zip`;
  a.click();

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
