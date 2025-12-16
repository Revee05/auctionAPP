import { authController } from '../controllers/authController.js'
import { authenticate } from '../middlewares/authMiddleware.js'

export async function authRoutes(fastify, options) {
  // Rate limiting configuration
  const registerRateLimit = {
    config: {
      rateLimit: {
        max: 5, // 5 requests
        timeWindow: '15 minutes'
      }
    }
  }

  const loginRateLimit = {
    config: {
      rateLimit: {
        max: 5, // 5 login attempts
        timeWindow: '15 minutes',
        errorResponseBuilder: (request, context) => ({
          error: 'Too many login attempts. Please try again later.',
          retryAfter: context.after
        })
      }
    }
  }

  const resendRateLimit = {
    config: {
      rateLimit: {
        max: 3, // 3 requests
        timeWindow: '15 minutes'
      }
    }
  }

  const verifyRateLimit = {
    config: {
      rateLimit: {
        max: 10, // 10 requests
        timeWindow: '15 minutes'
      }
    }
  }

  // Public routes with rate limiting
  fastify.post('/register', registerRateLimit, authController.register)
  fastify.post('/login', loginRateLimit, authController.login)
  
  // Email verification routes (public) with rate limiting
  fastify.get('/verify-email', verifyRateLimit, authController.verifyEmail)
  fastify.post('/resend-verification', resendRateLimit, authController.resendVerification)
  
  // Token management routes
  fastify.post('/refresh', authController.refresh)
  fastify.post('/logout', authController.logout)
  fastify.post('/logout-all', { preHandler: [authenticate] }, authController.logoutAll)
  
  // Protected routes
  fastify.get('/me', { preHandler: [authenticate] }, authController.me)
  fastify.put('/profile', { preHandler: [authenticate] }, authController.updateProfile)
  fastify.get('/status', authController.status)
}
