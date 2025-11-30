import { userController } from '../controllers/AdminController/userController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { authorize } from '../middlewares/rbacMiddleware.js'

export async function userRoutes(fastify, options) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate)
  
  // Get all users - Admin and Super Admin only
  fastify.get('/', {
    preHandler: [authorize('ADMIN', 'SUPER_ADMIN')]
  }, userController.getAll)
  
  // Get user by ID - All authenticated users
  fastify.get('/:id', userController.getById)
  
  // Update user - Admin and Super Admin only
  fastify.put('/:id', {
    preHandler: [authorize('ADMIN', 'SUPER_ADMIN')]
  }, userController.update)
  
  // Delete user - Super Admin only
  fastify.delete('/:id', {
    preHandler: [authorize('SUPER_ADMIN')]
  }, userController.delete)
  
  // Assign role - Super Admin only
  fastify.post('/:userId/roles', {
    preHandler: [authorize('SUPER_ADMIN')]
  }, userController.assignRole)
  
  // Remove role - Super Admin only
  fastify.delete('/:userId/roles', {
    preHandler: [authorize('SUPER_ADMIN')]
  }, userController.removeRole)
}
