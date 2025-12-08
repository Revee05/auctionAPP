# Quick Reference: Hashed Refresh Token System

## 🚀 Commands

### Development
```bash
# Start server
npm start
# or
npm run dev  # with nodemon

# Run tests
npm run test:rotation

# Clean up old tokens
npm run cleanup:tokens
```

### Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open database viewer
npx prisma studio
```

## 🔐 How It Works

### Login Flow
1. User sends email + password
2. Server validates credentials
3. Server generates **plain refresh token** (128 hex chars)
4. Server creates **HMAC-SHA256 hash** of token
5. Server stores **only the hash** in database (not plain token)
6. Server sends plain token to client as HttpOnly cookie
7. Client stores cookie automatically

### Refresh Flow (with Rotation)
1. Client sends refresh request (cookie sent automatically)
2. Server reads plain token from cookie
3. Server creates hash of received token
4. Server looks up hash in database
5. **If found and valid:**
   - Generate NEW plain token
   - Hash the new token
   - Store new hash in database
   - Revoke old token (set `revoked=true`)
   - Send new plain token as cookie
6. **If found but revoked (REUSE DETECTED):**
   - Log security event
   - Revoke ALL user sessions
   - Return 401 error
   - Clear cookies
7. **If not found:**
   - Return 401 error

### Logout Flow
1. Client sends logout request
2. Server reads refresh token from cookie
3. Server hashes token
4. Server marks token as revoked in database
5. Server clears cookies
6. Client cookie automatically removed

## 🔑 Environment Variables

```env
# Required for hashing
REFRESH_TOKEN_HASH_SECRET="change-this-to-strong-random-value-in-production"
REFRESH_TOKEN_BYTES=64

# JWT Settings
JWT_SECRET="your-secret-key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Cookie Settings
REFRESH_COOKIE_NAME="refresh_token"
ACCESS_COOKIE_NAME="access_token"
COOKIE_SAME_SITE="strict"
COOKIE_PATH="/"
NODE_ENV="development"  # Set to "production" for secure cookies
```

## 📊 Database Schema

```prisma
model RefreshToken {
  id         Int       @id @default(autoincrement())
  token      String?   @unique  // Legacy (deprecated)
  tokenHash  String?   @unique  // HMAC-SHA256 hash
  userId     Int
  expiresAt  DateTime
  createdAt  DateTime  @default(now())
  lastUsedAt DateTime?
  revoked    Boolean   @default(false)
  deviceInfo String?   // User-Agent
  ip         String?   // IP address
  hashVersion Int      @default(1)
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, revoked, expiresAt])
  @@index([tokenHash])
}
```

## 🛡️ Security Features

| Feature | Description |
|---------|-------------|
| **Hashed Storage** | Only HMAC-SHA256 hash stored, never plain token |
| **Automatic Rotation** | New token on every refresh, old one revoked |
| **Reuse Detection** | Detects replay attacks, revokes all sessions |
| **Atomic Operations** | Uses transactions to prevent race conditions |
| **Audit Trail** | Tracks IP, device, and usage times |
| **Soft Delete** | Revoked tokens kept for forensics |

## 🔍 Security Event Logs

Watch for these in your logs:

```javascript
// Normal operation
[AUTH] Token rotated for userId: 123, ip: 192.168.1.1

// Security event - investigate immediately!
[SECURITY] Refresh token reuse detected for userId: 123, ip: 192.168.1.100
```

## 📝 API Endpoints

### POST /api/auth/login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:** Sets cookies `access_token` and `refresh_token`

### POST /api/auth/refresh
**Request:** No body needed (cookies sent automatically)  
**Response:** New tokens set in cookies

### POST /api/auth/logout
**Request:** No body needed  
**Response:** Cookies cleared

### POST /api/auth/logout-all
**Request:** Requires valid access token  
**Response:** All sessions revoked, cookies cleared

## 🧪 Testing

### Manual Testing with REST Client
```http
### 1. Login
POST http://localhost:3500/api/auth/login
Content-Type: application/json

