import z from 'zod';

import {
  loginSchema,
  changePasswordSchema,
  adminResetPasswordSchema,
} from '@modules/auth/auth.validator.ts';

export type Role = 'student' | 'teacher' | 'junior_admin' | 'super_admin';

export interface AuthUser {
  id: string;
  branch: string;
  permissions: string[];
  role: Role;
  batches?: string[] | { _id: string }[];
  standard?: string | { _id: string }; // add this
}

// export interface LoginPayload {
//   loginId: string;
//   password: string;
// }

export type LoginPayload = z.infer<typeof loginSchema>;

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface AdminResetPasswordPayload {
  targetId: string;

  targetRole: 'junior_admin' | 'student';

  newPassword: string;
}

export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
