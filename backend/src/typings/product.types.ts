import { createProductSchema } from '@modules/product/product.validator.ts';
import z from 'zod';

export type CreateProductPayload = z.infer<
  typeof createProductSchema
>;

export type UpdateProductPayload =
  Partial<CreateProductPayload>;