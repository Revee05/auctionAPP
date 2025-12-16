# 🚨 CRITICAL: Update Your .env File NOW!

## ⚠️ ACTION REQUIRED

File `.env` Anda masih menggunakan **DEFAULT SECRETS** yang tidak aman!

```
JWT_SECRET="your-secret-key-change-in-production"  ❌ UNSAFE
COOKIE_SECRET="cookie-secret-key-change-in-production"  ❌ UNSAFE
REFRESH_TOKEN_HASH_SECRET="your-refresh-token-hash-secret..."  ❌ UNSAFE
```

---

## ✅ QUICK FIX (5 menit)

### Step 1: Generate Strong Secrets

Copy-paste command ini ke terminal:

```bash
node -e "const c=require('crypto'); console.log('JWT_SECRET=' + c.randomBytes(32).toString('hex')); console.log('REFRESH_TOKEN_HASH_SECRET=' + c.randomBytes(32).toString('hex')); console.log('COOKIE_SECRET=' + c.randomBytes(32).toString('hex'));"
```

**Sample output:**
```
JWT_SECRET=baee02a2cbe5873cf85ea39aa79682bd682a758e5feffd1ed78c9e1e898e2b38
REFRESH_TOKEN_HASH_SECRET=046be31c4f0ab74876604a0ef177f1f8f068b2a8eb06e05ed89fe60ab7af835a
COOKIE_SECRET=5653c48b6b44ab6074299227f86e292336031880fb882a601fa19fdcee08d04f
```

### Step 2: Update .env File

Buka file `be-auction/.env` dan **REPLACE** baris berikut dengan secrets yang baru di-generate:

```bash
# BEFORE (UNSAFE):
JWT_SECRET="your-secret-key-change-in-production"
REFRESH_TOKEN_HASH_SECRET="your-refresh-token-hash-secret-change-in-production-use-strong-random-value"
COOKIE_SECRET="cookie-secret-key-change-in-production"

# AFTER (SAFE - use YOUR generated secrets, not these examples):
JWT_SECRET=baee02a2cbe5873cf85ea39aa79682bd682a758e5feffd1ed78c9e1e898e2b38
REFRESH_TOKEN_HASH_SECRET=046be31c4f0ab74876604a0ef177f1f8f068b2a8eb06e05ed89fe60ab7af835a
COOKIE_SECRET=5653c48b6b44ab6074299227f86e292336031880fb882a601fa19fdcee08d04f
```

**IMPORTANT:** 
- Hapus tanda kutip `"` (tidak perlu quotes)
- Gunakan secrets yang ANDA generate sendiri (jangan copy contoh di atas!)

### Step 3: Update CORS Settings

Di `.env`, change:
```bash
# BEFORE (UNSAFE):
CORS_ORIGIN="*"

# AFTER (SAFE):
FRONTEND_URL="http://localhost:3000"
```

Dan HAPUS atau comment line `CORS_ORIGIN`:
```bash
# CORS_ORIGIN="*"  # Not used anymore
```

### Step 4: Restart Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

**Expected:**
- ✅ Server starts successfully
- ✅ No error about secrets
- ✅ Logs show Helmet and CORS registered

**If error:**
- Error `JWT_SECRET must be set` → Check .env file, remove quotes
- Error `JWT_SECRET must be at least 32 characters` → Generate new secret (must be 64 hex chars)

---

## 🔒 Security Validation

Setelah update, test bahwa semuanya bekerja:

### Test 1: Server Startup ✅
```bash
cd be-auction
npm run dev
```
Expected: Server starts without errors

### Test 2: Login Works ✅
```bash
# Test login di frontend
# Should work normally with new secrets
```

### Test 3: CORS Protection ✅
```bash
# Dari browser console di domain lain (NOT localhost:3000)
fetch('http://localhost:3500/api/auth/status', {credentials: 'include'})
```
Expected: CORS error (blocked)

### Test 4: Rate Limiting ✅
```bash
# Try login 6 times with wrong password
# 6th attempt should be blocked
```

---

## 📝 Complete .env Template

Untuk referensi, ini structure lengkap `.env` yang benar:

```bash
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL="postgresql://postgres:246855@localhost:5432/auctionDB"

# ===========================================
# JWT & AUTHENTICATION (GENERATE NEW!)
# ===========================================
JWT_SECRET=<YOUR_GENERATED_SECRET_64_CHARS>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ===========================================
# REFRESH TOKEN SECURITY (GENERATE NEW!)
# ===========================================
REFRESH_TOKEN_HASH_SECRET=<YOUR_GENERATED_SECRET_64_CHARS>
REFRESH_TOKEN_BYTES=64

# ===========================================
# COOKIES (GENERATE NEW!)
# ===========================================
COOKIE_SECRET=<YOUR_GENERATED_SECRET_64_CHARS>
ACCESS_COOKIE_NAME=access_token
REFRESH_COOKIE_NAME=refresh_token
COOKIE_SAME_SITE=strict
COOKIE_PATH=/

# ===========================================
# EMAIL (Keep existing values)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=revee210@gmail.com
SMTP_PASS=sttlfubimbtzbelp
EMAIL_FROM=revee210@gmail.com
EMAIL_FROM_NAME=Auction App

# ===========================================
# URLS
# ===========================================
FRONTEND_URL=http://localhost:3000
VERIFICATION_URL_BASE=http://localhost:3500

# ===========================================
# ENVIRONMENT
# ===========================================
NODE_ENV=development
PORT=3500
```

---

## ⚡ Why This Matters

### Without proper secrets:
- ❌ Attacker bisa create fake JWT tokens
- ❌ Attacker bisa read/modify cookies
- ❌ Session hijacking possible
- ❌ Complete authentication bypass

### With proper secrets:
- ✅ JWT tokens cryptographically secure
- ✅ Cookies cannot be forged
- ✅ Sessions protected
- ✅ Authentication secure

---

## 🎯 Verification Checklist

- [ ] Generated 3 new secrets dengan crypto.randomBytes(32)
- [ ] Updated JWT_SECRET di .env (no quotes, 64 hex chars)
- [ ] Updated REFRESH_TOKEN_HASH_SECRET di .env
- [ ] Updated COOKIE_SECRET di .env
- [ ] Updated FRONTEND_URL di .env
- [ ] Removed or commented CORS_ORIGIN="*"
- [ ] Restarted backend server
- [ ] Server starts without errors
- [ ] Login still works
- [ ] CORS blocks unauthorized origins

---

## 🆘 Troubleshooting

### "JWT_SECRET must be at least 32 characters"
Secret harus 64 hex characters. Re-generate dengan command di Step 1.

### "Cannot start server"
Check `.env` file format:
- No quotes around secrets
- No spaces before/after `=`
- Secrets are 64 hex characters (0-9, a-f)

### "Login not working"
Jika sudah pernah login sebelumnya, cookies lama mungkin invalid.
Fix: Clear browser cookies untuk localhost:3000

---

**Status:** ⚠️ CRITICAL - Update ASAP  
**Priority:** 🚨 HIGHEST  
**Time Required:** ⏱️ 5 minutes  
**Next:** After update, test all endpoints
