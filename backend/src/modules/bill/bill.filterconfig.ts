// modules/bill/bill.filterconfig.ts
export const billFilterConfig = {
  filterable: ['status', 'createdBy', 'paymentMethod', 'department'],
  searchable: ['code'],
  sortable: ['createdAt', 'total', 'status', 'code', 'paymentMethod'],
  defaultSort: '-createdAt',
};