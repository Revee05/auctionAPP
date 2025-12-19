/**
 * Example: Multi-Bucket Usage in Real Application
 * Demonstrates how to use multi-bucket storage for different asset types
 */

const storage = require('../../src/utils/Storage/index.cjs');

// ============================================
// Example 1: User Avatar Upload
// ============================================
async function uploadUserAvatar(userId, filePath) {
  try {
    // Upload to 'avatars/' prefix
    // If STORAGE_BUCKET_MAP has avatars=user-avatars-bucket,
    // it will automatically use that bucket
    const result = await storage.uploadFile(
      filePath,
      `avatars/user_${userId}.jpg`
    );
    
    console.log('Avatar uploaded to:', result.url);
    console.log('Bucket used:', result.meta?.bucket || 'default');
    
    return {
      url: result.url,
      key: result.key,
    };
  } catch (error) {
    console.error('Avatar upload failed:', error.message);
    throw error;
  }
}

// ============================================
// Example 2: Auction Item Images with Multiple Sizes
// ============================================
async function uploadAuctionImages(auctionId, imagePaths) {
  try {
    const sizes = ['original', 'large', 'medium', 'thumbnail'];
    const urls = {};
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      
      // Upload multiple sizes
      // All will auto-resolve to same bucket based on 'auctions' prefix
      for (const size of sizes) {
        const result = await storage.uploadFile(
          imagePath,
          `auctions/${auctionId}/image_${i}_${size}.jpg`
        );
        
        if (!urls[i]) urls[i] = {};
        urls[i][size] = result.url;
      }
    }
    
    console.log('Auction images uploaded:', Object.keys(urls).length, 'images');
    return urls;
  } catch (error) {
    console.error('Auction images upload failed:', error.message);
    throw error;
  }
}

// ============================================
// Example 3: Document Upload with Manual Bucket Override
// ============================================
async function uploadDocument(documentType, filePath, isArchive = false) {
  try {
    const timestamp = Date.now();
    const filename = `${documentType}_${timestamp}.pdf`;
    
    // For archived documents, manually override to use archive bucket
    const options = isArchive ? { bucket: 'archive-bucket' } : {};
    
    const result = await storage.uploadFile(
      filePath,
      `documents/${filename}`,
      options
    );
    
    console.log('Document uploaded:', result.url);
    console.log('Is archived:', isArchive);
    console.log('Bucket used:', result.meta?.bucket || 'default');
    
    return {
      url: result.url,
      key: result.key,
      isArchive,
    };
  } catch (error) {
    console.error('Document upload failed:', error.message);
    throw error;
  }
}

// ============================================
// Example 4: List Files from Specific Category
// ============================================
async function listUserAvatars(limit = 10) {
  try {
    // List files with 'avatars/' prefix
    // Will automatically use the correct bucket
    const { files } = await storage.listFiles('avatars/', { limit });
    
    console.log('Found', files.length, 'avatars');
    return files.map(file => ({
      key: file.key,
      url: storage.getPublicUrl(file.key),
      size: file.size,
      modified: file.modified,
    }));
  } catch (error) {
    console.error('List avatars failed:', error.message);
    throw error;
  }
}

// ============================================
// Example 5: Delete Old Files (Cleanup)
// ============================================
async function cleanupOldAuctionImages(auctionId) {
  try {
    // List all images for this auction
    const prefix = `auctions/${auctionId}/`;
    const { files } = await storage.listFiles(prefix);
    
    console.log('Found', files.length, 'files to delete');
    
    // Delete all files
    const deletePromises = files.map(file => 
      storage.deleteFile(file.key)
    );
    
    const results = await Promise.all(deletePromises);
    const successCount = results.filter(r => r.ok).length;
    
    console.log('Deleted', successCount, 'files successfully');
    return { deleted: successCount, total: files.length };
  } catch (error) {
    console.error('Cleanup failed:', error.message);
    throw error;
  }
}

// ============================================
// Example 6: Copy File Between Buckets
// ============================================
async function archiveAuctionImages(auctionId) {
  try {
    const prefix = `auctions/${auctionId}/`;
    const { files } = await storage.listFiles(prefix);
    
    console.log('Archiving', files.length, 'files...');
    
    // For cloud providers, you would:
    // 1. Download from original bucket
    // 2. Upload to archive bucket
    // 3. Delete from original bucket
    
    // Note: For local provider, this would move files to different subfolder
    const archiveResults = [];
    
    for (const file of files) {
      // This is simplified - in real implementation you'd handle downloads/uploads
      const newKey = `archive/${file.key}`;
      
      // Move logic here...
      console.log(`Would move ${file.key} to ${newKey}`);
      
      archiveResults.push({
        from: file.key,
        to: newKey,
      });
    }
    
    return archiveResults;
  } catch (error) {
    console.error('Archive failed:', error.message);
    throw error;
  }
}

// ============================================
// Example 7: Batch Upload with Progress
// ============================================
async function batchUploadWithProgress(files, prefix = 'uploads/') {
  console.log('Starting batch upload of', files.length, 'files...');
  
  const results = [];
  let completed = 0;
  
  for (const file of files) {
    try {
      const result = await storage.uploadFile(
        file.path,
        `${prefix}${file.name}`
      );
      
      completed++;
      results.push({ 
        success: true, 
        file: file.name, 
        url: result.url 
      });
      
      // Progress logging
      const progress = Math.round((completed / files.length) * 100);
      console.log(`Progress: ${progress}% (${completed}/${files.length})`);
    } catch (error) {
      results.push({ 
        success: false, 
        file: file.name, 
        error: error.message 
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`Batch upload complete: ${successCount}/${files.length} successful`);
  
  return results;
}

// ============================================
// DEMO: Run Examples
// ============================================
async function demo() {
  console.log('🚀 Multi-Bucket Storage Examples\n');
  console.log('═'.repeat(50));
  
  // Note: These are example calls - adjust paths as needed
  console.log('\n📝 Example functions ready to use:');
  console.log('  - uploadUserAvatar(userId, filePath)');
  console.log('  - uploadAuctionImages(auctionId, imagePaths)');
  console.log('  - uploadDocument(type, filePath, isArchive)');
  console.log('  - listUserAvatars(limit)');
  console.log('  - cleanupOldAuctionImages(auctionId)');
  console.log('  - archiveAuctionImages(auctionId)');
  console.log('  - batchUploadWithProgress(files, prefix)');
  
  console.log('\n💡 Configuration:');
  console.log('  STORAGE_PROVIDER:', process.env.STORAGE_PROVIDER || 'local');
  console.log('  STORAGE_BUCKET_MAP:', process.env.STORAGE_BUCKET_MAP || 'not set');
  
  console.log('\n✅ To use these functions, import them in your code:');
  console.log('  const { uploadUserAvatar } = require("./examples/multi-bucket-usage");');
}

// Run demo if called directly
if (require.main === module) {
  demo().catch(console.error);
}

// Export functions for use in other modules
module.exports = {
  uploadUserAvatar,
  uploadAuctionImages,
  uploadDocument,
  listUserAvatars,
  cleanupOldAuctionImages,
  archiveAuctionImages,
  batchUploadWithProgress,
};
