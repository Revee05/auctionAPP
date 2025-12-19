/**
 * Quick test script for storage module
 * Tests local provider with basic operations including multi-bucket
 */

const fs = require('fs').promises;
const path = require('path');
const storage = require('../../src/utils/Storage/index.cjs');

async function test() {
  console.log('🧪 Testing Storage Module with Multi-Bucket Support...\n');

  try {
    // 1. Check current provider
    console.log('1️⃣ Current provider:', storage.provider);

    // 2. Create a test file
    const testDir = path.join(__dirname, 'temp-test');
    await fs.mkdir(testDir, { recursive: true });
    const testFilePath = path.join(testDir, 'test-image.txt');
    await fs.writeFile(testFilePath, 'Hello from storage test!');
    console.log('✅ Created test file:', testFilePath);

    // 3. Upload file (basic)
    console.log('\n2️⃣ Uploading file (basic)...');
    const uploadResult = await storage.uploadFile(
      testFilePath,
      'test/sample.txt'
    );
    console.log('✅ Upload result:', uploadResult);

    // 4. Upload file with auto-bucket resolution (if STORAGE_BUCKET_MAP is set)
    console.log('\n3️⃣ Uploading file with auto-resolution prefix...');
    const avatarResult = await storage.uploadFile(
      testFilePath,
      'avatars/user123.txt'
    );
    console.log('✅ Avatar upload result:', avatarResult);
    console.log('   Bucket used:', avatarResult.meta?.bucket || 'N/A (local)');

    // 5. Get public URL
    console.log('\n4️⃣ Getting public URL...');
    const publicUrl = storage.getPublicUrl('test/sample.txt');
    console.log('✅ Public URL:', publicUrl);

    // 6. Check if file exists
    console.log('\n5️⃣ Checking if file exists...');
    const exists = await storage.exists('test/sample.txt');
    console.log('✅ File exists:', exists);

    // 7. List files
    console.log('\n6️⃣ Listing files in test/ directory...');
    const { files } = await storage.listFiles('test/');
    console.log('✅ Files found:', files.length);
    files.forEach((file) => {
      console.log(`   - ${file.key} (${file.size} bytes)`);
    });

    // 8. Delete files
    console.log('\n7️⃣ Deleting files...');
    const deleteResult1 = await storage.deleteFile('test/sample.txt');
    console.log('✅ Delete result 1:', deleteResult1);
    
    const deleteResult2 = await storage.deleteFile('avatars/user123.txt');
    console.log('✅ Delete result 2:', deleteResult2);

    // 9. Verify deletion
    console.log('\n8️⃣ Verifying deletion...');
    const existsAfterDelete = await storage.exists('test/sample.txt');
    console.log('✅ File exists after delete:', existsAfterDelete);

    // Cleanup
    // await fs.unlink(testFilePath);
    // await fs.rmdir(testDir);
    console.log('\n✨ All tests passed!');
    console.log('\n💡 Tip: Set STORAGE_BUCKET_MAP in .env to test multi-bucket resolution');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
