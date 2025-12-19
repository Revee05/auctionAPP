/**
 * Supabase Storage Provider
 * Requires: @supabase/supabase-js
 */

const fs = require('fs').promises;
const BaseAdapter = require('../BaseAdapter.cjs');
const { normalizeKey, getMimeType } = require('../utils.cjs');

class SupabaseAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config);
    this.providerName = 'supabase';
    this.supabaseUrl = config.url || process.env.SUPABASE_URL;
    this.supabaseKey = config.key || process.env.SUPABASE_KEY;
    this.bucket = config.bucket || process.env.SUPABASE_BUCKET;
    this.publicBaseUrl = config.publicBaseUrl || process.env.STORAGE_PUBLIC_BASE_URL || '';
    this.supabase = null;
  }

  async init(config = {}) {
    if (config.url) this.supabaseUrl = config.url;
    if (config.key) this.supabaseKey = config.key;
    if (config.bucket) this.bucket = config.bucket;
    if (config.publicBaseUrl !== undefined) this.publicBaseUrl = config.publicBaseUrl;

    if (!this.supabaseUrl || !this.supabaseKey || !this.bucket) {
      throw new Error('Supabase provider requires SUPABASE_URL, SUPABASE_KEY, and SUPABASE_BUCKET');
    }

    try {
      const { createClient } = require('@supabase/supabase-js');
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    } catch (error) {
      throw new Error('Supabase client not installed. Run `npm i @supabase/supabase-js` to enable Supabase support.');
    }
  }

  async uploadFile(localFilePath, destPath, opts = {}) {
    if (!localFilePath || !destPath) {
      throw new Error('uploadFile requires localFilePath and destPath');
    }

    if (!this.supabase) {
      await this.init();
    }

    const { resolveBucket } = require('../utils.cjs');
    const key = normalizeKey(destPath);
    const body = await fs.readFile(localFilePath);
    const contentType = opts.contentType || getMimeType(localFilePath);

    // Support bucket override: opts.bucket > auto-resolve from key > default bucket
    const targetBucket = opts.bucket || resolveBucket(key, this.bucket);

    const { data, error } = await this.supabase.storage
      .from(targetBucket)
      .upload(key, body, {
        contentType,
        upsert: opts.upsert !== false,
        cacheControl: opts.cacheControl || '3600',
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const url = this.getPublicUrl(key);

    return {
      provider: this.providerName,
      url,
      key: data.path || key,
      meta: {
        bucket: targetBucket,
        contentType,
      },
    };
  }

  getPublicUrl(destPath, opts = {}) {
    if (!destPath) return null;

    if (!this.supabase) {
      // Return a best-effort URL without initializing
      const key = normalizeKey(destPath);
      if (this.publicBaseUrl) {
        return `${this.publicBaseUrl}/${key}`;
      }
      if (this.supabaseUrl && this.bucket) {
        return `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${key}`;
      }
      return null;
    }

    const key = normalizeKey(destPath);

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(key, opts);

    return data?.publicUrl || null;
  }

  async deleteFile(destPath, opts = {}) {
    if (!destPath) {
      throw new Error('deleteFile requires destPath');
    }

    if (!this.supabase) {
      await this.init();
    }

    const key = normalizeKey(destPath);

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([key]);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }

    return { ok: true, provider: this.providerName };
  }

  async exists(destPath) {
    if (!destPath) return false;

    if (!this.supabase) {
      await this.init();
    }

    const key = normalizeKey(destPath);

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .list('', {
          search: key,
        });

      if (error) return false;
      
      return data && data.length > 0;
    } catch {
      return false;
    }
  }

  async listFiles(prefix = '', opts = {}) {
    if (!this.supabase) {
      await this.init();
    }

    const normalizedPrefix = normalizeKey(prefix);

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .list(normalizedPrefix, {
          limit: opts.limit || 1000,
          offset: opts.offset || 0,
          sortBy: { column: opts.sortBy || 'name', order: opts.order || 'asc' },
        });

      if (error) {
        throw new Error(`Supabase list failed: ${error.message}`);
      }

      const files = data.map((item) => ({
        key: normalizedPrefix ? `${normalizedPrefix}/${item.name}` : item.name,
        size: item.metadata?.size || 0,
        modified: new Date(item.updated_at || item.created_at),
      }));

      return { files };
    } catch (error) {
      return { files: [] };
    }
  }

  /**
   * Create a signed URL for temporary private access
   * @param {string} destPath - Destination path
   * @param {object} opts - Options (expiresIn: seconds)
   * @returns {Promise<string>}
   */
  async createSignedUrl(destPath, opts = {}) {
    if (!destPath) {
      throw new Error('createSignedUrl requires destPath');
    }

    if (!this.supabase) {
      await this.init();
    }

    const key = normalizeKey(destPath);

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(key, opts.expiresIn || 3600);

    if (error) {
      throw new Error(`Supabase signed URL failed: ${error.message}`);
    }

    return data.signedUrl;
  }
}

module.exports = SupabaseAdapter;
