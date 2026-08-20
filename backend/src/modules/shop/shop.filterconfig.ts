import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { IShop } from '@db/models/shop.model.ts';


export const shopFilterConfig: FilterConfig<IShop> = {
  searchable: ['name', 'code', 'phone', 'email'],
  filterable: ['active'],
  sortable: ['name', 'code', 'createdAt', 'updatedAt', 'active'],
  defaultSort: 'name',
};