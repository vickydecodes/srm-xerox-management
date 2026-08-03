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

const router = Router();

router.post('/login', loginUser);
router.get('/me', authMiddleware, getCurrentUser);
router.post('/logout', authMiddleware, logoutUser);

router.use(authMiddleware);
router.use(accessControl);

router.post(
  '/change-password',
  changePassword
);

router.post(
  '/admin/reset-password',
  
  adminResetPassword
);

export default router;
