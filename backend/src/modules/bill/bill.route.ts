import { Router } from 'express';
import { authMiddleware } from '@core/middlewares/auth.middleware.js';
// import { accessControl } from '@core/middlewares/access.middleware.js';
import { zodValidate } from '@core/middlewares/zod.validator.js';
import {
  createBillSchema,
  updateBillSchema,
  setBillActiveStatusSchema,
} from './bill.validator.js';

import {
  createBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill,
  setBillActiveStatus,
  retrieveBill,
  eraseBill,
} from './bill.controller.js';

const router = Router();

router.use(authMiddleware);
// const MODULE = '-bill';
router.post(
  '/',
  zodValidate(createBillSchema, 'body', 'CreateBillSchema'),
  createBill
);

router.get('/', getAllBills);

router.get('/:id', getBillById);

router.put(
  '/:id',
  zodValidate(updateBillSchema, 'body', 'UpdateBillSchema'),
  updateBill
);

router.delete('/:id', deleteBill);

router.patch(
  '/:id/active-status',
  zodValidate(
    setBillActiveStatusSchema,
    'body',
    'SetBillActiveStatusSchema'
  ),
  setBillActiveStatus
);

router.put('/:id/retrieve', retrieveBill);

router.delete('/:id/erase', eraseBill);

export default router;
