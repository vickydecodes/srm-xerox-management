import z from 'zod';

import {
  loginSchema,
  changePasswordSchema,
  adminResetPasswordSchema,
} from '@modules/auth/auth.validator.ts';

export type Role = 'super_admin' | 'branch_admin' | 'department_admin' | 'shop_admin' | 'staff';
export interface AuthUser {
  id: string;
  loginId?: string;
  branch?: string;
  department?: string;
  shop?: string;
  role: Role;
  active?: boolean;
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
