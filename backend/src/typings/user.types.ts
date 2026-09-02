import { createUserSchema } from '@modules/user/user.validator.ts';
import z from 'zod';

export type CreateUserPayload = z.infer<
  typeof createUserSchema
>;

export type UpdateUserPayload =
  Partial<CreateUserPayload>;