import { prisma } from '../../../lib/prisma.js'
import bcrypt from 'bcrypt'

// ============================================
// ADMIN CONTROLLER - User Management
// Akses: ADMIN & SUPER_ADMIN
// ============================================

export const adminUserController = {
  // =========================
  // GET ALL USERS
  // Akses: Admin & Super Admin
  // =========================
  async getAll(request, reply) {
    try {
      // Ambil semua user beserta role-nya
      const users = await prisma.user.findMany({
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      })
      
      // Format agar roles berupa array string
      let formattedUsers = users.map(user => ({
        ...user,
        roles: user.roles.map(ur => ur.role.name)
      }))

      // Jika requester BUKAN SUPER_ADMIN, sembunyikan user yang memiliki role SUPER_ADMIN
      const requesterRoles = request.user?.roles || []
      if (!requesterRoles.includes('SUPER_ADMIN')) {
        formattedUsers = formattedUsers.filter(u => !u.roles.includes('SUPER_ADMIN'))
      }

      return reply.send({ users: formattedUsers })
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  },

  // =========================
  // GET USER BY ID
  // Akses: Admin & Super Admin
  // =========================
  async getById(request, reply) {
    try {
      const { id } = request.params
      
      // Cari user berdasarkan ID beserta role-nya
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      })
      
      if (!user) {
        return reply.status(404).send({ error: 'User not found' })
      }
      
      // Format roles jadi array string
      const formattedUser = {
        ...user,
        roles: user.roles.map(ur => ur.role.name)
      }

      // Jika requester BUKAN SUPER_ADMIN, jangan izinkan melihat user yang punya role SUPER_ADMIN
      const requesterRoles = request.user?.roles || []
      if (formattedUser.roles.includes('SUPER_ADMIN') && !requesterRoles.includes('SUPER_ADMIN')) {
        return reply.status(403).send({ error: 'Access denied. Cannot view SUPER_ADMIN user.' })
      }

      return reply.send({ user: formattedUser })
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  },

  // =========================
  // UPDATE USER
  // Akses: Admin & Super Admin
  // =========================
  async update(request, reply) {
    try {
      const { id } = request.params
      const { name, email, password } = request.body
      // Fetch target user to check roles before allowing update
      const targetUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: {
          roles: {
            include: { role: true }
          }
        }
      })

      if (!targetUser) {
        return reply.status(404).send({ error: 'User not found' })
      }

      const targetRoles = targetUser.roles.map(ur => ur.role.name)
      const requesterRoles = request.user?.roles || []

      // Prevent non-super-admins from editing SUPER_ADMIN users
      if (targetRoles.includes('SUPER_ADMIN') && !requesterRoles.includes('SUPER_ADMIN')) {
        return reply.status(403).send({ error: 'Access denied. Cannot edit SUPER_ADMIN user.' })
      }

      // Prevent admins from editing other admins (unless requester is SUPER_ADMIN)
      if (requesterRoles.includes('ADMIN') && targetRoles.includes('ADMIN') && !requesterRoles.includes('SUPER_ADMIN')) {
        return reply.status(403).send({ error: 'Access denied. Admins cannot edit other admins.' })
      }
      
      // Siapkan data update
      const data = {}
      if (name) data.name = name
      if (email) data.email = email
      if (password) {
        data.password = await bcrypt.hash(password, 10)
      }
      
      // Update user
      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          updatedAt: true
        }
      })
      
      return reply.send({ message: 'User updated successfully', user })
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  }
}
