import { Router } from 'express';
import {
  loginUser,
  getCurrentUser,
  logoutUser,
  adminResetPassword,
  changePassword,
} from './auth.controller.js';

import { authMiddleware } from '@core/middlewares/auth.middleware.js';
import { accessControl } from '@core/middlewares/access.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';

import {
  loginSchema,
  changePasswordSchema,
  adminResetPasswordSchema,
} from './auth.validator.js';

const router = Router();

router.post(
  '/login',
  zodValidate(loginSchema, 'body', 'LoginSchema'),
  loginUser
);

router.get('/me', authMiddleware, getCurrentUser);

router.post('/logout', authMiddleware, logoutUser);

router.use(authMiddleware);
router.use(accessControl);

router.post(
  '/change-password',
  zodValidate(
    changePasswordSchema,
    'body',
    'ChangePasswordSchema'
  ),
  changePassword
);

router.post(
  '/admin/reset-password',
  zodValidate(
    adminResetPasswordSchema,
    'body',
    'AdminResetPasswordSchema'
  ),
  adminResetPassword
);

export default router;