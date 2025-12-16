import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { authRoutes } from './src/routes/authRoutes.js'
import { adminUserRoutes } from './src/routes/admin/AdminRoutes.js'
import { superAdminUserRoutes } from './src/routes/superadmin/SuperAdminRoutes.js'
import 'dotenv/config'

const fastify = Fastify({ logger: true })

/* ============================================
 * SECURITY: Validate critical secrets on startup
 * ============================================ */
const COOKIE_SECRET = process.env.COOKIE_SECRET;
if (!COOKIE_SECRET) {
  fastify.log.error('FATAL SECURITY ERROR: COOKIE_SECRET must be set in environment variables');
  process.exit(1);
}
if (COOKIE_SECRET.length < 32) {
  fastify.log.error('FATAL SECURITY ERROR: COOKIE_SECRET must be at least 32 characters long');
  process.exit(1);
}

/* ============================================
 * CORS Configuration - Whitelist specific origins
 * ============================================ */
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000', // Development
  'http://127.0.0.1:3000', // Development alternative
];

// Add production domain if in production
if (process.env.NODE_ENV === 'production' && process.env.PRODUCTION_FRONTEND_URL) {
  allowedOrigins.push(process.env.PRODUCTION_FRONTEND_URL);
}

fastify.register(fastifyCors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      fastify.log.warn(`CORS: Blocked origin ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 204
});

// Register cookie plugin untuk HTTP-only cookies
fastify.register(fastifyCookie, {
  secret: COOKIE_SECRET,
  parseOptions: {}
})

/* ============================================
 * Security Headers with Helmet
 * ============================================ */
fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // Prevent clickjacking
  },
  noSniff: true, // Prevent MIME type sniffing
  xssFilter: true, // Enable XSS filter
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
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
