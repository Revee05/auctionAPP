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
      // Cursor-based pagination
      // Query params: ?limit=20&cursor=<lastId>
      const { limit: limitQ, cursor: cursorQ } = request.query || {}
      let limit = parseInt(limitQ, 10)
      if (Number.isNaN(limit) || limit <= 0) limit = 20
      limit = Math.min(limit, 100)

      const requesterRoles = request.user?.roles || []
      const isSuperAdmin = requesterRoles.includes('SUPER_ADMIN')

      // If requester is NOT super admin, exclude SUPER_ADMIN users at DB level
      const where = {}
      if (!isSuperAdmin) {
        where.roles = {
          none: {
            role: {
              name: 'SUPER_ADMIN'
            }
          }
        }
      }

      // Validate cursor when present: ensure cursor user exists and is allowed
      let cursorId = null
      if (cursorQ) {
        cursorId = parseInt(cursorQ, 10)
        if (Number.isNaN(cursorId)) {
          return reply.status(400).send({ error: 'Invalid cursor' })
        }

        if (!isSuperAdmin) {
          const cursorUser = await prisma.user.findUnique({
            where: { id: cursorId },
            include: { roles: { include: { role: true } } }
          })
          if (!cursorUser) return reply.status(400).send({ error: 'Invalid cursor' })
          const cursorUserRoles = cursorUser.roles.map(r => r.role.name)
          if (cursorUserRoles.includes('SUPER_ADMIN')) {
            return reply.status(403).send({ error: 'Access denied. Invalid cursor.' })
          }
        }
      }

      // Fetch limit+1 so we can detect if there's a next page
      // Support sorting by id ascending or descending via ?sort=asc|desc
      const sortQ = (request.query && request.query.sort) || 'asc'
      const sortOrder = sortQ === 'desc' ? 'desc' : 'asc'

      const findOpts = {
        where,
        include: { roles: { include: { role: true } } },
        orderBy: { id: sortOrder },
        take: limit + 1
      }
      if (cursorId) {
        findOpts.cursor = { id: cursorId }
        findOpts.skip = 1
      }

      const users = await prisma.user.findMany(findOpts)

      const hasMore = users.length > limit
      const pageItems = hasMore ? users.slice(0, limit) : users

      const formattedUsers = pageItems.map(user => ({
        ...user,
        roles: user.roles.map(ur => ur.role.name)
      }))

      const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null

      return reply.send({ users: formattedUsers, nextCursor, hasNextPage: !!nextCursor })
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
