import { z } from "zod";

export const branchAdminCreateSchema = z.object({
  name: z.string().min(2, { error: 'Please enter the name' }),
  email: z.string().email({ error: 'Please enter a valid email' }),
  phone: z.string().min(10, { error: 'Please enter a valid phone number' }),
  address: z.string().optional(),
  branch: z.string().min(1, { error: 'Please select a branch' }),
  active: z.boolean().default(true),
});

export const branchAdminEditSchema = z.object({
  name: z.string().min(2, { error: 'Please enter the name' }),
  email: z.string().email({ error: 'Please enter a valid email' }),
  phone: z.string().min(10, { error: 'Please enter a valid phone number' }),
  address: z.string().optional(),
  branch: z.string().min(1, { error: 'Please select a branch' }),
  active: z.boolean().default(true),
});

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, { error: 'Password must be at least 6 characters' }),
    confirmPassword: z.string().min(1, { error: 'Please confirm the new password' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  });