import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import {
  getSuperAdminDashboard,
  getBranchAdminDashboard,
  getDepartmentAdminDashboard,
  getShopAdminDashboard,
  getStaffDashboard,
} from './dashboard.controller.ts';

const router = Router();

// Apply authentication middleware
router.use(authMiddleware);

// Middleware helper to restrict routes by role
const restrictTo = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendResponse.forbidden(res, 'Access denied: Insufficient permissions for this dashboard');
    }
    next();
  };
};

router.get('/super-admin', restrictTo('super_admin'), getSuperAdminDashboard);
router.get('/branch-admin', restrictTo('branch_admin'), getBranchAdminDashboard);
router.get('/department-admin', restrictTo('department_admin'), getDepartmentAdminDashboard);
router.get('/shop-admin', restrictTo('shop_admin'), getShopAdminDashboard);
router.get('/staff', restrictTo('staff'), getStaffDashboard);

export const basePath = '/dashboard';

export default router;
