# Frontend Authentication Implementation - Documentation

## Overview

This frontend implementation integrates with the backend's **cookie-based authentication system** with **refresh token rotation**. The architecture follows modern React best practices with separation of concerns, security, and developer experience in mind.

## Key Features

✅ **HttpOnly Cookie Authentication** - Tokens stored securely by backend  
✅ **Automatic Token Refresh** - Seamless 401 handling with retry  
✅ **Refresh Token Rotation** - Enhanced security with token reuse detection  
✅ **Role-Based Access Control** - Built-in RBAC support  
✅ **Protected Routes** - Easy route protection with HOC/components  
✅ **TypeScript-ready** - Clean interfaces for type safety  
✅ **Centralized Error Handling** - Consistent error messages  
✅ **Loading States** - Proper loading UX during auth operations  

---

## Architecture

### File Structure

```
fe-auction/
├── lib/
│   ├── config.js                    # Environment & API config
│   ├── apiClient.js                 # Axios instance with interceptors
│   └── services/
│       └── authService.js           # Auth business logic
├── context/
│   └── AuthContext.js               # Global auth state
├── hooks/
│   └── useAuth.js                   # Auth hooks (useAuth, useRole)
├── components/
│   └── auth/
│       └── ProtectedRoute.jsx       # Route protection component
└── app/
    └── auth/
        ├── login/page.js            # Login page
        └── register/page.js         # Register page
```

### Data Flow

```
Component → useAuth() → AuthContext → authService → apiClient → Backend API
                                                          ↓
                                              Axios Interceptor
                                              (Auto-refresh on 401)
```

---

## Components & Usage

### 1. **API Client** (`lib/apiClient.js`)

Axios instance configured with:
- Base URL from environment
- `withCredentials: true` (sends cookies)
- Response interceptor for 401 handling
- Automatic token refresh with request queuing

**Key Features:**
- Prevents multiple simultaneous refresh calls
- Queues failed requests during refresh
- Triggers `auth:unauthorized` event on refresh failure

### 2. **Auth Service** (`lib/services/authService.js`)

Handles all authentication API calls:

```javascript
import { authService } from '@/lib/services/authService';

// Login
const result = await authService.login(email, password);

// Register
await authService.register({ name, email, password, roleName });

// Get current user
const user = await authService.getCurrentUser();

// Logout
await authService.logout();

// Logout all sessions
await authService.logoutAll();
```

### 3. **Auth Context** (`context/AuthContext.js`)

Global authentication state provider:

```javascript
const {
  user,              // Current user object or null
  isLoading,         // Loading state during initialization
  isAuthenticated,   // Boolean: logged in or not
  login,             // (email, password) => Promise<{success, user, error}>
  logout,            // () => Promise<void>
  logoutAll,         // () => Promise<void>
  refreshUser,       // () => Promise<void>
} = useAuth();
```

**Features:**
- Initializes on mount by calling `/api/auth/me`
- Listens for `auth:unauthorized` events
- Automatically redirects on logout

### 4. **Auth Hooks** (`hooks/useAuth.js`)

**useAuth()**
```javascript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated && <p>Welcome {user.name}</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**useRole(requiredRoles)**
```javascript
import { useRole } from '@/hooks/useAuth';

function AdminPanel() {
  const { hasRole, userRoles } = useRole(['ADMIN', 'SUPER_ADMIN']);
  
  if (!hasRole) return <div>Access Denied</div>;
  
  return <div>Admin content...</div>;
}
```

### 5. **Protected Routes** (`components/auth/ProtectedRoute.jsx`)

**Component Wrapper:**
```javascript
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

**With Role Requirements:**
```javascript
<ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
  <AdminDashboard />
</ProtectedRoute>
```

**Higher-Order Component (HOC):**
```javascript
import { withAuth } from '@/components/auth/ProtectedRoute';

function DashboardPage() {
  return <div>Dashboard</div>;
}

export default withAuth(DashboardPage, {
  requiredRoles: ['ADMIN'],
  redirectTo: '/auth/login'
});
```

---

## Configuration

### Environment Variables (`.env.local`)

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3500

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG_AUTH=false
```

### Backend CORS Configuration

Backend must allow credentials:

```javascript
// Fastify CORS example
fastify.register(cors, {
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true,               // CRITICAL!
});
```

---

## Security Considerations

### ✅ What's Secure

1. **No Token Storage in Frontend**
   - Access/refresh tokens stored as HttpOnly cookies
   - JavaScript cannot read tokens (XSS protection)

2. **Automatic Token Refresh**
   - Seamless renewal without user intervention
   - Rotation prevents token reuse attacks

3. **CSRF Protection**
   - SameSite cookie attribute (Lax/Strict)
   - Cookie only sent to same domain

4. **Token Reuse Detection**
   - Backend detects and revokes all sessions on reuse

### ⚠️ Important Notes

- **Development vs Production:**
  - `Secure` flag: OFF in dev, ON in production
  - HTTPS required in production for Secure cookies
  
- **CORS Setup:**
  - Must explicitly allow credentials
  - Origin must match (no wildcards with credentials)

- **Cookie SameSite:**
  - `Strict`: Best security, breaks some SSO flows
  - `Lax`: Good balance (recommended)
  - `None`: Only with Secure flag (HTTPS)

---

## API Endpoints Used

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/auth/login` | POST | Login with credentials | `{ message, user }` |
| `/api/auth/register` | POST | Create new account | `{ message }` |
| `/api/auth/me` | GET | Get current user | `{ user }` |
| `/api/auth/status` | GET | Check auth status | `{ isLoggedIn, hasAccessToken, hasRefreshToken }` |
| `/api/auth/refresh` | POST | Refresh access token | `{ message, user }` |
| `/api/auth/logout` | POST | Logout current session | `{ message }` |
| `/api/auth/logout-all` | POST | Logout all sessions | `{ message }` |

