import { createShopSchema } from '@modules/shop/shop.validator.ts';
import z from 'zod';


export type CreateShopPayload = z.infer<
  typeof createShopSchema
>;


export type UpdateShopPayload =
  Partial<CreateShopPayload>;