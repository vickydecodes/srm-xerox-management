import { FilterConfig } from "@core/constants/dynamicfilter.constant.ts";
import { IInventoryProduct } from '@db/models/inventory-product.model.ts';

export const inventoryProductFilterConfig: FilterConfig<IInventoryProduct>= {
    searchable: [
        "product.name",
        "inventory.name"
    ],

    filterable: [
        "inventory",
        "product",
        "active"
    ],

    sortable: [
        "createdAt",
        "updatedAt",
        "quantity",
    ],

    defaultSort: "createdAt",
} 