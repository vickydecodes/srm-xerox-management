import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
import { accessControl } from '@core/middlewares/access.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';
import { proofUpload } from '@config/multer.config.js';

import {
  createOrderSchema,
  updateOrderSchema,
  verifyProofSchema,
} from './order.validator.js';


import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  retrieveOrder,
  eraseOrder,
  submitOrder,
  branchApproveOrder,
  superAdminApproveOrder,
  markOrderInProgress,
  markOrderReadyForPickup,
  markOrderDelivered,
  uploadOrderProofs,
  verifyOrderProof,
} from './order.controller.js';


const router = Router();


router.use(authMiddleware);


router.use(accessControl);


// const MODULE = '-order';


router.post(
  '/',
  proofUpload.array('proofs', 10),
  zodValidate(
    createOrderSchema,
    'body',
    'CreateOrderSchema'
  ),
  createOrder
);


router.get('/', getAllOrders);


router.get('/:id', getOrderById);


router.put(
  '/:id',
  proofUpload.array('proofs', 10),
  zodValidate(
    updateOrderSchema,
    'body',
    'UpdateOrderSchema'
  ),
  updateOrder
);


router.delete('/:id', deleteOrder);


router.put('/:id/retrieve', retrieveOrder);


router.delete('/:id/erase', eraseOrder);


router.patch('/:id/submit', submitOrder);
router.patch('/:id/branch-approve', branchApproveOrder);
router.patch('/:id/super-admin-approve', superAdminApproveOrder);
router.patch('/:id/in-progress', markOrderInProgress);
router.patch('/:id/ready-for-pickup', markOrderReadyForPickup);

router.patch('/:id/delivered', markOrderDelivered);

router.post(
  '/:id/proofs',
  proofUpload.array('proofs', 10),
  uploadOrderProofs
);

router.patch(
  '/:id/proofs/verify',
  zodValidate(verifyProofSchema, 'body', 'VerifyProofSchema'),
  verifyOrderProof
);


export default router;