---

## Error Handling

### Common Error Scenarios

**1. Network Error**
```javascript
try {
  await authService.login(email, password);
} catch (error) {
  // error.message = "Network error - please check your connection"
}
```

**2. Invalid Credentials**
```javascript
// error.message = "Invalid email or password"
```

**3. Token Refresh Failed**
- User automatically redirected to login
- `auth:unauthorized` event fired
- All queued requests rejected

### Custom Error Handling

```javascript
const result = await authService.login(email, password);

if (!result.success) {
  setError(result.error); // Display to user
}
```

---

## Migration from Old Code

### Before (localStorage-based)

```javascript
// ❌ Old approach
const handleLogin = async () => {
  const response = await fetch('/api/login', { ... });
  const data = await response.json();
  localStorage.setItem('token', data.token); // ❌ Insecure
  setUser(data.user);
};
```

### After (Cookie-based)

```javascript
// ✅ New approach
const { login } = useAuth();

const handleLogin = async () => {
  const result = await login(email, password);
  if (result.success) {
    // User automatically set in context
    // Cookies automatically sent by backend
    router.push('/dashboard');
  }
};
```

### Key Changes

1. **Remove localStorage/sessionStorage usage**
   - Tokens managed by backend via cookies
   
2. **Use AuthContext instead of manual state**
   - Centralized auth state
   - Automatic initialization
   
3. **Use authService for API calls**
   - Consistent error handling
   - Automatic refresh built-in

---

## Testing

### Local Development

1. **Start Backend:**
   ```bash
   cd be-auction
   npm run dev
   # Runs on http://localhost:3500
   ```

2. **Start Frontend:**
   ```bash
   cd fe-auction
   npm run dev
   # Runs on http://localhost:3000
   ```

3. **Test Flow:**
   - Register new user
   - Login
   - Access protected route
   - Check DevTools > Application > Cookies
   - Logout and verify cookies cleared

### Testing Token Refresh

1. Set short access token expiry in backend (e.g., 30 seconds)
2. Login and wait for token to expire
3. Make an API request - should auto-refresh
4. Check Network tab for `/api/auth/refresh` call

### Testing Reuse Detection

1. Login on Device A
2. Copy refresh token cookie
3. Login on Device B
4. Try to use old refresh token from Device A
5. Should revoke all sessions

---

## Common Issues & Solutions

### Issue: Cookies not sent with requests

**Solution:** Ensure `withCredentials: true` in axios config

```javascript
// ✅ Correct
axios.create({
  withCredentials: true
});

// ❌ Wrong
axios.create({
  // withCredentials missing
});
```

### Issue: CORS error with credentials

**Solution:** Backend must allow credentials explicitly

```javascript
// Backend CORS config
{
  origin: 'http://localhost:3000', // No wildcard!
  credentials: true
}
```

### Issue: Cookies not setting in browser

**Solutions:**
- Check SameSite attribute (use `Lax` for dev)
- Ensure frontend/backend on same domain or proper CORS
- Check Secure flag (should be `false` in dev)

### Issue: Infinite refresh loop

**Solution:** Check interceptor logic - refresh endpoint must be excluded

```javascript
if (originalRequest.url?.includes('/api/auth/refresh')) {
  return Promise.reject(error); // Don't retry refresh endpoint
}
```

---

## Advanced Usage

### Custom Loading Component

```javascript
<ProtectedRoute
  loadingComponent={<CustomSpinner />}
>
  <Content />
</ProtectedRoute>
```

### Manual User Refresh

```javascript
const { refreshUser } = useAuth();

// After profile update
await updateProfile(data);
await refreshUser(); // Sync user data
```

### Programmatic Navigation on Auth

```javascript
useEffect(() => {
  if (isAuthenticated) {
    router.push('/dashboard');
  }
}, [isAuthenticated]);
```

---

## Production Checklist

- [ ] Set `NEXT_PUBLIC_API_URL` to production backend URL
- [ ] Ensure backend uses `Secure` cookies (HTTPS)
- [ ] Configure proper CORS origin (no wildcards)
- [ ] Set `SameSite=Lax` or `Strict`
- [ ] Test token refresh flow
- [ ] Test logout from all devices
- [ ] Verify token reuse detection works
- [ ] Add rate limiting on auth endpoints
- [ ] Monitor `auth:unauthorized` events
- [ ] Set up error tracking (Sentry, etc.)

---

## References

- [Backend Auth Service](../../be-auction/src/services/authService.js)
- [Backend Auth Controller](../../be-auction/src/controllers/authController.js)
- [Refresh Token Rotation Plan](../../be-auction/exp/MD/REFRESH_TOKEN_ROTATION_PLAN.md)

---

**Last Updated:** December 8, 2025  
**Version:** 1.0.0
