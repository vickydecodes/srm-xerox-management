import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { IDepartment } from '@db/models/department.model.ts';

export const departmentFilterConfig: FilterConfig<IDepartment> = {
  searchable: ['name', 'code'],
  filterable: ['branch', 'active', 'deleted'],
  sortable: ['name', 'code', 'createdAt', 'updatedAt', 'active'],
  defaultSort: 'name',
};