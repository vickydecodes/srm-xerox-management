import { FilterConfig } from "@core/constants/dynamicfilter.constant.ts";
import { IInventoryProduct } from '@db/models/inventory-product.model.ts';

export const inventoryProductFilterConfig: FilterConfig<IInventoryProduct> = {
    searchable: [
        "inventory.name"
    ],
    searchableRefs: [
        { field: 'product', ref: 'Product', matchOn: 'name' }
    ],
    filterable: [
        "inventory",
        "product",
        "price",
        "active"
    ],

    sortable: [
        "createdAt",
        "updatedAt",
        "quantity",
        "price",
    ],

    defaultSort: "createdAt",
} 