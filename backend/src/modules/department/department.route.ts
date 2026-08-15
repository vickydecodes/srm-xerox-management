import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
// import { accessControl } from '@core/middlewares/access.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  setDepartmentActiveStatusSchema,
} from './department.validator.js';

import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  setDepartmentActiveStatus,
  retrieveDepartment,
  eraseDepartment,
  clearCredit,
} from './department.controller.js';

const router = Router();

router.use(authMiddleware);

// router.use(accessControl);

// const MODULE = '-department';

router.post(
  '/',
  zodValidate(
    createDepartmentSchema,
    'body',
    'CreateDepartmentSchema'
  ),
  createDepartment
);

router.get('/', getAllDepartments);

router.get('/:id', getDepartmentById);

router.put(
  '/:id',
  zodValidate(
    updateDepartmentSchema,
    'body',
    'UpdateDepartmentSchema'
  ),
  updateDepartment
);

router.delete('/:id', deleteDepartment);

router.patch(
  '/:id/active-status',
  zodValidate(
    setDepartmentActiveStatusSchema,
    'body',
    'SetDepartmentActiveStatusSchema'
  ),
  setDepartmentActiveStatus
);

router.put('/:id/retrieve', retrieveDepartment);

router.delete('/:id/erase', eraseDepartment);

router.post(
  '/:id/clear-credit',
  zodValidate(clearCreditSchema),
  clearCredit
);
export default router;