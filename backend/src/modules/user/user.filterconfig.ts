import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { IUser } from '@db/models/user.model.ts';

export const userFilterConfig: FilterConfig<IUser> = {
  searchable: ['name', 'login_id', 'email', 'phone'],
  filterable: ['role', 'branch', 'active', 'deleted'],
  sortable: ['name', 'login_id', 'createdAt', 'updatedAt', 'active', 'email', 'phone', 'role', 'branch', 'department', 'shop'],
  defaultSort: 'name',
};