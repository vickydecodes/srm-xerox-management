import { productSchema } from '@modules/product/product.validator.ts';
import z from 'zod';

export type CreateProductPayload = z.infer<typeof productSchema>;
export type UpdateProductPayload = Partial<CreateProductPayload>;
