import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import OrderModel, { IOrder } from '@db/models/order.model.ts';

export const enhanceOrder = (order: any) => {
  return enhanceDoc(OrderModel, order, [
    'branch',
    'department',
    'shop',
    'createdBy',
    'branchAdminApproval.approver',
    'superAdminApproval.approver',
    'approvalHistory.approver',
  ]);
};