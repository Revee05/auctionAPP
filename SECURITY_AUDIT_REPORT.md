# 🔒 Laporan Audit Keamanan - Auction App
**Tanggal Audit:** 16 Desember 2025  
**Versi:** 1.0  
**Status:** ⚠️ Memerlukan Perbaikan

---

## 📋 Ringkasan Eksekutif

Audit keamanan telah dilakukan pada aplikasi auction yang terdiri dari:
- **Backend (BE):** Fastify + Prisma + PostgreSQL
- **Frontend (FE):** Next.js 16 + React 19

### Tingkat Keamanan Saat Ini: **6.5/10** ⚠️

**Aspek Positif:**
- ✅ Implementasi refresh token rotation yang baik
- ✅ HttpOnly cookies untuk token storage
- ✅ HMAC-SHA256 untuk hash refresh tokens
- ✅ Rate limiting pada endpoints sensitif
- ✅ RBAC (Role-Based Access Control) sudah diimplementasi
- ✅ Email verification dengan hashed tokens
- ✅ Bcrypt untuk password hashing (10 rounds)

**Aspek yang Memerlukan Perbaikan:**
- ⚠️ Default secrets masih ada di kode
- ⚠️ Tidak ada input validation library
- ⚠️ CORS terlalu permisif (`origin: true`)
- ⚠️ Tidak ada security headers (Helmet)
- ⚠️ Tidak ada file .env.example
- ⚠️ SQL injection protection mengandalkan Prisma saja
- ⚠️ Error messages bisa mengekspos informasi sensitif

---

## 🔍 Temuan Detail

### 1. ⚠️ **KRITIS: Default Secrets di Kode**

**Lokasi:** `be-auction/src/utils/tokenHelper.js`, `be-auction/server.js`

**Masalah:**
```javascript
// ❌ BAD - Default secrets hardcoded
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const REFRESH_TOKEN_HASH_SECRET = process.env.REFRESH_TOKEN_HASH_SECRET || 
  "your-refresh-token-hash-secret-change-in-production-use-strong-random-value";
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'cookie-secret-key-change-in-production';
```

**Risiko:**
- Jika secret tidak diubah di production, attacker bisa membuat token palsu
- Bisa membaca/modify semua session cookies
- Complete authentication bypass possible

**Rekomendasi:**
```javascript
// ✅ GOOD - Fail fast jika secret tidak ada
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET must be set in environment variables');
}

const REFRESH_TOKEN_HASH_SECRET = process.env.REFRESH_TOKEN_HASH_SECRET;
if (!REFRESH_TOKEN_HASH_SECRET) {
  throw new Error('FATAL: REFRESH_TOKEN_HASH_SECRET must be set');
}
```

**Action Items:**
1. Generate strong secrets (minimal 32 bytes random):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Tambahkan validasi startup untuk memastikan secrets ada
3. Dokumentasikan di `.env.example`

---

### 2. ⚠️ **TINGGI: Tidak Ada Input Validation**

**Masalah:**
Controllers langsung menggunakan `request.body`, `request.params`, `request.query` tanpa validasi skema:

```javascript
// ❌ BAD - No validation
const { name, email, password, roleName } = request.body;
if (!name || !email || !password) {
  return reply.status(400).send({ error: "Required fields missing" });
}
```

**Risiko:**
- Type confusion attacks
- Unexpected data types causing crashes
- Mass assignment vulnerabilities
- Injection attacks pada fields yang tidak divalidasi

**Rekomendasi:**

Gunakan **Zod** atau **Joi** untuk schema validation:

```javascript
// ✅ GOOD - Schema validation with Zod
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  roleName: z.enum(['ARTIST', 'COLLECTOR']).optional()
});

async register(request, reply) {
  try {
    const validated = registerSchema.parse(request.body);
    // Use validated data only
  } catch (error) {
    return reply.status(400).send({ 
      error: 'Validation failed',
      details: error.errors 
    });
  }
}
```

**Action Items:**
1. Install Zod: `npm install zod` (sudah ada di FE, tambahkan di BE)
2. Buat validation schemas di `be-auction/src/validators/`
3. Apply ke semua endpoints yang menerima user input

---

### 3. ⚠️ **TINGGI: CORS Terlalu Permisif**

**Lokasi:** `be-auction/server.js`

**Masalah:**
```javascript
// ❌ BAD - Allows ALL origins
fastify.register(fastifyCors, {
  origin: true,  // Allows any origin!
  credentials: true,
});
```

**Risiko:**
- CSRF attacks dari domain manapun
- Credential theft
- Unauthorized API access

**Rekomendasi:**
```javascript
// ✅ GOOD - Whitelist specific origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://your-production-domain.com'
];

fastify.register(fastifyCors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 204
});
```

**Action Items:**
1. Set `FRONTEND_URL` di environment variables
2. Implement CORS whitelist
3. Test cross-origin requests setelah implementasi

---

### 4. ⚠️ **SEDANG: Tidak Ada Security Headers**

**Masalah:**
Backend tidak menggunakan Helmet atau security headers standar.

