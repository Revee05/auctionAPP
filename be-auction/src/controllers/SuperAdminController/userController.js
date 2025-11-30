import { prisma } from '../../../lib/prisma.js'

// ============================================
// SUPER ADMIN CONTROLLER - Advanced User Management
// Akses: SUPER_ADMIN ONLY
// ============================================

export const superAdminUserController = {
  // =========================
  // DELETE USER
  // Akses: Super Admin Only
  // =========================
  async delete(request, reply) {
    try {
      const { id } = request.params
      
      // Hapus user berdasarkan ID
      await prisma.user.delete({
        where: { id: parseInt(id) }
      })
      
      return reply.send({ message: 'User deleted successfully' })
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  },

  // =========================
  // ASSIGN ROLE TO USER
  // Akses: Super Admin Only
  // =========================
  async assignRole(request, reply) {
    try {
      const { userId } = request.params
      const { roleName } = request.body
      
      if (!roleName) {
        return reply.status(400).send({ error: 'roleName is required' })
      }
      
      // Cari role berdasarkan nama
      const role = await prisma.role.findUnique({ where: { name: roleName } })
      if (!role) {
        return reply.status(404).send({ error: 'Role not found' })
      }
      
      // Tambahkan atau update role pada user
      const userRole = await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: parseInt(userId),
            roleId: role.id
          }
        },
        update: {},
        create: {
          userId: parseInt(userId),
          roleId: role.id
        }
      })
      
      return reply.send({ message: 'Role assigned successfully', userRole })
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  },

  // =========================
  // REMOVE ROLE FROM USER
  // Akses: Super Admin Only
  // =========================
  async removeRole(request, reply) {
    try {
      const { userId } = request.params
      const { roleName } = request.body
      
      if (!roleName) {
        return reply.status(400).send({ error: 'roleName is required' })
      }
      
      // Cari role berdasarkan nama
      const role = await prisma.role.findUnique({ where: { name: roleName } })
      if (!role) {
        return reply.status(404).send({ error: 'Role not found' })
      }
      
      // Hapus role dari user
      await prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId: parseInt(userId),
            roleId: role.id
          }
        }
      })
      
      return reply.send({ message: 'Role removed successfully' })
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  }
}
