import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { ICreditPayment } from '@db/models/credit.model.ts';


export const creditPaymentFilterConfig: FilterConfig<ICreditPayment> = {
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
  defaultSort: '-createdAt',
};