import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { IXeroxOrder } from '@db/models/xerox-order.model.ts';

export const xeroxOrderFilterConfig: FilterConfig<IXeroxOrder> = {
  table: 'XeroxOrder',
  searchable: ['code', 'purpose', 'attachmentEmail'],
  filterable: [
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
  hasActive: false,
  enhanceRefs: ['department', 'branch', 'shop', 'createdBy', 'bill'],
};
