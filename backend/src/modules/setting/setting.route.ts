import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';
import { updateSettingSchema } from './setting.validator.js';
import { getSettings, updateSettings, previewPdf } from './setting.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getSettings);
router.put(
  '/',
  zodValidate(updateSettingSchema, 'body', 'UpdateSettingSchema'),
  updateSettings
);
router.post(
  '/preview-pdf',
  zodValidate(updateSettingSchema, 'body', 'UpdateSettingSchema'),
  previewPdf
);

export const basePath = '/settings';
export default router;
