/**
 * tokenHelper.js
 *
 * Ringkasan:
 * - Menyediakan utilitas JWT (access token), refresh token acak, perhitungan expiry, dan opsi cookie.
 * - Membaca konfigurasi dari environment variables (lihat .env).
 *
 * Environment variables yang dipakai:
 * - JWT_SECRET                 : Secret untuk sign/verify JWT
 * - JWT_ACCESS_EXPIRES_IN      : Expiry access token, contoh "15m", "24h", "7d"
 * - JWT_REFRESH_EXPIRES_IN     : Expiry refresh token, contoh "7d"
 * - ACCESS_COOKIE_NAME         : Nama cookie untuk access token
 * - REFRESH_COOKIE_NAME        : Nama cookie untuk refresh token
 * - COOKIE_SAME_SITE           : sameSite value untuk cookie ('strict'|'lax'|'none')
 * - COOKIE_PATH                : path cookie (default '/')
 * - NODE_ENV                   : production -> secure cookies aktif
 *
 * Mekanisme singkat:
 * - generateAccessToken(payload) -> JWT signed (short lived)
 * - verifyAccessToken(token) -> verifikasi JWT dan kembalikan payload
 * - generateRefreshToken() -> string acak, disimpan di DB + expiry dari getRefreshTokenExpiryDate()
 * - getCookieOptions(...) -> opsi cookie konsisten untuk setCookie/clearCookie
 */

/* Config / constants */
import jwt from "jsonwebtoken";
import crypto from "crypto";

/* ============================================
 * SECURITY: Validate critical environment variables
 * Fail fast if secrets are not properly configured
 * ============================================ */
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'FATAL SECURITY ERROR: JWT_SECRET must be set in environment variables.\n' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}
if (JWT_SECRET.length < 32) {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long');
}

const REFRESH_TOKEN_HASH_SECRET = process.env.REFRESH_TOKEN_HASH_SECRET;
if (!REFRESH_TOKEN_HASH_SECRET) {
  throw new Error(
    'FATAL SECURITY ERROR: REFRESH_TOKEN_HASH_SECRET must be set in environment variables.\n' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}
if (REFRESH_TOKEN_HASH_SECRET.length < 32) {
  throw new Error('FATAL SECURITY ERROR: REFRESH_TOKEN_HASH_SECRET must be at least 32 characters long');
}

const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const ACCESS_COOKIE_NAME = process.env.ACCESS_COOKIE_NAME || "access_token";
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || "refresh_token";
const COOKIE_SECURE = process.env.NODE_ENV === "production";
// Use 'lax' by default for development to allow cross-site XHR from localhost dev frontend
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || "lax";
const COOKIE_PATH = process.env.COOKIE_PATH || "/";

const REFRESH_TOKEN_BYTES = parseInt(process.env.REFRESH_TOKEN_BYTES || "64", 10);

/**
 * generateAccessToken
 * - Membuat JWT signed berisi payload yang diberikan.
 * - Gunakan untuk access token (pendek umur).
 *
 * @param {Object} payload - data yang ingin disimpan di token (mis. { userId, email, roles })
 * @returns {String} signed JWT
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
}

/**
 * verifyAccessToken
 * - Verifikasi JWT, melempar error jika token tidak valid / expired.
 *
 * @param {String} token - JWT string
 * @returns {Object} decoded payload
 * @throws {Error} jwt.Verify error bila tidak valid
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * generateRefreshToken
 * - Membuat refresh token acak berbentuk hex string.
 * - Tidak menggunakan JWT untuk refresh token (lebih sederhana, aman bila disimpan di DB).
 *
 * @returns {String} refresh token random
 */
export function generateRefreshToken() {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
}

/**
 * hashRefreshToken
 * - Membuat HMAC-SHA256 hash dari refresh token dengan secret key.
 * - Hash ini yang disimpan di database, bukan plain token.
 * - Menggunakan HMAC untuk menambah secret sehingga lebih aman dari preimage attacks.
 *
 * @param {String} token - Plain refresh token
 * @returns {String} hex hash dari token
 */
export function hashRefreshToken(token) {
  return crypto
    .createHmac("sha256", REFRESH_TOKEN_HASH_SECRET)
    .update(token)
    .digest("hex");
}

/**
 * getRefreshTokenExpiryDate
 * - Menghitung tanggal kadaluarsa untuk refresh token berdasarkan JWT_REFRESH_EXPIRES_IN.
 * - Mendukung format singkat: Nd (hari), Nh (jam), Nm (menit). Default 7 hari.
 *
 * @returns {Date} expiry Date object
 */
export function getRefreshTokenExpiryDate() {
  const expiry = new Date();
  const v = JWT_REFRESH_EXPIRES_IN || "7d";
  const match = String(v).match(/^(\d+)([dhm])$/);
  if (match) {
    const num = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === "d") expiry.setDate(expiry.getDate() + num);
    else if (unit === "h") expiry.setHours(expiry.getHours() + num);
    else if (unit === "m") expiry.setMinutes(expiry.getMinutes() + num);
    return expiry;
  }
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
}

/* Internal util: konversi expiry string -> seconds */
function parseExpiryToSeconds(exp) {
  const v = String(exp || JWT_ACCESS_EXPIRES_IN);
  const match = v.match(/^(\d+)([dhm])$/);
  if (match) {
    const num = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === "d") return num * 24 * 60 * 60;
    if (unit === "h") return num * 60 * 60;
    return num * 60;
  }
  // default 15 minutes
  return 15 * 60;
}

/* NOTE: We use seconds everywhere for cookie maxAge (no milliseconds) */

/**
 * getCookieOptions
 * - Menghasilkan opsi cookie konsisten yang dipakai saat setCookie.
 * - Mengembalikan maxAge dalam detik (sesuai ekspektasi header Set-Cookie / banyak library).
 *
 * @param {Object} [opts]
 * @param {boolean} [opts.httpOnly=true]
 * @param {number} [opts.maxAge] - maxAge dalam detik
 * @returns {Object} cookie options
 */
export function getCookieOptions({ httpOnly = true, maxAge } = {}) {
  const defaultMaxAgeSeconds = parseExpiryToSeconds(JWT_ACCESS_EXPIRES_IN);
  return {
    httpOnly,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: COOKIE_PATH,
    // maxAge expected in seconds
    maxAge: typeof maxAge === "number" ? Math.floor(maxAge) : defaultMaxAgeSeconds,
  };
}

/**
 * getRefreshCookieOptions
 * - Menghasilkan opsi cookie khusus untuk refresh token berdasarkan
 *   `JWT_REFRESH_EXPIRES_IN`. Mengembalikan maxAge (detik) agar header
 *   `Set-Cookie` menghasilkan nilai yang benar.
 *
 * @returns {Object} cookie options ready-to-use untuk refresh cookie
 */
export function getRefreshCookieOptions() {
  const seconds = parseExpiryToSeconds(JWT_REFRESH_EXPIRES_IN);
  return getCookieOptions({ maxAge: seconds });
}

/* Default export object untuk kemudahan import */
export default {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiryDate,
  getCookieOptions,
  getRefreshCookieOptions,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
};
