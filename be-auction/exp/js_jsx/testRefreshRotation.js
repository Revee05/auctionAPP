/**
 * testRefreshRotation.js
 * 
 * Script untuk menguji implementasi hashed refresh token dengan rotation.
 * Menguji: login, refresh dengan rotation, reuse detection, dan logout.
 */

import { authService } from '../../src/services/authService.js';
import { prisma } from '../../lib/prisma.js';
import tokenHelper from '../../src/utils/tokenHelper.js';

async function testHashedRefreshToken() {
  console.log('\n========================================');
  console.log('Testing Hashed Refresh Token with Rotation');
  console.log('========================================\n');

  try {
    // 1. Test Login
    console.log('1. Testing Login with hashed token...');
    const loginResult = await authService.login(
      'superadmin@auctionapp.com',
      'Password123!',
      { ip: '127.0.0.1', deviceInfo: 'Test Script' }
    );
    console.log('✓ Login successful');
    console.log('  User:', loginResult.user.email);
    console.log('  Roles:', loginResult.user.roles);
    
    const firstRefreshToken = loginResult.refreshToken;
    const firstTokenHash = tokenHelper.hashRefreshToken(firstRefreshToken);
    
    // Verify token is hashed in DB
    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: firstTokenHash }
    });
    
    if (!storedToken) {
      throw new Error('Token hash not found in database!');
    }
    
    if (storedToken.token) {
      console.log('  ⚠ Warning: Legacy token field still has value');
    }
    
    console.log('✓ Token hash stored correctly in DB');
    console.log('  Token Hash (first 16 chars):', firstTokenHash.substring(0, 16) + '...');
    console.log('  Expires At:', storedToken.expiresAt);
    console.log('  IP:', storedToken.ip);
    console.log('  Device:', storedToken.deviceInfo);

    // 2. Test Refresh (Rotation)
    console.log('\n2. Testing Token Refresh with Rotation...');
    const refreshResult = await authService.refreshAccessToken(
      firstRefreshToken,
      { ip: '127.0.0.1', deviceInfo: 'Test Script' }
    );
    console.log('✓ Token refreshed successfully');
    console.log('  New access token generated');
    
    const secondRefreshToken = refreshResult.refreshToken;
    const secondTokenHash = tokenHelper.hashRefreshToken(secondRefreshToken);
    
    // Verify old token is revoked
    const oldToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: firstTokenHash }
    });
    
    if (!oldToken.revoked) {
      throw new Error('Old token should be revoked!');
    }
    
    console.log('✓ Old token revoked correctly');
    console.log('  Old token last used:', oldToken.lastUsedAt);
    
    // Verify new token exists
    const newToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: secondTokenHash, revoked: false }
    });
    
    if (!newToken) {
      throw new Error('New token not found!');
    }
    
    console.log('✓ New token created correctly');
    console.log('  New Token Hash (first 16 chars):', secondTokenHash.substring(0, 16) + '...');

    // 3. Test Reuse Detection
    console.log('\n3. Testing Token Reuse Detection...');
    try {
      await authService.refreshAccessToken(
        firstRefreshToken, // Try to use old token again
        { ip: '192.168.1.100', deviceInfo: 'Attacker Script' }
      );
      throw new Error('Reuse should have been detected!');
    } catch (error) {
      if (error.message.includes('reuse detected')) {
        console.log('✓ Token reuse detected correctly');
        console.log('  Error:', error.message);
        
        // Verify all tokens are revoked
        const allTokens = await prisma.refreshToken.findMany({
          where: { userId: loginResult.user.id }
        });
        
        const allRevoked = allTokens.every(t => t.revoked);
        if (!allRevoked) {
          throw new Error('All tokens should be revoked after reuse detection!');
        }
        
        console.log('✓ All user sessions revoked');
        console.log('  Total tokens revoked:', allTokens.length);
      } else {
        throw error;
      }
    }

    // 4. Test Fresh Login After Reuse
    console.log('\n4. Testing Fresh Login After Reuse...');
    const freshLogin = await authService.login(
      'superadmin@auctionapp.com',
      'Password123!',
      { ip: '127.0.0.1', deviceInfo: 'Test Script - Fresh' }
    );
    console.log('✓ Fresh login successful after security event');

    // 5. Test Logout
    console.log('\n5. Testing Logout...');
    await authService.logout(freshLogin.refreshToken);
    
    const loggedOutToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: tokenHelper.hashRefreshToken(freshLogin.refreshToken) }
    });
    
    if (!loggedOutToken.revoked) {
      throw new Error('Token should be revoked after logout!');
    }
    
    console.log('✓ Logout successful');
    console.log('  Token revoked at:', loggedOutToken.lastUsedAt);

    // 6. Token Statistics
    console.log('\n6. Token Statistics:');
    const stats = await prisma.refreshToken.groupBy({
      by: ['revoked'],
      _count: true
    });
    
    stats.forEach(stat => {
      console.log(`  ${stat.revoked ? 'Revoked' : 'Active'}: ${stat._count} tokens`);
    });

    console.log('\n========================================');
    console.log('✓ All Tests Passed Successfully!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n✗ Test Failed!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testHashedRefreshToken()
  .then(() => {
    console.log('Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test suite failed');
    process.exit(1);
  });
