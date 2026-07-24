import { z } from 'zod';

export const inventoryProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name is too short'),
  type: z.enum(['external', 'internal']),
  description: z.string().trim().optional(),
  variants: z
    .record(z.string(), z.array(z.string().min(1)))
    .optional()
    .default({}),
});
