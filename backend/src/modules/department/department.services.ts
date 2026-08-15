import Department from '@db/models/department.model.ts';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';
import { CreateDepartmentPayload, UpdateDepartmentPayload } from '@typings/department.types.ts';
import { Role } from '@typings/auth.types.js';
import {
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  toObjectId,
  getVisibility,
} from './department.constants.ts';
import { enhanceDepartment } from './department.util.ts';
import { departmentFilterConfig } from './department.filterconfig.ts';
import Bill from '@db/models/bill.model.ts';
import CreditPayment from '@db/models/credit.model.ts';

export const createDepartment = async (data: CreateDepartmentPayload) => {
  const department = await new Department(data).save();

  return enhanceDepartment(department);
};

export const getAllDepartments = async (
  queries: Record<string, unknown>,
  role?: Role,
  options?: { branchId?: string }
) => {
  const rawQuery = options?.branchId ? { branch: toObjectId(options.branchId) } : undefined;

  return dynamicFilter(Department, departmentFilterConfig, queries, {
    visibility: getVisibility(role),
    rawQuery,
  });
};

export const getDepartmentById = async (id: string) => {
  return Department.findById(id);
};

export const updateDepartment = async (id: string, data: UpdateDepartmentPayload) => {
  const updated = await Department.findByIdAndUpdate(id, data, UPDATE_OPTIONS);

  if (!updated) return null;

  return enhanceDepartment(updated);
};

export const removeDepartment = async (id: string) => {
  const removed = await Department.findByIdAndUpdate(id, SOFT_DELETE, { new: true });

  if (!removed) return null;

  return enhanceDepartment(removed);
};

export const retrieveDepartment = async (id: string) => {
  const retrieved = await Department.findByIdAndUpdate(id, RETRIEVE, { new: true });

  if (!retrieved) return null;

  return enhanceDepartment(retrieved);
};

export const eraseDepartment = async (id: string) => {
  const erased = await Department.findByIdAndDelete(id);

  if (!erased) return null;

  return enhanceDepartment(erased);
};

export const setDepartmentActiveStatus = async (id: string, active: boolean) => {
  return Department.findByIdAndUpdate(
    id,
    {
      active,
      ...(active
        ? {
            deleted: false,
            deletedAt: null,
          }
        : {}),
    },
    { new: true }
  );
};

export const clearCredit = async (
  id: string,
  userId: string,
  data: { billIds: string[]; amount: number; paymentMethod: 'CASH' | 'UPI'; remarks?: string }
) => {
  const department = await Department.findById(id);
  if (!department) return null;

  if (!data.billIds.length) throw new Error('At least one bill must be selected');

  const bills = await Bill.find({ _id: { $in: data.billIds } });

  if (bills.length !== data.billIds.length) {
    throw new Error('One or more bills not found');
  }

  for (const bill of bills) {
    if (String(bill.department) !== id) {
      throw new Error(`Bill ${bill.code} does not belong to this department`);
    }
    if (bill.paymentMethod !== 'CREDIT') {
      throw new Error(`Bill ${bill.code} is not a credit bill`);
    }
    if (bill.status !== 'UNPAID') {
      throw new Error(`Bill ${bill.code} is already ${bill.status.toLowerCase()}`);
    }
  }

  const expectedTotal = bills.reduce((sum, b) => sum + b.total, 0);
  if (data.amount !== expectedTotal) {
    throw new Error(
      `Payment amount (${data.amount}) must equal the sum of selected bills (${expectedTotal})`
    );
  }

  department.outstandingCredit = Math.max(0, department.outstandingCredit - data.amount);

  const departmentId = toObjectId(id);
  if (!departmentId) throw new Error('Invalid department id');

  const billObjectIds = data.billIds.map((bid) => {
    const oid = toObjectId(bid);
    if (!oid) throw new Error(`Invalid bill id: ${bid}`);
    return oid;
  });

  const paidByObjectId = toObjectId(userId);
  if (!paidByObjectId) throw new Error('Invalid user id');

  await CreditPayment.create({
    department: departmentId,
    bills: billObjectIds,
    amount: data.amount, // required — make sure this is present
    paymentMethod: data.paymentMethod, // required — must be 'CASH' | 'UPI', not a plain string
    paidBy: paidByObjectId,
    date: new Date(), // optional (has default), fine to omit
    remarks: data.remarks, // optional
  });

  await department.save();
  await Bill.updateMany({ _id: { $in: data.billIds } }, { $set: { status: 'PAID' } });

  return enhanceDepartment(department);
};
