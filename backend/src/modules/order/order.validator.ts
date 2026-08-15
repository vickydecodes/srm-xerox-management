import { z } from 'zod';

const approvalSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  remarks: z.string().trim().optional(),
});

export const createOrderSchema = z.object({

  purpose: z
    .string()
    .trim()
    .optional(),

  managementAmount: z
    .number()
    .min(0, 'Management amount cannot be negative')
    .optional(),

  sponsors: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, 'Sponsor name is required'),

        amount: z
          .number()
          .min(0, 'Sponsor amount cannot be negative'),
      })
    )
    .optional()
    .default([]),

  items: z
    .array(
      z.object({
        type: z.enum(['InventoryProduct', 'Service']),

        item: z
          .string()
          .trim()
          .min(1, 'Item is required'),

        name: z
          .string()
          .trim()
          .min(1, 'Item name is required'),

        quantity: z
          .number()
          .min(0, 'Quantity cannot be negative'),

        price: z
          .number()
          .min(0, 'Price cannot be negative'),
      })
    )
    .optional()
    .default([]),

  branchAdminApproval: approvalSchema.optional(),
  superAdminApproval: approvalSchema.optional(),

  status: z
    .enum([
      'draft',
      'pending',
      'in_progress',
      'completed',
      'rejected',
    ])
    .optional(),
});

export const updateOrderSchema =
  createOrderSchema.partial();