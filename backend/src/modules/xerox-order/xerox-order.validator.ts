import { z } from 'zod';

const objectId = z.string().refine((val) => true, {
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

export const createXeroxOrderSchema = z.object({
  shop: objectId.optional(),

  purpose: z.string().trim().min(1, 'Purpose is required'),

  attachmentEmail: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),

  managementAmount: z
    .preprocess(parseJsonIfNeeded, z.coerce.number().min(0, 'Management amount cannot be negative'))
    .optional(),

  self_supports: z.preprocess(
    parseJsonIfNeeded,
    z
      .array(
        z.object({
          name: z
            .string()
            .trim()
            .min(1, 'Self support name is required'),
          amount: z.coerce.number().min(0, 'Self support amount cannot be negative'),
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
          item: z.string().trim().min(1, 'Item is required'),
          name: z.string().trim().min(1, 'Item name is required'),
          quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
          price: z.coerce.number().min(0, 'Price cannot be negative'),
          pages: z.coerce.number().min(1).optional(),
          copies: z.coerce.number().min(1).optional(),
          paperSize: z.string().trim().optional(),
          colorMode: z.string().trim().optional(),
          printSide: z.string().trim().optional(),
          binding: z.string().trim().optional(),
          attachment: z.any().optional(),
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

export const updateXeroxOrderSchema = createXeroxOrderSchema.partial();
