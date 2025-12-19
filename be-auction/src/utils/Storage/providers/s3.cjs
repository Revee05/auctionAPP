/**
 * AWS S3 Storage Provider
 * Requires: @aws-sdk/client-s3 (v3)
 */

const fs = require('fs').promises;
const BaseAdapter = require('../BaseAdapter.cjs');
const { normalizeKey, buildPublicUrl, getMimeType } = require('../utils.cjs');

class S3Adapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.providerName = 's3';
    this.bucket = config.bucket || process.env.AWS_S3_BUCKET;
    this.region = config.region || process.env.AWS_S3_REGION;
    this.publicBaseUrl = config.publicBaseUrl || process.env.STORAGE_PUBLIC_BASE_URL || '';
    this.s3Client = null;
  }

  async init(config = {}) {
    if (config.bucket) this.bucket = config.bucket;
    if (config.region) this.region = config.region;
    if (config.publicBaseUrl !== undefined) this.publicBaseUrl = config.publicBaseUrl;

    if (!this.bucket || !this.region) {
      throw new Error('S3 provider requires AWS_S3_BUCKET and AWS_S3_REGION');
    }

    try {
      const { S3Client } = require('@aws-sdk/client-s3');
      
      this.s3Client = new S3Client({
        region: this.region,
        credentials: config.credentials || {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    } catch (error) {
      throw new Error('AWS SDK not installed. Run `npm i @aws-sdk/client-s3` to enable S3 support.');
    }
  }

  async uploadFile(localFilePath, destPath, opts = {}) {
    if (!localFilePath || !destPath) {
      throw new Error('uploadFile requires localFilePath and destPath');
    }

    if (!this.s3Client) {
      await this.init();
    }

    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const { resolveBucket } = require('../utils.cjs');

    const key = normalizeKey(destPath);
    const body = await fs.readFile(localFilePath);
    const contentType = opts.contentType || getMimeType(localFilePath);

    // Support bucket override: opts.bucket > auto-resolve from key > default bucket
    const targetBucket = opts.bucket || resolveBucket(key, this.bucket);

    const command = new PutObjectCommand({
      Bucket: targetBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: opts.acl || 'public-read',
      Metadata: opts.metadata || {},
    });

    await this.s3Client.send(command);

    const url = this.getPublicUrl(key);

    return {
      provider: this.providerName,
      url,
      key,
      meta: {
        bucket: targetBucket,
        region: this.region,
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

    // Default S3 URL format
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async deleteFile(destPath, opts = {}) {
    if (!destPath) {
      throw new Error('deleteFile requires destPath');
    }

    if (!this.s3Client) {
      await this.init();
    }

    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

    const key = normalizeKey(destPath);

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);

    return { ok: true, provider: this.providerName };
  }

  async exists(destPath) {
    if (!destPath) return false;

    if (!this.s3Client) {
      await this.init();
    }

    const { HeadObjectCommand } = require('@aws-sdk/client-s3');

    const key = normalizeKey(destPath);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async listFiles(prefix = '', opts = {}) {
    if (!this.s3Client) {
      await this.init();
    }

    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');

    const normalizedPrefix = normalizeKey(prefix);

    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: normalizedPrefix,
      MaxKeys: opts.limit || 1000,
      ContinuationToken: opts.cursor,
    });

    const response = await this.s3Client.send(command);

    const files = (response.Contents || []).map((item) => ({
      key: item.Key,
      size: item.Size,
      modified: item.LastModified,
    }));

    return {
      files,
      cursor: response.NextContinuationToken,
    };
  }

  /**
   * Generate a signed URL for temporary access
   * @param {string} destPath - Destination path
   * @param {object} opts - Options (expiresIn: seconds)
   * @returns {Promise<string>}
   */
  async getSignedUrl(destPath, opts = {}) {
    if (!destPath) {
      throw new Error('getSignedUrl requires destPath');
    }

    if (!this.s3Client) {
      await this.init();
    }

    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

    const key = normalizeKey(destPath);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: opts.expiresIn || 3600, // 1 hour default
    });

    return signedUrl;
  }
}

module.exports = S3Adapter;
