import Order from '@db/models/order.model.ts';
import User from '@db/models/user.model.ts';
import Department from '@db/models/department.model.ts';
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
  const userObj = await User.findById(createdBy);

  if (!userObj) {
    throw new Error('User not found');
  }

  let branch = userObj.branch;
  let department = userObj.department;

  // Fallback for users without explicit branch/dept (like super_admin)
  if (!branch || !department) {
    const firstDept = await Department.findOne({
      active: true,
      deleted: false,
    });

    if (firstDept) {
      if (!branch) branch = firstDept.branch;
      if (!department) department = firstDept._id as any;
    }
  }

  if (!branch || !department) {
    throw new Error(
      'Could not resolve branch or department for the order creator.'
    );
  }

  const order = await new Order({
    ...data,
    branch,
    department,
    createdBy: toObjectId(createdBy),
    approvalHistory: [
      {
        status: 'draft',
        approver: toObjectId(createdBy) as any,
        date: new Date(),
        remarks: 'Order draft created',
      },
    ],
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
  return Order.findById(id).populate(
    'branch department createdBy branchAdminApproval.approver superAdminApproval.approver approvalHistory.approver'
  );
};

export const updateOrder = async (
  id: string,
  data: UpdateOrderPayload
) => {
  const order = await Order.findById(id);

  if (!order) return null;

  // Status transitions must be handled by dedicated service methods.
  const { status: _status, ...updateData } = data;

  Object.assign(order, updateData);

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

export const submitOrder = async (
  id: string,
  userId: string
) => {
  const order = await Order.findById(id);

  if (!order) return null;

  if (order.status !== 'draft') {
    throw new Error('Order is not in draft status');
  }

  order.status = 'pending';

  if (!order.approvalHistory) {
    order.approvalHistory = [];
  }

  order.approvalHistory.push({
    status: 'submitted',
    approver: toObjectId(userId) as any,
    date: new Date(),
    remarks: 'Submitted for approval',
  });

  await order.save();

  return enhanceOrder(order);
};

export const branchApproveOrder = async (
  id: string,
  branchAdminId: string,
  approvalData: {
    status: 'approved' | 'rejected';
    remarks?: string;
  }
) => {
  const order = await Order.findById(id);

  if (!order) return null;

  if (
    order.status === 'draft' ||
    order.status === 'delivered'
  ) {
    throw new Error(
      'Order cannot be approved in its current status'
    );
  }

  order.branchAdminApproval = {
    status: approvalData.status,
    approver: toObjectId(branchAdminId) as any,
    date: new Date(),
    remarks: approvalData.remarks || '',
  };

  if (!order.approvalHistory) {
    order.approvalHistory = [];
  }

  order.approvalHistory.push({
    status: approvalData.status,
    approver: toObjectId(branchAdminId) as any,
    date: new Date(),
    remarks: approvalData.remarks || '',
  });

  await order.save();

  return enhanceOrder(order);
};

export const superAdminApproveOrder = async (
  id: string,
  superAdminId: string,
  approvalData: {
    status: 'approved' | 'rejected';
    remarks?: string;
  }
) => {
  const order = await Order.findById(id);

  if (!order) return null;

  if (order.status === 'delivered') {
    throw new Error('Order is already delivered');
  }

  if (order.branchAdminApproval.status !== 'approved') {
    throw new Error(
      'Order must be approved by branch admin first'
    );
  }

  order.superAdminApproval = {
    status: approvalData.status,
    approver: toObjectId(superAdminId) as any,
    date: new Date(),
    remarks: approvalData.remarks || '',
  };

  if (!order.approvalHistory) {
    order.approvalHistory = [];
  }

  order.approvalHistory.push({
    status: approvalData.status,
    approver: toObjectId(superAdminId) as any,
    date: new Date(),
    remarks: approvalData.remarks || '',
  });

  await order.save();

  return enhanceOrder(order);
};

export const markOrderReadyForPickup = async (
  id: string
) => {
  const order = await Order.findById(id);

  if (!order) return null;

  if (order.status !== 'in_progress') {
    throw new Error(
      'Order must be in progress before it can be marked ready for pickup'
    );
  }

  order.status = 'ready_for_pickup';

  await order.save();

  return enhanceOrder(order);
};

export const markOrderDelivered = async (
  id: string
) => {
  const order = await Order.findById(id);

  if (!order) return null;

  if (order.status !== 'ready_for_pickup') {
    throw new Error(
      'Order must be ready for pickup before it can be delivered'
    );
  }

  order.status = 'delivered';

  await order.save();

  return enhanceOrder(order);
};