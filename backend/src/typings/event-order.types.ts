import { createEventOrderSchema } from '@modules/event-order/event-order.validator.ts';
import z from 'zod';

export type CreateEventOrderPayload = z.infer<
  typeof createEventOrderSchema
>;

export type UpdateEventOrderPayload =
  Partial<CreateEventOrderPayload>;
