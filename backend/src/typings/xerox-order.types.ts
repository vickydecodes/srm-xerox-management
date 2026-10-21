import { createXeroxOrderSchema } from '@modules/xerox-order/xerox-order.validator.ts';
import z from 'zod';

export type CreateXeroxOrderPayload = z.infer<
  typeof createXeroxOrderSchema
>;

export type UpdateXeroxOrderPayload =
  Partial<CreateXeroxOrderPayload>;
