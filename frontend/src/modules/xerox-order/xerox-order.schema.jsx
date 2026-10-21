import { z } from "zod";

export const xeroxOrderItemSchema = z.object({
  type: z.enum(['InventoryProduct', 'Service']).default('Service'),
  item: z.string().min(1, { message: 'Please select a product or service' }),
  name: z.string().min(1, { message: 'Item name is required' }),
  price: z.coerce.number().min(0, { message: 'Price cannot be negative' }),
  quantity: z.coerce.number().min(1, { message: 'Quantity must be at least 1' }),
  variant: z.any().optional(),
  code: z.string().optional(),
});

export const selfSupportSchema = z.object({
  name: z.string().min(1, { message: 'Self support sponsor name is required' }),
  amount: z.coerce.number().min(0, { message: 'Amount cannot be negative' }),
});

export const baseXeroxOrderSchema = z.object({
  branch: z.string().optional(),
  department: z.string().optional(),
  shop: z.string().optional(),
  purpose: z.string().min(1, { message: 'Work Title / Purpose is required' }),
  attachmentEmail: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .optional()
    .or(z.literal('')),
  fundingMethod: z.enum(['management', 'self_support'], {
    errorMap: () => ({ message: 'Please choose either Management or Self Support' }),
  }).default('management'),
  managementAmount: z.coerce.number().min(0).optional().default(0),
  self_supports: z.array(selfSupportSchema).default([]),
  items: z.array(xeroxOrderItemSchema).min(1, { message: 'Please add at least one item' }),
});

const validateXeroxOrder = (data, ctx) => {
  if (data.fundingMethod === 'self_support') {
    if (!data.self_supports || data.self_supports.length === 0 || Number(data.self_supports[0]?.amount) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Self support sponsor amount must be greater than 0',
        path: ['self_supports'],
      });
    }
  }
};

export const xeroxOrderCreateSchema = baseXeroxOrderSchema.superRefine(validateXeroxOrder);

export const xeroxOrderEditSchema = baseXeroxOrderSchema.partial().superRefine((data, ctx) => {
  if (data.items) {
    validateXeroxOrder(data, ctx);
  }
});

export const approvalSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    required_error: 'Please select an approval status',
  }),
  remarks: z.string().optional(),
  verifyProofs: z.boolean().optional(),
});
