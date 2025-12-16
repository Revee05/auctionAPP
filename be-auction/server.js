import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { authRoutes } from './src/routes/authRoutes.js'
import { adminUserRoutes } from './src/routes/admin/AdminRoutes.js'
import { superAdminUserRoutes } from './src/routes/superadmin/SuperAdminRoutes.js'
import 'dotenv/config'

const fastify = Fastify({ logger: true })


// Register CORS agar bisa diakses dari frontend
// Configure CORS to reflect the request origin (allows all origins).
// This is equivalent to allowing any origin while still sending a
// matching `Access-Control-Allow-Origin` header (required when
// `credentials: true` is used).
fastify.register(fastifyCors, {
  origin: true,
  credentials: true
});

// Register cookie plugin untuk HTTP-only cookies
fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || 'cookie-secret-key-change-in-production',
  parseOptions: {}
})

// Register rate limiting plugin
fastify.register(rateLimit, {
  global: false, // Apply only to specific routes
  max: 100, // Default global limit
  timeWindow: '15 minutes'
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
    await fastify.listen({ port: 3500, host: '0.0.0.0' })
    fastify.log.info(`Server listening on http://localhost:3500`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
