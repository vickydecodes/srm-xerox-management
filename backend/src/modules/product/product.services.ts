import Product from '@db/models/product.model.ts';
import InventoryProduct from '@db/models/inventory-product.model.ts';
import { dynamicFilter } from '@core/constants/dynamicfilter.constant.ts';
import {
  CreateProductPayload,
  UpdateProductPayload,
} from '@typings/product.types.ts';
import { Role } from '@typings/auth.types.js';
import {
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  toObjectId,
  getVisibility,
} from './product.constants.ts';
import { enhanceProduct } from './product.util.ts';
import { productFilterConfig } from './product.filterconfig.ts';

export const createProduct = async (data: CreateProductPayload) => {
  const product = await new Product(data).save();
  return enhanceProduct(product);
};

export const getAllProducts = async (
  queries: Record<string, unknown>,
  role?: Role,
  options?: { branchId?: string }
) => {
  const rawQuery = options?.branchId ? { branchId: toObjectId(options.branchId) } : undefined;

  return dynamicFilter(Product, productFilterConfig, queries, {
    visibility: getVisibility(role),
    rawQuery,
  });
};

export const getProductById = async (id: string) => {
  return Product.findById(id);
};

export const updateProduct = async (id: string, data: UpdateProductPayload) => {
  const updated = await Product.findByIdAndUpdate(id, data, UPDATE_OPTIONS);
  if (!updated) return null;
  return enhanceProduct(updated);
};

export const removeProduct = async (id: string) => {
  const removed = await Product.findByIdAndUpdate(id, SOFT_DELETE, { new: true });
  if (!removed) return null;
  return enhanceProduct(removed);
};

export const retrieveProduct = async (id: string) => {
  const retrieved = await Product.findByIdAndUpdate(id, RETRIEVE, { new: true });
  if (!retrieved) return null;
  return enhanceProduct(retrieved);
};

export const eraseProduct = async (id: string) => {
  const erased = await Product.findByIdAndDelete(id);
  if (!erased) return null;
  return enhanceProduct(erased);
};

export const setProductActiveStatus = async (id: string, active: boolean) => {
  return Product.findByIdAndUpdate(
    id,
    { active, ...(active ? { deleted: false, deletedAt: null } : {}) },
    { new: true }
  );
};
