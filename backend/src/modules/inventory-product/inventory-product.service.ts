import InventoryProduct from '@db/models/inventory-product.model.ts';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';
import {
    CreateInventoryProductPayload,
    UpdateInventoryProductPayload,
} from "@typings/inventory-product.types.ts";
import { Role } from "@typings/auth.types.ts";
import {
    UPDATE_OPTIONS,
    SOFT_DELETE,
    RETRIEVE,
    toObjectId,
    getVisibility,
} from "./inventory-product.constants.ts";
import { enhanceInventoryProduct } from './inventory-product.util.ts';
import { inventoryProductFilterConfig } from './inventory-product.filter.ts';

export const createInventoryProduct = async (
    data: CreateInventoryProductPayload
) => {

    const inventoryProduct = await new InventoryProduct(data).save();

    return enhanceInventoryProduct(inventoryProduct);
}

export const getAllInventoryProducts = async (
    queries: Record<string, unknown>,
    role?:  Role,
    options?: {inventoryId?: string}

) => {

    const rawQuery = options?.inventoryId
     ? {inventory: toObjectId(options.inventoryId)}
     : undefined;

     return dynamicFilter(
        InventoryProduct,
        inventoryProductFilterConfig,
        queries,
        { visibility: getVisibility(role),
            rawQuery,
        }
     );
};

export const getInventoryProductById = async (id: string) => {
    return  InventoryProduct.findById(id);
}

export const updateInventoryProduct = async (
    id: string,
    data: UpdateInventoryProductPayload
) => {

    const updated = 
     await InventoryProduct.findByIdAndUpdate(
        id,
        data,
        UPDATE_OPTIONS
     );

     if(!updated) return null;

     return enhanceInventoryProduct(updated);
     
};

export const removeInventoryProduct = async (id: string) =>{
    const removed = await InventoryProduct.findByIdAndUpdate(
        id,
        SOFT_DELETE,
        {new: true}
    );

    if(!removed) return null;

    return enhanceInventoryProduct(removed);
};

export const retrieveInventoryProduct = async (id: string) => {
    const retrieved = await InventoryProduct.findByIdAndUpdate(
        id,
        RETRIEVE,
        {new: true}
    );

    if(!retrieved) return null;
    
    return enhanceInventoryProduct(retrieved);
};

export const eraseInventoryProduct = async (id: string) => {
    const erased = await InventoryProduct.findByIdAndDelete(id);

    if (!erased) return null;

    return enhanceInventoryProduct(erased);
};

export const setInventoryProductActiveStatus = async (
    id: string,
    active: boolean
) => {
    return InventoryProduct.findByIdAndUpdate(
        id,
        { active },
        { new: true }
    );
};