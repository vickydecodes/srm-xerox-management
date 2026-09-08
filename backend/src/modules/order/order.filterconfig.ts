import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { IOrder } from '@db/models/order.model.ts';

export const orderFilterConfig: FilterConfig<IOrder> = {
  searchable: ['code', 'purpose', 'attachmentEmail'],
  filterable: [
    'orderType',
    'department',
    'branch',
    'shop',
    'createdBy',
    'status',
    'deleted',
  ],
  sortable: [
    'code',
    'status',
    'createdAt',
    'updatedAt',
    'department',
    'branch',
    'shop',
  ],
  defaultSort: 'createdAt',
};