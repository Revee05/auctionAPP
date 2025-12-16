# Email Verification Setup Guide

## 📧 Email Verification Feature

Fitur verifikasi email telah berhasil ditambahkan ke aplikasi Auction App. User harus memverifikasi email mereka sebelum dapat login.

---

## ✨ Features

- ✅ **Email verification required** - User tidak bisa login sebelum verifikasi email
- ✅ **24-hour token expiry** - Token verifikasi expired dalam 24 jam
- ✅ **Beautiful HTML emails** - Template email yang menarik dan responsive
- ✅ **Resend verification** - User bisa request email verifikasi ulang
- ✅ **Automatic cleanup** - Token expired dibersihkan secara otomatis
- ✅ **Secure tokens** - 128-character random hex tokens

---

## 🗂️ Files Created/Modified

### Created Files:
1. **`src/services/emailService.js`** - Email sending service dengan nodemailer
2. **`src/templates/verificationEmail.js`** - HTML & text email templates
3. **`prisma/migrations/20251212032121_add_email_verification/`** - Database migration

### Modified Files:
1. **`prisma/schema.prisma`** - Added email verification fields
2. **`src/services/authService.js`** - Added verification logic
3. **`src/controllers/authController.js`** - Added verification endpoints
4. **`src/routes/authRoutes.js`** - Added verification routes
5. **`src/utils/cleanupTokens.js`** - Added verification token cleanup
6. **`.env`** - Added SMTP configuration
7. **`rest/auth.rest`** - Added verification API tests

---

## 🔧 Configuration Required

### Step 1: Configure SMTP Settings

Edit file `.env` dan sesuaikan dengan email provider Anda:

```env
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password-here"

# Email sender details
EMAIL_FROM="noreply@auctionapp.com"
EMAIL_FROM_NAME="Auction App"

# Frontend URL for verification links
VERIFICATION_URL_BASE="http://localhost:3000"
```

### Step 2: Gmail Setup (Recommended)

Jika menggunakan Gmail:

1. **Enable 2-Factor Authentication**:
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
   - Paste to `SMTP_PASS` in `.env`

3. **Update `.env`**:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="youremail@gmail.com"
   SMTP_PASS="xxxx xxxx xxxx xxxx"  # 16-character app password
   EMAIL_FROM="youremail@gmail.com"
   ```

### Step 3: Other Email Providers

#### **Outlook/Hotmail**
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
```

#### **Yahoo Mail**
```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT=587
SMTP_USER="your-email@yahoo.com"
SMTP_PASS="your-app-password"
```

#### **Custom SMTP Server**
```env
SMTP_HOST="mail.yourdomain.com"
SMTP_PORT=587
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="your-password"
```

---

## 🚀 Testing

### 1. Start the Server

```bash
cd be-auction
npm run dev
```

### 2. Test Registration Flow

#### Register new user:
```bash
POST http://localhost:3500/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "roleName": "COLLECTOR"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account."
}
```

### 3. Check Email

User akan menerima email dengan:
- Verification link
- 24-hour expiry notice
- Beautiful HTML template

### 4. Verify Email

User clicks link di email atau:
```bash
GET http://localhost:3500/api/auth/verify-email?token={TOKEN_FROM_EMAIL}
```

**Response:**
```json
{
  "message": "Email verified successfully",
  "email": "john@example.com"
}
```

### 5. Test Login (Before Verification)

Attempt login before verification:
```bash
POST http://localhost:3500/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Please verify your email before logging in. Check your inbox for verification link.",
  "code": "EMAIL_NOT_VERIFIED"
}
```

### 6. Test Login (After Verification)

After email verification, login succeeds:
```bash
POST http://localhost:3500/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
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

### 7. Resend Verification Email

If token expired or email not received:
```bash
POST http://localhost:3500/api/auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Verification email sent successfully",
  "email": "john@example.com"
}
```

---

## 🗄️ Database Schema

New fields added to `User` table:

```prisma
model User {
  id                      Int            @id @default(autoincrement())
  name                    String
  email                   String         @unique
  password                String?
  emailVerified           Boolean        @default(false)        // ← NEW
  verificationToken       String?        @unique                // ← NEW
  verificationTokenExpiry DateTime?                             // ← NEW
  roles                   UserRole[]
  refreshTokens           RefreshToken[]
  createdAt               DateTime       @default(now())
  updatedAt               DateTime       @updatedAt
}
```

---

## 🔄 API Endpoints

### New Endpoints:

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/auth/verify-email?token={token}` | Verify email with token | No |
| `POST` | `/api/auth/resend-verification` | Resend verification email | No |

