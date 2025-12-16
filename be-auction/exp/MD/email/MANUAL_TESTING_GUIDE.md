# Testing Email Verification - Manual Guide

## ✅ Setup Status

- [x] Gmail SMTP configured (`revee210@gmail.com`)
- [x] App Password set in `.env` 
- [x] SMTP connection tested successfully
- [x] Server can start

## 📋 Manual Testing Steps

### Method 1: Using REST Client (VS Code Extension)

1. **Install REST Client Extension** (if not installed):
   - Press `Ctrl+Shift+X`
   - Search "REST Client"
   - Install the extension by Huachao Mao

2. **Open file**: `be-auction/rest/auth.rest`

3. **Edit registration variables** (around line 19-22):
   ```
   @newName = Test User Email
   @newEmail = revee210@gmail.com
   @newPass = Test123!@#
   @newRole = COLLECTOR
   ```

4. **Start server** (if not running):
   ```powershell
   cd C:\Users\HP\Documents\GitHub\auctionAPP\be-auction
   npm start
   ```

5. **Send registration request**:
   - Find "### Register cepat" section in `auth.rest`
   - Click "Send Request" link above the POST request
   - Check server logs for email sending confirmation

6. **Check your email** (`revee210@gmail.com`):
   - You should receive a verification email
   - Click the verification link or copy the token

7. **Verify email** (manually in browser or REST):
   ```
   GET http://localhost:3500/api/auth/verify-email?token={YOUR_TOKEN}
   ```

8. **Test login** (after verification):
   - Update variables in `auth.rest`:
     ```
     @collectorEmail = revee210@gmail.com
     @collectorPass = Test123!@#
     ```
   - Send login request
   - Should succeed after verification

---

### Method 2: Using PowerShell (Direct HTTP Request)

1. **Start server**:
   ```powershell
   cd C:\Users\HP\Documents\GitHub\auctionAPP\be-auction
   npm start
   ```

2. **Register user** (in new PowerShell window):
   ```powershell
   $body = @{
     name = "Test User Email"
     email = "revee210@gmail.com"
     password = "Test123!@#"
     roleName = "COLLECTOR"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:3500/api/auth/register" `
     -Method Post `
     -ContentType "application/json" `
     -Body $body
   ```

3. **Expected response**:
   ```json
   {
     "message": "Registration successful. Please check your email to verify your account."
   }
   ```

4. **Check email** at `revee210@gmail.com`

5. **Verify email** (copy token from email):
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3500/api/auth/verify-email?token=YOUR_TOKEN_HERE" `
     -Method Get
   ```

6. **Test login**:
   ```powershell
   $loginBody = @{
     email = "revee210@gmail.com"
     password = "Test123!@#"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:3500/api/auth/login" `
     -Method Post `
     -ContentType "application/json" `
     -Body $loginBody
   ```

---

### Method 3: Using Postman/Thunder Client

1. **Import to Postman** or use Thunder Client in VS Code

2. **POST** `http://localhost:3500/api/auth/register`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "name": "Test User Email",
       "email": "revee210@gmail.com",
       "password": "Test123!@#",
       "roleName": "COLLECTOR"
     }
     ```

3. **Check email** and copy verification token

4. **GET** `http://localhost:3500/api/auth/verify-email?token={token}`

5. **POST** `http://localhost:3500/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "email": "revee210@gmail.com",
       "password": "Test123!@#"
     }
     ```

---

## 🔍 Verification Checklist

### ✅ Registration Response
- [ ] Status 200/201
- [ ] Message: "Registration successful. Please check your email..."

### ✅ Email Received
- [ ] Email arrives at revee210@gmail.com
- [ ] Subject: "Verify Your Email Address - Auction App"
- [ ] Contains "Verify Email Address" button
- [ ] Contains verification link with token

### ✅ Email Content
- [ ] Personalized greeting with user name
- [ ] Working verification button
- [ ] Alternative text link
- [ ] 24-hour expiry warning
- [ ] Professional HTML design

### ✅ Email Verification
- [ ] Click link or visit URL with token
- [ ] Status 200
- [ ] Message: "Email verified successfully"
- [ ] Database updated (`emailVerified = true`)

### ✅ Login Behavior
- [ ] **Before verification**: Login blocked with 403 error
- [ ] Error message: "Please verify your email before logging in..."
- [ ] **After verification**: Login succeeds with 200
- [ ] Receives access/refresh tokens in cookies

---

## 🐛 Troubleshooting

### Email not received?

1. **Check server logs** for email sending:
   ```
   ✅ Verification email sent: <message-id>
   ```

2. **Check spam folder** in Gmail

3. **Verify SMTP credentials**:
   ```powershell
   cd C:\Users\HP\Documents\GitHub\auctionAPP\be-auction
   node test-smtp.js
   ```
   Should output: `✅ SMTP connection successful!`

4. **Check Gmail App Password**:
   - Make sure it's 16 characters (no spaces)
   - Generated from: https://myaccount.google.com/apppasswords

### Server crashes after request?

1. **Check for duplicate email**:
   - Email might already be registered
   - Use different email for each test

2. **Check server logs** for error details

3. **Restart server**:
   ```powershell
   # Kill all node processes
   Get-Process -Name node | Stop-Process -Force
   
   # Start fresh
   cd C:\Users\HP\Documents\GitHub\auctionAPP\be-auction
   npm start
   ```

### Token expired?

1. **Request new verification email**:
   ```powershell
   $body = @{
     email = "revee210@gmail.com"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:3500/api/auth/resend-verification" `
     -Method Post `
     -ContentType "application/json" `
     -Body $body
   ```

2. Tokens expire after 24 hours

---

## 📊 Database Verification

Check user status in database:

```sql
SELECT 
  id,
  name,
  email,
  "emailVerified",
  "verificationToken",
  "verificationTokenExpiry"
FROM "User"
WHERE email = 'revee210@gmail.com';
```

**Before verification:**
- `emailVerified`: `false`
- `verificationToken`: `{128-char hex string}`
- `verificationTokenExpiry`: `{timestamp 24 hours from registration}`

**After verification:**
- `emailVerified`: `true`
- `verificationToken`: `NULL`
- `verificationTokenExpiry`: `NULL`

---

## 📝 Quick Test Checklist

- [ ] 1. Server running (`npm start`)
- [ ] 2. Register user with your email
- [ ] 3. Check Gmail inbox
- [ ] 4. Click verification link in email
- [ ] 5. Try login before verification (should fail)
- [ ] 6. Complete email verification
- [ ] 7. Try login after verification (should succeed)

---

## ✅ Success Criteria

All these should work:

1. ✅ Registration sends verification email
2. ✅ Email arrives with correct content
3. ✅ Verification link works
4. ✅ Unverified users cannot login (403 error)
5. ✅ Verified users can login successfully
6. ✅ Resend verification works
7. ✅ Tokens expire after 24 hours

---

## 🎯 Next Steps

After successful manual testing:

1. **Frontend Integration**:
   - Create verification success page
   - Handle EMAIL_NOT_VERIFIED error
   - Add "Resend verification" button

2. **Production Deployment**:
   - Use dedicated email service (SendGrid/AWS SES)
   - Update VERIFICATION_URL_BASE to production URL
   - Add rate limiting to resend endpoint

3. **Monitoring**:
   - Track email delivery rates
   - Monitor verification completion rates
   - Log failed email sends

---

**Last Updated:** December 15, 2025  
**Gmail Account:** revee210@gmail.com  
**SMTP Status:** ✅ Connected & Verified
