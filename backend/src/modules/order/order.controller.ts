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
    const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
    const existingProofs = (req.body as any).proofs || [];

    if (files && files.length > 0) {
      const uploadedProofs = files.map((file) => ({
        proof: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        filename: file.originalname,
        mimetype: file.mimetype,
        verified: false,
      }));
      (req.body as any).proofs = [...existingProofs, ...uploadedProofs];
    }

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

    const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

    if (files && files.length > 0) {
      const uploadedProofs = files.map((file) => ({
        proof: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        filename: file.originalname,
        mimetype: file.mimetype,
        verified: false,
      }));
      const existingProofs = (req.body as any).proofs || [];
      (req.body as any).proofs = [...existingProofs, ...uploadedProofs];
    }

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

  submitOrder: async (
    req: AuthRequest & {
      params: { id: string };
    },
    res: Response
  ) => {
    const { id } = req.params;

    const order = await service.submitOrder(
      id,
      req.user!.id
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

  branchApproveOrder: async (
    req: AuthRequest & {
      params: { id: string };
      body: {
        status: 'approved' | 'rejected';
        remarks?: string;
      };
    },
    res: Response
  ) => {
    const { id } = req.params;

    const order = await service.branchApproveOrder(
      id,
      req.user!.id,
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

  superAdminApproveOrder: async (
    req: AuthRequest & {
      params: { id: string };
      body: {
        status: 'approved' | 'rejected';
        remarks?: string;
      };
    },
    res: Response
  ) => {
    const { id } = req.params;

    const order =
      await service.superAdminApproveOrder(
        id,
        req.user!.id,
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

  markOrderInProgress: async (
    req: AuthRequest & {
      params: { id: string };
    },
    res: Response
  ) => {
    const { id } = req.params;

    const order =
      await service.markOrderInProgress(id);

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

  markOrderReadyForPickup: async (
    req: AuthRequest & {
      params: { id: string };
    },
    res: Response
  ) => {
    const { id } = req.params;

    const order =
      await service.markOrderReadyForPickup(id);

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

  markOrderDelivered: async (
    req: AuthRequest & {
      params: { id: string };
    },
    res: Response
  ) => {
    const { id } = req.params;

    const order =
      await service.markOrderDelivered(id);

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

  uploadOrderProofs: async (
    req: Request<{ id: string }>,
    res: Response
  ) => {
    const { id } = req.params;
    const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return sendResponse.badRequest(res, 'No proof documents uploaded');
    }

    const proofItems = files.map((file) => ({
      proof: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      filename: file.originalname,
      mimetype: file.mimetype,
    }));
    const order = await service.addOrderProofs(id, proofItems);

    if (!order) {
      return sendResponse.notFound(res, 'order');
    }

    return sendResponse.updated(res, 'order', order);
  },

  verifyOrderProof: async (
    req: Request<
      { id: string },
      {},
      { proofIndex?: number; proofUrl?: string; verified: boolean }
    >,
    res: Response
  ) => {
    const { id } = req.params;
    const order = await service.verifyOrderProof(id, req.body);

    if (!order) {
      return sendResponse.notFound(res, 'order');
    }

    return sendResponse.updated(res, 'order', order);
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
  submitOrder,
  branchApproveOrder,
  superAdminApproveOrder,
  markOrderInProgress,
  markOrderReadyForPickup,
  markOrderDelivered,
  uploadOrderProofs,
  verifyOrderProof,
} = wrapControllers(controllers);