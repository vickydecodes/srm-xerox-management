import InventoryProduct from '@db/models/inventory-product.model.ts';
import Inventory from '@db/models/inventory.model.ts';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';
import {
  CreateInventoryProductPayload,
  UpdateInventoryProductPayload,
} from '@typings/inventory-product.types.ts';
import { Role } from '@typings/auth.types.ts';
import {
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  toObjectId,
  getVisibility,
} from './inventory-product.constants.ts';
import { enhanceInventoryProduct, resolveInventoryProductVariant } from './inventory-product.util.ts';
import { inventoryProductFilterConfig } from './inventory-product.filterconfig.ts';

export const createInventoryProduct = async (data: CreateInventoryProductPayload) => {
  let inventoryId = data.inventory;
  if (!inventoryId) {
    let defaultInventory = await Inventory.findOne({});
    if (!defaultInventory) {
      defaultInventory = await Inventory.create({
        name: 'Default Inventory',
        active: true,
      });
    }
    inventoryId = defaultInventory._id.toString();
  }

  const inventoryProduct = await new InventoryProduct({
    ...data,
    inventory: inventoryId,
  }).save();

  const populated = await InventoryProduct.findById(inventoryProduct._id).populate('product');
  return resolveInventoryProductVariant(populated);
};

export const getAllInventoryProducts = async (
  queries: Record<string, unknown>,
  role?: Role,
  options?: { inventoryId?: string }
) => {
  const rawQuery = options?.inventoryId
    ? { inventory: toObjectId(options.inventoryId) }
    : undefined;

  const result = await dynamicFilter(InventoryProduct, inventoryProductFilterConfig, queries, {
    visibility: getVisibility(role),
    rawQuery,
  });

  if (result.data) {
    result.data = result.data.map(resolveInventoryProductVariant);
  }
  return result;
};

export const getInventoryProductById = async (id: string) => {
  const ip = await InventoryProduct.findById(id).populate('product');
  return resolveInventoryProductVariant(ip);
};

export const updateInventoryProduct = async (id: string, data: UpdateInventoryProductPayload) => {
  const updated = await InventoryProduct.findByIdAndUpdate(id, data, UPDATE_OPTIONS).populate('product');

  if (!updated) return null;

  return resolveInventoryProductVariant(updated);
};

export const removeInventoryProduct = async (id: string) => {
  const removed = await InventoryProduct.findByIdAndUpdate(id, SOFT_DELETE, { new: true });

  if (!removed) return null;

  return enhanceInventoryProduct(removed);
};

export const retrieveInventoryProduct = async (id: string) => {
  const retrieved = await InventoryProduct.findByIdAndUpdate(id, RETRIEVE, { new: true });

  if (!retrieved) return null;

  return enhanceInventoryProduct(retrieved);
};

export const eraseInventoryProduct = async (id: string) => {
  const erased = await InventoryProduct.findByIdAndDelete(id);

  if (!erased) return null;

  return enhanceInventoryProduct(erased);
};

export const setInventoryProductActiveStatus = async (id: string, active: boolean) => {
  return InventoryProduct.findByIdAndUpdate(id, { active }, { new: true });
};
