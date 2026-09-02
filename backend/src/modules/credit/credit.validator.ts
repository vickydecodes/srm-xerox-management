import { z } from 'zod';
import { Types } from 'mongoose';


const objectId = z.string().refine(
  (val) => Types.ObjectId.isValid(val),
  {
    message: 'Invalid ObjectId',
  }
);


export const createCreditPaymentSchema = z.object({
  department: objectId,

  bills: z
    .array(objectId)
    .min(1, 'At least one bill is required'),

  amount: z
    .number()
    .min(0, 'Amount cannot be negative'),

  paymentMethod: z.enum(['CASH', 'UPI']),


  remarks: z
    .string()
    .trim()
    .optional(),
});


export const updateCreditPaymentSchema = z
  .object({
    department: objectId.optional(),

    bills: z
      .array(objectId)
      .min(1, 'At least one bill is required')
      .optional(),

    amount: z
      .number()
      .min(0, 'Amount cannot be negative')
      .optional(),

    paymentMethod: z
      .enum(['CASH', 'UPI'])
      .optional(),

    date: z.date().optional(),

    remarks: z
      .string()
      .trim()
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one field must be provided to update',
    }
  );


export const creditPaymentIdParamSchema = z.object({
  id: objectId,
});