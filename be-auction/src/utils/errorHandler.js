/**
 * Error Handler Utility
 * Centralized error handling with secure error messages for production
 */

/**
 * Format error for client response
 * In production: hide sensitive details
 * In development: show full error info
 * 
 * @param {Error} error - The error object
 * @param {Object} fastify - Fastify instance for logging
 * @returns {Object} Formatted error response
 */
export function formatError(error, fastify) {
  // Log error internally (always)
  if (fastify?.log) {
    fastify.log.error({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  } else {
    console.error('[ERROR]', error);
  }

  // Determine if we should expose details
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Known application errors (safe to expose)
  const knownErrors = [
    'EMAIL_NOT_VERIFIED',
    'Invalid email or password',
    'Registration failed',
    'User not found',
    'Access denied',
    'Validation failed',
    'Invalid or expired token',
    'Refresh token required',
    'Too many attempts'
  ];

  const isKnownError = knownErrors.some(known => 
    error.message?.includes(known)
  );

  if (isDevelopment) {
    // Development: return full error details
    return {
      error: error.message || 'An error occurred',
      ...(error.code && { code: error.code }),
      ...(error.details && { details: error.details }),
      stack: error.stack
    };
  }

  // Production: sanitized errors
  if (isKnownError) {
    // Safe to expose these messages
    return {
      error: error.message,
      ...(error.code && { code: error.code })
    };
  }

  // Unknown errors: generic message
  return {
    error: 'An unexpected error occurred. Please try again later.'
  };
}

/**
 * Handle Prisma-specific errors
 * @param {Error} error - Prisma error
 * @returns {Object} User-friendly error response
 */
export function handlePrismaError(error) {
  // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference
  
  if (error.code === 'P2002') {
    // Unique constraint violation
    const field = error.meta?.target?.[0] || 'field';
    return {
      status: 409,
      error: `A record with this ${field} already exists.`,
      code: 'DUPLICATE_ENTRY'
    };
  }

  if (error.code === 'P2025') {
    // Record not found
    return {
      status: 404,
      error: 'The requested resource was not found.',
      code: 'NOT_FOUND'
    };
  }

  if (error.code === 'P2003') {
    // Foreign key constraint failed
    return {
      status: 400,
      error: 'Invalid reference. The related record does not exist.',
      code: 'INVALID_REFERENCE'
    };
  }

  // Generic Prisma error
  return {
    status: 500,
    error: 'Database operation failed. Please try again.',
    code: 'DATABASE_ERROR'
  };
}

/**
 * Async error wrapper for route handlers
 * Catches errors and formats them appropriately
 * 
 * @param {Function} handler - Async route handler
 * @returns {Function} Wrapped handler
 */
export function asyncHandler(handler) {
  return async (request, reply) => {
    try {
      await handler(request, reply);
    } catch (error) {
      // Check if error is from Prisma
      if (error.code && error.code.startsWith('P')) {
        const prismaError = handlePrismaError(error);
        return reply.status(prismaError.status).send({
          error: prismaError.error,
          code: prismaError.code
        });
      }

      // Handle validation errors (from Zod)
      if (error.name === 'ZodError') {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      // Format and send error
      const formattedError = formatError(error, request.server);
      const statusCode = error.statusCode || error.status || 500;
      return reply.status(statusCode).send(formattedError);
    }
  };
}

/**
 * Create application error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @returns {Error} Application error
 */
export class ApplicationError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = 'ApplicationError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export default {
  formatError,
  handlePrismaError,
  asyncHandler,
  ApplicationError
};
