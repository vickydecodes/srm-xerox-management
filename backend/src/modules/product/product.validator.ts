import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name is too short'),

  description: z.string().trim().optional(),

  variants: z
    .record(z.string(), z.array(z.string().min(1)))
    .optional()
    .default({}),
});

export const updateProductSchema =
  createProductSchema.partial();

export const setProductActiveStatusSchema = z.object({
  active: z.boolean(),
});