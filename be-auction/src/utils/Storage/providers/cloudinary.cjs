/**
 * Cloudinary Storage Provider
 * Requires: cloudinary
 */

const BaseAdapter = require('../BaseAdapter.cjs');
const { normalizeKey } = require('../utils.cjs');

class CloudinaryAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.providerName = 'cloudinary';
    this.cloudName = config.cloudName || process.env.CLOUDINARY_CLOUD_NAME;
    this.apiKey = config.apiKey || process.env.CLOUDINARY_API_KEY;
    this.apiSecret = config.apiSecret || process.env.CLOUDINARY_API_SECRET;
    this.folder = config.folder || '';
    this.cloudinary = null;
  }

  async init(config = {}) {
    if (config.cloudName) this.cloudName = config.cloudName;
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.apiSecret) this.apiSecret = config.apiSecret;
    if (config.folder) this.folder = config.folder;

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error('Cloudinary provider requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
    }

    try {
      this.cloudinary = require('cloudinary').v2;
      
      this.cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });
    } catch (error) {
      throw new Error('Cloudinary package not installed. Run `npm i cloudinary` to enable Cloudinary support.');
    }
  }

  async uploadFile(localFilePath, destPath, opts = {}) {
    if (!localFilePath || !destPath) {
      throw new Error('uploadFile requires localFilePath and destPath');
    }

    if (!this.cloudinary) {
      await this.init();
    }

    const key = normalizeKey(destPath);
    
    // Extract public_id from destPath (remove extension)
    const publicId = key.replace(/\.[^/.]+$/, '');
    
    // Add folder prefix if configured
    const fullPublicId = this.folder ? `${this.folder}/${publicId}` : publicId;

    const uploadOptions = {
      public_id: fullPublicId,
      resource_type: opts.resourceType || 'auto',
      folder: opts.folder,
      tags: opts.tags,
      context: opts.context,
      overwrite: opts.overwrite !== false,
    };

    const result = await this.cloudinary.uploader.upload(localFilePath, uploadOptions);

    return {
      provider: this.providerName,
      url: result.secure_url,
      key: result.public_id,
      meta: {
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      },
    };
  }

  getPublicUrl(destPath, opts = {}) {
    if (!destPath) return null;

    // If destPath looks like a Cloudinary public_id, construct URL
    const key = normalizeKey(destPath);
    const publicId = key.replace(/\.[^/.]+$/, '');
    const fullPublicId = this.folder ? `${this.folder}/${publicId}` : publicId;

    if (!this.cloudName) {
      return null;
    }

    // Build base URL
    let url = `https://res.cloudinary.com/${this.cloudName}`;

    // Add transformations if provided
    if (opts.transformation) {
      url += `/image/upload/${opts.transformation}/${fullPublicId}`;
    } else {
      url += `/image/upload/${fullPublicId}`;
    }

    return url;
  }

  async deleteFile(destPath, opts = {}) {
    if (!destPath) {
      throw new Error('deleteFile requires destPath');
    }

    if (!this.cloudinary) {
      await this.init();
    }

    const key = normalizeKey(destPath);
    const publicId = key.replace(/\.[^/.]+$/, '');
    const fullPublicId = this.folder ? `${this.folder}/${publicId}` : publicId;

    const result = await this.cloudinary.uploader.destroy(fullPublicId, {
      resource_type: opts.resourceType || 'image',
    });

    return {
      ok: result.result === 'ok',
      provider: this.providerName,
      result: result.result,
    };
  }

  async exists(destPath) {
    if (!destPath) return false;

    if (!this.cloudinary) {
      await this.init();
    }

    try {
      const key = normalizeKey(destPath);
      const publicId = key.replace(/\.[^/.]+$/, '');
      const fullPublicId = this.folder ? `${this.folder}/${publicId}` : publicId;

      const result = await this.cloudinary.api.resource(fullPublicId);
      return !!result;
    } catch (error) {
      if (error.error && error.error.http_code === 404) {
        return false;
      }
      throw error;
    }
  }

  async listFiles(prefix = '', opts = {}) {
    if (!this.cloudinary) {
      await this.init();
    }

    const normalizedPrefix = normalizeKey(prefix);
    const fullPrefix = this.folder ? `${this.folder}/${normalizedPrefix}` : normalizedPrefix;

    try {
      const result = await this.cloudinary.api.resources({
        type: opts.type || 'upload',
        prefix: fullPrefix,
        max_results: opts.limit || 500,
        next_cursor: opts.cursor,
      });

      const files = result.resources.map((resource) => ({
        key: resource.public_id,
        size: resource.bytes,
        modified: new Date(resource.created_at),
        url: resource.secure_url,
      }));

      return {
        files,
        cursor: result.next_cursor,
      };
    } catch (error) {
      return { files: [] };
    }
  }
}

module.exports = CloudinaryAdapter;
