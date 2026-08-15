import { Request, Response } from 'express';
import * as service from './bill.services.ts';
import { CreateBillPayload, UpdateBillPayload } from '@typings/bill.types.ts';
import { createStatusControllers } from '@core/constants/createstatuscontroller.constant.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';
import { AccessRequest } from '@core/middlewares/access.middleware.ts';

const billStatus = createStatusControllers(
  {
    remove: service.removeBill,
    setActiveStatus: service.setBillActiveStatus,
    retrieve: service.retrieveBill,
  },
  'bill'
);

const controllers = {
  createBill: async (req: AccessRequest<{}, {}, CreateBillPayload>, res: Response) => {
    if (!req.user) {
      return sendResponse.unauthorized?.(res) ?? res.status(401).json({ message: 'Unauthorized' });
    }

    // Use the correct property from your AuthUser type (most common: id or _id)
    const createdBy = String(req.user.id ?? (req.user as any)._id);

    const bill = await service.createBill(req.body, createdBy);
    return sendResponse.created(res, 'Bill', bill);
  },

  getAllBills: async (req: Request, res: Response) => {
    const queries = buildQuery(req);
    const result = await service.getAllBills(queries);
    return sendResponse.paginated(res, 'bill', result);
  },

  // bill.controller.ts — add to controllers object

  getBillsByDepartment: async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const queries = buildQuery(req);
    const result = await service.getBillsByDepartment(id, queries);
    return sendResponse.paginated(res, 'bill', result);
  },

  getBillById: async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const bill = await service.getBillById(id);
    if (!bill) return sendResponse.notFound(res, 'bill');
    return sendResponse.fetched(res, 'bill', bill);
  },

  updateBill: async (req: Request<{ id: string }, {}, UpdateBillPayload>, res: Response) => {
    const { id } = req.params;
    const bill = await service.updateBill(id, req.body);
    if (!bill) return sendResponse.notFound(res, 'bill');
    return sendResponse.updated(res, 'bill', bill);
  },

  deleteBill: billStatus.softDelete,
  setBillActiveStatus: billStatus.setActiveStatus,
  retrieveBill: billStatus.retrieve,

  eraseBill: async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const bill = await service.eraseBill(id);
    if (!bill) return sendResponse.notFound(res, 'bill');
    return sendResponse.deleted(res, 'bill');
  },

  approveCreditBill: async (
    req: AccessRequest<{ id: string }, {}, { remarks?: string }>,
    res: Response
  ) => {
    if (!req.user) {
      return sendResponse.unauthorized?.(res) ?? res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    const userId = String(req.user.id ?? (req.user as any)._id);
    const bill = await service.approveCreditBill(id, userId, req.body.remarks);
    if (!bill) return sendResponse.notFound(res, 'bill');
    return sendResponse.updated(res, 'bill', bill);
  },

  rejectCreditBill: async (
    req: AccessRequest<{ id: string }, {}, { remarks?: string }>,
    res: Response
  ) => {
    if (!req.user) {
      return sendResponse.unauthorized?.(res) ?? res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    const userId = String(req.user.id ?? (req.user as any)._id);
    const bill = await service.rejectCreditBill(id, userId, req.body.remarks);
    if (!bill) return sendResponse.notFound(res, 'bill');
    return sendResponse.updated(res, 'bill', bill);
  },
};

export const {
  createBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill,
  setBillActiveStatus,
  retrieveBill,
  eraseBill,
  approveCreditBill,
  rejectCreditBill,
} = wrapControllers(controllers);
