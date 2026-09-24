import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';

// Dynamic filtering configuration for search module if needed
export const searchFilterConfig: FilterConfig<any> = {
  table: 'User', // Fake table since search is usually generic
  searchable: ['q'],
  filterable: ['type', 'active', 'deleted'],
  sortable: ['createdAt', 'updatedAt'],
  defaultSort: 'createdAt',
};
