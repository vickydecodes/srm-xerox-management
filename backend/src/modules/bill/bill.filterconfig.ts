// modules/bill/bill.filterconfig.ts
export const billFilterConfig = {
  filterable: ['status', 'createdBy'],
  searchable: ['code'],
  sortable: ['createdAt', 'total', 'status'],
  defaultSort: '-createdAt',
};