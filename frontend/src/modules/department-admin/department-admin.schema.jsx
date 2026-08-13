import { z } from "zod";

export const departmentAdminCreateSchema = z.object({
  name: z.string().min(2, { error: 'Please enter the name' }),
  email: z.string().email({ error: 'Please enter a valid email' }),
  phone: z.string().min(10, { error: 'Please enter a valid phone number' }),
  address: z.string().optional(),
  password: z.string().min(6, { error: 'Password must be at least 6 characters' }),
  branch: z.string().min(1, { error: 'Please select a branch' }),
  department: z.string().min(1, { error: 'Please select a department' }),
  active: z.boolean().default(true),
});

export const departmentAdminEditSchema = z.object({
  name: z.string().min(2, { error: 'Please enter the name' }),
  email: z.string().email({ error: 'Please enter a valid email' }),
  phone: z.string().min(10, { error: 'Please enter a valid phone number' }),
  address: z.string().optional(),
  branch: z.string().min(1, { error: 'Please select a branch' }),
  department: z.string().min(1, { error: 'Please select a department' }),
  active: z.boolean().default(true),
});