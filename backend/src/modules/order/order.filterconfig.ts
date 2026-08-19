import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { IOrder } from '@db/models/order.model.ts';

export const orderFilterConfig: FilterConfig<IOrder> = {
  searchable: ['code', 'purpose', 'attachmentEmail'],
  filterable: [
    'department',
    'branch',
    'status',
    'deleted',
  ],
  sortable: [
    'code',
    'status',
    'createdAt',
    'updatedAt',
  ],
  defaultSort: 'createdAt',
};