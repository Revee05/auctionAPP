/**
 * Base Storage Adapter Interface
 * All storage providers should implement this interface
 */

class BaseAdapter {
  constructor(config = {}) {
    this.config = config;
    this.providerName = 'base';
  }

  /**
   * Initialize the adapter with configuration
   * @param {object} config - Provider-specific configuration
   * @returns {Promise<void>}
   */
  async init(config) {
    throw new Error('init() must be implemented by provider');
  }

  /**
   * Upload a file to storage
   * @param {string} localFilePath - Path to local file
   * @param {string} destPath - Destination path in storage
   * @param {object} opts - Upload options (contentType, metadata, etc.)
   * @returns {Promise<{provider: string, url: string, key: string, meta?: object}>}
   */
  async uploadFile(localFilePath, destPath, opts = {}) {
    throw new Error('uploadFile() must be implemented by provider');
  }

  /**
   * Get public URL for a stored file
   * @param {string} destPath - Destination path in storage
   * @param {object} opts - URL options (expiry, transformation, etc.)
   * @returns {string|null} Public URL
   */
  getPublicUrl(destPath, opts = {}) {
    throw new Error('getPublicUrl() must be implemented by provider');
  }

  /**
   * Delete a file from storage
   * @param {string} destPath - Destination path in storage
   * @param {object} opts - Delete options
   * @returns {Promise<{ok: boolean, provider: string}>}
   */
  async deleteFile(destPath, opts = {}) {
    throw new Error('deleteFile() must be implemented by provider');
  }

  /**
   * Check if a file exists
   * @param {string} destPath - Destination path in storage
   * @returns {Promise<boolean>}
   */
  async exists(destPath) {
    throw new Error('exists() must be implemented by provider');
  }

  /**
   * List files in a directory/prefix
   * @param {string} prefix - Directory prefix
   * @param {object} opts - List options (limit, cursor, etc.)
   * @returns {Promise<{files: Array<{key: string, size: number, modified: Date}>, cursor?: string}>}
   */
  async listFiles(prefix = '', opts = {}) {
    throw new Error('listFiles() must be implemented by provider');
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getProviderName() {
    return this.providerName;
  }
}

module.exports = BaseAdapter;
