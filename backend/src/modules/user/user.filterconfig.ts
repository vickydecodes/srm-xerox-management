import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { IUser } from '@db/models/user.model.ts';

export const userFilterConfig: FilterConfig<IUser> = {
  table: 'User',
  searchable: ['name', 'email', 'login_id', 'phone'],
  filterable: ['role', 'branch', 'department', 'shop', 'active', 'deleted'],
  sortable: ['name', 'email', 'login_id', 'role', 'createdAt', 'updatedAt', 'active'],
  defaultSort: 'name',
  enhanceRefs: ['branch', 'department', 'shop'],
};