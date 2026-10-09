import { Request, Response } from 'express';
import * as service from './bill.services.ts';
import { CreateBillPayload, UpdateBillPayload } from '@typings/bill.types.ts';
import { createStatusControllers } from '@core/constants/createstatuscontroller.constant.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { buildQuery } from '@core/constants/querybuilder.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';
import { AccessRequest } from '@core/middlewares/access.middleware.ts';

import User from '@db/models/user.model.ts';
import Department from '@db/models/department.model.ts';
import { Role } from '@typings/auth.types.ts';

const isShopOrSuper = (role?: string) =>
  role === 'shop_admin' || role === 'staff' || role === 'super_admin';

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

    if (!isShopOrSuper(req.user.role)) {
      return sendResponse.forbidden?.(res, 'Only shop users and super admin can create bills') ?? res.status(403).json({ message: 'Forbidden' });
    }

    const createdBy = String(req.user.id ?? (req.user as any)._id);

    const bill = await service.createBill(req.body, createdBy);
    return sendResponse.created(res, 'Bill', bill);
  },

  getAllBills: async (req: AccessRequest, res: Response) => {
    const queries = buildQuery(req);
    const userContext = req.user ? {
      id: String(req.user.id ?? (req.user as any)._id),
      role: req.user.role as Role,
      department: req.user.department ? String(req.user.department) : undefined,
      branch: req.user.branch ? String(req.user.branch) : undefined,
      shop: req.user.shop ? String(req.user.shop) : undefined,
    } : undefined;

    const result = await service.getAllBills(queries, userContext);
    return sendResponse.paginated(res, 'bill', result);
  },

  getBillsByDepartment: async (req: AccessRequest<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const role = req.user?.role;

    if (role === 'department_admin') {
      const userDept = req.user?.department ? String(req.user.department) : (req.user?.id ? (await User.findById(req.user.id))?.department?.toString() : undefined);
      if (!userDept || userDept !== id) {
        return sendResponse.forbidden?.(res, 'Access denied to bills for this department') ?? res.status(403).json({ message: 'Forbidden' });
      }
    } else if (role === 'branch_admin') {
      const userBranch = req.user?.branch ? String(req.user.branch) : (req.user?.id ? (await User.findById(req.user.id))?.branch?.toString() : undefined);
      const dept = await Department.findById(id);
      if (!dept || String(dept.branch) !== String(userBranch)) {
        return sendResponse.forbidden?.(res, 'Access denied to bills for this department') ?? res.status(403).json({ message: 'Forbidden' });
      }
    }

    const queries = buildQuery(req);
    const result = await service.getBillsByDepartment(id, queries, req.user?.role);
    return sendResponse.paginated(res, 'bill', result);
  },

  getBillById: async (req: AccessRequest<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const bill = await service.getBillById(id);
    if (!bill) return sendResponse.notFound(res, 'bill');

    const role = req.user?.role;
    if (role === 'department_admin') {
      const userDept = req.user?.department ? String(req.user.department) : (req.user?.id ? (await User.findById(req.user.id))?.department?.toString() : undefined);
      if (bill.paymentMethod !== 'CREDIT' || String(bill.department) !== String(userDept)) {
        return sendResponse.forbidden?.(res, 'Access denied to this bill') ?? res.status(403).json({ message: 'Forbidden' });
      }
    } else if (role === 'branch_admin') {
      const userBranch = req.user?.branch ? String(req.user.branch) : (req.user?.id ? (await User.findById(req.user.id))?.branch?.toString() : undefined);
      let isBranch = String(bill.branch) === String(userBranch);
      if (!isBranch && bill.department) {
        const dept = await Department.findById(bill.department);
        if (dept && String(dept.branch) === String(userBranch)) {
          isBranch = true;
        }
      }
      if (bill.paymentMethod !== 'CREDIT' || !isBranch) {
        return sendResponse.forbidden?.(res, 'Access denied to this bill') ?? res.status(403).json({ message: 'Forbidden' });
      }
    }

    return sendResponse.fetched(res, 'bill', bill);
  },

  updateBill: async (req: AccessRequest<{ id: string }, {}, UpdateBillPayload>, res: Response) => {
    if (!isShopOrSuper(req.user?.role)) {
      return sendResponse.forbidden?.(res, 'Only shop users and super admin can edit bills') ?? res.status(403).json({ message: 'Forbidden' });
    }
    const { id } = req.params;
    const bill = await service.updateBill(id, req.body);
    if (!bill) return sendResponse.notFound(res, 'bill');
    return sendResponse.updated(res, 'bill', bill);
  },

  deleteBill: async (req: AccessRequest<{ id: string }>, res: Response) => {
    if (!isShopOrSuper(req.user?.role)) {
      return sendResponse.forbidden?.(res, 'Only shop users and super admin can delete bills') ?? res.status(403).json({ message: 'Forbidden' });
    }
    return billStatus.softDelete(req, res);
  },

  setBillActiveStatus: async (req: AccessRequest<{ id: string }>, res: Response) => {
    if (!isShopOrSuper(req.user?.role)) {
      return sendResponse.forbidden?.(res, 'Only shop users and super admin can modify bill status') ?? res.status(403).json({ message: 'Forbidden' });
    }
    return billStatus.setActiveStatus(req, res);
  },

  retrieveBill: async (req: AccessRequest<{ id: string }>, res: Response) => {
    if (!isShopOrSuper(req.user?.role)) {
      return sendResponse.forbidden?.(res, 'Only shop users and super admin can retrieve bills') ?? res.status(403).json({ message: 'Forbidden' });
    }
    return billStatus.retrieve(req, res);
  },

  eraseBill: async (req: AccessRequest<{ id: string }>, res: Response) => {
    if (!isShopOrSuper(req.user?.role)) {
      return sendResponse.forbidden?.(res, 'Only shop users and super admin can permanently delete bills') ?? res.status(403).json({ message: 'Forbidden' });
    }
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

  downloadBillPdf: async (req: AccessRequest<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const bill = await service.getBillById(id);
    if (!bill) return sendResponse.notFound(res, 'bill');

    const role = req.user?.role;
    if (role === 'department_admin') {
      const userDept = req.user?.department ? String(req.user.department) : (req.user?.id ? (await User.findById(req.user.id))?.department?.toString() : undefined);
      if (bill.paymentMethod !== 'CREDIT' || String(bill.department) !== String(userDept)) {
        return sendResponse.forbidden?.(res, 'Access denied to this bill') ?? res.status(403).json({ message: 'Forbidden' });
      }
    } else if (role === 'branch_admin') {
      const userBranch = req.user?.branch ? String(req.user.branch) : (req.user?.id ? (await User.findById(req.user.id))?.branch?.toString() : undefined);
      let isBranch = String(bill.branch) === String(userBranch);
      if (!isBranch && bill.department) {
        const dept = await Department.findById(bill.department);
        if (dept && String(dept.branch) === String(userBranch)) {
          isBranch = true;
        }
      }
      if (bill.paymentMethod !== 'CREDIT' || !isBranch) {
        return sendResponse.forbidden?.(res, 'Access denied to this bill') ?? res.status(403).json({ message: 'Forbidden' });
      }
    }

    const { generateBillPdf } = await import('./exportbill.util.js');
    const pdfBuffer = await generateBillPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=bill-${id}.pdf`);
    res.send(pdfBuffer);
  },
};

export const {
  createBill,
  getAllBills,
  getBillsByDepartment,
  getBillById,
  updateBill,
  deleteBill,
  setBillActiveStatus,
  retrieveBill,
  eraseBill,
  approveCreditBill,
  rejectCreditBill,
  downloadBillPdf,
} = wrapControllers(controllers);