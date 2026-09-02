import { Request, Response } from 'express';
import { AuthRequest } from '@core/middlewares/auth.middleware.ts';
import * as service from './setting.services.ts';
import sendResponse from '@core/constants/responsewrapper.constant.ts';
import { wrapControllers } from '@core/constants/wrapcontroller.constant.ts';

const controllers = {
  getSettings: async (req: Request, res: Response) => {
    const settings = await service.getSettings();
    return sendResponse.fetched(res, 'setting', settings);
  },

  updateSettings: async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'super_admin') {
      return sendResponse.forbidden(res, 'Only super admins can update settings');
    }
    const settings = await service.updateSettings(req.body);
    return sendResponse.updated(res, 'setting', settings);
  },
};

export const { getSettings, updateSettings } = wrapControllers(controllers);
