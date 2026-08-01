import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short'),

  email: z.string().trim().email('Invalid email address'),

  phone: z.string().trim().min(10, 'Phone number is too short'),

  address: z.string().trim().optional(),

  password: z.string().min(6, 'Password must be at least 6 characters'),

  role: z.enum([
    'super_admin',
    'branch_admin',
    'department_admin',
    'shop_admin',
    'staff',
  ]),

  branch: z.string().trim().optional(),
});