import { authService } from "../services/authService.js";
import tokenHelper from "../utils/tokenHelper.js";

// ============================================
// AUTH CONTROLLER - Cookie-based Authentication
// ============================================

export const authController = {
  // =========================
  // REGISTER - Daftar user baru
  // =========================
  async register(request, reply) {
    try {
      const { name, email, password, roleName } = request.body;

      if (!name || !email || !password) {
        return reply.status(400).send({
          error: "Name, email, and password are required",
        });
      }

      await authService.register({ name, email, password, roleName });

      return reply.status(201).send({
        message: "Registration successful. Please login.",
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
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.status(400).send({
          error: "Email and password are required",
        });
      }

      const result = await authService.login(email, password);

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
      return reply.status(401).send({ error: error.message });
    }
  },

  // =========================
  // REFRESH - Perbarui access token
  // =========================
  async refresh(request, reply) {
    try {
      const refreshToken = request.cookies[tokenHelper.REFRESH_COOKIE_NAME];

      if (!refreshToken) {
        return reply.status(401).send({ error: "No refresh token provided" });
      }

      const result = await authService.refreshAccessToken(refreshToken);

      // Set access token baru di cookie
      reply.setCookie(
        tokenHelper.ACCESS_COOKIE_NAME,
        result.accessToken,
        tokenHelper.getCookieOptions()
      );

      return reply.send({
        message: "Token refreshed successfully",
        user: result.user,
      });
    } catch (error) {
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
};
