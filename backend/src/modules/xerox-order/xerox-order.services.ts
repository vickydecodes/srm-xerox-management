import XeroxOrder from '@db/models/xerox-order.model.ts';
import User from '@db/models/user.model.ts';
import Department from '@db/models/department.model.ts';
import Bill from '@db/models/bill.model.ts';
import { applyCreditBalance } from '@modules/department/department.services.ts';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';

import {
  CreateXeroxOrderPayload,
  UpdateXeroxOrderPayload,
} from '@typings/xerox-order.types.ts';

import {
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  toObjectId,
} from './xerox-order.constants.ts';

import { enhanceXeroxOrder } from './xerox-order.util.ts';
import { xeroxOrderFilterConfig } from './xerox-order.filterconfig.ts';

export const createXeroxOrder = async (
  data: CreateXeroxOrderPayload,
  createdBy: string
) => {
  const userObj = await User.findById(createdBy);

  if (!userObj) {
    throw new Error('User not found');
  }

  let branch = typeof userObj.branch === 'object' && userObj.branch !== null ? ((userObj.branch as any).id || (userObj.branch as any)._id) : userObj.branch;
  let department = typeof userObj.department === 'object' && userObj.department !== null ? ((userObj.department as any).id || (userObj.department as any)._id) : userObj.department;

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
      'Could not resolve branch or department for the xerox order creator.'
    );
  }

  const order = await new XeroxOrder({
    ...data,
    branch: toObjectId(branch),
    department: toObjectId(department),
    createdBy: toObjectId(createdBy),
    approvalHistory: [
      {
        status: 'draft',
        approver: toObjectId(createdBy) as any,
        date: new Date(),
        remarks: 'Xerox order draft created',
      },
    ],
  }).save();

  return enhanceXeroxOrder(order);
};

export const getAllXeroxOrders = async (
  queries: Record<string, unknown>,
  options?: { branchId?: string }
) => {
  const rawQuery = options?.branchId
    ? { branch: toObjectId(options.branchId) }
    : undefined;

  return dynamicFilter(
    XeroxOrder,
    xeroxOrderFilterConfig,
    queries,
    {
      rawQuery,
    }
  );
};

export const getXeroxOrderById = async (id: string) => {
  return XeroxOrder.findById(id);
};

export const updateXeroxOrder = async (
  id: string,
  data: UpdateXeroxOrderPayload
) => {
  const order = await XeroxOrder.findById(id);

  if (!order) return null;

  const { status: _status, ...updateData } = data;

  Object.assign(order, updateData);

  await order.save();

  return enhanceXeroxOrder(order);
};

export const removeXeroxOrder = async (id: string) => {
  const removed = await XeroxOrder.findByIdAndUpdate(
    id,
    SOFT_DELETE,
    UPDATE_OPTIONS
  );

  if (!removed) return null;

  return enhanceXeroxOrder(removed);
};

export const retrieveXeroxOrder = async (id: string) => {
  const retrieved = await XeroxOrder.findByIdAndUpdate(
    id,
    RETRIEVE,
    UPDATE_OPTIONS
  );

  if (!retrieved) return null;

  return enhanceXeroxOrder(retrieved);
};

export const eraseXeroxOrder = async (id: string) => {
  const erased = await XeroxOrder.findByIdAndDelete(id);

  if (!erased) return null;

  return enhanceXeroxOrder(erased);
};

export const submitXeroxOrder = async (id: string, userId: string) => {
  const order = await XeroxOrder.findById(id);

  if (!order) return null;

  if (order.status !== 'draft') {
    throw new Error('Xerox order is not in draft status');
  }

  // Populate proofs from item attachments if order.proofs is empty
  const itemAttachments = (order.items || [])
    .filter((item: any) => item.attachment)
    .map((item: any) => ({
      proof: item.attachment.fileData || item.attachment.proof,
      filename: item.attachment.filename,
      mimetype: item.attachment.mimetype,
      verified: false,
    }));

  if ((!order.proofs || order.proofs.length === 0) && itemAttachments.length > 0) {
    order.proofs = itemAttachments;
  }

  order.status = 'pending';

  if (!order.approvalHistory) {
    order.approvalHistory = [];
  }

  order.approvalHistory.push({
    status: 'submitted',
    approver: toObjectId(userId) as any,
    date: new Date(),
    remarks: 'Submitted for processing',
  });

  await order.save();

  return enhanceXeroxOrder(order);
};

