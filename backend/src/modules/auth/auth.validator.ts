import { z } from 'zod';
import { objectId, passwordSchema } from '@core/utils/validator.util.js';

export const loginSchema = z.object({
  login_id: z.string().trim().min(3, 'Login ID is too short').max(100, 'Login ID is too long'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const getCurrentUserSchema = z.object({
  cookies: z.object({
    access_token: z.string().optional(),
  }),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const adminResetPasswordSchema = z.object({
  targetId: objectId,
  newPassword: passwordSchema,
});