### Modified Endpoints:

| Method | Endpoint | Changes |
|--------|----------|---------|
| `POST` | `/api/auth/register` | Now sends verification email |
| `POST` | `/api/auth/login` | Now blocks unverified users (403) |

---

## 🧹 Token Cleanup

Expired verification tokens are cleaned automatically.

### Manual Cleanup:

```bash
cd be-auction
node src/utils/cleanupTokens.js
```

### Scheduled Cleanup (Optional):

Add to `server.js` or use cron:

```javascript
import { cleanupExpiredVerificationTokens } from './src/utils/cleanupTokens.js';

// Run cleanup every 24 hours
setInterval(async () => {
  await cleanupExpiredVerificationTokens();
}, 24 * 60 * 60 * 1000);
```

---

## 🎨 Email Template Preview

The verification email includes:
- 🎨 Beautiful gradient header
- 👋 Personalized greeting with user's name
- 🔘 Big "Verify Email Address" button
- 🔗 Alternative link (for email clients without button support)
- ⏰ 24-hour expiry warning
- 📱 Responsive design (mobile-friendly)

---

## 🔒 Security Features

1. **Cryptographically secure tokens** - 64 bytes random (128 hex chars)
2. **Time-limited tokens** - 24-hour expiry
3. **Unique tokens** - Database unique constraint
4. **Token cleanup** - Expired tokens auto-cleared
5. **Blocked login** - Unverified users cannot login
6. **Rate limiting ready** - Can add rate limit to resend endpoint

---

## 🐛 Troubleshooting

### Email not sending?

1. **Check SMTP credentials**:
   ```bash
   # Test SMTP connection
   node -e "require('./src/services/emailService.js').verifyConnection()"
   ```

2. **Check logs**:
   ```bash
   # Look for email sending errors
   ✅ Verification email sent: <message-id>
   ❌ Failed to send verification email: <error>
   ```

3. **Common issues**:
   - Wrong app password (use app password, not regular password for Gmail)
   - 2FA not enabled (required for Gmail app passwords)
   - Firewall blocking port 587
   - SMTP_HOST incorrect

### Token not working?

1. **Check token expiry**:
   - Tokens expire in 24 hours
   - Use resend verification if expired

2. **Check token format**:
   - Token should be 128 hex characters
   - No spaces or special characters

### User can't login?

1. **Check verification status**:
   ```sql
   SELECT email, emailVerified, verificationTokenExpiry 
   FROM "User" 
   WHERE email = 'user@example.com';
   ```

2. **Manually verify user (for testing)**:
   ```sql
   UPDATE "User" 
   SET "emailVerified" = true, 
       "verificationToken" = NULL, 
       "verificationTokenExpiry" = NULL 
   WHERE email = 'user@example.com';
   ```

---

## 📝 Next Steps

### Optional Enhancements:

1. **Rate limiting** - Limit resend verification requests
2. **Email templates** - Add more email types (password reset, welcome, etc.)
3. **Email queue** - Use Bull or RabbitMQ for background processing
4. **Email tracking** - Track email open/click rates
5. **Multi-language** - Internationalize email templates

### Frontend Integration:

1. Create verification success page at `/auth/verify-email`
2. Handle `EMAIL_NOT_VERIFIED` error on login
3. Add "Resend verification email" button
4. Show verification pending state in UI

---

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Check server logs for error messages
2. Verify SMTP configuration in `.env`
3. Test SMTP connection with `verifyConnection()`
4. Check database for verification status

---

## ✅ Checklist

- [x] Database migration created and applied
- [x] Email service configured
- [x] Email templates created
- [x] Auth service updated
- [x] Auth controller updated
- [x] Routes configured
- [x] Token cleanup utility updated
- [x] Environment variables documented
- [ ] SMTP credentials configured (you need to do this)
- [ ] Test email sending
- [ ] Test full registration flow
- [ ] Frontend integration (optional)

---

**Implementation Date:** December 12, 2025
**Version:** 1.0.0
**Status:** ✅ Ready for testing (configure SMTP first)
