import { authService } from '../services/authService.js'
import { prisma } from '../../lib/prisma.js'

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
      
      // Set access token di HTTP-only cookie
      reply.setCookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        // maxAge: 15 * 60 * 1000, // 15 menit
        maxAge:  20// 20 detik (untuk testing)
      })

      // Set refresh token di HTTP-only cookie
      reply.setCookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 hari
      })
      
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
      const refreshToken = request.cookies.refresh_token
      
      if (!refreshToken) {
        return reply.status(401).send({ error: 'No refresh token provided' })
      }
      
      const result = await authService.refreshAccessToken(refreshToken)
      
      // Set access token baru di cookie
      reply.setCookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        // maxAge: 15 * 60 * 1000, // 15 menit
        maxAge:  20// 20 detik (untuk testing)
      })
      
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
      const refreshToken = request.cookies.refresh_token
      
      // Hapus refresh token dari database
      await authService.logout(refreshToken)
      
      // Hapus cookie
      reply.clearCookie('access_token', { path: '/' })
      reply.clearCookie('refresh_token', { path: '/' })
      
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
      reply.clearCookie('access_token', { path: '/' })
      reply.clearCookie('refresh_token', { path: '/' })
      
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
      const accessToken = request.cookies.access_token
      const refreshToken = request.cookies.refresh_token
      
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
