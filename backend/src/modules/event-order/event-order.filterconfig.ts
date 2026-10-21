import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { IEventOrder } from '@db/models/event-order.model.ts';

export const eventOrderFilterConfig: FilterConfig<IEventOrder> = {
  table: 'EventOrder',
  searchable: ['code', 'eventName', 'purpose', 'approvedReferralNumber', 'attachmentEmail'],
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
    'eventName',
    'eventDate',
    'approvedDate',
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
