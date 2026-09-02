import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: 'Please enter your current password' }),
    newPassword: z.string().min(6, { error: 'New password must be at least 6 characters' }),
    confirmPassword: z.string().min(1, { error: 'Please confirm your new password' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    error: 'New password must be different from current password',
    path: ['newPassword'],
  });