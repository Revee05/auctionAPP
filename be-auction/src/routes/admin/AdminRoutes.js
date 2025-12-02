import { adminUserController } from '../../controllers/AdminController/userController.js'
import { authenticate } from '../../middlewares/authMiddleware.js'
import { authorize } from '../../middlewares/rbacMiddleware.js'

// ============================================
// ADMIN ROUTES - User Management
// Prefix: /api/admin/users
// Akses: ADMIN & SUPER_ADMIN
// ============================================

export async function adminUserRoutes(fastify, options) {
  // Semua route memerlukan autentikasi dan role ADMIN atau SUPER_ADMIN
  fastify.addHook('preHandler', authenticate)
  fastify.addHook('preHandler', authorize('ADMIN', 'SUPER_ADMIN'))
  
  // GET /api/admin/users - Get all users
  fastify.get('/', adminUserController.getAll)
  
  // GET /api/admin/users/:id - Get user by ID
  fastify.get('/:id', adminUserController.getById)
  
  // PUT /api/admin/users/:id - Update user
  fastify.put('/:id', adminUserController.update)
}
