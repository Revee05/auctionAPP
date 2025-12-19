# Storage Module - Modular Cloud Storage Utility

Sistem storage modular yang mendukung multiple cloud providers dengan API yang konsisten dan mudah digunakan.

## 📦 Supported Providers

- ✅ **Local** - Filesystem lokal (development)
- ✅ **AWS S3** - Amazon S3 (requires `@aws-sdk/client-s3`)
- ✅ **Cloudinary** - Cloudinary CDN (requires `cloudinary`)
- ✅ **Supabase** - Supabase Storage (requires `@supabase/supabase-js`)
- 🚧 **Google Cloud Storage** - GCP Storage (requires `@google-cloud/storage`)
- 🚧 **Azure Blob** - Azure Blob Storage (requires `@azure/storage-blob`)

> 🚧 = Skeleton implementation (ready to use, but verify edge cases)

## 🚀 Quick Start

### 1. Install Dependencies (Optional)

Hanya install provider yang akan digunakan:

```bash
# Local - no dependencies needed

# AWS S3
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Cloudinary
npm install cloudinary

# Supabase
npm install @supabase/supabase-js

# Google Cloud
npm install @google-cloud/storage

# Azure
npm install @azure/storage-blob
```

### 2. Configure Environment

Set `STORAGE_PROVIDER` di `.env`:

```env
# Choose: local | s3 | cloudinary | supabase | gcp | azure
STORAGE_PROVIDER=local

# Local provider
STORAGE_LOCAL_PATH=public/uploads
STORAGE_PUBLIC_BASE_URL=http://localhost:3500

# AWS S3 provider
AWS_S3_BUCKET=my-bucket
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Cloudinary provider
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Supabase provider
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_BUCKET=avatars

# GCP provider
GCP_BUCKET_NAME=my-bucket
GCP_KEYFILE_PATH=/path/to/service-account.json

# Azure provider
AZURE_STORAGE_ACCOUNT=myaccount
AZURE_STORAGE_ACCOUNT_KEY=your-key
AZURE_CONTAINER_NAME=uploads
```

### 3. Use in Code

```javascript
const storage = require('./utils/storage');

// Upload file
const result = await storage.uploadFile(
  '/tmp/avatar.jpg',
  'avatars/user-123.jpg'
);
console.log(result);
// {
//   provider: 'local',
//   url: 'http://localhost:3500/avatars/user-123.jpg',
//   key: 'avatars/user-123.jpg',
//   meta: { size: 12345, contentType: 'image/jpeg' }
// }

// Get public URL
const url = storage.getPublicUrl('avatars/user-123.jpg');

// Delete file
await storage.deleteFile('avatars/user-123.jpg');

// Check if file exists
const exists = await storage.exists('avatars/user-123.jpg');

// List files in directory
const { files } = await storage.listFiles('avatars/');
```

## 📖 API Reference

### Core Operations

#### `uploadFile(localFilePath, destPath, opts?)`

Upload file ke storage.

**Parameters:**
- `localFilePath` (string) - Path ke file lokal
- `destPath` (string) - Destination path di storage (e.g., `avatars/user-123.jpg`)
- `opts` (object, optional):
  - `contentType` (string) - MIME type (auto-detected jika tidak diset)
  - `metadata` (object) - Custom metadata
  - `acl` (string) - Access control (S3 only, default: `'public-read'`)
  - `upsert` (boolean) - Overwrite existing file (Supabase, default: `true`)
  - `folder` (string) - Folder override (Cloudinary)

**Returns:** `Promise<{ provider, url, key, meta }>`

#### `getPublicUrl(destPath, opts?)`

Get public URL untuk file yang tersimpan.

**Parameters:**
- `destPath` (string) - Destination path di storage
- `opts` (object, optional):
  - `transformation` (string) - Image transformation (Cloudinary only)

**Returns:** `string | null`

#### `deleteFile(destPath, opts?)`

Delete file dari storage.

**Parameters:**
- `destPath` (string) - Destination path di storage
- `opts` (object, optional) - Provider-specific options

**Returns:** `Promise<{ ok: boolean, provider: string }>`

#### `exists(destPath)`

Cek apakah file exists di storage.

**Parameters:**
- `destPath` (string) - Destination path di storage

**Returns:** `Promise<boolean>`

#### `listFiles(prefix?, opts?)`

List files dalam directory/prefix.

**Parameters:**
- `prefix` (string, optional) - Directory prefix (default: `''`)
- `opts` (object, optional):
  - `limit` (number) - Max results (default: 1000)
  - `cursor` (string) - Pagination cursor

**Returns:** `Promise<{ files: Array<{ key, size, modified }>, cursor? }>`

### Utilities

#### `getProviderName()`

Get nama provider yang aktif.

**Returns:** `string` (e.g., `'local'`, `'s3'`, `'cloudinary'`)

#### `init(providerName?, config?)`

Inisialisasi storage dengan provider dan config tertentu (optional, auto-initialized saat pertama kali digunakan).

**Parameters:**
- `providerName` (string, optional) - Provider name
- `config` (object, optional) - Provider-specific config

#### `reset()`

Reset storage instance (useful untuk testing).

### Direct Adapter Access

Untuk advanced use cases, akses adapter langsung:

```javascript
const { adapters } = require('./utils/storage');

// Create custom S3 instance
const s3 = new adapters.s3({
  bucket: 'my-bucket',
  region: 'us-west-2',
});
await s3.init();
await s3.uploadFile('/tmp/file.pdf', 'docs/file.pdf');
```

