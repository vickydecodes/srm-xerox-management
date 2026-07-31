// modules/bill/bill.services.ts
import Bill from '@db/models/bill.model.ts';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';
import { CreateBillPayload, UpdateBillPayload } from '@typings/bill.types.ts';
import { Role } from '@typings/auth.types.js';
import { UPDATE_OPTIONS, SOFT_DELETE, RETRIEVE, getVisibility } from './bill.constants.ts';
import { enhanceBill } from './bill.util.ts';
import { billFilterConfig } from './bill.filterconfig.ts';

export const createBill = async (data: CreateBillPayload, createdBy: string) => {
  const bill = await new Bill({ ...data, createdBy }).save();
  return enhanceBill(bill);
};

export const getAllBills = async (
  queries: Record<string, unknown>,
  role?: Role,
  options?: { createdBy?: string }
) => {
  const rawQuery = options?.createdBy ? { createdBy: options.createdBy } : undefined;

  return dynamicFilter(Bill, billFilterConfig, queries, {
    visibility: getVisibility(role),
    rawQuery,
  });
};

export const getBillById = async (id: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;
  return enhanceBill(bill);
};

export const updateBill = async (id: string, data: UpdateBillPayload) => {
  const updated = await Bill.findByIdAndUpdate(id, data, UPDATE_OPTIONS);
  if (!updated) return null;
  return enhanceBill(updated);
};

export const removeBill = async (id: string) => {
  const removed = await Bill.findByIdAndUpdate(id, SOFT_DELETE, { new: true });
  if (!removed) return null;
  return enhanceBill(removed);
};

export const retrieveBill = async (id: string) => {
  const retrieved = await Bill.findByIdAndUpdate(id, RETRIEVE, { new: true });
  if (!retrieved) return null;
  return enhanceBill(retrieved);
};

export const eraseBill = async (id: string) => {
  const erased = await Bill.findByIdAndDelete(id);
  if (!erased) return null;
  return enhanceBill(erased);
};

export const setBillActiveStatus = async (id: string, active: boolean) => {
  return Bill.findByIdAndUpdate(
    id,
    { active, ...(active ? { deleted: false, deletedAt: null } : {}) },
    { new: true }
  );
};