export const branchApproveXeroxOrder = async (
  id: string,
  branchAdminId: string,
  approvalData: {
    status: 'approved' | 'rejected';
    remarks?: string;
    verifyProofs?: boolean;
    proofs?: { proof: string; verified: boolean }[];
  }
) => {
  const order = await XeroxOrder.findById(id);

  if (!order) return null;

  if (order.status === 'draft' || order.status === 'delivered') {
    throw new Error('Xerox order cannot be approved in its current status');
  }

  if (approvalData.proofs) {
    order.proofs = approvalData.proofs;
  } else if (approvalData.verifyProofs && order.proofs) {
    order.proofs = order.proofs.map((p) => ({ ...p, verified: true }));
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

  if (approvalData.status === 'rejected') {
    order.status = 'rejected';
  }

  await order.save();

  return enhanceXeroxOrder(order);
};

export const superAdminApproveXeroxOrder = async (
  id: string,
  superAdminId: string,
  approvalData: {
    status: 'approved' | 'rejected';
    remarks?: string;
    verifyProofs?: boolean;
    proofs?: { proof: string; verified: boolean }[];
  }
) => {
  const order = await XeroxOrder.findById(id);

  if (!order) return null;

  if (order.status === 'delivered') {
    throw new Error('Xerox order is already delivered');
  }

  if (approvalData.proofs) {
    order.proofs = approvalData.proofs;
  } else if (approvalData.verifyProofs && order.proofs) {
    order.proofs = order.proofs.map((p) => ({ ...p, verified: true }));
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

  if (approvalData.status === 'rejected') {
    order.status = 'rejected';
  }

  await order.save();

  return enhanceXeroxOrder(order);
};

export const markXeroxOrderInProgress = async (id: string) => {
  const order = await XeroxOrder.findById(id);

  if (!order) return null;

  if (order.status !== 'pending' && order.status !== 'in_progress') {
    throw new Error('Xerox order must be pending before it can be processed');
  }

  order.status = 'in_progress';

  await order.save();

  return enhanceXeroxOrder(order);
};

export const markXeroxOrderReadyForPickup = async (id: string) => {
  const order = await XeroxOrder.findById(id);

  if (!order) return null;

  if (order.status !== 'in_progress') {
    throw new Error('Xerox order must be in progress before it can be marked ready for pickup');
  }

  order.status = 'ready_for_pickup';

  await order.save();

  return enhanceXeroxOrder(order);
};

export const markXeroxOrderDelivered = async (id: string) => {
  const order = await XeroxOrder.findById(id);

  if (!order) return null;

  if (order.status !== 'ready_for_pickup') {
    throw new Error('Xerox order must be ready for pickup before it can be delivered');
  }

  order.status = 'delivered';

  if (order.bill) {
    const bill = await Bill.findById(order.bill);
    if (bill && bill.paymentMethod === 'CREDIT' && bill.approvalStatus === 'approved') {
      const dept = await Department.findById(order.department);
      if (dept) {
        dept.outstandingCredit += bill.total;
        await applyCreditBalance(dept);
        await dept.save();
      }
    }
  }

  await order.save();

  return enhanceXeroxOrder(order);
};

export const addXeroxOrderProofs = async (
  id: string,
  proofItems: { proof: string; filename?: string; mimetype?: string }[]
) => {
  const order = await XeroxOrder.findById(id);
  if (!order) return null;

  if (!order.proofs) order.proofs = [];
  for (const item of proofItems) {
    order.proofs.push({
      proof: item.proof,
      filename: item.filename,
      mimetype: item.mimetype,
      verified: false,
    });
  }

  await order.save();
  return enhanceXeroxOrder(order);
};

export const verifyXeroxOrderProof = async (
  id: string,
  data: { proofIndex?: number; proofUrl?: string; verified: boolean }
) => {
  const order = await XeroxOrder.findById(id);
  if (!order) return null;

  if (!order.proofs) order.proofs = [];

  if (typeof data.proofIndex === 'number' && order.proofs[data.proofIndex]) {
    order.proofs[data.proofIndex].verified = data.verified;
  } else if (data.proofUrl) {
    const item = order.proofs.find((p) => p.proof === data.proofUrl);
    if (item) item.verified = data.verified;
  } else {
    order.proofs = order.proofs.map((p) => ({ ...p, verified: data.verified }));
  }

  await order.save();
  return enhanceXeroxOrder(order);
};
