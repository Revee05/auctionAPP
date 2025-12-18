import { authService } from '../services/authService.js'
import { prisma } from '../../lib/prisma.js'

export async function authenticate(request, reply) {
  try {
    // Prioritas 1: Coba ambil token dari cookie (lebih aman)
    let token = request.cookies.access_token
    
    // Prioritas 2: Fallback ke Authorization header (untuk backward compatibility)
    if (!token) {
      const authHeader = request.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    
    if (!token) {
      return reply.status(401).send({ error: 'No token provided' })
    }

    const decoded = authService.verifyToken(token)
    
    // Check user status in database - BLOCK suspended or banned users
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { status: true }
    })

    if (!user) {
      return reply.status(401).send({ error: 'User not found' })
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      return reply.status(403).send({ 
        error: 'Your account has been suspended or banned. Please contact support.',
        code: 'ACCOUNT_SUSPENDED'
      })
    }
    
    request.user = decoded
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' })
  }
}
