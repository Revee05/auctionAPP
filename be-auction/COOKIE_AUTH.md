# Cookie-Based Authentication with Refresh Tokens

## Overview
Sistem autentikasi menggunakan HTTP-only cookies untuk keamanan yang lebih baik. Token disimpan di cookie, bukan di response body atau localStorage.

## Security Benefits
- ✅ **HTTP-only cookies**: Tidak bisa diakses JavaScript, mencegah XSS attacks
- ✅ **Secure flag**: Cookie hanya dikirim via HTTPS (production)
- ✅ **SameSite strict**: Mencegah CSRF attacks
- ✅ **Refresh tokens**: Short-lived access tokens + long-lived refresh tokens
- ✅ **Database storage**: Refresh tokens disimpan di database, bisa di-revoke

## Token Types

### Access Token
- **Lifetime**: 15 menit (configurable)
- **Storage**: HTTP-only cookie (`access_token`)
- **Purpose**: Akses ke protected endpoints
- **Type**: JWT

### Refresh Token
- **Lifetime**: 7 hari (configurable)
- **Storage**: HTTP-only cookie (`refresh_token`) + Database
- **Purpose**: Mendapatkan access token baru tanpa login ulang
- **Type**: Random hex string (64 bytes)

## API Endpoints

### 1. Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "roleName": "COLLECTOR"  // optional, default: COLLECTOR
}
```

**Response**:
```json
{
  "message": "Registration successful. Please login."
}
```

### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "roles": ["COLLECTOR"]
  }
}
```

**Cookies Set**:
- `access_token`: JWT (15 min, HTTP-only, Secure, SameSite=Strict)
- `refresh_token`: Random string (7 days, HTTP-only, Secure, SameSite=Strict)

### 3. Refresh Token
```http
POST /api/auth/refresh
Cookie: refresh_token=<token>
```

**Response**:
```json
{
  "message": "Token refreshed successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "roles": ["COLLECTOR"]
  }
}
```

**Cookies Updated**:
- `access_token`: New JWT (15 min)

### 4. Logout
```http
POST /api/auth/logout
Cookie: refresh_token=<token>
```

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

**Effect**:
- Refresh token dihapus dari database
- Cookies `access_token` dan `refresh_token` di-clear

### 5. Logout All Devices
```http
POST /api/auth/logout-all
Cookie: access_token=<token>
```

**Response**:
```json
{
  "message": "Logged out from all devices"
}
```

**Effect**:
- Semua refresh tokens user dihapus dari database
- User harus login ulang di semua device

### 6. Get Current User (Me)
```http
GET /api/auth/me
Cookie: access_token=<token>
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "roles": ["COLLECTOR"],
    "createdAt": "2024-11-30T14:00:00.000Z"
  }
}
```

### 7. Check Status
```http
GET /api/auth/status
```

**Response**:
```json
{
  "isLoggedIn": true,
  "hasAccessToken": true,
  "hasRefreshToken": true
}
```

## Client-Side Implementation

### Using Fetch API
```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // IMPORTANT: Include cookies
    body: JSON.stringify({ email, password })
  });
  
  return await response.json();
};

// Access protected endpoint
const getProfile = async () => {
  const response = await fetch('http://localhost:3000/api/auth/me', {
    credentials: 'include' // IMPORTANT: Include cookies
  });
  
  return await response.json();
};

// Refresh token
const refreshToken = async () => {
  const response = await fetch('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  
  return await response.json();
};

// Logout
const logout = async () => {
  const response = await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  
  return await response.json();
};
```

### Using Axios
```javascript
import axios from 'axios';

// Create axios instance with credentials
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true // IMPORTANT: Include cookies
});

// Login
const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

// Get profile
const getProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

// Auto-refresh on 401
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        await api.post('/auth/refresh');
        // Retry original request
        return api.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## Testing with REST Client

Karena cookies tidak otomatis ter-handle di REST file, ada 2 opsi:

### Opsi 1: Backward Compatibility (Bearer Token)
```http
### Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "superadmin@auction.com",
  "password": "password123"
}

### Save token dari response cookies, lalu gunakan di header
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Get profile dengan Bearer token
GET http://localhost:3000/api/auth/me
Authorization: Bearer {{token}}
```

### Opsi 2: Testing dengan Browser/Postman
1. Gunakan browser atau Postman
2. Login via POST /api/auth/login
3. Cookies otomatis tersimpan
4. Akses endpoint lain tanpa perlu set header

## Environment Variables

```env
# JWT Settings
JWT_SECRET="your-secret-key-change-in-production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Cookie Settings
COOKIE_SECRET="cookie-secret-key-change-in-production"

# Server
NODE_ENV="development"  # Set to "production" for secure cookies
```

## Database Schema

```prisma
model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}
```

## Security Best Practices

1. **HTTPS in Production**: Set `NODE_ENV=production` untuk enable secure cookie flag
2. **Strong Secrets**: Ganti `JWT_SECRET` dan `COOKIE_SECRET` dengan random string yang kuat
3. **Short Access Token Lifetime**: Default 15 menit, bisa disesuaikan
4. **Refresh Token Rotation**: Pertimbangkan rotate refresh token setiap kali di-refresh
5. **Token Cleanup**: Jalankan cron job untuk hapus expired refresh tokens dari database

## Migration from Bearer Token

Middleware sudah support backward compatibility:
```javascript
// Prioritas 1: Coba ambil dari cookie
let token = request.cookies.access_token

// Prioritas 2: Fallback ke Authorization header
if (!token) {
  const authHeader = request.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
}
```

Jadi client lama yang pakai Bearer token masih bisa berfungsi.
