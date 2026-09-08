import { z } from 'zod';


export const baseUserSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short'),

  email: z.string().trim().email('Invalid email address'),

  phone: z.string().trim().min(10, 'Phone number is too short'),

  address: z.string().trim().optional(),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),

  role: z.enum([
    'super_admin',
    'branch_admin',
    'department_admin',
    'shop_admin',
    'staff',
  ]),

  branch: z.string().trim().optional(),

  department: z.string().trim().optional(),

  shop: z.string().trim().optional(),
});

export const createUserSchema = baseUserSchema.refine((data) => {
  if (data.role === 'shop_admin') {
    return !!data.shop;
  }
  if (data.role === 'department_admin') {
    return !!data.department && !!data.branch;
  }
  if (data.role === 'branch_admin') {
    return !!data.branch;
  }
  return true;
}, {
  message: 'Required fields are missing for the selected role',
  path: ['role'],
});

export const updateUserSchema =
  baseUserSchema.partial();


export const setUserActiveStatusSchema = z.object({
  active: z.boolean(),
});