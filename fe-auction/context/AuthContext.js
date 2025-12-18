"use client";

import { createContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/authService";

export const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  logoutAll: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  /**
   * Initialize auth state on mount
   * Fetches current user from backend using existing cookies
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await authService.getCurrentUser();
      
      if (result.success && result.user) {
        // Ensure roles is always an array
        const normalizedUser = {
          ...result.user,
          roles: Array.isArray(result.user.roles) ? result.user.roles : []
        };
        setUser(normalizedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login handler
   * Calls backend login API and updates local state
   */
  const login = useCallback(async (email, password) => {
    try {
      const result = await authService.login(email, password);
      
      if (result.success && result.user) {
        // Ensure roles is always an array
        const normalizedUser = {
          ...result.user,
          roles: Array.isArray(result.user.roles) ? result.user.roles : []
        };
        setUser(normalizedUser);
        return { success: true, user: normalizedUser };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Logout handler
   * Calls backend logout API and clears local state
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state even if API call fails
      setUser(null);
      router.push('/auth/login');
    }
  }, [router]);

  /**
   * Logout from all devices
   */
  const logoutAll = useCallback(async () => {
    try {
      await authService.logoutAll();
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      setUser(null);
      router.push('/auth/login');
    }
  }, [router]);

  /**
   * Refresh user data
   * Useful after profile updates or role changes
   */
  const refreshUser = useCallback(async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.user) {
        // Ensure roles is always an array
        const normalizedUser = {
          ...result.user,
          roles: Array.isArray(result.user.roles) ? result.user.roles : []
        };
        setUser(normalizedUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, []);

  /**
   * Handle unauthorized events from API client
   * Triggered when refresh token fails
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      router.push('/auth/login');
    };

    const handleSuspended = (event) => {
      setUser(null);
      const message = event.detail?.message || 'Your account has been suspended or banned.';
      // Store message in sessionStorage to show on login page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_error', message);
      }
      router.push('/auth/login');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorized);
      window.addEventListener('auth:suspended', handleSuspended);
      return () => {
        window.removeEventListener('auth:unauthorized', handleUnauthorized);
        window.removeEventListener('auth:suspended', handleSuspended);
      };
    }
  }, [router]);

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    logoutAll,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
