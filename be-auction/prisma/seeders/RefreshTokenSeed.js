import 'dotenv/config'
import { prisma } from './prismaClient.js'
import tokenHelper from '../../src/utils/tokenHelper.js'

export async function seedRefreshTokens() {
  // Fetch all users and create one refresh token per user if none exist
  const users = await prisma.user.findMany()
  console.log(`RefreshTokenSeed: found ${Array.isArray(users) ? users.length : 0} users`)

  const printed = []

  for (const u of users) {
    const existing = await prisma.refreshToken.findFirst({ where: { userId: u.id } })
    if (existing) continue

    const plain = tokenHelper.generateRefreshToken()
    const hash = tokenHelper.hashRefreshToken(plain)
    const expiresAt = tokenHelper.getRefreshTokenExpiryDate()

    await prisma.refreshToken.create({
      data: {
        tokenHash: hash,
        userId: u.id,
        expiresAt,
        deviceInfo: 'seed',
        ip: '127.0.0.1'
      }
    })

    // Keep plain tokens for output for all users (useful for testing)
    if (u.email) {
      printed.push({ email: u.email, token: plain })
    }
  }

  if (printed.length > 0) {
    console.log('Seeded refresh tokens (plain tokens printed for all users):')
    for (const p of printed) {
      console.log(`- ${p.email}: ${p.token}`)
    }
  } else {
    console.log('Seeded refresh tokens (no users found or no tokens created)')
  }
}
