import { Request, Response } from 'express';
import { AuthRequest } from '@core/middlewares/auth.middleware.ts';

import * as service from './xerox-order.services.ts';
import { extractBranch } from './xerox-order.constants.ts';

import {
  CreateXeroxOrderPayload,
  UpdateXeroxOrderPayload,
} from '@typings/xerox-order.types.ts';

import { createStatusControllers } from '@core/constants/createstatuscontroller.constant.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';

const xeroxOrderStatus = createStatusControllers(
  {
    remove: service.removeXeroxOrder,
    retrieve: service.retrieveXeroxOrder,
  },
  'XeroxOrder'
);

const controllers = {
  createXeroxOrder: async (
    req: AuthRequest & {
      body: CreateXeroxOrderPayload;
    },
    res: Response
  ) => {
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

    const order = await service.createXeroxOrder(
      req.body,
      req.user!.id
    );

    return sendResponse.created(
      res,
      'XeroxOrder',
      order
    );
  },

  getAllXeroxOrders: async (
    req: AuthRequest,
    res: Response
  ) => {
    const queries = buildQuery(req);
    const branch = extractBranch(queries);
    delete queries.shop;

    const result = await service.getAllXeroxOrders(
      queries,
      {
        branchId: branch,
        approvedByBranchOnly: req.user?.role === 'shop_admin',
      }
    );

    return sendResponse.paginated(
      res,
      'XeroxOrders',
      result
    );
  },

  getXeroxOrderById: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.getXeroxOrderById(id);

    if (!order) {
      return sendResponse.notFound(res, 'XeroxOrder');
    }

    return sendResponse.success(
      res,
      'XeroxOrder retrieved successfully',
      order
    );
  },

  updateXeroxOrder: async (
    req: Request & {
      body: UpdateXeroxOrderPayload;
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

    const order = await service.updateXeroxOrder(
      id,
      req.body
    );

    if (!order) {
      return sendResponse.notFound(res, 'XeroxOrder');
    }

    return sendResponse.updated(
      res,
      'XeroxOrder',
      order
    );
  },

  deleteXeroxOrder: xeroxOrderStatus.softDelete,
  retrieveXeroxOrder: xeroxOrderStatus.retrieve,

  eraseXeroxOrder: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.eraseXeroxOrder(id);

    if (!order) {
      return sendResponse.notFound(res, 'XeroxOrder');
    }

    return sendResponse.deleted(
      res,
      'XeroxOrder'
    );
  },

  submitXeroxOrder: async (
    req: AuthRequest,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.submitXeroxOrder(
      id,
      req.user!.id
    );

    if (!order) {
      return sendResponse.notFound(res, 'XeroxOrder');
    }

    return sendResponse.updated(
      res,
      'XeroxOrder',
      order
    );
  },

  branchApproveXeroxOrder: async (
    req: AuthRequest,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.branchApproveXeroxOrder(
      id,
      req.user!.id,
      req.body
    );

    if (!order) {
      return sendResponse.notFound(res, 'XeroxOrder');
    }

    return sendResponse.updated(
      res,
      'XeroxOrder',
      order
    );
  },

  superAdminApproveXeroxOrder: async (
    req: AuthRequest,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.superAdminApproveXeroxOrder(
      id,
      req.user!.id,
      req.body
    );

    if (!order) {
      return sendResponse.notFound(res, 'XeroxOrder');
    }

    return sendResponse.updated(
      res,
      'XeroxOrder',
      order
    );
  },

  markXeroxOrderInProgress: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const shopId = (req as any).user?.shop;
    const order = await service.markXeroxOrderInProgress(id, shopId ? String(shopId) : undefined);

    if (!order) {
      return sendResponse.notFound(res, 'XeroxOrder');
    }

    return sendResponse.updated(
      res,
      'XeroxOrder',
      order
    );
  },

  markXeroxOrderReadyForPickup: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.markXeroxOrderReadyForPickup(id);

    if (!order) {
      return sendResponse.notFound(res, 'XeroxOrder');
    }

    return sendResponse.updated(
      res,
      'XeroxOrder',
      order
    );
  },

  markXeroxOrderDelivered: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.markXeroxOrderDelivered(id);

    if (!order) {
      return sendResponse.notFound(res, 'XeroxOrder');
    }

    return sendResponse.updated(
      res,
      'XeroxOrder',
      order
    );
  },

  uploadXeroxOrderProofs: async (
    req: AuthRequest,
    res: Response
  ) => {
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
    const order = await service.addXeroxOrderProofs(id, proofItems);

    if (!order) {
      return sendResponse.notFound(res, 'XeroxOrder');
    }

    return sendResponse.updated(res, 'XeroxOrder', order);
  },

  verifyXeroxOrderProof: async (
    req: Request,
    res: Response
  ) => {
    const id = req.params.id as string;
    const order = await service.verifyXeroxOrderProof(id, req.body);

    if (!order) {
      return sendResponse.notFound(res, 'XeroxOrder');
    }

    return sendResponse.updated(res, 'XeroxOrder', order);
  },
};

export const {
  createXeroxOrder,
  getAllXeroxOrders,
  getXeroxOrderById,
  updateXeroxOrder,
  deleteXeroxOrder,
  retrieveXeroxOrder,
  eraseXeroxOrder,
  submitXeroxOrder,
  branchApproveXeroxOrder,
  superAdminApproveXeroxOrder,
  markXeroxOrderInProgress,
  markXeroxOrderReadyForPickup,
  markXeroxOrderDelivered,
  uploadXeroxOrderProofs,
  verifyXeroxOrderProof,
} = wrapControllers(controllers);
