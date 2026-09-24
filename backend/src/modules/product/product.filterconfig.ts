import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { IProduct } from '@db/models/product.model.ts';

export const productFilterConfig: FilterConfig<IProduct> = {
  table: 'Product',
  searchable: ['name', 'code'],
  filterable: ['type', 'active', 'deleted'],
  sortable: ['name', 'code', 'createdAt', 'active'],
  defaultSort: 'name',
};
