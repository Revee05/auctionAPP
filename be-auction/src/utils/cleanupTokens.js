/**
 * cleanupTokens.js
 * 
 * Utility untuk membersihkan refresh token yang sudah expired atau revoked.
 * Jalankan secara periodik dengan cron job atau scheduler.
 */

import { prisma } from '../../lib/prisma.js';

/**
 * Clean up expired and old revoked tokens
 * @param {number} daysOld - Hapus token revoked yang lebih tua dari X hari (default: 30)
 */
export async function cleanupExpiredTokens(daysOld = 30) {
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  try {
    // Delete expired tokens
    const expiredResult = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: now }
      }
    });

    // Delete old revoked tokens
    const revokedResult = await prisma.refreshToken.deleteMany({
      where: {
        revoked: true,
        lastUsedAt: { lt: cutoffDate }
      }
    });

    console.log(`[CLEANUP] Deleted ${expiredResult.count} expired tokens`);
    console.log(`[CLEANUP] Deleted ${revokedResult.count} old revoked tokens (older than ${daysOld} days)`);

    return {
      expiredDeleted: expiredResult.count,
      revokedDeleted: revokedResult.count
    };
  } catch (error) {
    console.error('[CLEANUP] Error cleaning up tokens:', error);
    throw error;
  }
}

/**
 * Clean up expired email verification tokens
 */
export async function cleanupExpiredVerificationTokens() {
  const now = new Date();

  try {
    // Clear expired verification tokens (both plain and hashed)
    const result = await prisma.user.updateMany({
      where: {
        emailVerified: false,
        verificationTokenExpiry: { lt: now },
        OR: [
          { verificationToken: { not: null } },
          { verificationTokenHash: { not: null } }
        ]
      },
      data: {
        verificationToken: null,
        verificationTokenHash: null,
        verificationTokenExpiry: null
      }
    });

    console.log(`[CLEANUP] Cleared ${result.count} expired verification tokens`);
    return result.count;
  } catch (error) {
    console.error('[CLEANUP] Error cleaning up verification tokens:', error);
    throw error;
  }
}

/**
 * Get statistics about refresh tokens
 */
export async function getTokenStats() {
  try {
    const [total, active, revoked, expired] = await Promise.all([
      prisma.refreshToken.count(),
      prisma.refreshToken.count({
        where: {
          revoked: false,
          expiresAt: { gt: new Date() }
        }
      }),
      prisma.refreshToken.count({
        where: { revoked: true }
      }),
      prisma.refreshToken.count({
        where: {
          revoked: false,
          expiresAt: { lt: new Date() }
        }
      })
    ]);

    return { total, active, revoked, expired };
  } catch (error) {
    console.error('[CLEANUP] Error getting token stats:', error);
    throw error;
  }
}

// CLI runner (if you want to run this directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[CLEANUP] Starting token cleanup...');
  
  getTokenStats()
    .then(stats => {
      console.log('[CLEANUP] Current stats:', stats);
      return cleanupExpiredTokens();
    })
    .then(() => {
      console.log('[CLEANUP] Cleaning up verification tokens...');
      return cleanupExpiredVerificationTokens();
    })
    .then(() => {
      console.log('[CLEANUP] Cleanup complete');
      return getTokenStats();
    })
    .then(stats => {
      console.log('[CLEANUP] Final stats:', stats);
      process.exit(0);
    })
    .catch(err => {
      console.error('[CLEANUP] Cleanup failed:', err);
      process.exit(1);
    });
}
