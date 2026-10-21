import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
import { accessControl } from '@core/middlewares/access.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';
import { proofUpload } from '@config/multer.config.js';

import {
  createXeroxOrderSchema,
  updateXeroxOrderSchema,
  verifyProofSchema,
} from './xerox-order.validator.js';

import {
  createXeroxOrder,
  getAllXeroxOrders,
  getXeroxOrderById,
  updateXeroxOrder,
  deleteXeroxOrder,
  retrieveXeroxOrder,
  eraseXeroxOrder,
  submitXeroxOrder,
  branchApproveXeroxOrder,
  superAdminApproveXeroxOrder,
  markXeroxOrderInProgress,
  markXeroxOrderReadyForPickup,
  markXeroxOrderDelivered,
  uploadXeroxOrderProofs,
  verifyXeroxOrderProof,
} from './xerox-order.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(accessControl);

router.post(
  '/',
  proofUpload.any(),
  zodValidate(
    createXeroxOrderSchema,
    'body',
    'CreateXeroxOrderSchema'
  ),
  createXeroxOrder
);

router.get('/', getAllXeroxOrders);

router.get('/:id', getXeroxOrderById);

router.put(
  '/:id',
  proofUpload.any(),
  zodValidate(
    updateXeroxOrderSchema,
    'body',
    'UpdateXeroxOrderSchema'
  ),
  updateXeroxOrder
);

router.delete('/:id', deleteXeroxOrder);
router.put('/:id/retrieve', retrieveXeroxOrder);
router.delete('/:id/erase', eraseXeroxOrder);

router.patch('/:id/submit', submitXeroxOrder);
router.patch('/:id/branch-approve', branchApproveXeroxOrder);
router.patch('/:id/super-admin-approve', superAdminApproveXeroxOrder);
router.patch('/:id/in-progress', markXeroxOrderInProgress);
router.patch('/:id/ready-for-pickup', markXeroxOrderReadyForPickup);
router.patch('/:id/delivered', markXeroxOrderDelivered);

router.post(
  '/:id/proofs',
  proofUpload.array('proofs', 10),
  uploadXeroxOrderProofs
);

router.patch(
  '/:id/proofs/verify',
  zodValidate(verifyProofSchema, 'body', 'VerifyProofSchema'),
  verifyXeroxOrderProof
);

export default router;
