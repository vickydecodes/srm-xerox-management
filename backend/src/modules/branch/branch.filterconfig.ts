import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { IBranch } from '@db/models/branch.model.ts';

export const branchFilterConfig: FilterConfig<IBranch> = {
  searchable: ['name', 'code'],
  filterable: ['active', 'deleted'],
  sortable: ['name', 'code', 'createdAt', 'updatedAt', 'active'],
  defaultSort: 'name',
};