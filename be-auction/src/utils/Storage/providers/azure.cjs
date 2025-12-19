/**
 * Azure Blob Storage Provider (Skeleton)
 * Requires: @azure/storage-blob
 * TODO: Complete implementation
 */

const fs = require('fs').promises;
const BaseAdapter = require('../BaseAdapter.cjs');
const { normalizeKey, buildPublicUrl, getMimeType } = require('../utils.cjs');

class AzureAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.providerName = 'azure';
    this.accountName = config.accountName || process.env.AZURE_STORAGE_ACCOUNT;
    this.accountKey = config.accountKey || process.env.AZURE_STORAGE_ACCOUNT_KEY;
    this.containerName = config.containerName || process.env.AZURE_CONTAINER_NAME;
    this.publicBaseUrl = config.publicBaseUrl || process.env.STORAGE_PUBLIC_BASE_URL || '';
    this.blobServiceClient = null;
    this.containerClient = null;
  }

  async init(config = {}) {
    if (config.accountName) this.accountName = config.accountName;
    if (config.accountKey) this.accountKey = config.accountKey;
    if (config.containerName) this.containerName = config.containerName;
    if (config.publicBaseUrl !== undefined) this.publicBaseUrl = config.publicBaseUrl;

    if (!this.accountName || !this.accountKey || !this.containerName) {
      throw new Error('Azure provider requires AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCOUNT_KEY, and AZURE_CONTAINER_NAME');
    }

    try {
      const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');

      const sharedKeyCredential = new StorageSharedKeyCredential(
        this.accountName,
        this.accountKey
      );

      this.blobServiceClient = new BlobServiceClient(
        `https://${this.accountName}.blob.core.windows.net`,
        sharedKeyCredential
      );

      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      
      // Ensure container exists
      await this.containerClient.createIfNotExists({
        access: 'blob', // Public access for blobs
      });
    } catch (error) {
      throw new Error('Azure Storage Blob not installed. Run `npm i @azure/storage-blob` to enable Azure support.');
    }
  }

  async uploadFile(localFilePath, destPath, opts = {}) {
    if (!localFilePath || !destPath) {
      throw new Error('uploadFile requires localFilePath and destPath');
    }

    if (!this.containerClient) {
      await this.init();
    }

    const { resolveBucket } = require('../utils.cjs');
    const key = normalizeKey(destPath);
    
    // Support container override: opts.bucket > auto-resolve from key > default container
    const targetContainerName = opts.bucket || resolveBucket(key, this.containerName);
    const targetContainerClient = targetContainerName !== this.containerName
      ? this.blobServiceClient.getContainerClient(targetContainerName)
      : this.containerClient;
    
    const blobClient = targetContainerClient.getBlockBlobClient(key);
    
    const contentType = opts.contentType || getMimeType(localFilePath);
    const data = await fs.readFile(localFilePath);

    await blobClient.upload(data, data.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
      metadata: opts.metadata || {},
    });

    const url = this.getPublicUrl(key);

    return {
      provider: this.providerName,
      url,
      key,
      meta: {
        container: this.containerName,
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

    // Default Azure Blob URL format
    return `https://${this.accountName}.blob.core.windows.net/${this.containerName}/${key}`;
  }

  async deleteFile(destPath, opts = {}) {
    if (!destPath) {
      throw new Error('deleteFile requires destPath');
    }

    if (!this.containerClient) {
      await this.init();
    }

    const key = normalizeKey(destPath);
    const blobClient = this.containerClient.getBlockBlobClient(key);

    await blobClient.deleteIfExists();

    return { ok: true, provider: this.providerName };
  }

  async exists(destPath) {
    if (!destPath) return false;

    if (!this.containerClient) {
      await this.init();
    }

    const key = normalizeKey(destPath);
    const blobClient = this.containerClient.getBlockBlobClient(key);

    try {
      return await blobClient.exists();
    } catch {
      return false;
    }
  }

  async listFiles(prefix = '', opts = {}) {
    if (!this.containerClient) {
      await this.init();
    }

    const normalizedPrefix = normalizeKey(prefix);
    const files = [];

    try {
      const iterator = this.containerClient.listBlobsFlat({
        prefix: normalizedPrefix,
      });

      let count = 0;
      const limit = opts.limit || 1000;

      for await (const blob of iterator) {
        if (count >= limit) break;

        files.push({
          key: blob.name,
          size: blob.properties.contentLength,
          modified: blob.properties.lastModified,
        });

        count++;
      }

      return { files };
    } catch (error) {
      return { files: [] };
    }
  }

  /**
   * Generate a SAS (Shared Access Signature) URL for temporary access
   * @param {string} destPath - Destination path
   * @param {object} opts - Options (expiresIn: seconds, permissions: 'r'|'w'|'rw')
   * @returns {Promise<string>}
   */
  async getSasUrl(destPath, opts = {}) {
    if (!destPath) {
      throw new Error('getSasUrl requires destPath');
    }

    if (!this.containerClient) {
      await this.init();
    }

    const { generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
    const { StorageSharedKeyCredential } = require('@azure/storage-blob');

    const key = normalizeKey(destPath);
    const blobClient = this.containerClient.getBlockBlobClient(key);

    const sharedKeyCredential = new StorageSharedKeyCredential(
      this.accountName,
      this.accountKey
    );

    const permissions = BlobSASPermissions.parse(opts.permissions || 'r');
    const expiresOn = new Date(Date.now() + (opts.expiresIn || 3600) * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName: key,
        permissions,
        expiresOn,
      },
      sharedKeyCredential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  }
}

module.exports = AzureAdapter;
