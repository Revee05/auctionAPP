import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import 'dotenv/config'
import { authRoutes } from './src/routes/authRoutes.js'
import { adminUserRoutes } from './src/routes/admin/userRoutes.js'
import { superAdminUserRoutes } from './src/routes/superadmin/userRoutes.js'

const fastify = Fastify({ logger: true })

// Register cookie plugin untuk HTTP-only cookies
fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || 'cookie-secret-key-change-in-production',
  parseOptions: {}
})

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' })
fastify.register(adminUserRoutes, { prefix: '/api/admin/users' })
fastify.register(superAdminUserRoutes, { prefix: '/api/superadmin/users' })

// Health check
fastify.get('/', async (request, reply) => {
  return { message: 'Auction API is running!' }
})

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    fastify.log.info(`Server listening on http://localhost:3000`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
