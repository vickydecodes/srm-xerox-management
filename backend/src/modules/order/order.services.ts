import Order from '@db/models/order.model.ts';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';

import {
  CreateOrderPayload,
  UpdateOrderPayload,
} from '@typings/order.types.ts';


import {
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  toObjectId,
} from './order.constants.ts';

import { enhanceOrder } from './order.util.ts';
import { orderFilterConfig } from './order.filterconfig.ts';


export const createOrder = async (
  data: CreateOrderPayload,
  createdBy: string
) => {
  const order = await new Order({
    ...data,
    createdBy: toObjectId(createdBy),
  }).save();

  return enhanceOrder(order);
};


export const getAllOrders = async (
  queries: Record<string, unknown>,
  options?: { branchId?: string }
) => {
  const rawQuery = options?.branchId
    ? { branch: toObjectId(options.branchId) }
    : undefined;

  return dynamicFilter(
    Order,
    orderFilterConfig,
    queries,
    {
      rawQuery,
    }
  );
};


export const getOrderById = async (
  id: string
) => {
  return Order.findById(id);
};


export const updateOrder = async (
  id: string,
  data: UpdateOrderPayload
) => {
  const order = await Order.findById(id);

  if (!order) return null;

  Object.assign(order, data);

  await order.save();

  return enhanceOrder(order);
};


export const removeOrder = async (
  id: string
) => {
  const removed = await Order.findByIdAndUpdate(
    id,
    SOFT_DELETE,
    UPDATE_OPTIONS
  );

  if (!removed) return null;

  return enhanceOrder(removed);
};


export const retrieveOrder = async (
  id: string
) => {
  const retrieved = await Order.findByIdAndUpdate(
    id,
    RETRIEVE,
    UPDATE_OPTIONS
  );

  if (!retrieved) return null;

  return enhanceOrder(retrieved);
};


export const eraseOrder = async (
  id: string
) => {
  const erased = await Order.findByIdAndDelete(id);

  if (!erased) return null;

  return enhanceOrder(erased);
};

export const submitOrder = async (id: string, userId: string) => {
  const order = await Order.findById(id);
  if (!order) return null;
  if (order.status !== 'draft') {
    throw new Error('Order is not in draft status');
  }
  order.status = 'pending';
  await order.save();
  return enhanceOrder(order);
};

export const branchApproveOrder = async (
  id: string,
  branchAdminId: string,
  approvalData: { status: 'approved' | 'rejected'; remarks?: string }
) => {
  const order = await Order.findById(id);
  if (!order) return null;
  if (order.status !== 'pending') {
    throw new Error('Order is not pending branch admin approval');
  }
  order.branchAdminApproval = {
    status: approvalData.status,
    approver: toObjectId(branchAdminId) as any,
    date: new Date(),
    remarks: approvalData.remarks || '',
  };
  await order.save();
  return enhanceOrder(order);
};

export const vpApproveOrder = async (
  id: string,
  vpId: string,
  approvalData: { status: 'approved' | 'rejected'; remarks?: string }
) => {
  const order = await Order.findById(id);
  if (!order) return null;
  if (order.branchAdminApproval.status !== 'approved') {
    throw new Error('Order must be approved by branch admin first');
  }
  order.vpApproval = {
    status: approvalData.status,
    approver: toObjectId(vpId) as any,
    date: new Date(),
    remarks: approvalData.remarks || '',
  };
  await order.save();
  return enhanceOrder(order);
};