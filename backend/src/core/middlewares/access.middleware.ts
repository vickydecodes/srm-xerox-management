import { Request, Response, NextFunction } from 'express';
import sendResponse from '@core/constants/responsewrapper.constant.js';
import { AuthUser, Role } from '@typings/auth.types.ts';

export interface AccessRequest<
  Params = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> extends Request<Params, ResBody, ReqBody, ReqQuery> {
  user?: AuthUser;
  role?: Role;
  branchId?: string;
  permissions?: Record<string, any>;
  queryFilter?: Record<string, any>;
  can?: (action: string, module: string) => boolean;
}

export async function accessControl(req: AccessRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return sendResponse.unauthorized(res, 'Unauthenticated');
    }

    req.role = req.user.role as Role;
    req.branchId = req.user.branch;

    req.permissions = {};

    req.can = () => true;

    req.queryFilter = {};

    next();
  } catch (error) {
    console.error('❌ AccessControl Error:', error);
    return sendResponse.error(res, 'accessControl', error);
  }
}
