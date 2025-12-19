/**
 * ⚠️ DEPRECATED: Compatibility wrapper for legacy storage module
 * 
 * This file is maintained for backward compatibility only.
 * Please migrate to the new modular storage API:
 * 
 * Old (deprecated):
 *   const { uploadFile, getPublicUrl } = require('./utils/Storage/storage');
 * 
 * New (recommended):
 *   const storage = require('./utils/storage');
 *   await storage.uploadFile(...);
 *   storage.getPublicUrl(...);
 * 
 * Migration benefits:
 * - Consistent URL generation across all providers
 * - Better error handling and validation
 * - Support for delete, exists, and listFiles operations
 * - Proper path normalization (no backslashes in URLs)
 * - Lazy initialization and better performance
 * 
 * This wrapper will be removed in a future version.
 */

const newStorage = require('./index.cjs');

// Track if deprecation warning has been shown
let deprecationWarned = false;

function showDeprecationWarning() {
  if (!deprecationWarned) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '[DEPRECATED] You are using the legacy storage module (src/utils/Storage/storage.js).\n' +
      'Please migrate to the new modular storage API at src/utils/storage/index.js.\n' +
      'See migration guide for details. This warning will only be shown once per process.'
    );
    deprecationWarned = true;
  }
}

/**
 * Upload file (compatibility wrapper)
 * @deprecated Use storage.uploadFile() from '../storage' instead
 */
async function uploadFile(localFilePath, destPath) {
  showDeprecationWarning();
  
  const result = await newStorage.uploadFile(localFilePath, destPath);
  
  // Return legacy format (provider, url) for backward compatibility
  return {
    provider: result.provider,
    url: result.url,
  };
}

/**
 * Get public URL (compatibility wrapper)
 * @deprecated Use storage.getPublicUrl() from '../storage' instead
 */
function getPublicUrl(destPath) {
  showDeprecationWarning();
  
  return newStorage.getPublicUrl(destPath);
}

/**
 * Get current provider name (compatibility wrapper)
 * @deprecated Use storage.provider from '../storage' instead
 */
const provider = newStorage.provider;

module.exports = { 
  uploadFile, 
  getPublicUrl, 
  provider,
  
  // Export additional operations for convenience
  deleteFile: newStorage.deleteFile,
  exists: newStorage.exists,
  listFiles: newStorage.listFiles,
};
