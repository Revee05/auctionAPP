# Multi-Bucket Storage Guide

## Overview

Storage utility sekarang mendukung multiple buckets/containers dengan dua cara:
1. **Auto-resolution** - Bucket dipilih otomatis berdasarkan prefix key
2. **Manual override** - Bucket dispesifikasikan langsung pada setiap operasi

## Konfigurasi

### 1. Environment Variable

Tambahkan `STORAGE_BUCKET_MAP` di `.env`:

```env
# Format: prefix1=bucket1,prefix2=bucket2,default=default-bucket
STORAGE_BUCKET_MAP=avatars=user-avatars-bucket,auctions=auction-images-bucket,documents=docs-bucket,default=main-bucket
```

### 2. Cara Kerja Auto-Resolution

- Sistem membaca segment pertama dari key (sebelum `/`)
- Jika segment cocok dengan prefix di map, gunakan bucket tersebut
- Jika tidak cocok, gunakan bucket `default` dari map
- Jika tidak ada `default`, gunakan bucket utama dari provider config

**Contoh:**
```javascript
// Dengan STORAGE_BUCKET_MAP di atas:

// Key: "avatars/user123.jpg" 
// → Resolved bucket: "user-avatars-bucket"

// Key: "auctions/item456.png" 
// → Resolved bucket: "auction-images-bucket"

// Key: "misc/random.txt" 
// → Resolved bucket: "main-bucket" (default)
```

## Penggunaan

### Auto-Resolution (Recommended)

```javascript
const storage = require('./utils/Storage/index.cjs');

// Upload ke bucket yang di-resolve otomatis dari key prefix
await storage.uploadFile(
  './tmp/photo.jpg',
  'avatars/user123.jpg'  // Auto → user-avatars-bucket
);

await storage.uploadFile(
  './tmp/item.png',
  'auctions/item456.png'  // Auto → auction-images-bucket
);

await storage.uploadFile(
  './tmp/doc.pdf',
  'documents/contract.pdf'  // Auto → docs-bucket
);

await storage.uploadFile(
  './tmp/misc.txt',
  'other/random.txt'  // Auto → main-bucket (default)
);
```

### Manual Override

```javascript
// Override bucket untuk operasi tertentu
await storage.uploadFile(
  './tmp/photo.jpg',
  'special/vip-user.jpg',
  { bucket: 'premium-bucket' }  // Manual override
);

// Delete dari bucket spesifik
await storage.deleteFile(
  'old/file.jpg',
  { bucket: 'archive-bucket' }
);

// List files dari bucket spesifik
const { files } = await storage.listFiles(
  'folder/',
  { bucket: 'backup-bucket' }
);
```

## Provider-Specific Notes

### AWS S3
- `bucket` = S3 bucket name
- URL generation akan menggunakan bucket yang sebenarnya digunakan

### Supabase
- `bucket` = Supabase storage bucket name
- Pastikan bucket sudah dibuat di Supabase dashboard

### GCP Storage
- `bucket` = GCS bucket name
- Credentials harus punya akses ke semua bucket yang digunakan

### Azure Blob
- `bucket` = Container name (dalam Azure terminology)
- Container akan otomatis dibuat jika belum ada

### Local Provider
- `bucket` digunakan sebagai subfolder di dalam `STORAGE_LOCAL_PATH`
- Contoh: bucket=`avatars` → `public/uploads/avatars/`

### Cloudinary
- Cloudinary tidak support multiple "buckets" native
- `bucket` akan diabaikan atau bisa digunakan sebagai folder prefix

## Best Practices

### 1. Organisasi by Purpose
```env
STORAGE_BUCKET_MAP=avatars=users-bucket,products=products-bucket,documents=docs-bucket,default=general-bucket
```

### 2. Organisasi by Access Level
```env
STORAGE_BUCKET_MAP=public=public-bucket,private=private-bucket,archive=archive-bucket,default=public-bucket
```

### 3. Organisasi by Environment
```env
# Development
STORAGE_BUCKET_MAP=default=dev-main-bucket

# Production
STORAGE_BUCKET_MAP=avatars=prod-users,auctions=prod-auctions,default=prod-main
```

## Security Considerations

1. **Permissions**: Pastikan credentials memiliki akses ke semua bucket yang dimapping
2. **ACL/Public Access**: Set ACL sesuai kebutuhan per-bucket
3. **CORS**: Konfigurasi CORS untuk bucket yang diakses dari frontend
4. **Signed URLs**: Untuk bucket private, gunakan signed URLs bukan public URLs

## Example: User Avatar Upload

```javascript
const storage = require('./utils/Storage/index.cjs');
const path = require('path');

async function uploadUserAvatar(userId, filePath) {
  try {
    // Auto-resolve ke 'user-avatars-bucket' jika configured
    const result = await storage.uploadFile(
      filePath,
      `avatars/user_${userId}.jpg`
    );
    
    console.log('Avatar uploaded:', result.url);
    console.log('Bucket used:', result.meta.bucket);
    
    return result.url;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// Usage
await uploadUserAvatar(123, './tmp/photo.jpg');
```

## Example: Auction Images with Multiple Sizes

```javascript
async function uploadAuctionImages(auctionId, imagePath) {
  const sizes = ['original', 'large', 'thumbnail'];
  const urls = {};
  
  for (const size of sizes) {
    // All auto-resolve to 'auction-images-bucket'
    const result = await storage.uploadFile(
      imagePath,
      `auctions/${auctionId}/${size}.jpg`
    );
    urls[size] = result.url;
  }
  
  return urls;
}
```

## Troubleshooting

### Bucket not found
- Pastikan bucket sudah dibuat di cloud provider
- Cek credentials memiliki permission ke bucket tersebut

### Wrong bucket used
- Verifikasi `STORAGE_BUCKET_MAP` di .env
- Check prefix key cocok dengan mapping
- Debug dengan log `result.meta.bucket` untuk lihat bucket yang digunakan

### Permission denied
- Pastikan service account/IAM role punya akses ke semua buckets
- Untuk S3: cek IAM policy
- Untuk Supabase: cek bucket policies & RLS
- Untuk GCP: cek service account permissions

## Migration from Single Bucket

Jika sebelumnya menggunakan single bucket:

1. **Tanpa perubahan code**: Leave `STORAGE_BUCKET_MAP` empty, semua file akan ke default bucket
2. **Gradual migration**: Tambah mapping satu-per-satu sesuai kebutuhan
3. **Full migration**: Set mapping lengkap dan organize existing files by prefix

```javascript
// Before (single bucket)
await storage.uploadFile('./photo.jpg', 'user123.jpg');

// After (multi-bucket, no code change needed)
await storage.uploadFile('./photo.jpg', 'avatars/user123.jpg'); // Auto-resolves
```

## Testing

Jalankan test suite:

```bash
node test-multi-bucket.cjs
```

Test akan memverifikasi:
- Bucket map parsing
- Auto-resolution logic
- Fallback ke default bucket
- Manual override behavior
