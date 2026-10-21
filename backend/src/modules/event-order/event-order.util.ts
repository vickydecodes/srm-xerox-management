import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import EventOrderModel, { IEventOrder } from '@db/models/event-order.model.ts';

export const enhanceEventOrder = (order: any) => {
  return enhanceDoc(EventOrderModel, order, [
    'branch',
    'department',
    'shop',
    'createdBy',
    'branchAdminApproval.approver',
    'superAdminApproval.approver',
    'approvalHistory.approver',
  ]);
};
