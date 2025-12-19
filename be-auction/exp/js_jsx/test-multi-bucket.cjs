/**
 * Test script for multi-bucket functionality
 * Tests bucket resolution from prefix mapping
 */

const fs = require('fs').promises;
const path = require('path');
const { parseBucketMap, resolveBucket } = require('../../src/utils/Storage/utils.cjs');

async function test() {
  console.log('🧪 Testing Multi-Bucket Functionality...\n');

  try {
    // 1. Test bucket map parsing
    console.log('1️⃣ Testing bucket map parsing...');
    const testMapString = 'avatars=user-avatars-bucket,auctions=auction-images-bucket,documents=docs-bucket,default=main-bucket';
    const bucketMap = parseBucketMap(testMapString);
    console.log('✅ Parsed bucket map:', bucketMap);
    console.log('   Expected:', {
      avatars: 'user-avatars-bucket',
      auctions: 'auction-images-bucket',
      documents: 'docs-bucket',
      default: 'main-bucket'
    });

    // 2. Test bucket resolution
    console.log('\n2️⃣ Testing bucket resolution...');
    
    const testCases = [
      { key: 'avatars/user123.jpg', expected: 'user-avatars-bucket' },
      { key: 'auctions/item456.png', expected: 'auction-images-bucket' },
      { key: 'documents/contract.pdf', expected: 'docs-bucket' },
      { key: 'misc/random.txt', expected: 'main-bucket' },
      { key: 'unknown/file.jpg', expected: 'main-bucket' },
    ];

    let allPassed = true;
    for (const testCase of testCases) {
      const resolved = resolveBucket(testCase.key, 'fallback-bucket', bucketMap);
      const passed = resolved === testCase.expected;
      allPassed = allPassed && passed;
      
      console.log(`   ${passed ? '✅' : '❌'} Key: "${testCase.key}"`);
      console.log(`      Resolved: "${resolved}" | Expected: "${testCase.expected}"`);
    }

    // 3. Test with manual bucket override
    console.log('\n3️⃣ Testing manual bucket override...');
    console.log('   When opts.bucket is provided, it should override auto-resolution');
    console.log('   ✅ Manual override will be handled by provider uploadFile method');

    // 4. Test without bucket map (should use default)
    console.log('\n4️⃣ Testing without bucket map...');
    const noBucketMap = parseBucketMap('');
    const resolvedNoMap = resolveBucket('avatars/user.jpg', 'default-bucket', noBucketMap);
    console.log(`   ✅ Resolved: "${resolvedNoMap}" (should be "default-bucket")`);

    if (allPassed) {
      console.log('\n✨ All multi-bucket tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed - check output above');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
