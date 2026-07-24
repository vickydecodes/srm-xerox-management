import { inventoryProductSchema } from '@modules/product/product.validator.ts';
import z from 'zod';

export type CreateInventoryProductPayload = z.infer<typeof inventoryProductSchema>;
export type UpdateInventoryProductPayload = Partial<CreateInventoryProductPayload>;
