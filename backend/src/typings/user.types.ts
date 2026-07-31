import { userSchema } from '@modules/user/user.validator.ts';
import z from 'zod';

export type CreateUserPayload = z.infer<typeof userSchema>;
export type UpdateUserPayload = Partial<CreateUserPayload>;