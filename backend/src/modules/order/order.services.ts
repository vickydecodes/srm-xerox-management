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