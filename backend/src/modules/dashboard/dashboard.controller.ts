import { Response } from 'express';
import { AuthRequest } from '@core/middlewares/auth.middleware.ts';
import * as service from './dashboard.services.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';

const controllers = {
  getSuperAdminDashboard: async (req: AuthRequest, res: Response) => {
    const data = await service.getSuperAdminDashboard();
    return sendResponse.success(res, 'Super Admin Dashboard metrics fetched successfully', data);
  },

  getBranchAdminDashboard: async (req: AuthRequest, res: Response) => {
    const { branch } = req.user;
    if (!branch) {
      return sendResponse.badRequest(res, 'User is not assigned to any branch');
    }
    const data = await service.getBranchAdminDashboard(branch);
    return sendResponse.success(res, 'Branch Admin Dashboard metrics fetched successfully', data);
  },

  getDepartmentAdminDashboard: async (req: AuthRequest, res: Response) => {
    const { branch } = req.user;
    if (!branch) {
      return sendResponse.badRequest(res, 'User is not assigned to any branch');
    }
    const data = await service.getBranchAdminDashboard(branch);
    return sendResponse.success(res, 'Department Admin Dashboard metrics fetched successfully', data);
  },

  getShopAdminDashboard: async (req: AuthRequest, res: Response) => {
    const { branch } = req.user;
    if (!branch) {
      return sendResponse.badRequest(res, 'User is not assigned to any branch');
    }
    const data = await service.getBranchAdminDashboard(branch);
    return sendResponse.success(res, 'Shop Admin Dashboard metrics fetched successfully', data);
  },

  getStaffDashboard: async (req: AuthRequest, res: Response) => {
    const { id } = req.user;
    const data = await service.getStaffDashboard(id);
    return sendResponse.success(res, 'Staff Dashboard metrics fetched successfully', data);
  },
};

export const {
  getSuperAdminDashboard,
  getBranchAdminDashboard,
  getDepartmentAdminDashboard,
  getShopAdminDashboard,
  getStaffDashboard,
} = wrapControllers(controllers);
