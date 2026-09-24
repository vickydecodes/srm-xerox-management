import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { ICreditPayment } from '@db/models/credit.model.ts';


export const creditPaymentFilterConfig: FilterConfig<ICreditPayment> = {
  table: 'CreditPayment',
  filterable: [
    'department',
    'paymentMethod',
    'paidBy',
  ],
  searchable: [
    'remarks',
  ],
  sortable: [
    'amount',
    'date',
    'createdAt',
    'updatedAt',
  ],
  defaultSort: 'createdAt',
  hasActive: false,
  hasDeleted: false,
  enhanceRefs: ['department', 'paidBy'],
};