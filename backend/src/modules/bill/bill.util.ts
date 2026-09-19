// modules/bill/bill.utils.ts (or wherever enhance*.ts files live)
import { enhanceDoc } from '@core/constants/enhancedoc.constant.ts';
import BillModel, { BillDocument } from '@db/models/bill.model.ts';

export const enhanceBill = (bill: BillDocument) => {
  return enhanceDoc(BillModel, bill, ['createdBy', 'items.item', 'branch', 'department'], {
    extras: {
      select: 'code status subtotal discount tax total paymentMethod branch department',
      populate: {
        createdBy: 'email role',
      },
    },
  });
};