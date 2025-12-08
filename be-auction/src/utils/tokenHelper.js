import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

const ACCESS_COOKIE_NAME = process.env.ACCESS_COOKIE_NAME || 'access_token'
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refresh_token'
const COOKIE_SECURE = process.env.NODE_ENV === 'production'
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || 'strict'
const COOKIE_PATH = process.env.COOKIE_PATH || '/'

export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex')
}

export function getRefreshTokenExpiryDate() {
  const expiry = new Date()
  const v = JWT_REFRESH_EXPIRES_IN || '7d'
  const match = String(v).match(/^(\d+)([dhm])$/)
  if (match) {
    const num = parseInt(match[1], 10)
    const unit = match[2]
    if (unit === 'd') expiry.setDate(expiry.getDate() + num)
    else if (unit === 'h') expiry.setHours(expiry.getHours() + num)
    else if (unit === 'm') expiry.setMinutes(expiry.getMinutes() + num)
    return expiry
  }
  expiry.setDate(expiry.getDate() + 7)
  return expiry
}

function parseExpiryToMs(exp) {
  const v = String(exp || JWT_ACCESS_EXPIRES_IN)
  const match = v.match(/^(\d+)([dhm])$/)
  if (match) {
    const num = parseInt(match[1], 10)
    const unit = match[2]
    if (unit === 'd') return num * 24 * 60 * 60 * 1000
    if (unit === 'h') return num * 60 * 60 * 1000
    return num * 60 * 1000
  }
  return 15 * 60 * 1000
}

export function getCookieOptions({ httpOnly = true, maxAge } = {}) {
  const defaultMaxAge = parseExpiryToMs(JWT_ACCESS_EXPIRES_IN)
  return {
    httpOnly,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: COOKIE_PATH,
    maxAge: typeof maxAge === 'number' ? maxAge : defaultMaxAge
  }
}

export default {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiryDate,
  getCookieOptions,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME
}