**Risiko:**
- XSS attacks
- Clickjacking
- MIME-type sniffing
- Tidak ada Content Security Policy

**Rekomendasi:**

Install dan configure **@fastify/helmet**:

```bash
npm install @fastify/helmet
```

```javascript
// ✅ GOOD - Security headers
import helmet from '@fastify/helmet';

fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true
});
```

---

### 5. ⚠️ **SEDANG: Rate Limiting Tidak Konsisten**

**Masalah:**
- Rate limiting hanya pada beberapa auth routes
- Tidak ada global rate limiting
- Tidak ada brute-force protection untuk login

**Saat Ini:**
```javascript
// Only on specific routes
fastify.post('/register', registerRateLimit, authController.register)
fastify.post('/login', authController.login) // ❌ No rate limit!
```

**Rekomendasi:**
```javascript
// ✅ GOOD - Aggressive rate limiting untuk auth endpoints
const loginRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '15 minutes',
      ban: 3, // Ban after 3 violations
      errorResponseBuilder: (req, context) => ({
        error: 'Too many login attempts. Try again later.',
        retryAfter: context.after
      })
    }
  }
};

fastify.post('/login', loginRateLimit, authController.login);

// Global rate limit untuk semua API calls
fastify.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: '1 minute'
});
```

---

### 6. ⚠️ **SEDANG: Error Messages Verbose**

**Masalah:**
Error messages mengekspos detail implementasi:

```javascript
// ❌ BAD - Exposes database errors
catch (error) {
  return reply.status(500).send({ error: error.message });
}
```

**Risiko:**
- Database schema exposure
- Implementation details leak
- Stack traces di production

**Rekomendasi:**
```javascript
// ✅ GOOD - Generic error messages
catch (error) {
  fastify.log.error(error); // Log internally
  
  if (process.env.NODE_ENV === 'production') {
    return reply.status(500).send({ 
      error: 'An error occurred. Please try again later.' 
    });
  } else {
    // Detailed errors only in development
    return reply.status(500).send({ 
      error: error.message,
      stack: error.stack 
    });
  }
}
```

---

### 7. ⚠️ **SEDANG: Tidak Ada .env.example**

**Masalah:**
- Tidak ada dokumentasi environment variables
- Developer baru tidak tahu variable apa yang dibutuhkan
- Secret requirements tidak terdokumentasi

**Rekomendasi:**

Buat `be-auction/.env.example`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/auction_db

# JWT & Authentication
JWT_SECRET=<generate-with-crypto.randomBytes(32)>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_TOKEN_HASH_SECRET=<generate-with-crypto.randomBytes(32)>

# Cookies
COOKIE_SECRET=<generate-with-crypto.randomBytes(32)>
ACCESS_COOKIE_NAME=access_token
REFRESH_COOKIE_NAME=refresh_token
COOKIE_SAME_SITE=strict
COOKIE_PATH=/

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@auction.com
EMAIL_FROM_NAME=Auction App

# Application URLs
FRONTEND_URL=http://localhost:3000
VERIFICATION_URL_BASE=http://localhost:3500

# Environment
NODE_ENV=development
```

Dan `fe-auction/.env.example`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3500
NEXT_PUBLIC_DEBUG_AUTH=false
```

---

### 8. ✅ **BAIK: Token Management**

**Yang Sudah Benar:**
- ✅ HttpOnly cookies (tidak accessible dari JavaScript)
- ✅ Refresh token rotation implemented
- ✅ HMAC-SHA256 untuk hash tokens
- ✅ Token reuse detection dengan session revocation
- ✅ Separate access & refresh tokens
- ✅ Token expiry management

**Saran Tambahan:**
- Tambahkan device fingerprinting untuk anomaly detection
- Implement suspicious login alerts
- Add geolocation tracking untuk security audit

---

### 9. ✅ **BAIK: Password Security**

**Yang Sudah Benar:**
- ✅ Bcrypt dengan 10 rounds
- ✅ Password tidak pernah di-log atau return ke client
- ✅ Password hash stored dengan aman

**Saran Tambahan:**
```javascript
// Tingkatkan ke 12 rounds untuk security lebih baik
const hashedPassword = await bcrypt.hash(password, 12);

// Tambahkan password strength validation
const passwordSchema = z.string()
  .min(8, 'Password minimal 8 karakter')
  .max(128, 'Password maksimal 128 karakter')
  .regex(/[A-Z]/, 'Harus ada huruf kapital')
  .regex(/[a-z]/, 'Harus ada huruf kecil')
  .regex(/[0-9]/, 'Harus ada angka')
  .regex(/[^A-Za-z0-9]/, 'Harus ada karakter spesial');
```

---

### 10. ✅ **BAIK: RBAC Implementation**

**Yang Sudah Benar:**
- ✅ Role-based access control implemented
- ✅ Middleware untuk authorization checks
- ✅ Role hierarchy (SUPER_ADMIN > ADMIN > USER)
- ✅ Protected routes di frontend & backend

