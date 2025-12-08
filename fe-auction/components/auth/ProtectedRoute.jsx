/**
 * Protected Route Component
 * HOC and Component for protecting routes that require authentication
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * ProtectedRoute Component
 * Wraps content that requires authentication
 * Redirects to login if not authenticated
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Protected content
 * @param {string} props.redirectTo - Redirect path (default: /auth/login)
 * @param {string|string[]} props.requiredRoles - Optional role requirements
 * @param {React.ReactNode} props.loadingComponent - Custom loading component
 */
export function ProtectedRoute({ 
  children, 
  redirectTo = "/auth/login",
  requiredRoles = null,
  loadingComponent = <LoadingScreen />
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show loading while checking auth
  if (isLoading) {
    return loadingComponent;
  }

  // Not authenticated - return null while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Check role requirements if specified
  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequiredRole = roles.some(role => user?.roles?.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="text-center p-8 bg-zinc-900 border border-zinc-800 rounded-lg">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-zinc-400 mb-6">
              You don&apos;t have permission to access this page.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-purple-400 hover:bg-purple-500 text-black font-semibold rounded"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

/**
 * Default Loading Screen
 */
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
        <p className="text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Higher-Order Component for protecting pages
 * 
 * @param {React.Component} Component - Component to protect
 * @param {Object} options - Protection options
 * @returns {React.Component} Protected component
 */
export function withAuth(Component, options = {}) {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

export default ProtectedRoute;
