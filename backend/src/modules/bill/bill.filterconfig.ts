// modules/bill/bill.filterconfig.ts
export const billFilterConfig = {
  table: 'Bill',
  filterable: ['status', 'createdBy', 'paymentMethod', 'department', 'branch'],
  searchable: ['code'],
  sortable: ['createdAt', 'total', 'status', 'code', 'paymentMethod'],
  defaultSort: 'createdAt',
  hasActive: false,
  enhanceRefs: ['branch', 'department', 'order', 'createdBy', 'approvedBy'],
};