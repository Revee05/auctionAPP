/**
 * Auth Validation Schemas
 * Centralized validation using Zod for all authentication-related inputs
 */

import { z } from 'zod';

/* ============================================
 * Password validation with strong requirements
 * ============================================ */
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/* ============================================
 * Email validation (lowercase normalized)
 * ============================================ */
export const emailSchema = z.string()
  .email('Invalid email format')
  .toLowerCase()
  .max(255, 'Email must not exceed 255 characters');

/* ============================================
 * Name validation (sanitized)
 * ============================================ */
export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .trim()
  .regex(/^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

/* ============================================
 * Role validation (enum)
 * ============================================ */
export const roleSchema = z.enum(['ARTIST', 'COLLECTOR', 'ADMIN', 'SUPER_ADMIN'], {
  errorMap: () => ({ message: 'Invalid role. Must be ARTIST, COLLECTOR, ADMIN, or SUPER_ADMIN' })
});

/* ============================================
 * User ID validation (positive integer)
 * ============================================ */
export const userIdSchema = z.coerce.number()
  .int('User ID must be an integer')
  .positive('User ID must be positive');

/* ============================================
 * REGISTER Schema
 * ============================================ */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  roleName: roleSchema.optional()
});

/* ============================================
 * LOGIN Schema
 * ============================================ */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

/* ============================================
 * RESEND VERIFICATION Schema
 * ============================================ */
export const resendVerificationSchema = z.object({
  email: emailSchema
});

/* ============================================
 * VERIFY EMAIL Schema (query params)
 * ============================================ */
export const verifyEmailSchema = z.object({
  token: z.string()
    .min(1, 'Verification token is required')
    .max(256, 'Invalid token format')
});

/* ============================================
 * UPDATE PROFILE Schema
 * ============================================ */
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  avatarUrl: z.string()
    .url('Avatar URL must be a valid URL')
    .max(500, 'Avatar URL too long')
    .optional()
    .or(z.literal('')), // Allow empty string to remove avatar
  language: z.enum(['en', 'id']).optional()
});

/* ============================================
 * CHANGE EMAIL Schema (requires verification)
 * ============================================ */
export const changeEmailSchema = z.object({
  newEmail: emailSchema,
  password: z.string().min(1, 'Password is required for email change')
});

/* ============================================
 * CHANGE PASSWORD Schema
 * ============================================ */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

/* ============================================
 * ASSIGN ROLE Schema (Super Admin)
 * ============================================ */
export const assignRoleSchema = z.object({
  roleName: roleSchema
});

/* ============================================
 * UPDATE USER Schema (Admin)
 * ============================================ */
export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional()
}).refine(data => data.name || data.email || data.password, {
  message: 'At least one field (name, email, or password) must be provided'
});

/* ============================================
 * PAGINATION & SORTING Schema
 * ============================================ */
export const paginationSchema = z.object({
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20),
  cursor: z.string().optional(),
  sortBy: z.enum(['id', 'name'], {
    errorMap: () => ({ message: 'Sort by must be either "id" or "name"' })
  }).optional().default('id'),
  sortOrder: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort order must be either "asc" or "desc"' })
  }).optional().default('asc'),
  q: z.string().max(255, 'Search query too long').optional()
});

/* ============================================
 * Validation Helper Function
 * Parses and validates data, returns formatted errors
 * ============================================ */
export function validateData(schema, data) {
  try {
    return {
      success: true,
      data: schema.parse(data)
    };
  } catch (error) {
    return {
      success: false,
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    };
  }
}

export default {
  passwordSchema,
  emailSchema,
  nameSchema,
  roleSchema,
  userIdSchema,
  registerSchema,
  loginSchema,
  resendVerificationSchema,
  verifyEmailSchema,
  updateProfileSchema,
  changeEmailSchema,
  changePasswordSchema,
  assignRoleSchema,
  updateUserSchema,
  paginationSchema,
  validateData
};
