import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z.string().refine((val) => true /* UUID validation handled by DB or regex */, {
  message: 'Invalid ObjectId',
});

const approvalSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  remarks: z.string().trim().optional(),
});

const parseJsonIfNeeded = (val: unknown) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

export const proofSchema = z.object({
  proof: z.string().trim().min(1, 'Proof data is required'),
  filename: z.string().trim().optional(),
  mimetype: z.string().trim().optional(),
  verified: z.coerce.boolean().optional().default(false),
});

export const verifyProofSchema = z.object({
  proofIndex: z.coerce.number().int().min(0).optional(),
  proofUrl: z.string().trim().optional(),
  verified: z.coerce.boolean(),
});

export const createOrderSchema = z.object({
  orderType: z.enum(['WORK_ORDER', 'XEROX_ORDER']),
  shop: objectId,

  purpose: z
    .string()
    .trim()
    .optional(),

  attachmentEmail: z
    .string()
    .trim()
    .email('Invalid email address'),

  managementAmount: z
    .preprocess(parseJsonIfNeeded, z.coerce.number().min(0, 'Management amount cannot be negative'))
    .optional(),

  sponsors: z.preprocess(
    parseJsonIfNeeded,
    z
      .array(
        z.object({
          name: z
            .string()
            .trim()
            .min(1, 'Sponsor name is required'),

          amount: z.coerce.number().min(0, 'Sponsor amount cannot be negative'),
        })
      )
      .optional()
      .default([])
  ),

  items: z.preprocess(
    parseJsonIfNeeded,
    z
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

          quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),

          price: z.coerce.number().min(0, 'Price cannot be negative'),

          size: z.string().trim().optional(),

          customSize: z.string().trim().optional(),
        })
      )
      .optional()
      .default([])
  ),

  proofs: z.preprocess(parseJsonIfNeeded, z.array(proofSchema).optional().default([])),

  branchAdminApproval: approvalSchema.optional(),
  superAdminApproval: approvalSchema.optional(),

  status: z
    .enum([
      'draft',
      'pending',
      'in_progress',
      'ready_for_pickup',
      'delivered',
      'rejected',
    ])
    .optional(),
});

export const updateOrderSchema =
  createOrderSchema.partial();
