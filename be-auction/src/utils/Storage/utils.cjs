/**
 * Storage Utility Helpers
 * Path normalization, key sanitization, and environment validation
 */

/**
 * Normalize storage key/path to forward slashes and remove leading slash
 * @param {string} destPath - Destination path
 * @returns {string} Normalized key
 */
function normalizeKey(destPath) {
  if (!destPath) return '';
  // Convert backslashes to forward slashes
  let normalized = destPath.replace(/\\/g, '/');
  // Remove leading slash
  normalized = normalized.replace(/^\/+/, '');
  // Remove double slashes
  normalized = normalized.replace(/\/+/g, '/');
  return normalized;
}

/**
 * Ensure public base URL has no trailing slash
 * @param {string} publicBaseUrl - Base URL
 * @returns {string} Normalized base URL
 */
function ensurePublicBase(publicBaseUrl) {
  if (!publicBaseUrl) return '';
  return publicBaseUrl.replace(/\/+$/, '');
}

/**
 * Build full public URL from base and key
 * @param {string} publicBaseUrl - Base URL
 * @param {string} key - Storage key
 * @returns {string} Full public URL
 */
function buildPublicUrl(publicBaseUrl, key) {
  const base = ensurePublicBase(publicBaseUrl);
  const normalizedKey = normalizeKey(key);
  if (!base) return `/${normalizedKey}`;
  return `${base}/${normalizedKey}`;
}

/**
 * Validate required environment variables for a provider
 * @param {string} provider - Provider name
 * @param {object} env - Environment variables object
 * @returns {{ok: boolean, missing: string[]}} Validation result
 */
function validateEnvForProvider(provider, env = process.env) {
  const requirements = {
    local: [],
    s3: ['AWS_S3_BUCKET', 'AWS_S3_REGION'],
    cloudinary: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
    supabase: ['SUPABASE_URL', 'SUPABASE_KEY', 'SUPABASE_BUCKET'],
    gcp: ['GCP_BUCKET_NAME'],
    azure: ['AZURE_STORAGE_ACCOUNT', 'AZURE_CONTAINER_NAME'],
  };

  const required = requirements[provider] || [];
  const missing = required.filter((key) => !env[key]);

  return {
    ok: missing.length === 0,
    missing,
  };
}

/**
 * Get MIME type from file extension
 * @param {string} filePath - File path
 * @returns {string} MIME type
 */
function getMimeType(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    // Video
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    // Default
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Generate unique filename with timestamp
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop();
  const name = originalName.replace(/\.[^/.]+$/, '').substring(0, 50);
  const sanitized = name.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${sanitized}_${timestamp}_${random}.${ext}`;
}

/**
 * Parse bucket mapping from env string
 * @param {string} mapString - Bucket map string (e.g., "avatars=bucket1,auctions=bucket2,default=main")
 * @returns {object} Parsed bucket map
 */
function parseBucketMap(mapString = process.env.STORAGE_BUCKET_MAP) {
  if (!mapString) return {};
  
  const map = {};
  const pairs = mapString.split(',').map(s => s.trim()).filter(Boolean);
  
  for (const pair of pairs) {
    const [prefix, bucket] = pair.split('=').map(s => s.trim());
    if (prefix && bucket) {
      map[prefix] = bucket;
    }
  }
  
  return map;
}

/**
 * Resolve bucket from key prefix using bucket map
 * @param {string} key - Storage key/path
 * @param {string} defaultBucket - Default bucket if no match
 * @param {object} bucketMap - Bucket mapping object
 * @returns {string} Resolved bucket name
 */
function resolveBucket(key, defaultBucket, bucketMap = null) {
  if (!bucketMap) {
    bucketMap = parseBucketMap();
  }
  
  if (Object.keys(bucketMap).length === 0) {
    return defaultBucket;
  }
  
  const normalizedKey = normalizeKey(key);
  const firstSegment = normalizedKey.split('/')[0];
  
  // Check if first segment matches a prefix in bucket map
  if (bucketMap[firstSegment]) {
    return bucketMap[firstSegment];
  }
  
  // Return default bucket from map or fallback
  return bucketMap.default || defaultBucket;
}

module.exports = {
  normalizeKey,
  ensurePublicBase,
  buildPublicUrl,
  validateEnvForProvider,
  getMimeType,
  generateUniqueFilename,
  parseBucketMap,
  resolveBucket,
};
