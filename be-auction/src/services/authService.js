import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../../lib/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export const authService = {
  // ============================================
  // REGISTER - Daftar user baru
  // ============================================
  async register(data) {
    const { name, email, password, roleName } = data
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new Error('Registration failed. Please check your information.')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
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

    return user
  },

  // ============================================
  // LOGIN - Masuk ke sistem
  // ============================================
  async login(email, password) {
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

    // Extract role names
    const roles = user.roles.map(ur => ur.role.name)

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        roles 
      },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES_IN }
    )

    // Generate refresh token (long-lived)
    const refreshToken = crypto.randomBytes(64).toString('hex')
    const refreshTokenExpiry = new Date()
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7) // 7 days

    // Save refresh token to database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry
      }
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles
      }
    }
  },

  // ============================================
  // REFRESH TOKEN - Dapatkan access token baru
  // ============================================
  async refreshAccessToken(refreshToken) {
    // Find refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
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
      throw new Error('Invalid refresh token')
    }

    // Check if token expired
    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } })
      throw new Error('Refresh token expired')
    }

    // Extract role names
    const roles = storedToken.user.roles.map(ur => ur.role.name)

    // Generate new access token
    const accessToken = jwt.sign(
      { 
        userId: storedToken.user.id, 
        email: storedToken.user.email,
        roles 
      },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES_IN }
    )

    return {
      accessToken,
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name,
        email: storedToken.user.email,
        roles
      }
    }
  },

  // ============================================
  // LOGOUT - Hapus refresh token
  // ============================================
  async logout(refreshToken) {
    if (!refreshToken) {
      return
    }

    // Delete refresh token from database
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    })
  },

  // ============================================
  // LOGOUT ALL - Hapus semua refresh token user
  // ============================================
  async logoutAll(userId) {
    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId }
    })
  },

  // ============================================
  // VERIFY TOKEN - Validasi JWT
  // ============================================
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      throw new Error('Invalid token')
    }
  }
}
