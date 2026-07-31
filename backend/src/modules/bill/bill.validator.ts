// modules/bill/bill.validator.ts
import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});

const billItemSchema = z.object({
  item: objectId,
  name: z.string().trim().min(1, 'name is required'),
  quantity: z.number().min(0, 'quantity cannot be negative'),
  price: z.number().min(0, 'price cannot be negative'),
});

export const createBillSchema = z.object({
  items: z.array(billItemSchema).min(1, 'at least one item is required'),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
});

export const updateBillSchema = z
  .object({
    items: z.array(billItemSchema).min(1).optional(),
    discount: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    status: z.enum(['UNPAID', 'PAID', 'CANCELLED']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  });

export const setBillActiveStatusSchema = z.object({
  active: z.boolean({ error: 'active is required' }),
});

export const billIdParamSchema = z.object({
  id: objectId,
});