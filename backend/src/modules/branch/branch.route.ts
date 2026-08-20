import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
// import { accessControl } from '@core/middlewares/access.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';
import {
  createBranchSchema,
  updateBranchSchema,
  setBranchActiveStatusSchema,
} from './branch.validator.js';

import {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  setBranchActiveStatus,
  retrieveBranch,
  eraseBranch,
} from './branch.controller.js';

export const basePath = '/branches';
export const baseRoute = `/api/v1${basePath}`;

const router = Router();

router.use(authMiddleware);

// router.use(accessControl);

// const MODULE = '-branch';

router.post(
  '/',
  zodValidate(createBranchSchema, 'body', 'CreateBranchSchema'),
  createBranch
);

router.get('/', getAllBranches);

router.get('/:id', getBranchById);

router.put(
  '/:id',
  zodValidate(updateBranchSchema, 'body', 'UpdateBranchSchema'),
  updateBranch
);

router.delete('/:id', deleteBranch);

router.patch(
  '/:id/active-status',
  zodValidate(
    setBranchActiveStatusSchema,
    'body',
    'SetBranchActiveStatusSchema'
  ),
  setBranchActiveStatus
);

router.put('/:id/retrieve', retrieveBranch);

router.delete('/:id/erase', eraseBranch);

export default router;