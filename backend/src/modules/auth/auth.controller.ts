import { NextFunction, Request, Response } from 'express';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';
import * as service from './auth.services.js';
import { log } from '@core/constants/logger.constant.ts';
import { ENVCONFIG } from '@config/env.config.js';
import {
  LoginPayload,
  ChangePasswordPayload,
  AdminResetPasswordPayload,
} from '@typings/auth.types.js';
import { COOKIE, LOG, ENTITY, ERROR, SHORT_AGE, LONG_AGE } from './auth.constants.js';
import { AccessRequest } from '@core/middlewares/access.middleware.ts';

const IS_PROD = ENVCONFIG.prod;

const cookieOptions = {
  ...COOKIE.OPTIONS,
  secure: IS_PROD,
  sameSite: (IS_PROD ? 'none' : 'lax') as 'none' | 'lax',
};

const controllers = {
  loginUser: async (req: Request<{}, {}, LoginPayload>, res: Response, next: NextFunction) => {
    const { login_id, password, rememberMe } = req.body;

    const result = await service.login(login_id, password);

    if (!result) {
      log('error', LOG.LOGIN.FAILED, { login_id });
      return sendResponse.notFound(res, ENTITY.USER);
    }

    const { user, token } = result;

    log('info', LOG.LOGIN.SUCCESS, { login_id });

    res.cookie(COOKIE.NAME, token, {
      ...cookieOptions,
      maxAge: rememberMe ? LONG_AGE : SHORT_AGE,
    });

    return sendResponse.fetched(res, ENTITY.USER, user);
  },

  getCurrentUser: async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.access_token;

    if (!token) {
      log('error', LOG.CURRENT_USER.NO_TOKEN);
      return sendResponse.unauthorized(res, ERROR.UNAUTHENTICATED);
    }

    const user = await service.getCurrentUser(token);

    if (!user) {
      log('error', LOG.CURRENT_USER.INVALID_TOKEN);
      return sendResponse.unauthorized(res, ERROR.INVALID_TOKEN);
    }

    log('info', LOG.CURRENT_USER.SUCCESS, { userId: user._id });

    return sendResponse.fetched(res, ENTITY.USER, user);
  },

  changePassword: async (
    req: AccessRequest<{}, {}, ChangePasswordPayload>,
    res: Response,
    next: NextFunction
  ) => {
    const user = req.user;

    if (!user) return sendResponse.unauthorized(res, ERROR.UNAUTHENTICATED);

    const { currentPassword, newPassword } = req.body;

    log('info', LOG.CHANGE_PASSWORD.REQUEST, { userId: user.id });

    const result = await service.changePassword({
      userId: user.id,
      currentPassword,
      newPassword,
    });

    return sendResponse.success(res, result.message);
  },

  adminResetPassword: async (
    req: AccessRequest<{}, {}, AdminResetPasswordPayload>,
    res: Response,
    next: NextFunction
  ) => {
    const admin = req.user;

    if (!admin) return sendResponse.unauthorized(res, ERROR.UNAUTHENTICATED);

    const { targetId, newPassword } = req.body;

    log('info', LOG.ADMIN_RESET.INITIATED, { adminId: admin.id, targetId });

    const result = await service.adminResetPassword({
      adminId: admin.id,
      adminRole: admin.role,
      targetId,
      newPassword,
    });

    log('success', LOG.ADMIN_RESET.SUCCESS, { adminId: admin.id, targetId });

    return sendResponse.success(res, result.message);
  },

  logoutUser: async (req: Request, res: Response, next: NextFunction) => {
    log('info', LOG.LOGOUT.REQUEST);

    res.clearCookie(COOKIE.NAME, cookieOptions);

    const result = await service.logout();

    log('success', LOG.LOGOUT.SUCCESS);

    return sendResponse.success(res, result.message);
  },
};

export const { loginUser, logoutUser, getCurrentUser, adminResetPassword, changePassword } =
  wrapControllers(controllers);