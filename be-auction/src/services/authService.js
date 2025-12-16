import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '../../lib/prisma.js'
import tokenHelper from '../utils/tokenHelper.js'
import { sendVerificationEmail } from './emailService.js'

export const authService = {
  // ============================================
  // REGISTER - Daftar user baru
  // ============================================
  async register(data, reqMeta = {}) {
    const { name, email, password, roleName } = data
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new Error('Registration failed. Please check your information.')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate verification token (64 bytes = 128 hex characters)
    const verificationToken = crypto.randomBytes(64).toString('hex')
    // Hash the token for storage (similar to refresh token pattern)
    const verificationTokenHash = tokenHelper.hashRefreshToken(verificationToken)
    // Token expires in 24 hours
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: false,
        verificationToken, // Store plain token for backward compatibility (can be removed later)
        verificationTokenHash, // Store hashed token
        verificationTokenExpiry,
        registrationIp: reqMeta.ip || null
      }
    })

    // Assign role (default COLLECTOR jika tidak diisi)
    const defaultRole = roleName || 'COLLECTOR'
    const role = await prisma.role.findUnique({ where: { name: defaultRole } })
    if (role) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id
        }
      })
    }

    // Send verification email (non-blocking, catch errors)
    try {
      await sendVerificationEmail({
        email: user.email,
        userName: user.name,
        verificationToken
      })
      console.log(`✅ Verification email sent to: ${user.email}`)
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${user.email}:`, error.message)
      // Don't throw error - user is created, they can resend verification later
    }

    return user
  },

  // ============================================
  // LOGIN - Masuk ke sistem
  // ============================================
  async login(email, password, reqMeta = {}) {
    // Find user with roles
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user || !user.password) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    // Check email verification - BLOCK unverified users
    if (!user.emailVerified) {
      throw new Error('EMAIL_NOT_VERIFIED')
    }

    // Extract role names
    const roles = user.roles.map(ur => ur.role.name)

    // Generate access token (short-lived)
    const accessToken = tokenHelper.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles
    })

    // Generate refresh token (long-lived) with hash
    const plainRefreshToken = tokenHelper.generateRefreshToken()
    const tokenHash = tokenHelper.hashRefreshToken(plainRefreshToken)
    const refreshTokenExpiry = tokenHelper.getRefreshTokenExpiryDate()

    // Save ONLY hash to database (not plain token)
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
        deviceInfo: reqMeta.deviceInfo || null,
        ip: reqMeta.ip || null
      }
    })

    return {
      accessToken,
      refreshToken: plainRefreshToken, // Send plain token to client as cookie
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles
      }
    }
  },

  // ============================================
  // REFRESH TOKEN - Dapatkan access token baru dengan rotation
  // ============================================
  async refreshAccessToken(plainRefreshToken, reqMeta = {}) {
    if (!plainRefreshToken) {
      throw new Error('Refresh token required')
    }

    const tokenHash = tokenHelper.hashRefreshToken(plainRefreshToken)

    // Check for reuse detection OUTSIDE transaction to ensure revocation is committed
    const revokedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: true
      }
    })

    if (revokedToken) {
      // Token reuse detected! Revoke all sessions (outside transaction)
      console.error(`[SECURITY] Refresh token reuse detected for userId: ${revokedToken.userId}, ip: ${reqMeta.ip}`)
      await prisma.refreshToken.updateMany({
        where: { userId: revokedToken.userId },
        data: { revoked: true }
      })
      throw new Error('Refresh token reuse detected. All sessions revoked.')
    }

    // Use transaction for atomic rotation
    return await prisma.$transaction(async (tx) => {
      // Find valid token by hash
      const storedToken = await tx.refreshToken.findFirst({
        where: {
          tokenHash,
          revoked: false,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            include: {
              roles: {
                include: {
                  role: true
                }
              }
            }
          }
        }
      })

      if (!storedToken) {
        throw new Error('Invalid or expired refresh token')
      }

      // Token rotation: create new token
      const newPlainToken = tokenHelper.generateRefreshToken()
      const newTokenHash = tokenHelper.hashRefreshToken(newPlainToken)
      const newExpiry = tokenHelper.getRefreshTokenExpiryDate()

      // Insert new token
      await tx.refreshToken.create({
        data: {
          tokenHash: newTokenHash,
          userId: storedToken.userId,
          expiresAt: newExpiry,
          deviceInfo: reqMeta.deviceInfo || storedToken.deviceInfo,
          ip: reqMeta.ip || storedToken.ip
        }
      })

      // Revoke old token (conditional update to handle race conditions)
      const updated = await tx.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          revoked: false
        },
        data: {
          revoked: true,
          lastUsedAt: new Date()
        }
      })

      if (updated.count === 0) {
        // Race condition: token already processed
        console.warn(`[SECURITY] Concurrent token rotation detected for userId: ${storedToken.userId}`)
        throw new Error('Concurrent token rotation detected')
      }

      // Extract role names
      const roles = storedToken.user.roles.map(ur => ur.role.name)

      // Generate new access token
      const accessToken = tokenHelper.generateAccessToken({
        userId: storedToken.user.id,
        email: storedToken.user.email,
        roles
      })

      console.log(`[AUTH] Token rotated for userId: ${storedToken.userId}, ip: ${reqMeta.ip}`)

      return {
        accessToken,
        refreshToken: newPlainToken, // New plain token for client cookie
        user: {
          id: storedToken.user.id,
          name: storedToken.user.name,
          email: storedToken.user.email,
          roles
        }
      }
    })
  },

  // ============================================
  // LOGOUT - Hapus refresh token
  // ============================================
  async logout(plainRefreshToken) {
    if (!plainRefreshToken) {
      return
    }

    const tokenHash = tokenHelper.hashRefreshToken(plainRefreshToken)

    // Revoke refresh token (soft delete)
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true, lastUsedAt: new Date() }
    })
  },

  // ============================================
  // LOGOUT ALL - Hapus semua refresh token user
  // ============================================
  async logoutAll(userId) {
    // Revoke all refresh tokens for this user (soft delete)
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true, lastUsedAt: new Date() }
    })
  },

  // ============================================
  // VERIFY TOKEN - Validasi JWT
  // ============================================
  verifyToken(token) {
    try {
      return tokenHelper.verifyAccessToken(token)
    } catch (error) {
      throw new Error('Invalid token')
    }
  },


  // ============================================
  // ME - Ambil data user saat ini
  // ============================================
  async me(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles.map(ur => ur.role.name),
    }
  },

  // ============================================
  // VERIFY EMAIL - Verifikasi email dengan token
  // ============================================
  async verifyEmail(token, reqMeta = {}) {
    if (!token) {
      throw new Error('Verification token is required')
    }

    // Hash the incoming token to compare with database
    const tokenHash = tokenHelper.hashRefreshToken(token)

    // Find user with valid token (check both hashed and plain for migration compatibility)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            verificationTokenHash: tokenHash,
            verificationTokenExpiry: { gt: new Date() },
            emailVerified: false
          },
          {
            verificationToken: token,
            verificationTokenExpiry: { gt: new Date() },
            emailVerified: false
          }
        ]
      }
    })

    if (!user) {
      throw new Error('Invalid or expired verification token')
    }

    // Update user - mark as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenHash: null,
        verificationTokenExpiry: null,
        verificationIp: reqMeta.ip || null
      }
    })

    console.log(`✅ Email verified for ${user.email} from IP: ${reqMeta.ip || 'unknown'}`)

    return {
      message: 'Email verified successfully',
      email: user.email
    }
  },

  // ============================================
  // RESEND VERIFICATION - Kirim ulang email verifikasi
  // ============================================
  async resendVerification(email) {
    if (!email) {
      throw new Error('Email is required')
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Check if already verified
    if (user.emailVerified) {
      throw new Error('Email is already verified')
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(64).toString('hex')
    const verificationTokenHash = tokenHelper.hashRefreshToken(verificationToken)
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenHash,
        verificationTokenExpiry
      }
    })

    // Send verification email
    try {
      await sendVerificationEmail({
        email: user.email,
        userName: user.name,
        verificationToken
      })
      console.log(`✅ Verification email resent to: ${user.email}`)
    } catch (error) {
      console.error(`❌ Failed to resend verification email to ${user.email}:`, error.message)
      throw new Error('Failed to send verification email. Please try again later.')
    }

    return {
      message: 'Verification email sent successfully',
      email: user.email
    }
  }
}
