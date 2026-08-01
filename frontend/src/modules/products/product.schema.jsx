import { z } from "zod";

const variantSchema = z.object({
  key: z.string().min(1, { error: 'Variant name is required' }),
  values: z.string().min(1, { error: 'Enter at least one value, comma separated' }),
});

export const productCreateSchema = z.object({
  name: z.string().min(2, { error: 'Please enter the product name' }),
  description: z.string().optional(),
  variants: z.array(variantSchema).optional(),
});

export const productEditSchema = productCreateSchema.extend({
  active: z.boolean(),
});