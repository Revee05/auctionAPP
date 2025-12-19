/**
 * Local Filesystem Storage Provider
 * Stores files in a local directory
 */

const fs = require('fs').promises;
const path = require('path');
const BaseAdapter = require('../BaseAdapter.cjs');
const { normalizeKey, buildPublicUrl, getMimeType } = require('../utils.cjs');

class LocalAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.providerName = 'local';
    this.basePath = config.basePath || process.env.STORAGE_LOCAL_PATH || 'public/uploads';
    this.publicBaseUrl = config.publicBaseUrl || process.env.STORAGE_PUBLIC_BASE_URL || '';
  }

  async init(config = {}) {
    if (config.basePath) this.basePath = config.basePath;
    if (config.publicBaseUrl !== undefined) this.publicBaseUrl = config.publicBaseUrl;
    
    // Ensure base directory exists
    await fs.mkdir(this.basePath, { recursive: true });
  }

  async uploadFile(localFilePath, destPath, opts = {}) {
    if (!localFilePath || !destPath) {
      throw new Error('uploadFile requires localFilePath and destPath');
    }

    const { resolveBucket } = require('../utils.cjs');
    const key = normalizeKey(destPath);
    
    // For local provider, opts.bucket can be used as subfolder override
    const targetBasePath = opts.bucket 
      ? path.join(this.basePath, opts.bucket)
      : (resolveBucket(key, this.basePath) !== this.basePath 
          ? path.join(this.basePath, resolveBucket(key, '')) 
          : this.basePath);
    
    const destFull = path.join(targetBasePath, key);

    // Create directory if needed
    await fs.mkdir(path.dirname(destFull), { recursive: true });

    // Copy file
    await fs.copyFile(localFilePath, destFull);

    // Get file stats for metadata
    const stats = await fs.stat(destFull);

    const url = this.getPublicUrl(key);

    return {
      provider: this.providerName,
      url,
      key,
      meta: {
        size: stats.size,
        contentType: opts.contentType || getMimeType(localFilePath),
        modified: stats.mtime,
      },
    };
  }

  getPublicUrl(destPath, opts = {}) {
    if (!destPath) return null;
    const key = normalizeKey(destPath);
    return buildPublicUrl(this.publicBaseUrl, key);
  }

  async deleteFile(destPath, opts = {}) {
    if (!destPath) {
      throw new Error('deleteFile requires destPath');
    }

    const key = normalizeKey(destPath);
    const destFull = path.join(this.basePath, key);

    try {
      await fs.unlink(destFull);
      return { ok: true, provider: this.providerName };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, consider it a success
        return { ok: true, provider: this.providerName };
      }
      throw error;
    }
  }

  async exists(destPath) {
    if (!destPath) return false;
    
    const key = normalizeKey(destPath);
    const destFull = path.join(this.basePath, key);

    try {
      await fs.access(destFull);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(prefix = '', opts = {}) {
    const normalizedPrefix = normalizeKey(prefix);
    const dirPath = path.join(this.basePath, normalizedPrefix);

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files = [];

      for (const entry of entries) {
        if (entry.isFile()) {
          const filePath = path.join(dirPath, entry.name);
          const stats = await fs.stat(filePath);
          const key = path.join(normalizedPrefix, entry.name).replace(/\\/g, '/');

          files.push({
            key,
            size: stats.size,
            modified: stats.mtime,
          });
        }
      }

      return { files };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { files: [] };
      }
      throw error;
    }
  }
}

module.exports = LocalAdapter;
