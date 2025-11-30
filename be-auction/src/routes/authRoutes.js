import { authController } from '../controllers/authController.js'
import { authenticate } from '../middlewares/authMiddleware.js'

export async function authRoutes(fastify, options) {
  // Public routes
  fastify.post('/register', authController.register)
  fastify.post('/login', authController.login)
  
  // Token management routes
  fastify.post('/refresh', authController.refresh)
  fastify.post('/logout', authController.logout)
  fastify.post('/logout-all', { preHandler: [authenticate] }, authController.logoutAll)
  
  // Protected routes
  fastify.get('/me', { preHandler: [authenticate] }, authController.me)
  fastify.get('/status', authController.status)
}
