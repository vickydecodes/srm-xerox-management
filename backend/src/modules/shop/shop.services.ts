import Shop from '@db/models/shop.model.ts';
import {
  dynamicFilter,
  PaginatedResult,
} from '@core/constants/dynamicfilter.constant.ts';

import {
  CreateShopPayload,
  UpdateShopPayload,
} from '@typings/shop.types.ts';

import { Role } from '@typings/auth.types.js';

import {
  UPDATE_OPTIONS,
  SOFT_DELETE,
  RETRIEVE,
  toObjectId,
  getVisibility,
} from './shop.constants.ts';

import { enhanceShop } from './shop.util.ts';
import { shopFilterConfig } from './shop.filterconfig.ts';
import { IShop } from '@db/models/shop.model.ts';

export const createShop = async (
  data: CreateShopPayload,
  createdBy: string
) => {
  const shop = await new Shop({
    ...data,
    createdBy: toObjectId(createdBy),
  }).save();

  return enhanceShop(shop);
};

export const getAllShops = async (
  queries: Record<string, unknown>,
  role?: Role
): Promise<PaginatedResult<IShop>> => {
  return dynamicFilter(
    Shop,
    shopFilterConfig,
    queries,
    {
      visibility: getVisibility(role),
    }
  );
};

export const getShopById = async (
  id: string
) => {
  return Shop.findById(id);
};

export const updateShop = async (
  id: string,
  data: UpdateShopPayload
) => {
  const updated = await Shop.findByIdAndUpdate(
    id,
    data,
    UPDATE_OPTIONS
  );

  if (!updated) return null;

  return enhanceShop(updated);
};

export const removeShop = async (
  id: string
) => {
  const removed = await Shop.findByIdAndUpdate(
    id,
    SOFT_DELETE,
    UPDATE_OPTIONS
  );

  if (!removed) return null;

  return enhanceShop(removed);
};

export const retrieveShop = async (
  id: string
) => {
  const retrieved = await Shop.findByIdAndUpdate(
    id,
    RETRIEVE,
    UPDATE_OPTIONS
  );

  if (!retrieved) return null;

  return enhanceShop(retrieved);
};

export const eraseShop = async (
  id: string
) => {
  const erased = await Shop.findByIdAndDelete(id);

  if (!erased) return null;

  return enhanceShop(erased);
};

export const setShopActiveStatus = async (
  id: string,
  active: boolean
) => {
  return Shop.findByIdAndUpdate(
    id,
    {
      active,
      ...(active
        ? {
            deleted: false,
            deletedAt: null,
          }
        : {}),
    },
    { new: true }
  );
};