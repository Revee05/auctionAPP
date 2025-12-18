import { authService } from "../services/authService.js";
import tokenHelper from "../utils/tokenHelper.js";
import { registerSchema, loginSchema, resendVerificationSchema, verifyEmailSchema, updateProfileSchema, changeEmailSchema, changePasswordSchema } from "../validators/authValidators.js";

// ============================================
// AUTH CONTROLLER - Cookie-based Authentication
// ============================================

export const authController = {
  // =========================
  // REGISTER - Daftar user baru
  // =========================
  async register(request, reply) {
    try {
      // Validate input
      const validation = registerSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { name, email, password, roleName } = validation.data;

      // Capture request metadata
      const reqMeta = {
        ip: request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress,
        deviceInfo: request.headers['user-agent'] || 'unknown'
      };

      await authService.register({ name, email, password, roleName }, reqMeta);

      return reply.status(201).send({
        message: "Registration successful. Please check your email to verify your account.",
      });
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  },

  // =========================
  // LOGIN - Masuk dengan cookie
  // =========================
  async login(request, reply) {
    try {
      // Validate input
      const validation = loginSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { email, password } = validation.data;

      // Capture request metadata for security
      const reqMeta = {
        ip: request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress,
        deviceInfo: request.headers['user-agent'] || 'unknown'
      };

      const result = await authService.login(email, password, reqMeta);

      // Set access token di HTTP-only cookie (names/options from env via helper)
      reply.setCookie(
        tokenHelper.ACCESS_COOKIE_NAME,
        result.accessToken,
        tokenHelper.getCookieOptions()
      );

      // Set refresh token di HTTP-only cookie (use helper for options; maxAge in seconds)
      reply.setCookie(
        tokenHelper.REFRESH_COOKIE_NAME,
        result.refreshToken,
        tokenHelper.getRefreshCookieOptions()
      );

      return reply.send({
        message: "Login successful",
        user: result.user,
      });
    } catch (error) {
      // Handle email verification error specifically
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        return reply.status(403).send({ 
          error: "Please verify your email before logging in. Check your inbox for verification link.",
          code: "EMAIL_NOT_VERIFIED"
        });
      }
      // Handle suspended/banned account error
      if (error.message === 'ACCOUNT_SUSPENDED') {
        return reply.status(403).send({ 
          error: "Your account has been suspended or banned. Please contact support.",
          code: "ACCOUNT_SUSPENDED"
        });
      }
      return reply.status(401).send({ error: error.message });
    }
  },

  // =========================
  // REFRESH - Perbarui access token dengan rotation
  // =========================
  async refresh(request, reply) {
    try {
      const refreshToken = request.cookies[tokenHelper.REFRESH_COOKIE_NAME];

      if (!refreshToken) {
        return reply.status(401).send({ error: "No refresh token provided" });
      }

      // Capture request metadata for security
      const reqMeta = {
        ip: request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress,
        deviceInfo: request.headers['user-agent'] || 'unknown'
      };

      const result = await authService.refreshAccessToken(refreshToken, reqMeta);

      // Set NEW access token di cookie
      reply.setCookie(
        tokenHelper.ACCESS_COOKIE_NAME,
        result.accessToken,
        tokenHelper.getCookieOptions()
      );

      // Set NEW refresh token di cookie (rotation)
      reply.setCookie(
        tokenHelper.REFRESH_COOKIE_NAME,
        result.refreshToken,
        tokenHelper.getRefreshCookieOptions()
      );

      return reply.send({
        message: "Token refreshed successfully",
        user: result.user,
      });
    } catch (error) {
      // Clear cookies on reuse detection or other errors
      reply.clearCookie(tokenHelper.ACCESS_COOKIE_NAME, { path: "/" });
      reply.clearCookie(tokenHelper.REFRESH_COOKIE_NAME, { path: "/" });
      
      // Handle suspended/banned account error
      if (error.message === 'ACCOUNT_SUSPENDED') {
        return reply.status(403).send({ 
          error: "Your account has been suspended or banned. Please contact support.",
          code: "ACCOUNT_SUSPENDED"
        });
      }
      
      return reply.status(401).send({ error: error.message });
    }
  },

  // =========================
  // LOGOUT - Hapus token & cookie
  // =========================
  async logout(request, reply) {
    try {
      const refreshToken = request.cookies[tokenHelper.REFRESH_COOKIE_NAME];

      // Hapus refresh token dari database
      await authService.logout(refreshToken);

      // Hapus cookie
      reply.clearCookie(tokenHelper.ACCESS_COOKIE_NAME, { path: "/" });
      reply.clearCookie(tokenHelper.REFRESH_COOKIE_NAME, { path: "/" });

      return reply.send({ message: "Logged out successfully" });
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  },

  // =========================
  // LOGOUT ALL - Hapus semua sesi user
  // =========================
  async logoutAll(request, reply) {
    try {
      const userId = request.user.userId;

      // Hapus semua refresh token user
      await authService.logoutAll(userId);

      // Hapus cookie
      reply.clearCookie(tokenHelper.ACCESS_COOKIE_NAME, { path: "/" });
      reply.clearCookie(tokenHelper.REFRESH_COOKIE_NAME, { path: "/" });

      return reply.send({ message: "Logged out from all devices" });
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  },

  // =========================
  // GET CURRENT USER (Me)
  // =========================
  async me(request, reply) {
    try {
      const user = await authService.me(request.user.userId)

      return reply.send({ user })
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  },

  // =========================
  // UPDATE PROFILE - Perbarui profil user saat ini
  // =========================
  async updateProfile(request, reply) {
    try {
      const userId = request.user.userId;
      
      // Validate input
      const validation = updateProfileSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { name, avatarUrl } = validation.data;

      const user = await authService.updateProfile(userId, { name, avatarUrl })

      return reply.send({ message: 'Profile updated successfully', user })
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  },

  // =========================
  // CHECK STATUS - Cek status login
  // =========================
  async status(request, reply) {
    try {
      const accessToken = request.cookies[tokenHelper.ACCESS_COOKIE_NAME];
      const refreshToken = request.cookies[tokenHelper.REFRESH_COOKIE_NAME];

      return reply.send({
        isLoggedIn: !!(accessToken || refreshToken),
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      });
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  },

  // =========================
  // VERIFY EMAIL - Verifikasi email dengan token
  // =========================
  async verifyEmail(request, reply) {
    try {
      // Validate input
      const validation = verifyEmailSchema.safeParse(request.query);
      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { token } = validation.data;

      // Capture request metadata
      const reqMeta = {
        ip: request.ip || request.headers['x-forwarded-for'] || request.socket.remoteAddress,
        deviceInfo: request.headers['user-agent'] || 'unknown'
      };

      const result = await authService.verifyEmail(token, reqMeta);

      // If client expects JSON, return JSON. Otherwise redirect to frontend login.
      const accept = request.headers.accept || '';
      const frontendBase = process.env.FRONTEND_URL;

      if (accept.includes('application/json')) {
        return reply.send({
          message: result.message,
          email: result.email,
          isEmailChange: result.isEmailChange || false,
        });
      }

      // Different redirect for email change vs registration
      if (result.isEmailChange) {
        const redirectUrl = `${frontendBase.replace(/\/$/, '')}/auth/login?emailChanged=1&email=${encodeURIComponent(result.email || '')}`;
        return reply.redirect(redirectUrl);
      } else {
        const redirectUrl = `${frontendBase.replace(/\/$/, '')}/auth/login?verified=1&email=${encodeURIComponent(result.email || '')}`;
        return reply.redirect(redirectUrl);
      }
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  },

  // =========================
  // RESEND VERIFICATION - Kirim ulang email verifikasi
  // =========================
  async resendVerification(request, reply) {
    try {
      // Validate input
      const validation = resendVerificationSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { email } = validation.data;

      const result = await authService.resendVerification(email);

      return reply.send({
        message: result.message,
      });
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  },

  // =========================
  // CHANGE EMAIL - Request email change with verification
  // =========================
  async changeEmail(request, reply) {
    try {
      const userId = request.user.userId;

      // Validate input
      const validation = changeEmailSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { newEmail, password } = validation.data;

      const result = await authService.changeEmail(userId, newEmail, password);

      return reply.send(result);
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  },

  // =========================
  // CHANGE PASSWORD - Update user password
  // =========================
  async changePassword(request, reply) {
    try {
      const userId = request.user.userId;

      // Validate input
      const validation = changePasswordSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const { currentPassword, newPassword } = validation.data;

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      return reply.send(result);
    } catch (error) {
      return reply.status(400).send({ error: error.message });
    }
  },
};
