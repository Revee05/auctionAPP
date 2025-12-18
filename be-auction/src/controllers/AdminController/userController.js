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
      // Query params: ?limit=20&cursor=<cursorValue>&sortBy=id|name&sortOrder=asc|desc
      const { limit: limitQ, cursor: cursorQ, sortBy: sortByQ, sortOrder: sortOrderQ, q: qQ } = request.query || {}
      let limit = parseInt(limitQ, 10)
      if (Number.isNaN(limit) || limit <= 0) limit = 20
      limit = Math.min(limit, 100)

      const requesterRoles = request.user?.roles || []
      const isSuperAdmin = requesterRoles.includes('SUPER_ADMIN')

      // Sort configuration
      const sortBy = sortByQ === 'name' ? 'name' : 'id'
      const sortOrder = sortOrderQ === 'desc' ? 'desc' : 'asc'

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

      // Server-side search: match name or email (case-insensitive)
      if (qQ) {
        where.OR = [
          { name: { contains: String(qQ), mode: 'insensitive' } },
          { email: { contains: String(qQ), mode: 'insensitive' } }
        ]
      }

      // Parse cursor - cursor format depends on sortBy field
      let cursorObj = null
      if (cursorQ) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cursorQ))
          if (sortBy === 'id') {
            const cursorId = parseInt(parsed.id, 10)
            if (Number.isNaN(cursorId)) {
              return reply.status(400).send({ error: 'Invalid cursor' })
            }
            cursorObj = { id: cursorId }
          } else {
            // sortBy === 'name'
            if (!parsed.name || !parsed.id) {
              return reply.status(400).send({ error: 'Invalid cursor' })
            }
            cursorObj = { name: parsed.name, id: parseInt(parsed.id, 10) }
          }

          // Validate cursor user exists and is allowed
          if (!isSuperAdmin && cursorObj.id) {
            const cursorUser = await prisma.user.findUnique({
              where: { id: cursorObj.id },
              include: { roles: { include: { role: true } } }
            })
            if (!cursorUser) return reply.status(400).send({ error: 'Invalid cursor' })
            const cursorUserRoles = cursorUser.roles.map(r => r.role.name)
            if (cursorUserRoles.includes('SUPER_ADMIN')) {
              return reply.status(403).send({ error: 'Access denied. Invalid cursor.' })
            }
          }
        } catch (e) {
          return reply.status(400).send({ error: 'Invalid cursor format' })
        }
      }

      // Build orderBy - for name, we need secondary sort by id for consistency
      const orderBy = sortBy === 'name'
        ? [{ name: sortOrder }, { id: 'asc' }]
        : { id: sortOrder }

      const findOpts = {
        where,
        include: { roles: { include: { role: true } } },
        orderBy,
        take: limit + 1
      }

      if (cursorObj) {
        // Prisma cursor must reference a unique field or a defined compound unique.
        // Our schema doesn't define a compound unique on (name, id), so always use id as cursor.
        findOpts.cursor = { id: cursorObj.id }
        findOpts.skip = 1
      }

      const users = await prisma.user.findMany(findOpts)

      const hasMore = users.length > limit
      const pageItems = hasMore ? users.slice(0, limit) : users

      const formattedUsers = pageItems.map(user => ({
        ...user,
        roles: Array.isArray(user.roles) ? user.roles.map(ur => ur.role.name) : [],
        status: user.status || 'ACTIVE'
      }))

      // Compute counts from DB (respect current visibility/filtering rules)
      // baseWhere already contains visibility filters (e.g. exclude SUPER_ADMIN for non-super-admins)
      const baseWhere = where
      const totalUsers = await prisma.user.count({ where: baseWhere })
      const activeUsers = await prisma.user.count({ where: { ...baseWhere, status: 'ACTIVE' } })
      const adminNames = isSuperAdmin ? ['ADMIN', 'SUPER_ADMIN'] : ['ADMIN']
      const adminCount = await prisma.user.count({ where: { ...baseWhere, roles: { some: { role: { name: { in: adminNames } } } } } })

      // Generate next cursor
      let nextCursor = null
      if (hasMore && pageItems.length > 0) {
        const lastItem = pageItems[pageItems.length - 1]
        if (sortBy === 'id') {
          nextCursor = encodeURIComponent(JSON.stringify({ id: lastItem.id }))
        } else {
          nextCursor = encodeURIComponent(JSON.stringify({ name: lastItem.name, id: lastItem.id }))
        }
      }

      return reply.send({ users: formattedUsers, nextCursor, hasNextPage: !!nextCursor, totalUsers, activeUsers, adminCount })
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
        roles: Array.isArray(user.roles) ? user.roles.map(ur => ur.role.name) : []
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
  },

  // =========================
  // BAN USER
  // Akses: Admin & Super Admin
  // Admin can ban USER, ARTIST, COLLECTOR only (not ADMIN or SUPER_ADMIN)
  // =========================
  async banUser(request, reply) {
    try {
      const { id } = request.params
      const requesterRoles = request.user?.roles || []
      
      // Fetch target user to check roles before allowing ban
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

      // Prevent banning self
      if (request.user?.id === parseInt(id)) {
        return reply.status(403).send({ error: 'You cannot ban yourself' })
      }

      // Admin restrictions: cannot ban ADMIN or SUPER_ADMIN
      if (requesterRoles.includes('ADMIN') && !requesterRoles.includes('SUPER_ADMIN')) {
        if (targetRoles.includes('ADMIN') || targetRoles.includes('SUPER_ADMIN')) {
          return reply.status(403).send({ error: 'Admins cannot ban other admins or super admins' })
        }
      }

      // Update user status to BANNED
      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { status: 'BANNED' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          updatedAt: true
        }
      })

      return reply.send({ message: 'User banned successfully', user })
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  },

  // =========================
  // UNBAN USER
  // Akses: Admin & Super Admin
  // =========================
  async unbanUser(request, reply) {
    try {
      const { id } = request.params
      const requesterRoles = request.user?.roles || []
      
      // Fetch target user to check roles before allowing unban
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

      // Admin restrictions: cannot unban ADMIN or SUPER_ADMIN
      if (requesterRoles.includes('ADMIN') && !requesterRoles.includes('SUPER_ADMIN')) {
        if (targetRoles.includes('ADMIN') || targetRoles.includes('SUPER_ADMIN')) {
          return reply.status(403).send({ error: 'Admins cannot unban other admins or super admins' })
        }
      }

      // Update user status to ACTIVE
      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          updatedAt: true
        }
      })

      return reply.send({ message: 'User unbanned successfully', user })
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  }
}
