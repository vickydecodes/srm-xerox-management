import CreditPayment from '@db/models/credit.model.ts';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';

import {
  CreateCreditPaymentPayload,
  UpdateCreditPaymentPayload,
} from '@typings/credit.types.ts';

import {
  UPDATE_OPTIONS,
  toObjectId,
} from './credit.constants.ts';

import { enhanceCreditPayment } from './credit.util.ts';
import { creditPaymentFilterConfig } from './credit.filterconfig.ts';


export const createCreditPayment = async (
  data: CreateCreditPaymentPayload,
  paidBy: string
) => {
  const creditPayment = await new CreditPayment({
    ...data,
    department: toObjectId(data.department),
    bills: data.bills.map(toObjectId),
    paidBy: toObjectId(paidBy),
  }).save();

  return enhanceCreditPayment(creditPayment);
};


export const getAllCreditPayments = async (
  queries: Record<string, unknown>
) => {
  return dynamicFilter(
    CreditPayment,
    creditPaymentFilterConfig,
    queries
  );
};


export const getCreditPaymentById = async (
  id: string
) => {
  return CreditPayment.findById(id);
};


export const updateCreditPayment = async (
  id: string,
  data: UpdateCreditPaymentPayload
) => {
  const updated = await CreditPayment.findByIdAndUpdate(
    id,
    data,
    UPDATE_OPTIONS
  );

  if (!updated) return null;

  return enhanceCreditPayment(updated);
};