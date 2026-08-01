import { Router } from 'express';
// import { authMiddleware } from '@core/middlewares/auth.middleware.js';
// import { accessControl } from '@core/middlewares/access.middleware.js';
// import { zodValidate } from '@core/middlewares/zod.validator.js';
// import { departmentSchema } from './department.validator.js';

import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  setDepartmentActiveStatus,
  retrieveDepartment,
  eraseDepartment,
} from './department.controller.js';

const router = Router();

// router.use(authMiddleware);
// router.use(accessControl);

// const MODULE = '-department';

router.post('/', createDepartment);
router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);
router.patch('/:id/active-status', setDepartmentActiveStatus);
router.put('/:id/retrieve', retrieveDepartment);
router.delete('/:id/erase', eraseDepartment);

export default router;