import { authService } from '../services/authService.js'

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
    
    request.user = decoded
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' })
  }
}
