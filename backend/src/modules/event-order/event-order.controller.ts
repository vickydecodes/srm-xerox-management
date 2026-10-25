import { Request, Response } from 'express';
import { AuthRequest } from '@core/middlewares/auth.middleware.ts';

import * as service from './event-order.services.ts';
import { extractBranch } from './event-order.constants.ts';

import {
  CreateEventOrderPayload,
  UpdateEventOrderPayload,
} from '@typings/event-order.types.ts';

import { createStatusControllers } from '@core/constants/createstatuscontroller.constant.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';

const eventOrderStatus = createStatusControllers(
  {
    remove: service.removeEventOrder,
    retrieve: service.retrieveEventOrder,
  },
  'EventOrder'
);

const controllers = {
  createEventOrder: async (
    req: AuthRequest & {
      body: CreateEventOrderPayload;
    },
    res: Response
  ) => {
    const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
    const proofFiles = files.filter(f => f.fieldname === 'proofs' || !f.fieldname.startsWith('item_attachment_'));
    const itemFiles = files.filter(f => f.fieldname.startsWith('item_attachment_'));
    const existingProofs = (req.body as any).proofs || [];

    if (proofFiles && proofFiles.length > 0) {
      if (req.user?.role !== 'department_admin' && req.user?.role !== 'super_admin') {
        return sendResponse.forbidden(res, 'Only department admin can upload proof documents');
      }
      const uploadedProofs = proofFiles.map((file) => ({
        proof: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        filename: file.originalname,
        mimetype: file.mimetype,
        verified: false,
      }));
      (req.body as any).proofs = [...existingProofs, ...uploadedProofs];
    }

    if (itemFiles && itemFiles.length > 0) {
      let parsedItems = (req.body as any).items;
      if (typeof parsedItems === 'string') {
        try { parsedItems = JSON.parse(parsedItems); } catch { }
      }
      if (Array.isArray(parsedItems)) {
        itemFiles.forEach((file) => {
          const match = file.fieldname.match(/^item_attachment_(\d+)$/);
          if (match) {
            const idx = parseInt(match[1], 10);
            if (parsedItems[idx]) {
              parsedItems[idx].attachment = {
                fileData: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                filename: file.originalname,
                mimetype: file.mimetype,
              };
            }
          }
        });
        (req.body as any).items = parsedItems;
      }
    }

    const order = await service.createEventOrder(
      req.body,
      req.user!.id
    );

    return sendResponse.created(
      res,
      'EventOrder',
      order
    );
  },

  getAllEventOrders: async (
    req: AuthRequest,
    res: Response
  ) => {
    const queries = buildQuery(req);
    const branch = extractBranch(queries);
    delete queries.shop;

    const result = await service.getAllEventOrders(
      queries,
      {
        branchId: branch,
        approvedByBranchOnly: req.user?.role === 'shop_admin',
      }
    );

    return sendResponse.paginated(
      res,
      'EventOrders',
      result
    );
  },

  getEventOrderById: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.getEventOrderById(id);

    if (!order) {
      return sendResponse.notFound(res, 'EventOrder');
    }

    return sendResponse.success(
      res,
      'EventOrder retrieved successfully',
      order
    );
  },

  updateEventOrder: async (
    req: Request & {
      body: UpdateEventOrderPayload;
    },
    res: Response
  ) => {
    const id = req.params.id as string;
    const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
    const proofFiles = files.filter(f => f.fieldname === 'proofs' || !f.fieldname.startsWith('item_attachment_'));
    const itemFiles = files.filter(f => f.fieldname.startsWith('item_attachment_'));
    const existingProofs = (req.body as any).proofs || [];

    if (proofFiles && proofFiles.length > 0) {
      const uploadedProofs = proofFiles.map((file) => ({
        proof: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        filename: file.originalname,
        mimetype: file.mimetype,
        verified: false,
      }));
      (req.body as any).proofs = [...existingProofs, ...uploadedProofs];
    }

    if (itemFiles && itemFiles.length > 0) {
      let parsedItems = (req.body as any).items;
      if (typeof parsedItems === 'string') {
        try { parsedItems = JSON.parse(parsedItems); } catch { }
      }
      if (Array.isArray(parsedItems)) {
        itemFiles.forEach((file) => {
          const match = file.fieldname.match(/^item_attachment_(\d+)$/);
          if (match) {
            const idx = parseInt(match[1], 10);
            if (parsedItems[idx]) {
              parsedItems[idx].attachment = {
                fileData: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                filename: file.originalname,
                mimetype: file.mimetype,
              };
            }
          }
        });
        (req.body as any).items = parsedItems;
      }
    }

    const order = await service.updateEventOrder(
      id,
      req.body
    );

    if (!order) {
      return sendResponse.notFound(res, 'EventOrder');
    }

    return sendResponse.updated(
      res,
      'EventOrder',
      order
    );
  },

  deleteEventOrder: eventOrderStatus.softDelete,
  retrieveEventOrder: eventOrderStatus.retrieve,

  eraseEventOrder: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.eraseEventOrder(id);

    if (!order) {
      return sendResponse.notFound(res, 'EventOrder');
    }

    return sendResponse.deleted(
      res,
      'EventOrder'
    );
  },

  submitEventOrder: async (
    req: AuthRequest,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.submitEventOrder(
      id,
      req.user!.id
    );

    if (!order) {
      return sendResponse.notFound(res, 'EventOrder');
    }

    return sendResponse.updated(
      res,
      'EventOrder',
      order
    );
  },

  branchApproveEventOrder: async (
    req: AuthRequest,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.branchApproveEventOrder(
      id,
      req.user!.id,
      req.body
    );

    if (!order) {
      return sendResponse.notFound(res, 'EventOrder');
    }

    return sendResponse.updated(
      res,
      'EventOrder',
      order
    );
  },

  superAdminApproveEventOrder: async (
    req: AuthRequest,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.superAdminApproveEventOrder(
      id,
      req.user!.id,
      req.body
    );

    if (!order) {
      return sendResponse.notFound(res, 'EventOrder');
    }

    return sendResponse.updated(
      res,
      'EventOrder',
      order
    );
  },

  markEventOrderInProgress: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const shopId = (req as any).user?.shop;
    const order = await service.markEventOrderInProgress(id, shopId ? String(shopId) : undefined);

    if (!order) {
      return sendResponse.notFound(res, 'EventOrder');
    }

    return sendResponse.updated(
      res,
      'EventOrder',
      order
    );
  },

  markEventOrderReadyForPickup: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.markEventOrderReadyForPickup(id);

    if (!order) {
      return sendResponse.notFound(res, 'EventOrder');
    }

    return sendResponse.updated(
      res,
      'EventOrder',
      order
    );
  },

  markEventOrderDelivered: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.markEventOrderDelivered(id);

    if (!order) {
      return sendResponse.notFound(res, 'EventOrder');
    }

    return sendResponse.updated(
      res,
      'EventOrder',
      order
    );
  },

  uploadEventOrderProofs: async (
    req: AuthRequest,
    res: Response
  ) => {
    if (req.user?.role !== 'department_admin' && req.user?.role !== 'super_admin') {
      return sendResponse.forbidden(res, 'Only department admin can upload proof documents');
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return sendResponse.error(res, 'No proof documents uploaded', { statusCode: 400 });
    }

    const proofItems = files.map((file) => ({
      proof: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      filename: file.originalname,
      mimetype: file.mimetype,
    }));

    const id = req.params.id as string;
    const order = await service.addEventOrderProofs(id, proofItems);

    if (!order) {
      return sendResponse.notFound(res, 'EventOrder');
    }

    return sendResponse.updated(res, 'EventOrder', order);
  },

  verifyEventOrderProof: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.verifyEventOrderProof(id, req.body);

    if (!order) {
      return sendResponse.notFound(res, 'EventOrder');
    }

    return sendResponse.updated(res, 'EventOrder', order);
  },
};

export const {
  createEventOrder,
  getAllEventOrders,
  getEventOrderById,
  updateEventOrder,
  deleteEventOrder,
  retrieveEventOrder,
  eraseEventOrder,
  submitEventOrder,
  branchApproveEventOrder,
  superAdminApproveEventOrder,
  markEventOrderInProgress,
  markEventOrderReadyForPickup,
  markEventOrderDelivered,
  uploadEventOrderProofs,
  verifyEventOrderProof,
} = wrapControllers(controllers);
