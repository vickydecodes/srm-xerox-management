import { createOrderSchema } from '@modules/order/order.validator.ts';
import z from 'zod';

export type CreateOrderPayload = z.infer<
  typeof createOrderSchema
>;

export type UpdateOrderPayload =
  Partial<CreateOrderPayload>;