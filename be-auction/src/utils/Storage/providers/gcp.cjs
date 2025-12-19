/**
 * Google Cloud Storage Provider (Skeleton)
 * Requires: @google-cloud/storage
 * TODO: Complete implementation
 */

const fs = require('fs').promises;
const BaseAdapter = require('../BaseAdapter.cjs');
const { normalizeKey, buildPublicUrl, getMimeType } = require('../utils.cjs');

class GCPAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.providerName = 'gcp';
    this.bucketName = config.bucketName || process.env.GCP_BUCKET_NAME;
    this.keyFilePath = config.keyFilePath || process.env.GCP_KEYFILE_PATH;
    this.publicBaseUrl = config.publicBaseUrl || process.env.STORAGE_PUBLIC_BASE_URL || '';
    this.storage = null;
    this.bucket = null;
  }

  async init(config = {}) {
    if (config.bucketName) this.bucketName = config.bucketName;
    if (config.keyFilePath) this.keyFilePath = config.keyFilePath;
    if (config.publicBaseUrl !== undefined) this.publicBaseUrl = config.publicBaseUrl;

    if (!this.bucketName) {
      throw new Error('GCP provider requires GCP_BUCKET_NAME');
    }

    try {
      const { Storage } = require('@google-cloud/storage');
      
      const storageOptions = {};
      if (this.keyFilePath) {
        storageOptions.keyFilename = this.keyFilePath;
      }
      // If keyFilePath is not provided, SDK will use GOOGLE_APPLICATION_CREDENTIALS env var

      this.storage = new Storage(storageOptions);
      this.bucket = this.storage.bucket(this.bucketName);
    } catch (error) {
      throw new Error('Google Cloud Storage not installed. Run `npm i @google-cloud/storage` to enable GCP support.');
    }
  }

  async uploadFile(localFilePath, destPath, opts = {}) {
    if (!localFilePath || !destPath) {
      throw new Error('uploadFile requires localFilePath and destPath');
    }

    if (!this.bucket) {
      await this.init();
    }

    const { resolveBucket } = require('../utils.cjs');
    const key = normalizeKey(destPath);
    const contentType = opts.contentType || getMimeType(localFilePath);

    // Support bucket override: opts.bucket > auto-resolve from key > default bucket
    const targetBucketName = opts.bucket || resolveBucket(key, this.bucketName);
    const targetBucket = targetBucketName !== this.bucketName 
      ? this.storage.bucket(targetBucketName) 
      : this.bucket;

    const uploadOptions = {
      destination: key,
      metadata: {
        contentType,
        metadata: opts.metadata || {},
      },
      public: opts.makePublic !== false,
    };

    await targetBucket.upload(localFilePath, uploadOptions);

    const url = this.getPublicUrl(key);

    return {
      provider: this.providerName,
      url,
      key,
      meta: {
        bucket: targetBucketName,
        contentType,
      },
    };
  }

  getPublicUrl(destPath, opts = {}) {
    if (!destPath) return null;

    const key = normalizeKey(destPath);

    if (this.publicBaseUrl) {
      return buildPublicUrl(this.publicBaseUrl, key);
    }

    // Default GCS public URL format
    return `https://storage.googleapis.com/${this.bucketName}/${key}`;
  }

  async deleteFile(destPath, opts = {}) {
    if (!destPath) {
      throw new Error('deleteFile requires destPath');
    }

    if (!this.bucket) {
      await this.init();
    }

    const key = normalizeKey(destPath);
    const file = this.bucket.file(key);

    await file.delete();

    return { ok: true, provider: this.providerName };
  }

  async exists(destPath) {
    if (!destPath) return false;

    if (!this.bucket) {
      await this.init();
    }

    const key = normalizeKey(destPath);
    const file = this.bucket.file(key);

    try {
      const [exists] = await file.exists();
      return exists;
    } catch {
      return false;
    }
  }

  async listFiles(prefix = '', opts = {}) {
    if (!this.bucket) {
      await this.init();
    }

    const normalizedPrefix = normalizeKey(prefix);

    const [files] = await this.bucket.getFiles({
      prefix: normalizedPrefix,
      maxResults: opts.limit || 1000,
      pageToken: opts.cursor,
    });

    const fileList = files.map((file) => ({
      key: file.name,
      size: parseInt(file.metadata.size, 10),
      modified: new Date(file.metadata.updated),
    }));

    return {
      files: fileList,
      cursor: files.nextQuery?.pageToken,
    };
  }

  /**
   * Generate a signed URL for temporary access
   * @param {string} destPath - Destination path
   * @param {object} opts - Options (expiresIn: seconds, action: 'read'|'write')
   * @returns {Promise<string>}
   */
  async getSignedUrl(destPath, opts = {}) {
    if (!destPath) {
      throw new Error('getSignedUrl requires destPath');
    }

    if (!this.bucket) {
      await this.init();
    }

    const key = normalizeKey(destPath);
    const file = this.bucket.file(key);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: opts.action || 'read',
      expires: Date.now() + (opts.expiresIn || 3600) * 1000,
    });

    return url;
  }
}

module.exports = GCPAdapter;