**Saran Tambahan:**
- Tambahkan audit logging untuk role changes
- Implement permission-based access (lebih granular dari role-based)
- Add role assumption feature untuk debugging

---

## 🔒 Frontend Security Analysis

### 11. ✅ **BAIK: XSS Prevention**

**Yang Sudah Benar:**
- ✅ React otomatis escape output
- ✅ Tidak ada `dangerouslySetInnerHTML` di user code (hanya di layout untuk theme script)
- ✅ Tidak ada `eval()` di user code

**Theme Script Analysis:**
```javascript
// Layout.js - Inline script untuk mencegah FOUC (Flash of Unstyled Content)
<script dangerouslySetInnerHTML={{ __html: `(function(){...})();` }} />
```
**Status:** ✅ AMAN - Script ini:
- Hardcoded (tidak ada user input)
- Hanya membaca/set theme dari localStorage
- Runs before hydration (necessary untuk dark mode)
- Tidak ada security risk

---

### 12. ✅ **BAIK: Token Storage**

**Yang Sudah Benar:**
- ✅ Tokens di HttpOnly cookies (tidak accessible dari JavaScript)
- ✅ Tidak ada tokens di localStorage
- ✅ CSRF protection via SameSite cookies
- ✅ Automatic token refresh dengan axios interceptor

---

### 13. ⚠️ **SEDANG: Content Security Policy**

**Masalah:**
Frontend tidak menggunakan CSP headers dari Next.js config.

**Rekomendasi:**

Tambahkan di `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
```

---

## 📊 Prioritas Perbaikan

### 🚨 **KRITIS (Segera - 1-2 hari):**
1. ✅ Hapus default secrets & tambahkan validation
2. ✅ Whitelist CORS origins
3. ✅ Buat .env.example files
4. ✅ Tambahkan rate limiting ke login endpoint

### ⚠️ **TINGGI (1 minggu):**
5. ⬜ Implement input validation dengan Zod
6. ⬜ Install & configure Helmet
7. ⬜ Improve error handling (no detail exposure)
8. ⬜ Tambahkan security headers di Next.js

### 📌 **SEDANG (2 minggu):**
9. ⬜ Implement comprehensive rate limiting
10. ⬜ Add password strength requirements
11. ⬜ Device fingerprinting untuk token management
12. ⬜ Audit logging system

### 💡 **RENDAH (Future enhancements):**
13. ⬜ 2FA/MFA implementation
14. ⬜ Security monitoring & alerting
15. ⬜ Automated security scanning (Snyk, OWASP ZAP)
16. ⬜ Penetration testing

---

## 🛠️ Action Plan - Quick Wins (1 Hari)

### Step 1: Secure Secrets (30 menit)
```bash
# Generate strong secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('REFRESH_TOKEN_HASH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('COOKIE_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Buat `.env` file dan tambahkan secrets, lalu update `tokenHelper.js` untuk fail fast.

### Step 2: Fix CORS (15 menit)
Update `server.js` dengan CORS whitelist seperti di rekomendasi #3.

### Step 3: Rate Limit Login (10 menit)
Tambahkan rate limiting ke login endpoint seperti di rekomendasi #5.

### Step 4: Create .env.example (15 menit)
Copy template dari rekomendasi #7.

### Step 5: Install Helmet (20 menit)
```bash
cd be-auction
npm install @fastify/helmet
```
Apply konfigurasi dari rekomendasi #4.

---

## 📈 Target Keamanan

**Saat Ini:** 6.5/10 ⚠️  
**Setelah Quick Wins:** 7.5/10 ✅  
**Setelah Implementasi Penuh:** 9.0/10 🎯

---

## 📚 Referensi & Best Practices

1. **OWASP Top 10:** https://owasp.org/www-project-top-ten/
2. **Fastify Security Best Practices:** https://fastify.dev/docs/latest/Guides/Security/
3. **Next.js Security Headers:** https://nextjs.org/docs/app/api-reference/next-config-js/headers
4. **JWT Best Practices:** https://tools.ietf.org/html/rfc8725
5. **NIST Password Guidelines:** https://pages.nist.gov/800-63-3/

---

## ✅ Checklist Implementasi

### Backend Security
- [ ] Hapus default secrets & add validation
- [ ] Implement Zod validation schemas
- [ ] Configure CORS whitelist
- [ ] Install & configure Helmet
- [ ] Add comprehensive rate limiting
- [ ] Improve error handling
- [ ] Create .env.example
- [ ] Add security audit logging
- [ ] Increase bcrypt rounds to 12
- [ ] Add password strength validation

### Frontend Security
- [ ] Add CSP headers in Next.js config
- [ ] Implement client-side validation
- [ ] Add security headers
- [ ] Test CORS configuration
- [ ] Review all user input handling

### DevOps & Monitoring
- [ ] Set up environment variable management
- [ ] Configure secrets rotation policy
- [ ] Add security monitoring
- [ ] Set up automated vulnerability scanning
- [ ] Create incident response plan

---

**Dibuat oleh:** GitHub Copilot Security Audit  
**Last Updated:** 16 Desember 2025  
**Next Review:** 16 Januari 2026
