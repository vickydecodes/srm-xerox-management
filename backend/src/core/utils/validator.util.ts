import { z } from 'zod';
import { Types } from 'mongoose';

export const objectId = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ID format',
});

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(64, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');
