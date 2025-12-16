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
  },

  // =========================
  // LIST ALL USERS (with pagination)
  // Akses: Super Admin Only
  // =========================
  async list(request, reply) {
    try {
      // Cursor-based pagination
      // Query params: ?limit=20&cursor=<cursorValue>&sortBy=id|name&sortOrder=asc|desc
      const { limit: limitQ, cursor: cursorQ, sortBy: sortByQ, sortOrder: sortOrderQ, q: qQ } = request.query || {}
      let limit = parseInt(limitQ, 10)
      if (Number.isNaN(limit) || limit <= 0) limit = 20
      limit = Math.min(limit, 100)

      // Sort configuration
      const sortBy = sortByQ === 'name' ? 'name' : 'id'
      const sortOrder = sortOrderQ === 'desc' ? 'desc' : 'asc'

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
        } catch (e) {
          return reply.status(400).send({ error: 'Invalid cursor format' })
        }
      }

      // Build orderBy - for name, we need secondary sort by id for consistency
      const orderBy = sortBy === 'name'
        ? [{ name: sortOrder }, { id: 'asc' }]
        : { id: sortOrder }

      // Build where clause (add server-side search if provided)
      const where = {}
      if (qQ) {
        where.OR = [
          { name: { contains: String(qQ), mode: 'insensitive' } },
          { email: { contains: String(qQ), mode: 'insensitive' } }
        ]
      }

      const findOpts = {
        where,
        include: {
          roles: {
            include: { role: true }
          }
        },
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

      // Format agar roles berupa array nama role
      const formattedUsers = pageItems.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        roles: Array.isArray(user.roles) ? user.roles.map(ur => ur.role.name) : [],
        status: user.status || 'ACTIVE'
      }))

      // Compute counts from DB (respect current filters)
      const baseWhere = where
      const totalUsers = await prisma.user.count({ where: baseWhere })
      const activeUsers = await prisma.user.count({ where: { ...baseWhere, status: 'ACTIVE' } })
      const adminCount = await prisma.user.count({ where: { ...baseWhere, roles: { some: { role: { name: { in: ['ADMIN','SUPER_ADMIN'] } } } } } })

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
  }
}
