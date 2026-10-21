import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import XeroxOrderModel, { IXeroxOrder } from '@db/models/xerox-order.model.ts';

export const enhanceXeroxOrder = (order: any) => {
  return enhanceDoc(XeroxOrderModel, order, [
    'branch',
    'department',
    'shop',
    'createdBy',
    'branchAdminApproval.approver',
    'superAdminApproval.approver',
    'approvalHistory.approver',
  ]);
};
