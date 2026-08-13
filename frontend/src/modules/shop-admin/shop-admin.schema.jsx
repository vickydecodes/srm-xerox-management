import { z } from "zod";

export const shopAdminCreateSchema = z.object({
  name: z.string().min(2, { error: 'Please enter the name' }),
  email: z.string().email({ error: 'Please enter a valid email' }),
  phone: z.string().min(10, { error: 'Please enter a valid phone number' }),
  address: z.string().optional(),
  password: z.string().min(6, { error: 'Password must be at least 6 characters' }),
  active: z.boolean().default(true),
});

export const shopAdminEditSchema = z.object({
  name: z.string().min(2, { error: 'Please enter the name' }),
  email: z.string().email({ error: 'Please enter a valid email' }),
  phone: z.string().min(10, { error: 'Please enter a valid phone number' }),
  address: z.string().optional(),
  active: z.boolean().default(true),
});