import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Department name is too short'),

  code: z.string().trim().min(1, 'Department code is required'),

  branch: z.string().trim(),
});

export const updateDepartmentSchema =
  createDepartmentSchema.partial();

export const setDepartmentActiveStatusSchema = z.object({
  active: z.boolean(),
});

export const clearCreditSchema = z.object({
  billIds: z
    .array(z.string().trim().min(1))
    .optional(),

  amount: z.number().positive('Amount must be greater than 0'),

  paymentMethod: z.enum(['CASH', 'UPI']),

  remarks: z.string().trim().optional(),
});