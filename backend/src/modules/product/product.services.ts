import InventoryProduct from '@db/models/inventory-product.model.ts';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';
import {
  CreateInventoryProductPayload,
  UpdateInventoryProductPayload,
} from '@typings/inventory.types.ts';
import { Role } from '@typings/auth.types.js';
import {
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  toObjectId,
  getVisibility,
} from './product.constants.ts';
import { enhanceProduct } from './product.util.ts';
import { inventoryProductFilterConfig } from './product.filterconfig.ts';

export const createProduct = async (data: CreateInventoryProductPayload) => {
  const product = await new InventoryProduct(data).save();
  return enhanceProduct(product);
};

export const getAllProducts = async (
  queries: Record<string, unknown>,
  role?: Role,
  options?: { branchId?: string }
) => {
  const rawQuery = options?.branchId ? { branchId: toObjectId(options.branchId) } : undefined;

  return dynamicFilter(InventoryProduct, inventoryProductFilterConfig, queries, {
    visibility: getVisibility(role),
    rawQuery,
  });
};

export const getProductById = async (id: string) => {
  return InventoryProduct.findById(id);
};

export const updateProduct = async (id: string, data: UpdateInventoryProductPayload) => {
  const updated = await InventoryProduct.findByIdAndUpdate(id, data, UPDATE_OPTIONS);
  if (!updated) return null;
  return enhanceProduct(updated);
};

export const removeProduct = async (id: string) => {
  const removed = await InventoryProduct.findByIdAndUpdate(id, SOFT_DELETE, { new: true });
  if (!removed) return null;
  return enhanceProduct(removed);
};

export const retrieveProduct = async (id: string) => {
  const retrieved = await InventoryProduct.findByIdAndUpdate(id, RETRIEVE, { new: true });
  if (!retrieved) return null;
  return enhanceProduct(retrieved);
};

export const eraseProduct = async (id: string) => {
  const erased = await InventoryProduct.findByIdAndDelete(id);
  if (!erased) return null;
  return enhanceProduct(erased);
};

export const setProductActiveStatus = async (id: string, active: boolean) => {
  return InventoryProduct.findByIdAndUpdate(
    id,
    { active, ...(active ? { deleted: false, deletedAt: null } : {}) },
    { new: true }
  );
};
