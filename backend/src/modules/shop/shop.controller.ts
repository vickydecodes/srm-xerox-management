import { Request, Response } from 'express';

import * as service from './shop.services.ts';

import {
  CreateShopPayload,
  UpdateShopPayload,
} from '@typings/shop.types.ts';

import { createStatusControllers } from '@core/constants/createstatuscontroller.constant.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';
import { AuthRequest } from '@core/middlewares/auth.middleware.ts';

const shopStatus = createStatusControllers(
  {
    remove: service.removeShop,
    setActiveStatus: service.setShopActiveStatus,
    retrieve: service.retrieveShop,
  },
  'shop'
);

const controllers = {
  createShop: async (
    req: AuthRequest & {
      body: CreateShopPayload;
    },
    res: Response
  ) => {
    if (!req.user) {
      return (
        sendResponse.unauthorized?.(res) ??
        res.status(401).json({
          message: 'Unauthorized',
        })
      );
    }

    const createdBy = String(
      req.user.id ?? (req.user as any)._id
    );

    const shop = await service.createShop(
      req.body,
      createdBy
    );

    return sendResponse.created(
      res,
      'Shop',
      shop
    );
  },

  getAllShops: async (
    req: Request,
    res: Response
  ) => {
    const queries = buildQuery(req);

    const result = await service.getAllShops(
      queries,
      'super_admin'
    );

    return sendResponse.paginated(
      res,
      'shop',
      result
    );
  },

  getShopById: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;

    const shop = await service.getShopById(id);

    if (!shop) {
      return sendResponse.notFound(
        res,
        'shop'
      );
    }

    return sendResponse.fetched(
      res,
      'shop',
      shop
    );
  },

  updateShop: async (
    req: Request<
      { id: string },
      {},
      UpdateShopPayload
    >,
    res: Response
  ) => {
    const { id } = req.params;

    const shop = await service.updateShop(
      id,
      req.body
    );

    if (!shop) {
      return sendResponse.notFound(
        res,
        'shop'
      );
    }

    return sendResponse.updated(
      res,
      'shop',
      shop
    );
  },

  deleteShop: shopStatus.softDelete,

  setShopActiveStatus:
    shopStatus.setActiveStatus,

  retrieveShop: shopStatus.retrieve,

  eraseShop: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;

    const shop = await service.eraseShop(id);

    if (!shop) {
      return sendResponse.notFound(
        res,
        'shop'
      );
    }

    return sendResponse.deleted(
      res,
      'shop'
    );
  },
};

export const {
  createShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
  setShopActiveStatus,
  retrieveShop,
  eraseShop,
} = wrapControllers(controllers);