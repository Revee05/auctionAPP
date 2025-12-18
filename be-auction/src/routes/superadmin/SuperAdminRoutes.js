import { superAdminUserController } from '../../controllers/SuperAdminController/userController.js'
import { authenticate } from '../../middlewares/authMiddleware.js'
import { authorize } from '../../middlewares/rbacMiddleware.js'

// ============================================
// SUPER ADMIN ROUTES - Advanced User Management
// Prefix: /api/superadmin/users
// Akses: SUPER_ADMIN ONLY
// ============================================

export async function superAdminUserRoutes(fastify, options) {
  // Semua route memerlukan autentikasi dan role SUPER_ADMIN
  fastify.addHook('preHandler', authenticate)
  fastify.addHook('preHandler', authorize('SUPER_ADMIN'))
  
  // DELETE /api/superadmin/users/:id - Delete user
  fastify.delete('/:id', superAdminUserController.delete)
  
  // POST /api/superadmin/users/:userId/roles - Assign role to user
  fastify.post('/:userId/roles', superAdminUserController.assignRole)
  
  // DELETE /api/superadmin/users/:userId/roles - Remove role from user
  fastify.delete('/:userId/roles', superAdminUserController.removeRole)
  
  // GET /api/superadmin/users - List all users
  fastify.get('/', superAdminUserController.list)
  
  // PUT /api/superadmin/users/:id/ban - Ban user
  fastify.put('/:id/ban', superAdminUserController.banUser)
  
  // PUT /api/superadmin/users/:id/unban - Unban user
  fastify.put('/:id/unban', superAdminUserController.unbanUser)
}
