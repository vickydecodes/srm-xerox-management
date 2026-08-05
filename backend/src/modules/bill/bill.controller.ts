// modules/bill/bill.controller.ts
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
    const bill = await service.createBill(req.body, req.user.id);
    return sendResponse.created(res, 'Bill', bill);
  },

  getAllBills: async (req: Request, res: Response) => {
    const queries = buildQuery(req);
    const result = await service.getAllBills(queries);
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
} = wrapControllers(controllers);