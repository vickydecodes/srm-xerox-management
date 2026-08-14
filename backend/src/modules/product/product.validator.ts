import { z } from 'zod';

const variantSubdocumentSchema = z.object({
  attributes: z.record(z.string(), z.string()),
  sku: z.string().trim().optional(),
  active: z.boolean().optional().default(true),
});

const productObjectSchema = z.object({
  name: z.string().trim().min(2, 'Product name is too short'),

  description: z.string().trim().optional(),

  attributes: z
    .record(z.string(), z.array(z.string().min(1)))
    .optional()
    .default({}),

  variants: z.array(variantSubdocumentSchema).optional().default([]),
});

export const createProductSchema = z.preprocess((val: any) => {
  if (val && val.variants && !Array.isArray(val.variants)) {
    return {
      ...val,
      attributes: val.variants,
      variants: [],
    };
  }
  return val;
}, productObjectSchema);

export const updateProductSchema = z.preprocess((val: any) => {
  if (val && val.variants && !Array.isArray(val.variants)) {
    return {
      ...val,
      attributes: val.variants,
      variants: [],
    };
  }
  return val;
}, productObjectSchema.partial());

export const setProductActiveStatusSchema = z.object({
  active: z.boolean(),
});