/**
 * Storage Facade - Unified Storage API
 * Factory pattern for dynamic provider selection
 * 
 * Usage:
 * ```js
 * const storage = require('./utils/storage');
 * 
 * // Upload file
 * const result = await storage.uploadFile('/tmp/photo.jpg', 'avatars/user123.jpg');
 * console.log(result.url); // Public URL
 * 
 * // Get public URL
 * const url = storage.getPublicUrl('avatars/user123.jpg');
 * 
 * // Delete file
 * await storage.deleteFile('avatars/user123.jpg');
 * ```
 */

const { validateEnvForProvider } = require('./utils.cjs');

// Provider adapters
const LocalAdapter = require('./providers/local.cjs');
const S3Adapter = require('./providers/s3.cjs');
const CloudinaryAdapter = require('./providers/cloudinary.cjs');
const SupabaseAdapter = require('./providers/supabase.cjs');
const GCPAdapter = require('./providers/gcp.cjs');
const AzureAdapter = require('./providers/azure.cjs');

/**
 * Storage provider registry
 */
const PROVIDERS = {
  local: LocalAdapter,
  s3: S3Adapter,
  cloudinary: CloudinaryAdapter,
  supabase: SupabaseAdapter,
  gcp: GCPAdapter,
  azure: AzureAdapter,
};

/**
 * Current storage instance (singleton)
 */
let storageInstance = null;
let currentProvider = null;

/**
 * Create or get storage adapter instance
 * @param {string} providerName - Provider name (local, s3, cloudinary, supabase, gcp, azure)
 * @param {object} config - Provider-specific configuration
 * @returns {BaseAdapter} Storage adapter instance
 */
function createStorage(providerName, config = {}) {
  const provider = (providerName || process.env.STORAGE_PROVIDER || 'local').toLowerCase();

  // Validate provider
  if (!PROVIDERS[provider]) {
    const available = Object.keys(PROVIDERS).join(', ');
    throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}. Available: ${available}`);
  }

  // Validate environment variables
  const validation = validateEnvForProvider(provider);
  if (!validation.ok && validation.missing.length > 0) {
    console.warn(
      `[Storage] Warning: Missing environment variables for ${provider}: ${validation.missing.join(', ')}`
    );
  }

  const AdapterClass = PROVIDERS[provider];
  const adapter = new AdapterClass(config);

  return adapter;
}

/**
 * Initialize storage with provider and config
 * @param {string} providerName - Provider name
 * @param {object} config - Provider configuration
 */
async function init(providerName, config = {}) {
  currentProvider = providerName || process.env.STORAGE_PROVIDER || 'local';
  storageInstance = createStorage(currentProvider, config);
  await storageInstance.init(config);
  return storageInstance;
}

/**
 * Get current storage instance (lazy initialization)
 * @returns {BaseAdapter}
 */
function getStorage() {
  if (!storageInstance) {
    const provider = process.env.STORAGE_PROVIDER || 'local';
    storageInstance = createStorage(provider);
  }
  return storageInstance;
}

/**
 * Upload a file to storage
 * @param {string} localFilePath - Path to local file
 * @param {string} destPath - Destination path in storage
 * @param {object} opts - Upload options
 * @returns {Promise<{provider: string, url: string, key: string, meta?: object}>}
 */
async function uploadFile(localFilePath, destPath, opts = {}) {
  const storage = getStorage();
  
  // Lazy init if needed
  if (!storage.s3Client && storage.providerName === 's3') {
    await storage.init();
  }
  if (!storage.supabase && storage.providerName === 'supabase') {
    await storage.init();
  }
  if (!storage.cloudinary && storage.providerName === 'cloudinary') {
    await storage.init();
  }
  if (!storage.bucket && storage.providerName === 'gcp') {
    await storage.init();
  }
  if (!storage.containerClient && storage.providerName === 'azure') {
    await storage.init();
  }
  
  return storage.uploadFile(localFilePath, destPath, opts);
}

/**
 * Get public URL for a stored file
 * @param {string} destPath - Destination path in storage
 * @param {object} opts - URL options
 * @returns {string|null} Public URL
 */
function getPublicUrl(destPath, opts = {}) {
  const storage = getStorage();
  return storage.getPublicUrl(destPath, opts);
}

/**
 * Delete a file from storage
 * @param {string} destPath - Destination path in storage
 * @param {object} opts - Delete options
 * @returns {Promise<{ok: boolean, provider: string}>}
 */
async function deleteFile(destPath, opts = {}) {
  const storage = getStorage();
  
  // Lazy init if needed
  if (!storage.s3Client && storage.providerName === 's3') {
    await storage.init();
  }
  if (!storage.supabase && storage.providerName === 'supabase') {
    await storage.init();
  }
  if (!storage.cloudinary && storage.providerName === 'cloudinary') {
    await storage.init();
  }
  if (!storage.bucket && storage.providerName === 'gcp') {
    await storage.init();
  }
  if (!storage.containerClient && storage.providerName === 'azure') {
    await storage.init();
  }
  
  return storage.deleteFile(destPath, opts);
}

/**
 * Check if a file exists
 * @param {string} destPath - Destination path in storage
 * @returns {Promise<boolean>}
 */
async function exists(destPath) {
  const storage = getStorage();
  
  // Lazy init if needed
  if (!storage.s3Client && storage.providerName === 's3') {
    await storage.init();
  }
  if (!storage.supabase && storage.providerName === 'supabase') {
    await storage.init();
  }
  if (!storage.cloudinary && storage.providerName === 'cloudinary') {
    await storage.init();
  }
  if (!storage.bucket && storage.providerName === 'gcp') {
    await storage.init();
  }
  if (!storage.containerClient && storage.providerName === 'azure') {
    await storage.init();
  }
  
  return storage.exists(destPath);
}

/**
 * List files in a directory/prefix
 * @param {string} prefix - Directory prefix
 * @param {object} opts - List options
 * @returns {Promise<{files: Array, cursor?: string}>}
 */
async function listFiles(prefix = '', opts = {}) {
  const storage = getStorage();
  
  // Lazy init if needed
  if (!storage.s3Client && storage.providerName === 's3') {
    await storage.init();
  }
  if (!storage.supabase && storage.providerName === 'supabase') {
    await storage.init();
  }
  if (!storage.cloudinary && storage.providerName === 'cloudinary') {
    await storage.init();
  }
  if (!storage.bucket && storage.providerName === 'gcp') {
    await storage.init();
  }
  if (!storage.containerClient && storage.providerName === 'azure') {
    await storage.init();
  }
  
  return storage.listFiles(prefix, opts);
}

/**
 * Get current provider name
 * @returns {string}
 */
function getProviderName() {
  const storage = getStorage();
  return storage.getProviderName();
}

/**
 * Reset storage instance (useful for testing)
 */
function reset() {
  storageInstance = null;
  currentProvider = null;
}

// Main exports (facade API)
module.exports = {
  // Initialization
  init,
  reset,
  
  // Core operations
  uploadFile,
  getPublicUrl,
  deleteFile,
  exists,
  listFiles,
  
  // Utilities
  getProviderName,
  createStorage,
  
  // Direct adapter access (for advanced use)
  adapters: PROVIDERS,
  
  // Current provider getter
  get provider() {
    return getProviderName();
  },
};
