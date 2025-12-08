# Quick Start Guide - Frontend Authentication

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd fe-auction
npm install
```

### 2. Setup Environment

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3500
NEXT_PUBLIC_DEBUG_AUTH=false
```

### 3. Start Development Server

```bash
npm run dev
# Runs on http://localhost:3000
```

---

## 🧪 Testing the Implementation

### Test 1: Registration Flow

1. Navigate to `http://localhost:3000/auth/register`
2. Select role (Collector or Artist)
3. Fill in the form:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
4. Click "Register"
5. Should redirect to login page with success message

### Test 2: Login Flow

1. Navigate to `http://localhost:3000/auth/login`
2. Enter credentials:
   - Email: superadmin@auctionapp.com
   - Password: Password123!
3. Click "Login"
4. Should redirect to home/admin page
5. **Check DevTools:**
   - Application > Cookies
   - Should see `access_token` and `refresh_token` (HttpOnly)

### Test 3: Protected Routes

1. While logged in, navigate to `http://localhost:3000/admin`
2. Should see dashboard if you have ADMIN/SUPER_ADMIN role
3. If not admin, should see "Access Denied" message
4. Logout and try accessing again - should redirect to login

### Test 4: Auto Token Refresh

1. Login and stay on any page
2. Wait for access token to expire (15 minutes default)
3. Navigate to any protected page or make API call
4. **Check Network Tab:**
   - Should see automatic POST to `/api/auth/refresh`
   - Original request retried after refresh
   - No need to login again

### Test 5: Logout

1. Click user avatar in header
2. Click "Logout"
3. Should redirect to login page
4. **Check DevTools:**
   - Cookies should be cleared
   - Accessing protected routes redirects to login

### Test 6: Multiple Sessions

1. Login on Browser A
2. Copy `refresh_token` cookie value
3. Login on Browser B (different browser/incognito)
4. Try to use old refresh token from Browser A
5. Backend should detect reuse and revoke all sessions

---

## 🔍 Debugging Tips

### Enable Debug Mode

Set in `.env.local`:
```bash
NEXT_PUBLIC_DEBUG_AUTH=true
```

This will log all API requests to console:
```
[API] POST /api/auth/login
[API] GET /api/auth/me
[API] POST /api/auth/refresh
```

### Check Browser Console

Look for:
- Auth initialization messages
- Token refresh events
- Error messages

### Check Network Tab

Filter by `/api/auth` to see:
- Request/response payloads
- Cookie headers
- Status codes

### Common Issues

**1. Cookies not appearing:**
- Check backend CORS settings
- Verify `withCredentials: true` in API client
- Ensure same-origin or proper CORS config

**2. 401 errors:**
- Check if cookies are being sent
- Verify token hasn't expired
- Check backend token validation

**3. Infinite redirects:**
- Check protected route logic
- Verify auth initialization completes
- Ensure `isLoading` is handled

---

## 📝 Example Code Snippets

### Simple Protected Component

```javascript
import { useAuth } from '@/hooks/useAuth';

export default function MyProfile() {
  const { user, logout } = useAuth();
  
  if (!user) return null;
  
  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Role-Based Rendering

```javascript
import { useRole } from '@/hooks/useAuth';

export default function AdminPanel() {
  const { hasRole } = useRole(['ADMIN', 'SUPER_ADMIN']);
  
  if (!hasRole) {
    return <div>Access Denied</div>;
  }
  
  return <div>Admin Controls Here</div>;
}
```

### Full Protected Page

```javascript
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRoles="ADMIN">
      <div>Protected Content</div>
    </ProtectedRoute>
  );
}
```

### Custom API Call

```javascript
import apiClient from '@/lib/apiClient';

async function fetchUserData() {
  try {
    const response = await apiClient.get('/api/users/profile');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
}
```

---

## 🎯 Test User Accounts

Use these pre-seeded accounts from backend:

| Email | Password | Role |
|-------|----------|------|
| superadmin@auctionapp.com | Password123! | SUPER_ADMIN |
| admin@auctionapp.com | Password123! | ADMIN |
| mike.sculptor@auctionapp.com | Password123! | ARTIST |
| robert.collector@auctionapp.com | Password123! | COLLECTOR |

---

## 🔐 Security Testing

### Test XSS Protection

1. Open DevTools Console
2. Try to read cookies:
   ```javascript
   document.cookie
   ```
3. Should NOT see `access_token` or `refresh_token` (HttpOnly protection)

### Test CSRF Protection

1. Create malicious form on different domain
2. Try to POST to `/api/auth/logout`
3. Should fail due to SameSite cookie attribute

### Test Token Reuse Detection

1. Login and capture refresh token
2. Logout
3. Try to reuse old refresh token
4. Backend should reject and revoke all sessions

---

## 📊 Monitoring

### Events to Watch

Listen for custom events:

```javascript
window.addEventListener('auth:unauthorized', () => {
  console.log('User unauthorized - redirecting to login');
});
```

### Metrics to Track

- Login success/failure rate
- Token refresh frequency
- Session duration
- Unauthorized events (potential security issues)

---

## ✅ Production Checklist

Before deploying:

- [ ] Update `NEXT_PUBLIC_API_URL` to production backend
- [ ] Ensure backend uses HTTPS (Secure cookies)
- [ ] Test in production-like environment
- [ ] Verify CORS configuration
- [ ] Test all user roles
- [ ] Test logout from all devices
- [ ] Verify error handling
- [ ] Check loading states
- [ ] Test on mobile devices
- [ ] Set up error monitoring (Sentry)

---

## 🆘 Need Help?

1. Check `AUTH_IMPLEMENTATION.md` for detailed documentation
2. Review backend implementation in `be-auction/src/services/authService.js`
3. Check browser console and network tab for errors
4. Verify environment variables are set correctly
5. Ensure backend is running on correct port (3500)

---

**Happy coding! 🎨**