## 🔧 Provider-Specific Features

### S3 Provider

```javascript
const storage = require('./utils/storage');

// Generate signed URL (temporary access)
const s3Adapter = storage.createStorage('s3');
await s3Adapter.init();
const signedUrl = await s3Adapter.getSignedUrl('private/document.pdf', {
  expiresIn: 3600, // 1 hour
});
```

### Cloudinary Provider

```javascript
// Upload with transformations
await storage.uploadFile('/tmp/photo.jpg', 'photos/hero.jpg', {
  folder: 'website',
  tags: ['hero', 'homepage'],
});

// Get URL with transformation
const url = storage.getPublicUrl('photos/hero', {
  transformation: 'w_800,h_600,c_fill',
});
// https://res.cloudinary.com/cloud/image/upload/w_800,h_600,c_fill/photos/hero
```

### Supabase Provider

```javascript
const storage = require('./utils/storage');

// Create signed URL for private files
const supabaseAdapter = storage.createStorage('supabase');
await supabaseAdapter.init();
const signedUrl = await supabaseAdapter.createSignedUrl('private/doc.pdf', {
  expiresIn: 3600,
});
```

### GCP Provider

```javascript
const storage = require('./utils/storage');

// Generate signed URL
const gcpAdapter = storage.createStorage('gcp');
await gcpAdapter.init();
const signedUrl = await gcpAdapter.getSignedUrl('files/report.pdf', {
  expiresIn: 7200, // 2 hours
  action: 'read',
});
```

### Azure Provider

```javascript
const storage = require('./utils/storage');

// Generate SAS URL
const azureAdapter = storage.createStorage('azure');
await azureAdapter.init();
const sasUrl = await azureAdapter.getSasUrl('documents/contract.pdf', {
  expiresIn: 3600,
  permissions: 'r', // read-only
});
```

## 🔄 Migration from Legacy Storage

Jika menggunakan `src/utils/Storage/storage.js` (deprecated), migrasi mudah:

**Before (Old):**
```javascript
const { uploadFile, getPublicUrl } = require('./utils/Storage/storage');

const result = await uploadFile('/tmp/file.jpg', 'avatars/user.jpg');
const url = getPublicUrl('avatars/user.jpg');
```

**After (New):**
```javascript
const storage = require('./utils/storage');

const result = await storage.uploadFile('/tmp/file.jpg', 'avatars/user.jpg');
const url = storage.getPublicUrl('avatars/user.jpg');
```

### Migration Benefits

✅ **Konsisten:** URL yang sama dari `uploadFile` dan `getPublicUrl`  
✅ **Path normalization:** Tidak ada backslash di URL (Windows-safe)  
✅ **More operations:** `deleteFile`, `exists`, `listFiles`  
✅ **Better error handling:** Env validation, clear error messages  
✅ **Lazy initialization:** Faster startup time  

> Compatibility wrapper akan menampilkan deprecation warning tapi tetap berfungsi.

## 🧪 Testing

```javascript
const storage = require('./utils/storage');

// Switch provider untuk testing
await storage.init('local', {
  basePath: '/tmp/test-uploads',
  publicBaseUrl: 'http://localhost:3500',
});

// Upload test file
const result = await storage.uploadFile('/tmp/test.jpg', 'test/file.jpg');
console.log(result.url);

// Clean up
await storage.deleteFile('test/file.jpg');
storage.reset();
```

## 🛠️ Architecture

```
src/utils/storage/
├── index.js              # Facade API (entry point)
├── BaseAdapter.js        # Abstract base class
├── utils.js              # Path normalization, validators
└── providers/
    ├── local.js          # Local filesystem provider
    ├── s3.js             # AWS S3 provider
    ├── cloudinary.js     # Cloudinary provider
    ├── supabase.js       # Supabase provider
    ├── gcp.js            # Google Cloud Storage
    └── azure.js          # Azure Blob Storage
```

### Design Patterns

- **Factory Pattern:** Dynamic provider selection via `createStorage()`
- **Adapter Pattern:** Uniform interface across different storage backends
- **Singleton Pattern:** Single storage instance per process (lazy init)
- **Strategy Pattern:** Pluggable storage strategies

## 📝 Notes

1. **Path normalization:** Semua backslashes dikonversi ke forward slashes
2. **Leading slashes:** Dihapus otomatis dari destination paths
3. **Content-Type:** Auto-detected dari file extension jika tidak diset
4. **Lazy initialization:** Provider hanya di-init saat pertama kali digunakan
5. **Environment validation:** Warning jika env vars required tidak diset

## 🐛 Troubleshooting

### Error: "AWS SDK not installed"

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Error: "Missing SUPABASE_URL, SUPABASE_KEY or SUPABASE_BUCKET"

Pastikan `.env` sudah diisi:
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-key
SUPABASE_BUCKET=your-bucket
```

### File tidak bisa diakses (404)

- **Local:** Pastikan `STORAGE_PUBLIC_BASE_URL` dan web server serve path yang benar
- **S3:** Cek bucket policy dan ACL (`public-read`)
- **Cloudinary:** Cek public_id dan folder structure
- **Supabase:** Pastikan bucket public atau gunakan signed URL

## 📚 Further Reading

- [AWS S3 SDK v3 Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Google Cloud Storage Node.js](https://cloud.google.com/nodejs/docs/reference/storage/latest)
- [Azure Blob Storage SDK](https://learn.microsoft.com/en-us/javascript/api/@azure/storage-blob)

---

**Created:** December 2025  
**Maintainer:** Development Team  
**License:** MIT
