import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
import { accessControl } from '@core/middlewares/access.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';
import { proofUpload } from '@config/multer.config.js';

import {
  createEventOrderSchema,
  updateEventOrderSchema,
  verifyProofSchema,
} from './event-order.validator.js';

import {
  createEventOrder,
  getAllEventOrders,
  getEventOrderById,
  updateEventOrder,
  deleteEventOrder,
  retrieveEventOrder,
  eraseEventOrder,
  submitEventOrder,
  branchApproveEventOrder,
  superAdminApproveEventOrder,
  markEventOrderInProgress,
  markEventOrderReadyForPickup,
  markEventOrderDelivered,
  uploadEventOrderProofs,
  verifyEventOrderProof,
} from './event-order.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(accessControl);

router.post(
  '/',
  proofUpload.any(),
  zodValidate(
    createEventOrderSchema,
    'body',
    'CreateEventOrderSchema'
  ),
  createEventOrder
);

router.get('/', getAllEventOrders);

router.get('/:id', getEventOrderById);

router.put(
  '/:id',
  proofUpload.any(),
  zodValidate(
    updateEventOrderSchema,
    'body',
    'UpdateEventOrderSchema'
  ),
  updateEventOrder
);

router.delete('/:id', deleteEventOrder);
router.put('/:id/retrieve', retrieveEventOrder);
router.delete('/:id/erase', eraseEventOrder);

router.patch('/:id/submit', submitEventOrder);
router.patch('/:id/branch-approve', branchApproveEventOrder);
router.patch('/:id/super-admin-approve', superAdminApproveEventOrder);
router.patch('/:id/in-progress', markEventOrderInProgress);
router.patch('/:id/ready-for-pickup', markEventOrderReadyForPickup);
router.patch('/:id/delivered', markEventOrderDelivered);

router.post(
  '/:id/proofs',
  proofUpload.array('proofs', 10),
  uploadEventOrderProofs
);

router.patch(
  '/:id/proofs/verify',
  zodValidate(verifyProofSchema, 'body', 'VerifyProofSchema'),
  verifyEventOrderProof
);

export default router;
