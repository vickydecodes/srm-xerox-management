import {
  createCreditPaymentSchema,
} from '@modules/credit/credit.validator.ts';

import z from 'zod';


export type CreateCreditPaymentPayload = z.infer<
  typeof createCreditPaymentSchema
>;


export type UpdateCreditPaymentPayload =
  Partial<CreateCreditPaymentPayload>;