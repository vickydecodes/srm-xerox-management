import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
   import sendResponse from '@core/constants/responsewrapper.constant.js';
   import type { AuthUser, Role } from '@typings/auth.types.ts';

   export interface AccessRequest<
     Params = any,
     ResBody = any,
     ReqBody = any,
     ReqQuery = any,
   > extends Request<Params, ResBody, ReqBody, ReqQuery> {
     user?: AuthUser;
     role?: Role;
     branch?: string;
     department?: string;
     shop?: string;
     queryFilter?: Record<string, any>;
   }

export async function accessControl(req: AccessRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return sendResponse.unauthorized(res, 'Unauthenticated');
    }

    const { role, branch, department, shop, active, id } = req.user as any;

    console.log(req.user)

    if (active === false) {
      return sendResponse.unauthorized(
        res,
        'Your account has been deactivated. Please contact admin.'
      );
    }

    req.role = role as Role;
    req.branch = branch;
    req.department = department;
    req.shop = shop;

    req.queryFilter = {};

    
    
    switch (req.role) {
      case 'super_admin':
        break;
      case 'shop_admin': {
        req.queryFilter.shop = req.shop;
        break;
      }
      case 'staff':
        req.queryFilter.createdBy = id;
        req.queryFilter.shop = req.shop;
        req.queryFilter.branch = req.branch;
        break;
      case 'branch_admin':
        req.queryFilter.branch = req.branch;
        break;
      case 'department_admin':
        req.queryFilter.branch = req.branch;
        req.queryFilter.department = req.department;
        break;
    }

    next();
  } catch (error) {
    console.error('❌ AccessControl Error:', error);
    return sendResponse.error(res, 'accessControl', error);
  }
}