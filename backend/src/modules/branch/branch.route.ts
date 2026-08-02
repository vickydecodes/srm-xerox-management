import { Router } from 'express';
// import { authMiddleware } from '@core/middlewares/auth.middleware.js';
// import { accessControl } from '@core/middlewares/access.middleware.js';
// import { zodValidate } from '@core/middlewares/zod.validator.js';
// import { branchSchema } from './branch.validator.js';

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

const router = Router();

// router.use(authMiddleware);
// router.use(accessControl);

// const MODULE = '-branch';

router.post('/', createBranch);
router.get('/', getAllBranches);
router.get('/:id', getBranchById);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);
router.patch('/:id/active-status', setBranchActiveStatus);
router.put('/:id/retrieve', retrieveBranch);
router.delete('/:id/erase', eraseBranch);

export default router;