"use client";

import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

/**
 * useAuth Hook
 * Provides access to authentication context
 * 
 * @returns {Object} Auth context with user, loading state, and auth methods
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

/**
 * useRequireAuth Hook
 * Returns auth context and throws error if not authenticated
 * Use this in protected components/pages
 * 
 * @returns {Object} Auth context (guaranteed authenticated)
 */
export function useRequireAuth() {
  const auth = useAuth();
  
  if (!auth.isAuthenticated && !auth.isLoading) {
    throw new Error("This component requires authentication");
  }
  
  return auth;
}

/**
 * useRole Hook
 * Check if user has specific role(s)
 * 
 * @param {string|string[]} requiredRoles - Role name or array of role names
 * @returns {Object} { hasRole: boolean, userRoles: string[] }
 */
export function useRole(requiredRoles) {
  const { user } = useAuth();
  
  if (!user || !user.roles) {
    return { hasRole: false, userRoles: [] };
  }
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const hasRole = roles.some(role => user.roles.includes(role));
  
  return { hasRole, userRoles: user.roles };
}
