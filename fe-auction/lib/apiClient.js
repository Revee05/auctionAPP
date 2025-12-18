/**
 * API Client with Axios
 * Handles all HTTP requests with automatic token refresh on 401
 * Uses HttpOnly cookies for authentication (set by backend)
 */

import axios from 'axios';
import config from './config';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true, // CRITICAL: Send cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let refreshSubscribers = [];

/**
 * Subscribe to refresh completion
 * Used to queue failed requests during token refresh
 */
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers when refresh is complete
 */
function onRefreshComplete(error = null) {
  refreshSubscribers.forEach((callback) => callback(error));
  refreshSubscribers = [];
}

/**
 * Response Interceptor
 * Automatically refresh tokens on 401 and retry failed requests
 */
apiClient.interceptors.response.use(
  // Success response - pass through
  (response) => response,
  
  // Error response - handle 401 with refresh
  async (error) => {
    const originalRequest = error.config;

    // Handle 403 ACCOUNT_SUSPENDED - force logout immediately
    if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_SUSPENDED') {
      // Trigger logout (handled by auth context)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:suspended', { 
          detail: { message: error.response.data.error }
        }));
      }
      return Promise.reject(error);
    }

    // Ignore refresh endpoint errors to prevent infinite loops
    if (originalRequest.url?.includes(config.auth.endpoints.refresh)) {
      isRefreshing = false;
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((err) => {
            if (err) {
              reject(err);
            } else {
              resolve(apiClient(originalRequest));
            }
          });
        });
      }

      isRefreshing = true;

      try {
        // Attempt to refresh the token
        await apiClient.post(config.auth.endpoints.refresh);
        
        // Refresh successful - retry all queued requests
        isRefreshing = false;
        onRefreshComplete();
        
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth state and reject all queued requests
        isRefreshing = false;
        onRefreshComplete(refreshError);
        
        // Trigger logout (handled by auth context)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Request Interceptor (Optional)
 * Can be used for logging, adding custom headers, etc.
 */
apiClient.interceptors.request.use(
  (config) => {
    if (process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
