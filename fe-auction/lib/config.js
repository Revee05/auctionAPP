/**
 * Application Configuration
 * Centralized config management for environment variables
 */

export const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500',
  
  // Auth Configuration
  auth: {
    endpoints: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      logout: '/api/auth/logout',
      logoutAll: '/api/auth/logout-all',
      refresh: '/api/auth/refresh',
      me: '/api/auth/me',
      status: '/api/auth/status',
      verifyEmail: '/api/auth/verify-email',
      resendVerification: '/api/auth/resend-verification',
    },
    // Retry config for refresh token
    maxRefreshRetries: 1,
  },

  // Debug mode
  debug: process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true',
};

export default config;
