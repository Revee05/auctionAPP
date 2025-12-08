import { authService } from '../services/authService.js'
import { prisma } from '../../lib/prisma.js'
import tokenHelper from '../utils/tokenHelper.js'

// ============================================
// AUTH CONTROLLER - Cookie-based Authentication
// ============================================

export const authController = {
  // =========================
  // REGISTER - Daftar user baru
  // =========================
  async register(request, reply) {
    try {
      const { name, email, password, roleName } = request.body
      
      if (!name || !email || !password) {
        return reply.status(400).send({ 
          error: 'Name, email, and password are required' 
        })
      }
      
      await authService.register({ name, email, password, roleName })
      
      return reply.status(201).send({
        message: 'Registration successful. Please login.'
      })
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  },

  // =========================
  // LOGIN - Masuk dengan cookie
  // =========================
  async login(request, reply) {
    try {
      const { email, password } = request.body
      
      if (!email || !password) {
        return reply.status(400).send({ 
          error: 'Email and password are required' 
        })
      }
      
      const result = await authService.login(email, password)
      
      // Set access token di HTTP-only cookie (names/options from env via helper)
      reply.setCookie(tokenHelper.ACCESS_COOKIE_NAME, result.accessToken, tokenHelper.getCookieOptions())

      // Set refresh token di HTTP-only cookie
      // refresh cookie can be longer lived; use cookie options with explicit maxAge (ms)
      const refreshMaxAgeMs = (() => {
        // parse JWT_REFRESH_EXPIRES_IN like '7d' to ms
        const v = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        const match = String(v).match(/^(\d+)([dhm])$/)
        if (match) {
          const num = parseInt(match[1], 10)
          const unit = match[2]
          if (unit === 'd') return num * 24 * 60 * 60 * 1000
          if (unit === 'h') return num * 60 * 60 * 1000
          return num * 60 * 1000
        }
        return 7 * 24 * 60 * 60 * 1000
      })()

      reply.setCookie(tokenHelper.REFRESH_COOKIE_NAME, result.refreshToken, tokenHelper.getCookieOptions({ maxAge: refreshMaxAgeMs }))
      
      return reply.send({ 
        message: 'Login successful',
        user: result.user
      })
    } catch (error) {
      return reply.status(401).send({ error: error.message })
    }
  },

  // =========================
  // REFRESH - Perbarui access token
  // =========================
  async refresh(request, reply) {
    try {
      const refreshToken = request.cookies[tokenHelper.REFRESH_COOKIE_NAME]
      
      if (!refreshToken) {
        return reply.status(401).send({ error: 'No refresh token provided' })
      }
      
      const result = await authService.refreshAccessToken(refreshToken)
      
      // Set access token baru di cookie
      reply.setCookie(tokenHelper.ACCESS_COOKIE_NAME, result.accessToken, tokenHelper.getCookieOptions())
      
      return reply.send({ 
        message: 'Token refreshed successfully',
        user: result.user
      })
    } catch (error) {
      return reply.status(401).send({ error: error.message })
    }
  },

  // =========================
  // LOGOUT - Hapus token & cookie
  // =========================
  async logout(request, reply) {
    try {
      const refreshToken = request.cookies[tokenHelper.REFRESH_COOKIE_NAME]
      
      // Hapus refresh token dari database
      await authService.logout(refreshToken)
      
      // Hapus cookie
      reply.clearCookie(tokenHelper.ACCESS_COOKIE_NAME, { path: '/' })
      reply.clearCookie(tokenHelper.REFRESH_COOKIE_NAME, { path: '/' })
      
      return reply.send({ message: 'Logged out successfully' })
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  },

  // =========================
  // LOGOUT ALL - Hapus semua sesi user
  // =========================
  async logoutAll(request, reply) {
    try {
      const userId = request.user.userId
      
      // Hapus semua refresh token user
      await authService.logoutAll(userId)
      
      // Hapus cookie
      reply.clearCookie(tokenHelper.ACCESS_COOKIE_NAME, { path: '/' })
      reply.clearCookie(tokenHelper.REFRESH_COOKIE_NAME, { path: '/' })
      
      return reply.send({ message: 'Logged out from all devices' })
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  },

  // =========================
  // GET CURRENT USER (Me)
  // =========================
  async me(request, reply) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          roles: true
        }
      })

      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }

      const formattedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles.map(ur => ur.role.name),
        createdAt: user.createdAt
      }

      return reply.send({ user: formattedUser })
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  },

  // =========================
  // CHECK STATUS - Cek status login
  // =========================
  async status(request, reply) {
    try {
      const accessToken = request.cookies[tokenHelper.ACCESS_COOKIE_NAME]
      const refreshToken = request.cookies[tokenHelper.REFRESH_COOKIE_NAME]
      
      return reply.send({
        isLoggedIn: !!(accessToken || refreshToken),
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      })
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  }
}
