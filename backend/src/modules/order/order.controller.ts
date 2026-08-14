import { Request, Response } from 'express';

import { AuthRequest } from '@core/middlewares/auth.middleware.ts';

import * as service from './order.services.ts';

import { extractBranch } from './order.constants.ts';

import {
  CreateOrderPayload,
  UpdateOrderPayload,
} from '@typings/order.types.ts';

import { createStatusControllers } from '@core/constants/createstatuscontroller.constant.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';


const orderStatus = createStatusControllers(
  {
    remove: service.removeOrder,
    retrieve: service.retrieveOrder,
  },
  'order'
);


const controllers = {
  createOrder: async (
    req: AuthRequest & {
      body: CreateOrderPayload;
    },
    res: Response
  ) => {
    const order = await service.createOrder(
      req.body,
      req.user!.id
    );

    return sendResponse.created(
      res,
      'Order',
      order
    );
  },


  getAllOrders: async (
    req: Request,
    res: Response
  ) => {
    const queries = buildQuery(req);

    const branch = extractBranch(queries);

    const result = await service.getAllOrders(
      queries,
      { branchId: branch }
    );

    return sendResponse.paginated(
      res,
      'order',
      result
    );
  },


  getOrderById: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;

    const order = await service.getOrderById(id);

    if (!order) {
      return sendResponse.notFound(
        res,
        'order'
      );
    }

    return sendResponse.fetched(
      res,
      'order',
      order
    );
  },


  updateOrder: async (
    req: Request<
      { id: string },
      {},
      UpdateOrderPayload
    >,
    res: Response
  ) => {
    const { id } = req.params;

    const order = await service.updateOrder(
      id,
      req.body
    );

    if (!order) {
      return sendResponse.notFound(
        res,
        'order'
      );
    }

    return sendResponse.updated(
      res,
      'order',
      order
    );
  },


  deleteOrder: orderStatus.softDelete,

  retrieveOrder: orderStatus.retrieve,


  eraseOrder: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;

    const order = await service.eraseOrder(id);

    if (!order) {
      return sendResponse.notFound(
        res,
        'order'
      );
    }

    return sendResponse.deleted(
      res,
      'order'
    );
  },
};


export const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  retrieveOrder,
  eraseOrder,
} = wrapControllers(controllers);