{
  "email": "superadmin@auctionapp.com",
  "password": "Password123!"
}

### 2. Refresh (rotates token)
POST http://localhost:3500/api/auth/refresh

### 3. Try to reuse old token (should detect and revoke all)
# Manually grab old token and replay it

### 4. Logout
POST http://localhost:3500/api/auth/logout
```

### Automated Testing
```bash
npm run test:rotation
```

## 🧹 Maintenance

### Cleanup Old Tokens
```bash
# Run manually
npm run cleanup:tokens

# Or schedule with cron (Linux/Mac)
0 2 * * * cd /path/to/be-auction && npm run cleanup:tokens

# Or Task Scheduler (Windows)
# Create task to run: npm run cleanup:tokens
# Trigger: Daily at 2:00 AM
```

### Monitor Token Stats
```javascript
import { getTokenStats } from './src/utils/cleanupTokens.js';

const stats = await getTokenStats();
console.log(stats);
// { total: 100, active: 60, revoked: 38, expired: 2 }
```

## ⚠️ Production Checklist

Before deploying to production:

- [ ] Change `REFRESH_TOKEN_HASH_SECRET` to strong random value
- [ ] Store secrets in secure vault (not in .env file in repo)
- [ ] Set `NODE_ENV=production` for secure cookies
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set up monitoring for `[SECURITY]` log events
- [ ] Configure cleanup cron job
- [ ] Add rate limiting to `/api/auth/refresh`
- [ ] Test cookie settings with your frontend domain
- [ ] Review CORS settings (`CORS_ORIGIN`)
- [ ] Update `COOKIE_SAME_SITE` if needed for your setup

## 🔄 Token Lifecycle

```
LOGIN
  ↓
[Generate Plain Token] → [Hash with HMAC-SHA256] → [Store Hash in DB]
  ↓
[Send Plain Token as HttpOnly Cookie]
  ↓
CLIENT STORES COOKIE
  ↓
REFRESH REQUEST
  ↓
[Read Plain Token from Cookie] → [Hash Token] → [Lookup in DB]
  ↓
[Generate NEW Plain Token] → [Hash New Token] → [Store New Hash]
  ↓
[Revoke Old Token] → [Send New Plain Token as Cookie]
  ↓
OLD TOKEN BECOMES INVALID
  ↓
IF OLD TOKEN REUSED:
  ↓
[Detect Reuse] → [Revoke ALL User Sessions] → [Log Security Event]
```

## 📞 Troubleshooting

### "Invalid refresh token" error
- Token might be expired (check `JWT_REFRESH_EXPIRES_IN`)
- Token might have been revoked
- Cookie might not be sent (check domain/path settings)

### "Refresh token reuse detected"
- This is a security feature working correctly
- Someone tried to replay an old token
- All sessions revoked - user must login again
- Check logs for IP address of attacker

### Cookies not being sent
- Check `COOKIE_SAME_SITE` setting
- Ensure frontend and backend on same domain or use `Lax`
- In production, ensure HTTPS is enabled
- Check cookie path matches your API routes

### Race condition errors
- This is rare and handled automatically
- Transaction ensures only one rotation succeeds
- Other concurrent requests will fail safely

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `src/utils/tokenHelper.js` | Token generation & hashing |
| `src/services/authService.js` | Auth logic with rotation |
| `src/controllers/authController.js` | HTTP handlers |
| `src/utils/cleanupTokens.js` | Maintenance utility |
| `exp/js_jsx/testRefreshRotation.js` | Test suite |
| `prisma/schema.prisma` | Database schema |

## 💡 Tips

- Monitor security logs regularly
- Run cleanup weekly or daily
- Set appropriate token expiry times
- Use strong random secrets
- Enable HTTPS in production
- Consider rate limiting refresh endpoint
- Keep audit trail for compliance
