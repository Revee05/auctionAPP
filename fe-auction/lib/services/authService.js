/**
 * Authentication Service
 * Handles all authentication-related API calls
 * Separation of concerns - keeps business logic away from components
 */

import apiClient from '@/lib/apiClient';
import config from '@/lib/config';

class AuthService {
  /**
   * Login with email and password
   * Backend will set HttpOnly cookies (access_token, refresh_token)
   */
  async login(email, password) {
    try {
      const response = await apiClient.post(config.auth.endpoints.login, {
        email,
        password,
      });
      
      return {
        success: true,
        user: response.data.user,
        message: response.data.message,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Register new user
   * Backend returns success message - user must login separately
   */
  async register(data) {
    try {
      const { name, email, password, roleName } = data;
      const response = await apiClient.post(config.auth.endpoints.register, {
        name,
        email,
        password,
        roleName,
      });
      
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current user information
   * Uses existing cookies - no need to pass tokens
   */
  async getCurrentUser() {
    try {
      const response = await apiClient.get(config.auth.endpoints.me);
      return {
        success: true,
        user: response.data.user,
      };
    } catch (error) {
      // Don't throw on 401 - just return null user
      if (error.response?.status === 401) {
        return { success: false, user: null };
      }
      throw this.handleError(error);
    }
  }

  /**
   * Check authentication status
   * Lightweight check for cookie presence
   */
  async checkStatus() {
    try {
      const response = await apiClient.get(config.auth.endpoints.status);
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      return {
        success: false,
        isLoggedIn: false,
        hasAccessToken: false,
        hasRefreshToken: false,
      };
    }
  }

  /**
   * Logout from current session
   * Clears cookies and revokes refresh token on backend
   */
  async logout() {
    try {
      await apiClient.post(config.auth.endpoints.logout);
      return { success: true };
    } catch (error) {
      // Even if logout fails, we should clear local state
      console.error('Logout error:', error);
      return { success: false };
    }
  }

  /**
   * Logout from all devices/sessions
   * Revokes all refresh tokens for the user
   */
  async logoutAll() {
    try {
      await apiClient.post(config.auth.endpoints.logoutAll);
      return { success: true };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Manual refresh token rotation
   * Usually handled automatically by axios interceptor
   */
  async refreshToken() {
    try {
      const response = await apiClient.post(config.auth.endpoints.refresh);
      return {
        success: true,
        user: response.data.user,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify email with token from email link
   * @param {string} token - Verification token from URL
   */
  async verifyEmail(token) {
    try {
      const response = await apiClient.get(
        `${config.auth.endpoints.verifyEmail}?token=${token}`
      );
      return {
        success: true,
        message: response.data.message,
        email: response.data.email,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resend verification email
   * @param {string} email - User's email address
   */
  async resendVerification(email) {
    try {
      const response = await apiClient.post(config.auth.endpoints.resendVerification, {
        email,
      });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Error handler - extracts meaningful error messages
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      const message = errorData?.error || 
                     errorData?.message || 
                     'An error occurred';
      
      // Create error with additional metadata
      const err = new Error(message);
      err.code = errorData?.code;
      err.statusCode = error.response.status;
      
      return err;
    } else if (error.request) {
      // Request made but no response received
      return new Error('Network error - please check your connection');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
