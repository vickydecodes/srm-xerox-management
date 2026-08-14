import Bill, { IBillItem } from '@db/models/bill.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import Service from '@db/models/service.model.ts';
import Department from '@db/models/department.model.ts';
import Order from '@db/models/order.model.ts';
import mongoose from 'mongoose';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';
import { CreateBillPayload, UpdateBillPayload } from '@typings/bill.types.ts';
import { Role } from '@typings/auth.types.js';
import { UPDATE_OPTIONS, SOFT_DELETE, RETRIEVE, getVisibility } from './bill.constants.ts';
import { enhanceBill } from './bill.util.ts';
import { billFilterConfig } from './bill.filterconfig.ts';

export const adjustStockForBill = async (
  oldItems: IBillItem[],
  newItems: IBillItem[]
) => {
  const serviceIds = new Set<string>();
  for (const item of [...oldItems, ...newItems]) {
    if (item.type === 'Service' && item.item) {
      serviceIds.add(item.item.toString());
    }
  }

  const serviceMap = new Map<string, any>();
  if (serviceIds.size > 0) {
    const services = await Service.find({ _id: { $in: Array.from(serviceIds) } });
    for (const s of services) {
      serviceMap.set(s._id.toString(), s);
    }
  }

  const oldMap = new Map<string, number>();
  for (const item of oldItems) {
    if (item.type === 'InventoryProduct') {
      const idStr = item.item.toString();
      oldMap.set(idStr, (oldMap.get(idStr) || 0) + item.quantity);
    } else if (item.type === 'Service') {
      const idStr = item.item.toString();
      const svc = serviceMap.get(idStr);
      if (svc && svc.materials) {
        for (const m of svc.materials) {
          const mIdStr = m.product.toString();
          const totalQty = item.quantity * m.quantity;
          oldMap.set(mIdStr, (oldMap.get(mIdStr) || 0) + totalQty);
        }
      }
    }
  }

  const newMap = new Map<string, number>();
  for (const item of newItems) {
    if (item.type === 'InventoryProduct') {
      const idStr = item.item.toString();
      newMap.set(idStr, (newMap.get(idStr) || 0) + item.quantity);
    } else if (item.type === 'Service') {
      const idStr = item.item.toString();
      const svc = serviceMap.get(idStr);
      if (svc && svc.materials) {
        for (const m of svc.materials) {
          const mIdStr = m.product.toString();
          const totalQty = item.quantity * m.quantity;
          newMap.set(mIdStr, (newMap.get(mIdStr) || 0) + totalQty);
        }
      }
    }
  }

  const allItemIds = new Set([...oldMap.keys(), ...newMap.keys()]);

  for (const itemId of allItemIds) {
    const oldQty = oldMap.get(itemId) || 0;
    const newQty = newMap.get(itemId) || 0;
    const diff = newQty - oldQty;

    if (diff !== 0) {
      await InventoryProduct.findByIdAndUpdate(
        itemId,
        { $inc: { quantity: -diff } }
      );
    }
  }
};

export const createBill = async (data: CreateBillPayload, createdBy: string) => {
  await adjustStockForBill([], data.items as any);

  // Determine initial status and approvalStatus
  let status = 'UNPAID';
  let approvalStatus: 'pending' | 'approved' | 'rejected' = 'approved';

  if (data.paymentMethod === 'CREDIT') {
    status = 'UNPAID';
    if (data.order) {
      // Linked to order
      approvalStatus = 'approved';
    } else {
      // Direct CREDIT bill
      approvalStatus = 'pending';
    }
  } else {
    // CASH or UPI bills are immediately paid and approved
    status = 'PAID';
    approvalStatus = 'approved';
  }

  const bill = new Bill({
    ...data,
    status,
    approvalStatus,
    createdBy,
  });

  // Run totals pre-save trigger beforehand to know the bill total for credit validation
  bill.items = bill.items.map((item) => ({
    ...item,
    total: item.quantity * item.price,
  }));
  bill.subtotal = bill.items.reduce((sum, item) => sum + item.total, 0);
  bill.total = bill.subtotal - (bill.discount || 0) + (bill.tax || 0);

  if (data.paymentMethod === 'CREDIT' && data.department) {
    const dept = await Department.findById(data.department);
    if (!dept) throw new Error('Department not found');

    if (dept.outstandingCredit + bill.total > dept.creditLimit) {
      throw new Error(
        `Credit bill total (${bill.total} INR) exceeds remaining department credit limit (${dept.creditLimit - dept.outstandingCredit} INR)`
      );
    }

    if (approvalStatus === 'approved') {
      dept.outstandingCredit += bill.total;
      await dept.save();
    }
  }

  await bill.save();

  if (data.order) {
    const order = await Order.findById(data.order);
    if (order) {
      order.bill = bill._id as any;
      await order.save();
    }
  }

  return enhanceBill(bill);
};

export const approveCreditBill = async (id: string, userId: string, remarks?: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;
  if (bill.paymentMethod !== 'CREDIT' || bill.approvalStatus !== 'pending') {
    throw new Error('Bill is not a pending CREDIT bill');
  }

  if (bill.department) {
    const dept = await Department.findById(bill.department);
    if (!dept) throw new Error('Department not found');
    if (dept.outstandingCredit + bill.total > dept.creditLimit) {
      throw new Error(
        `Approving this bill exceeds remaining department credit limit (${dept.creditLimit - dept.outstandingCredit} INR)`
      );
    }
    dept.outstandingCredit += bill.total;
    await dept.save();
  }

  bill.approvalStatus = 'approved';
  bill.approvedBy = new mongoose.Types.ObjectId(userId);
  bill.approvedAt = new Date();
  if (remarks) bill.remarks = remarks;

  await bill.save();
  return enhanceBill(bill);
};

export const rejectCreditBill = async (id: string, userId: string, remarks?: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;
  if (bill.paymentMethod !== 'CREDIT' || bill.approvalStatus !== 'pending') {
    throw new Error('Bill is not a pending CREDIT bill');
  }

  bill.approvalStatus = 'rejected';
  bill.approvedBy = new mongoose.Types.ObjectId(userId);
  bill.approvedAt = new Date();
  if (remarks) bill.remarks = remarks;

  await bill.save();
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
  const oldBill = await Bill.findById(id);
  if (!oldBill) return null;

  if (data.items) {
    await adjustStockForBill(oldBill.items, data.items as any);
  }

  const updated = await Bill.findByIdAndUpdate(id, data, UPDATE_OPTIONS);
  if (!updated) return null;
  return enhanceBill(updated);
};

export const removeBill = async (id: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;

  if (!bill.deleted) {
    await adjustStockForBill(bill.items, []);
  }

  const removed = await Bill.findByIdAndUpdate(id, SOFT_DELETE, { new: true });
  if (!removed) return null;
  return enhanceBill(removed);
};

export const retrieveBill = async (id: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;

  if (bill.deleted) {
    await adjustStockForBill([], bill.items);
  }

  const retrieved = await Bill.findByIdAndUpdate(id, RETRIEVE, { new: true });
  if (!retrieved) return null;
  return enhanceBill(retrieved);
};

export const eraseBill = async (id: string) => {
  const bill = await Bill.findById(id);
  if (!bill) return null;

  if (!bill.deleted) {
    await adjustStockForBill(bill.items, []);
  }

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