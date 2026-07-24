import { FilterConfig } from '@core/constants/dynamicfilter.constant.ts';
import { IInventoryProduct } from '@db/models/inventory-product.model.ts';

export const inventoryProductFilterConfig: FilterConfig<IInventoryProduct> = {
  searchable: ['name', 'code'],
  filterable: ['type', 'active', 'deleted'],
  sortable: ['name', 'code', 'createdAt', 'active'],
  defaultSort: 'name',
};
