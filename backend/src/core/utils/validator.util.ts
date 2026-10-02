import { z } from 'zod';
import { Types } from 'mongoose';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const objectId = z.string().trim().refine((val) => Types.ObjectId.isValid(val) || UUID_REGEX.test(val) || val.length >= 10, {
  message: 'Invalid ID format',
});

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(64, 'Password is too long');
