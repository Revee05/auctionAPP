/**
 * Middleware RBAC (Role-Based Access Control)
 * Digunakan untuk membatasi akses endpoint berdasarkan role user.
 * 
 * Cara pakai di route:
 * fastify.get('/route', { preHandler: [authorize('ADMIN', 'SUPER_ADMIN')] }, handler)
 * 
 * @param  {...string} allowedRoles - Daftar role yang diizinkan mengakses route
 * @returns {Function} Middleware Fastify
 */
export function authorize(...allowedRoles) {
  // Middleware yang akan dijalankan sebelum handler utama
  return async (request, reply) => {
    // Ambil daftar role user dari JWT (diisi oleh middleware authenticate)
    const userRoles = request.user?.roles || []
    
    // Cek apakah user punya salah satu role yang diizinkan
    const hasPermission = allowedRoles.some(role => userRoles.includes(role))
    
    // Jika tidak punya permission, kirim response 403 Forbidden
    if (!hasPermission) {
      // Log helpful debug information in server logs (non-sensitive)
      try {
        console.warn('[RBAC] Access denied. Required:', allowedRoles, 'User roles:', userRoles, 'User:', request.user && { userId: request.user.userId, email: request.user.email });
      } catch (e) {
        // ignore logging errors
      }

      return reply.status(403).send({ 
        error: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles, // Role yang dibutuhkan
        userRoles: userRoles         // Role yang dimiliki user
      })
    }
    // Jika punya permission, lanjut ke handler berikutnya
  }
}
